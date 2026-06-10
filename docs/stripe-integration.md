# Stripe integration — implementation guide

Scope: one-off diagnostic payments (Rapid $695 / Lab-Backed $945) wired into the existing Cal.com booking flow, and the Sentinel weekly subscription ($22.95/wk). All amounts AUD, GST inc.

This guide assumes:

- Stack already in place: Next.js 16 App Router, React 19, plain JSX, no TypeScript, server runtime pinned to `nodejs`.
- Supabase Postgres is provisioned per `schema.sql` (not yet wired to the app).
- Cal.com booking flow lives in `components/BookingForm.jsx` + `components/BookingTakeover.jsx` + `app/api/cal/*`.
- Clerk is the auth provider (per `customers.clerk_user_id`), but Clerk integration is out of scope here — the Stripe flow itself does not require a logged-in user; the `customer` row is created/matched by email at webhook time.

---

## 1. Environment variables

Add to local `.env.local` and production env. None of these are checked in.

| Var | Where it's read | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | server only (`lib/stripe.js`) | `sk_test_…` in dev, `sk_live_…` in prod. |
| `STRIPE_WEBHOOK_SECRET` | `app/api/stripe/webhook/route.js` | `whsec_…` — comes from `stripe listen` locally, from the Stripe dashboard endpoint in prod. **Different value in dev vs prod.** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client (only needed if you use Payment Element later) | `pk_test_…` / `pk_live_…`. Not used by Checkout-redirect flow but worth defining now. |
| `STRIPE_PRICE_SENTINEL_WEEKLY` | server | The recurring Price ID for $22.95/week (create in Stripe dashboard as a recurring product). |
| `STRIPE_PRICE_INSPECTION_RAPID` | server | Price ID for $695 once-off (`type: one_time`, `tax_behavior: inclusive`). |
| `STRIPE_PRICE_INSPECTION_LAB` | server | Price ID for $945 once-off, GST inclusive. |
| `NEXT_PUBLIC_SITE_URL` | server (Checkout `success_url` / `cancel_url`) | e.g. `https://sporetrust.com.au` in prod, `http://localhost:3000` in dev. |
| `SUPABASE_URL` | server | Same project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only — never client | Service-role key, bypasses RLS. The webhook **must** use this. |

> Set up Prices in the Stripe Dashboard rather than hard-coding amounts in code. The amount tied to a `price.id` is what Stripe charges; treat the Price ID env var as the source of truth.

---

## 2. Checkout vs. Payment Element — recommendation

**Use Stripe Checkout (hosted, redirect mode).** This is a marketing site with a mostly-mobile audience, a low transaction volume, no in-app account dashboard, and no design appetite for a payment-form-shaped section inside an existing modal. Hosted Checkout handles Apple Pay / Google Pay / Link / card 3DS / Australian GST display / receipt emails / refund UI / fraud signals out of the box. Payment Element is the right choice when you need a fully in-page UX or multi-step server-driven flows, neither of which applies here. Migrate to Embedded Checkout or Payment Element later if and when the booking flow needs to keep customers on-site through payment (e.g. for a partner portal). For now, redirect → success page → back to site.

For Sentinel subscriptions, same answer: Checkout in `mode: 'subscription'` collects the card and the first charge in one step.

---

## 3. Flow shape

### 3a. Diagnostic booking — pay first, then book

The current flow creates a Cal.com booking immediately on form submit. Change it so:

1. User completes the 4-step `BookingForm` as today (Suburb → Day → Time → Details).
2. On submit, instead of POSTing directly to `/api/cal/bookings`, POST to **`/api/stripe/checkout/inspection`** with the full form payload + the chosen tier (`rapid` | `lab`).
3. That endpoint:
   - Creates a Checkout Session with `mode: 'payment'`, the right Price ID, and a `metadata` blob containing the entire booking payload (suburb, day, time, name, email, phone, address, role, message, tier). Stripe metadata accepts up to 50 keys × 500 chars each — plenty for this.
   - Sets `customer_email` to `form.email` so Stripe attaches/creates a Customer with that email (use `customer_creation: 'always'` for one-off payments so a Customer object is always created).
   - Sets `success_url` to `${SITE}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}` and `cancel_url` back into `${SITE}/?booking=cancelled`.
   - Returns `{ url }` from `session.url`.
4. Client redirects via `window.location.assign(url)`.
5. After successful payment, the webhook `checkout.session.completed` is the **single source of truth** for "the booking + payment is real". It:
   - Upserts `customers` by lowercased email; stores `stripe_customer_id`.
   - Upserts `properties` by `(LOWER(address_line), postcode)`.
   - Inserts an `inspections` row with `stripe_payment_intent_id`, `amount_paid`, `scheduled_at` (from metadata), `inspection_type` (`'standard'` for rapid, `'lab_backed'` for lab).
   - Calls `POST /api/cal/bookings` server-to-server (or directly calls `calFetch` from inside the webhook handler — same code path) to create the Cal.com booking. Captures `cal_booking_id` onto the inspections row.
6. The success page (`app/booking/confirmed/page.jsx`) renders the same confirmation UI the current `BookingForm` step 4 shows. It can call a small endpoint (`/api/stripe/session?session_id=…`) to read the session and show booking reference + amount.

Rationale: doing payment **before** Cal.com booking avoids the "we charged the card but lost the slot" race. If Cal.com fails inside the webhook, retry the Cal call (idempotent via `stripe_payment_intent_id`) and surface in admin; do not refund automatically.

### 3b. Sentinel weekly subscription

1. "Join Sentinel" CTA points at `/api/stripe/checkout/sentinel?email=…&propertyId=…` (or POST with a small intake form first — name/email/address/postcode — since the schema requires `customers.email`, `customers.name`, and a `properties` row).
2. That endpoint creates a Checkout Session with `mode: 'subscription'`, line item is `STRIPE_PRICE_SENTINEL_WEEKLY`, `customer_email` set, `success_url` = `/sentinel/joined?session_id={CHECKOUT_SESSION_ID}`.
3. Webhook handles `customer.subscription.created` → insert `subscriptions` row with `stripe_subscription_id`, `weekly_amount = 22.95`, `status = 'active'`, `current_period_end = sub.current_period_end * 1000`.
4. Ongoing `customer.subscription.updated` / `.deleted` / `invoice.payment_failed` events keep `status` + `current_period_end` in sync.

---

## 4. Files to create

```
lib/
  stripe.js                    new — server-side Stripe client + helpers
  supabase/
    server.js                  new — service-role Supabase client (server only)

app/
  api/
    stripe/
      checkout/
        inspection/route.js    new — POST → create Checkout for $695/$945
        sentinel/route.js      new — POST → create Checkout for $22.95/wk
      session/route.js         new — GET → read session by id (for success page)
      webhook/route.js         new — POST — Stripe events handler
  booking/
    confirmed/page.jsx         new — post-payment confirmation page
  sentinel/
    joined/page.jsx            new — post-subscription confirmation page

components/
  BookingForm.jsx              modified — submit posts to /api/stripe/checkout/inspection
                               and redirects to session.url instead of /api/cal/bookings
  SentinelCard.jsx             modified — CTA points at new sentinel checkout (or via
                               a small SentinelIntake takeover similar to BookingTakeover)
```

You will also need to install the SDK:

```bash
npm i stripe @supabase/supabase-js
```

(No types package required — this is plain JSX.)

---

## 5. Minimal code for each file

All code is in the project's existing style (plain JS, `import` syntax, `export const runtime = "nodejs"` on every API route, no TS).

### `lib/stripe.js`

```js
import Stripe from "stripe";

let cachedClient = null;

export function getStripeClient() {
  if (cachedClient) return cachedClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  cachedClient = new Stripe(key, {
    apiVersion: "2025-08-27.basil", // pin a version — see Stripe changelog
    appInfo: { name: "sporetrust-site", url: "https://sporetrust.com.au" },
    maxNetworkRetries: 2,
  });
  return cachedClient;
}

export function getPriceId(slug) {
  const map = {
    rapid: process.env.STRIPE_PRICE_INSPECTION_RAPID,
    lab: process.env.STRIPE_PRICE_INSPECTION_LAB,
    sentinel: process.env.STRIPE_PRICE_SENTINEL_WEEKLY,
  };
  const id = map[slug];
  if (!id) throw new Error(`No Stripe price configured for tier "${slug}".`);
  return id;
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
```

Pin the API version explicitly — Stripe sends events using whatever version you set on your endpoint, and pinning avoids surprise schema changes. Check Stripe's docs for the current basil version when you implement.

### `lib/supabase/server.js`

```js
import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

// Service-role client. NEVER import this from a "use client" file.
export function getSupabaseServiceClient() {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role credentials are not configured.");
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
```

Keep this file out of any component import graph. If you later add a browser-side client for RLS-scoped reads, put it at `lib/supabase/browser.js` with the `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### `app/api/stripe/checkout/inspection/route.js`

```js
import { NextResponse } from "next/server";
import { getPriceId, getSiteUrl, getStripeClient } from "../../../../../lib/stripe";

export const runtime = "nodejs";

const ALLOWED_TIERS = new Set(["rapid", "lab"]);

function requireText(body, key, label = key) {
  const value = String(body?.[key] || "").trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tier = String(body.tier || "rapid");
    if (!ALLOWED_TIERS.has(tier)) throw new Error("Unknown inspection tier.");

    // Same field set as the existing /api/cal/bookings POST.
    const booking = {
      tier,
      start: requireText(body, "start", "Inspection time"),
      name: requireText(body, "name", "Name"),
      email: requireText(body, "email", "Email").toLowerCase(),
      phone: requireText(body, "phone", "Phone"),
      address: requireText(body, "address", "Address"),
      locationLabel: requireText(body, "locationLabel", "Suburb"),
      postcode: String(body.postcode || "").trim().slice(0, 64),
      placeId: String(body.placeId || "").trim().slice(0, 128),
      lat: String(body.lat || "").trim().slice(0, 32),
      lng: String(body.lng || "").trim().slice(0, 32),
      role: String(body.role || "").trim().slice(0, 64),
      message: String(body.message || "").trim().slice(0, 480),
    };

    const stripe = getStripeClient();
    const site = getSiteUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        ui_mode: "hosted",
        line_items: [{ price: getPriceId(tier), quantity: 1 }],
        customer_email: booking.email,
        customer_creation: "always",
        payment_intent_data: {
          // Surfaces on the dashboard PaymentIntent for debugging.
          metadata: { tier, locationLabel: booking.locationLabel },
        },
        // Metadata is the carrier for the booking payload. Stripe limits:
        // 50 keys × 500 chars per value. We comfortably fit.
        metadata: { ...booking, kind: "inspection" },
        success_url: `${site}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/?booking=cancelled`,
        // Australian Business Number on receipts, GST inclusive prices.
        // automatic_tax: { enabled: true }, // Optional — only if Tax is set up.
      },
      {
        // Idempotency on the create call — protects against double-clicks.
        // Use a short-lived random key derived from email + start.
        idempotencyKey: `inspection:${booking.email}:${booking.start}:${tier}`,
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not start checkout." },
      { status: 400 }
    );
  }
}
```

### `app/api/stripe/checkout/sentinel/route.js`

```js
import { NextResponse } from "next/server";
import { getPriceId, getSiteUrl, getStripeClient } from "../../../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();
    const postcode = String(body.postcode || "").trim();
    if (!email || !name || !address || !postcode) {
      throw new Error("Email, name, address, and postcode are required.");
    }

    const stripe = getStripeClient();
    const site = getSiteUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        ui_mode: "hosted",
        line_items: [{ price: getPriceId("sentinel"), quantity: 1 }],
        customer_email: email,
        subscription_data: {
          metadata: { kind: "sentinel", name, address, postcode },
        },
        metadata: { kind: "sentinel", name, email, address, postcode },
        success_url: `${site}/sentinel/joined?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/?sentinel=cancelled`,
      },
      { idempotencyKey: `sentinel:${email}` }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not start subscription." },
      { status: 400 }
    );
  }
}
```

### `app/api/stripe/session/route.js`

```js
import { NextResponse } from "next/server";
import { getStripeClient } from "../../../../lib/stripe";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "subscription"],
    });

    return NextResponse.json({
      status: session.status, // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      amountTotal: session.amount_total, // cents
      currency: session.currency,
      mode: session.mode,
      customerEmail: session.customer_details?.email,
      metadata: session.metadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not load session." },
      { status: 400 }
    );
  }
}
```

### `app/api/stripe/webhook/route.js`

This is the load-bearing file. It must:

- Read the raw request body — do **not** use `request.json()`, which mutates the body and breaks signature verification.
- Verify the Stripe signature with `STRIPE_WEBHOOK_SECRET`.
- Be idempotent — Stripe retries events. Use Stripe IDs as the dedupe key (`stripe_payment_intent_id` is `UNIQUE`; `stripe_subscription_id` is `UNIQUE` — Postgres conflicts will short-circuit duplicates).
- Return a 200 quickly. If you need slow work (e.g. calling Cal.com), do it inline but timeout-bounded; Stripe will retry on non-2xx.

```js
import { NextResponse } from "next/server";
import { getStripeClient } from "../../../../lib/stripe";
import { getSupabaseServiceClient } from "../../../../lib/supabase/server";
import { calFetch, CAL_EVENT_LENGTH, CAL_TIME_ZONE } from "../../../../lib/cal";

export const runtime = "nodejs";
// Stripe webhook bodies need to be read as raw bytes for signature checks.
// Next.js 16 App Router gives us request.text(), which is fine.

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "charge.refunded",
]);

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature/secret." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object, stripe);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object);
        break;

      case "customer.subscription.deleted":
        await syncSubscription({ ...event.data.object, status: "canceled" });
        break;

      case "invoice.payment_succeeded":
        await syncInvoicePayment(event.data.object, "active");
        break;

      case "invoice.payment_failed":
        await syncInvoicePayment(event.data.object, "past_due");
        break;

      case "charge.refunded":
        await handleRefund(event.data.object);
        break;

      // payment_intent.* events are mostly a safety net — the checkout.session.completed
      // handler is the primary path.
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Throw → Stripe will retry. Log first.
    console.error("[stripe webhook]", event.type, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------

async function handleCheckoutCompleted(session, stripe) {
  const kind = session.metadata?.kind;
  if (kind === "inspection") {
    await handleInspectionPaid(session, stripe);
  }
  // For 'sentinel' the customer.subscription.created event also fires — let
  // that handler own the subscriptions row. checkout.session.completed for
  // subscriptions is mainly informational.
}

async function handleInspectionPaid(session, stripe) {
  const sb = getSupabaseServiceClient();
  const md = session.metadata || {};

  // 1. Customer (upsert by lowercased email).
  const email = (md.email || session.customer_details?.email || "").toLowerCase();
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  const { data: customerRow, error: customerError } = await sb
    .from("customers")
    .upsert(
      {
        email,
        name: md.name || session.customer_details?.name || "Unknown",
        phone: md.phone || null,
        stripe_customer_id: stripeCustomerId || null,
      },
      { onConflict: "email" } // requires the customers_email_lower_uq unique index treatment;
      // alternatively select-then-update if you keep emails case-mixed.
    )
    .select("customer_id, stripe_customer_id")
    .single();

  if (customerError) throw customerError;

  // If the customer already existed with a different stripe_customer_id, leave it; if
  // null, patch it.
  if (!customerRow.stripe_customer_id && stripeCustomerId) {
    await sb
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("customer_id", customerRow.customer_id)
      .is("stripe_customer_id", null);
  }

  // 2. Property (upsert by lower(address_line) + postcode — the schema has a unique
  // index on these). Pass lat/lng/placeId where available.
  const { data: propertyRow, error: propertyError } = await sb
    .from("properties")
    .upsert(
      {
        address_line: md.address,
        postcode: md.postcode || "",
        state: "QLD",
        google_place_id: md.placeId || null,
        lat: md.lat ? Number(md.lat) : null,
        lng: md.lng ? Number(md.lng) : null,
      },
      { onConflict: "lower(address_line),postcode", ignoreDuplicates: false }
    )
    .select("property_id")
    .single();

  if (propertyError) throw propertyError;

  // 3. Inspection. stripe_payment_intent_id is UNIQUE → second delivery of the
  // same event no-ops.
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const amountPaid = (session.amount_total || 0) / 100; // cents → dollars

  const inspectionType = md.tier === "lab" ? "lab_backed" : "standard";

  const { data: existing } = await sb
    .from("inspections")
    .select("inspection_id, cal_booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  let inspectionId = existing?.inspection_id;
  let calBookingId = existing?.cal_booking_id;

  if (!inspectionId) {
    const { data: inserted, error: insErr } = await sb
      .from("inspections")
      .insert({
        customer_id: customerRow.customer_id,
        property_id: propertyRow.property_id,
        stripe_payment_intent_id: paymentIntentId,
        amount_paid: amountPaid,
        scheduled_at: md.start,
        duration_minutes: 90,
        status: "scheduled",
        inspection_type: inspectionType,
      })
      .select("inspection_id, cal_booking_id")
      .single();
    if (insErr) throw insErr;
    inspectionId = inserted.inspection_id;
    calBookingId = inserted.cal_booking_id;
  }

  // 4. Create the Cal.com booking if we haven't already.
  if (!calBookingId) {
    const calPayload = await calFetch("/bookings", {
      method: "POST",
      apiVersion: "2026-02-25",
      body: buildCalBookingBody(md, session),
    });
    const uid = calPayload?.data?.uid;
    if (uid) {
      await sb
        .from("inspections")
        .update({ cal_booking_id: uid })
        .eq("inspection_id", inspectionId)
        .is("cal_booking_id", null); // idempotent — only fills if still null
    }
  }
}

function buildCalBookingBody(md, session) {
  return {
    start: md.start,
    eventTypeId: Number(process.env.CAL_EVENT_TYPE_ID),
    lengthInMinutes: CAL_EVENT_LENGTH,
    attendee: {
      name: md.name,
      email: md.email,
      phoneNumber: md.phone,
      language: "en",
      timeZone: CAL_TIME_ZONE,
    },
    bookingFieldsResponses: {
      title: `Sporetrust diagnostic - ${md.locationLabel}`,
      notes: [
        `Tier: ${md.tier}`,
        `Stripe session: ${session.id}`,
        `Phone: ${md.phone}`,
        `Address: ${md.address}`,
        md.message ? `Notes: ${md.message}` : null,
      ].filter(Boolean).join("\n"),
    },
    metadata: {
      source: "sporetrust_site",
      stripeSessionId: session.id,
      tier: md.tier,
      location: md.locationLabel,
    },
  };
}

async function syncSubscription(sub) {
  const sb = getSupabaseServiceClient();
  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  // Map Stripe status → schema status.
  const status = mapSubStatus(sub.status);
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  // Update existing row by stripe_subscription_id (the UNIQUE column).
  const { data: existing } = await sb
    .from("subscriptions")
    .select("subscription_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (existing) {
    await sb
      .from("subscriptions")
      .update({
        status,
        current_period_end: currentPeriodEnd,
        cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
      })
      .eq("subscription_id", existing.subscription_id);
    return;
  }

  // New subscription — find the customer + property and insert.
  const { data: customerRow } = await sb
    .from("customers")
    .select("customer_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!customerRow) {
    // Customer not yet in our DB: pull email from Stripe + upsert.
    const stripe = getStripeClient();
    const cust = await stripe.customers.retrieve(stripeCustomerId);
    const email = (cust.email || "").toLowerCase();
    const md = sub.metadata || {};
    const { data: newCust } = await sb
      .from("customers")
      .upsert(
        { email, name: md.name || cust.name || "Unknown", stripe_customer_id: stripeCustomerId },
        { onConflict: "email" }
      )
      .select("customer_id")
      .single();
    if (!newCust) throw new Error("Could not create customer for subscription " + sub.id);
    await insertNewSubscription(sb, newCust.customer_id, sub, status, currentPeriodEnd);
    return;
  }

  await insertNewSubscription(sb, customerRow.customer_id, sub, status, currentPeriodEnd);
}

async function insertNewSubscription(sb, customerId, sub, status, currentPeriodEnd) {
  const md = sub.metadata || {};
  // Property: subscriptions table requires property_id. Either come from metadata
  // (preferred — captured at checkout) or block and surface an admin task.
  const { data: prop } = await sb
    .from("properties")
    .upsert(
      {
        address_line: md.address || "Unknown",
        postcode: md.postcode || "0000",
        state: "QLD",
      },
      { onConflict: "lower(address_line),postcode" }
    )
    .select("property_id")
    .single();

  const weeklyAmount = (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100;

  await sb.from("subscriptions").insert({
    customer_id: customerId,
    property_id: prop.property_id,
    stripe_subscription_id: sub.id,
    plan: "sentinel",
    status,
    weekly_amount: weeklyAmount,
    current_period_end: currentPeriodEnd,
  });
}

function mapSubStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "active";
  }
}

async function syncInvoicePayment(invoice, expectedStatus) {
  if (!invoice.subscription) return;
  const sb = getSupabaseServiceClient();
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  await sb
    .from("subscriptions")
    .update({ status: expectedStatus })
    .eq("stripe_subscription_id", subscriptionId);
}

async function handleRefund(charge) {
  const sb = getSupabaseServiceClient();
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  // Decrement amount_paid by the refund total. charge.amount_refunded is cumulative
  // total (in cents) refunded for the charge — write the resulting net.
  const netPaidCents = (charge.amount_captured || charge.amount || 0) - (charge.amount_refunded || 0);
  const netPaid = netPaidCents / 100;

  await sb
    .from("inspections")
    .update({
      amount_paid: netPaid,
      // Optional policy: full refund → mark inspection cancelled.
      // status: netPaid === 0 ? "cancelled" : undefined,
    })
    .eq("stripe_payment_intent_id", paymentIntentId);
}
```

### `app/booking/confirmed/page.jsx`

```jsx
import Brand from "../../../components/Brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadSession(sessionId) {
  if (!sessionId) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function BookingConfirmedPage({ searchParams }) {
  const { session_id } = await searchParams;
  const session = await loadSession(session_id);

  return (
    <main className="solution">
      <section className="hero-content book-form booking-confirmation">
        <Brand />
        <span className="wizard-kicker">Booking received</span>
        <h1>Your inspection is booked.</h1>
        <p>
          We have your payment and the diagnostic visit is on the calendar.
          You will receive a Cal.com confirmation by email shortly.
        </p>
        {session?.amountTotal ? (
          <small>
            Paid: {(session.amountTotal / 100).toFixed(2)} {String(session.currency || "AUD").toUpperCase()}
          </small>
        ) : null}
      </section>
    </main>
  );
}
```

### `app/sentinel/joined/page.jsx`

Same shape as `booking/confirmed`, copy adjusted to "Welcome to Sentinel".

### `components/BookingForm.jsx` — change the submit handler

Replace the `submitBooking` body's fetch + setStep(4) block with:

```js
const response = await fetch("/api/stripe/checkout/inspection", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...form, tier: form.tier || "rapid" }),
});
const payload = await response.json();
if (!response.ok || !payload.url) {
  throw new Error(payload.error || "Could not start checkout.");
}
window.location.assign(payload.url);
return; // important: don't continue to setSubmittedBooking
```

Add a `tier` field to `form` state (default `'rapid'`) and a step where the user picks Rapid vs Lab — or pass `tier` in via `BookingTakeover` based on which pricing-tier CTA was clicked (`data-tier="rapid" | "lab"` on the link).

---

## 6. Webhook idempotency strategy

Three overlapping defenses, in order of strength:

1. **Stripe-side: idempotency keys on `stripe.checkout.sessions.create`.** Already shown above — `idempotencyKey: 'inspection:<email>:<start>:<tier>'`. This makes the *create* call safe to retry from the browser.
2. **DB-side: UNIQUE indexes.** `inspections.stripe_payment_intent_id` and `subscriptions.stripe_subscription_id` are both `UNIQUE`. The handler uses select-then-insert (or `ON CONFLICT DO NOTHING` via Supabase upsert), so double-deliveries of `checkout.session.completed` are a no-op rather than a duplicate row.
3. **Handler-side: ID-scoped updates.** Every `UPDATE` in the webhook is scoped by `stripe_payment_intent_id` or `stripe_subscription_id`, never by a guessable surrogate ID. Conditional updates (`.is('cal_booking_id', null)` before stamping the Cal UID) make the Cal-call retry safe.

Do **not** rely on `event.id` alone as the dedupe key. Stripe occasionally re-dispatches with the same event ID but you don't need an `event_log` table for this volume — the per-resource UNIQUE constraints are sufficient. If volume grows or you add side-effects that aren't naturally idempotent (e.g. emails), then add an `event_log(event_id PRIMARY KEY)` table and `INSERT … ON CONFLICT DO NOTHING` at the top of the handler.

---

## 7. Local development

```bash
# 1. Install Stripe CLI: brew install stripe/stripe-cli/stripe
# 2. Log in once.
stripe login

# 3. Forward live Stripe events into the dev server.
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → prints "Ready! Your webhook signing secret is whsec_…"
# Copy that whsec into .env.local as STRIPE_WEBHOOK_SECRET, then restart `npm run dev`.

# 4. In a third terminal, run dev.
npm run dev
```

Test cards (Stripe docs > Testing):

- `4242 4242 4242 4242` — succeeds.
- `4000 0025 0000 3155` — requires 3DS (Australian test).
- `4000 0000 0000 9995` — declined: insufficient funds.
- Any future expiry, any 3 digit CVC, any postcode.

You can also fire specific events without going through a browser flow:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

These send synthetic events that hit your webhook — useful for verifying handler logic without real card UX. Note: triggered events have synthetic metadata (no `kind: 'inspection'`), so the handler should treat missing metadata as "skip" rather than fail.

---

## 8. Edge cases

**Subscription pause vs cancel.** Stripe distinguishes:

- "Pause collection" (`pause_collection.behavior = 'void' | 'mark_uncollectible' | 'keep_as_draft'`) — subscription remains `active` in Stripe's `status` field but stops billing. Detect via `subscription.pause_collection` being non-null and override our schema status to `'paused'`.
- Cancel at period end (`cancel_at_period_end = true`) — `status` stays `active` until the period ends, then flips to `canceled`. Treat as `active` in our schema until the `customer.subscription.deleted` event arrives, then `cancelled`.
- Immediate cancel — `status: 'canceled'` fires `customer.subscription.deleted` straight away.

Update `mapSubStatus` to check `pause_collection` first if you offer pause via the customer portal.

**Refunds — full.** `charge.refunded` arrives with `amount_refunded === amount_captured`. The handler shown above writes `amount_paid = 0` and you can optionally flip `inspections.status` to `'cancelled'`. Refunds **do not** automatically cancel the Cal.com booking — call `DELETE /v2/bookings/{uid}` (Cal API) from the same handler if that's your policy.

**Refunds — partial.** `charge.refunded` fires once with `amount_refunded` reflecting the cumulative refunded total (Stripe sends one event per refund). The handler writes the net `amount_paid = (captured - refunded) / 100`. The schema's `CHECK (amount_paid >= 0)` is satisfied because Stripe enforces refund total ≤ captured.

**Cal.com booking cancelled after payment.** Two paths:

- Cancelled in Cal.com UI by the customer: there's no automatic webhook from Cal hitting Stripe. You will need an admin task to reconcile — easiest is a `/admin/refunds` page that lists `inspections` rows whose `cal_booking_id` has a `status: 'cancelled'` in Cal.com (poll the Cal API for the booking) and lets staff click "refund". The actual refund goes via `stripe.refunds.create({ payment_intent: pi })`, then `charge.refunded` flows through the webhook as above.
- Cancelled by ops (e.g. weather, tech unavailable): same path — ops triggers the refund in Stripe Dashboard, the webhook syncs `amount_paid` and `inspections.status`.

**Payment succeeded but Cal.com booking failed (slot taken).** The webhook tries `calFetch('/bookings', …)`; if Cal returns a 409 / "slot unavailable", do **not** retry blindly — the slot is gone. Surface to admin via an `inspections.on_site_notes` flag like `"NEEDS_RESCHEDULE: Cal slot taken at payment time"` and a follow-up email. Refund or not is a policy call — typically refund unless the customer agrees to a new slot.

**Customer paid twice (refresh during redirect).** The Stripe-side idempotency key on the create call de-dupes server-to-Stripe. If a customer somehow gets two separate Checkout sessions and pays both, you get two `payment_intent.succeeded` events with different PI IDs — both create inspections (different `stripe_payment_intent_id` values). Admin handles by refunding one.

**`customer.subscription.updated` with no period change.** Fires for many things — card auto-updated, default payment method changed, etc. The handler is a blind update on `status` + `current_period_end`, which is safe to no-op.

**Email casing.** The schema has `UNIQUE INDEX customers_email_lower_uq ON customers (LOWER(email))`. Supabase's `.upsert({ onConflict: 'email' })` only works on a true `UNIQUE` constraint, not a functional index. Either add a real `email_lower` column with a unique constraint, or do select-by-`ilike` → update-or-insert manually inside the webhook. Pick one and stick with it.

---

## 9. Production webhook setup

In the Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://sporetrust.com.au/api/stripe/webhook`
- API version: pin to whatever you pinned in `lib/stripe.js`.
- Events: subscribe to exactly the events in `RELEVANT_EVENTS` above (do not subscribe to "all events" — extra traffic + missed-event paranoia for nothing).
- Copy the signing secret into prod env as `STRIPE_WEBHOOK_SECRET`. **This is different from the local `stripe listen` secret.**

After deployment, send a test event from the Dashboard and confirm a 200 response.
