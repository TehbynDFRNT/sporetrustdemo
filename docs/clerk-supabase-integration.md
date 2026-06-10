# Clerk + Supabase integration — Sporetrust

Implementation guide for wiring **Clerk** auth into the Next.js 16 app and connecting Clerk's session JWT to **Supabase Postgres RLS** so the `customers.clerk_user_id` and `partner_organizations.clerk_org_id` fields scope every query.

This project is plain **JSX**, not TypeScript. Every code sample below is `.jsx` / `.js`.

---

## 1. Chosen approach: Supabase native Third-Party Auth

There are two historical paths and only one current path:

| Path | Status | Use? |
|---|---|---|
| Clerk JWT template named `"supabase"`, signed with Supabase's JWT secret | **Deprecated 1 Apr 2025**. Grace-period TP-MAU billing exclusion runs out 1 Jan 2026. | **No** |
| Supabase **Third-Party Auth** with Clerk as provider, verified via Clerk's JWKS endpoint | Current. Co-developed with the Clerk team. | **Yes — this is what we use** |

**What's different**: in the new model Clerk's *session token* (not a separate template) is sent as the `Authorization: Bearer …` header to Supabase. Supabase verifies it against the public JWKS at `https://<clerk-domain>/.well-known/jwks.json` and exposes the claims via `auth.jwt()` inside RLS policies. There is **no shared signing secret** anymore.

> If you find tutorials still referencing a "supabase" JWT template — they're stale. Don't use them.[^1]

**Session token version**: as of 14 Apr 2025 Clerk emits **v2** session tokens. Organization claims are now nested under a single `o` claim (`o.id`, `o.rol`, `o.slg`, `o.per`) instead of the old flat `org_id`, `org_role`, etc. Every RLS policy below targets v2.[^2]

---

## 2. Environment variables

Put these in `.env.local` (gitignored, like the existing `CAL_*` vars):

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never expose
```

Optional (only if you wire up Clerk-hosted sign-in pages later):

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/account
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/account
```

**Clerk dashboard**: turn **Organizations** on (Configure → Organization settings). Without this the partner-org flow has nothing to write to. Leave **Personal accounts** enabled — that's where customers live.

**Supabase dashboard**: Authentication → Sign In / Providers → **Add provider** → **Clerk** → paste your Clerk Frontend API domain (e.g. `clerk.sporetrust.com.au` for prod, `XXX.clerk.accounts.dev` for dev). Supabase will pull the JWKS automatically.

For Supabase local dev, add to `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "XXX.clerk.accounts.dev"
```

---

## 3. File plan

```
package.json                                   add @clerk/nextjs, @supabase/supabase-js
middleware.js                                  Clerk auth middleware (plain JS)
app/layout.jsx                                 wrap children in <ClerkProvider>
app/sign-in/[[...sign-in]]/page.jsx            Clerk <SignIn />
app/sign-up/[[...sign-up]]/page.jsx            Clerk <SignUp />
app/account/page.jsx                           gated: customer's reports list
app/account/layout.jsx                         requires auth, redirects if not signed in
app/api/webhooks/clerk/route.js                Clerk webhook receiver (svix verified)
lib/supabase/server.js                         server-side Supabase client factory
lib/supabase/client.js                         client-side Supabase client factory
lib/supabase/admin.js                          service-role client (webhooks, admin tasks)
components/MegaNav.jsx                         add <SignedIn>/<SignedOut> account link
```

No TypeScript — keep `.js` / `.jsx`.

---

## 4. Install

```bash
npm install @clerk/nextjs @supabase/supabase-js svix
```

`svix` is for verifying webhook signatures. Clerk also exposes a `verifyWebhook()` helper from `@clerk/nextjs/webhooks` that wraps svix; either works, but pulling svix directly keeps the webhook handler portable.

---

## 5. Middleware

`middleware.js` at the repo root (Next sees it automatically — sibling of `app/`):

```js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that REQUIRE a signed-in session.
const isProtected = createRouteMatcher([
  "/account(.*)",
  "/partners/dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except static assets and Next internals.
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
```

Important: `/api/webhooks/clerk` must **not** require auth — incoming webhooks have no Clerk session. The matcher above already excludes static files; the webhook route is under `/api`, so it gets executed by middleware, but because it's not in `isProtected` it stays public.

---

## 6. `<ClerkProvider>` in the root layout

Wrap the existing `app/layout.jsx`:

```jsx
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, JetBrains_Mono, Montserrat } from "next/font/google";
import BookingTakeover from "../components/BookingTakeover";
import QuizTakeover from "../components/QuizTakeover";
import ReportDemoTakeover from "../components/ReportDemoTakeover";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import "./globals.css";

// ...font definitions unchanged...

export default function RootLayout({ children }) {
  const fontClasses = [
    geist.variable,
    jetBrains.variable,
    montserrat.variable,
  ].join(" ");

  return (
    <ClerkProvider>
      <html lang="en-AU" className={fontClasses}>
        <body>
          <SiteHeader />
          {children}
          <SiteFooter />
          <BookingTakeover />
          <QuizTakeover />
          <ReportDemoTakeover />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

`<ClerkProvider>` must be **outside** `<html>` for the SSR cookie pass-through to work.

---

## 7. Sign-in / sign-up routes

Catch-all routes so Clerk owns the URL surface:

```jsx
// app/sign-in/[[...sign-in]]/page.jsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="auth-page">
      <SignIn />
    </main>
  );
}
```

```jsx
// app/sign-up/[[...sign-up]]/page.jsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="auth-page">
      <SignUp />
    </main>
  );
}
```

Add a minimal `.auth-page` rule to `app/globals.css` to centre the Clerk widget — Clerk's component brings its own styles, you just need a flex container.

---

## 8. MegaNav integration point (note only — don't implement here)

In `components/MegaNav.jsx`, the slot for the account link is next to the existing `Book inspection` CTA (around line 288). Use Clerk's gating components so unsigned and signed states render the right link:

```jsx
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

// inside <nav>, next to the Book CTA:
<SignedOut>
  <a className="mega-nav__signin" href="/sign-in">Sign in</a>
</SignedOut>
<SignedIn>
  <a className="mega-nav__account" href="/account">My reports</a>
  <UserButton afterSignOutUrl="/" />
</SignedIn>
```

(The class names match the existing `mega-nav__*` BEM scheme. Style in `globals.css` alongside `.mega-nav__cta`.)

---

## 9. Supabase client factories

The key idea: every Supabase client we build for an **authenticated request** declares `accessToken: async () => clerk_token`. The Supabase JS SDK calls that function on every fetch, attaches the Bearer header, and Supabase verifies it against Clerk's JWKS.

### 9a. Server components / route handlers — `lib/supabase/server.js`

```js
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Use inside async server components, server actions, and route handlers.
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        const { getToken } = await auth();
        return (await getToken()) ?? null;
      },
    }
  );
}
```

### 9b. Client components — `lib/supabase/client.js`

```js
"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      }
    );
  }, [session]);
}
```

`useMemo` keyed on `session` keeps a stable reference; otherwise every render builds a new client and breaks Supabase's realtime subscriptions.

### 9c. Service-role admin client — `lib/supabase/admin.js`

For Clerk webhooks and any other server-side context where there is no end-user JWT. **Never import this from a client component, ever.**

```js
import { createClient } from "@supabase/supabase-js";

// Bypasses RLS. Server-only.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
```

### 9d. Public anonymous client (for `report_slug` viewers)

The published-report URL is meant to be share-able without a login. For that path use the anon client with **no** access token:

```js
// inline at the top of app/r/[slug]/page.jsx
import { createClient } from "@supabase/supabase-js";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

The slug-scoped RLS policy in §11 handles the rest.

---

## 10. First-sign-in sync — **use webhooks, not lazy upsert**

You have two options to ensure a Clerk `user_xxx` ends up linked to a `customers` row:

**A. Webhook (`user.created`, `user.updated`, `user.deleted`)** — eventually consistent, runs without a user request, survives multiple sign-in surfaces.

**B. Lazy upsert** — on the first authenticated DB call, `INSERT … ON CONFLICT DO UPDATE` a `customers` row.

**Recommendation: webhook.** Sporetrust has a real-world case where the customer already exists in `customers` (admin booked them by email before they ever signed up). That means at sign-up time the right operation is **"find by email-lower, attach `clerk_user_id`; if no match, create"** — non-trivial logic that you do *not* want sprinkled across every server component that touches Supabase. Centralise it in one webhook handler.

`app/api/webhooks/clerk/route.js`:

```js
import { Webhook } from "svix";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  const payload = await req.text();
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");

  let evt;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    return new Response("Invalid signature", { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const u = evt.data;
      const email = u.email_addresses?.[0]?.email_address;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || email;
      const phone = u.phone_numbers?.[0]?.phone_number ?? null;

      if (!email) break;

      // 1. Try to attach Clerk ID to an existing customer row by email.
      const { data: existing } = await supabase
        .from("customers")
        .select("customer_id, clerk_user_id")
        .ilike("email", email)
        .maybeSingle();

      if (existing) {
        if (existing.clerk_user_id && existing.clerk_user_id !== u.id) {
          // collision: same email, different Clerk user. Log and bail.
          console.error("Clerk user collision", { email, existing, incoming: u.id });
          break;
        }
        await supabase
          .from("customers")
          .update({ clerk_user_id: u.id, name, phone })
          .eq("customer_id", existing.customer_id);
      } else {
        await supabase.from("customers").insert({
          clerk_user_id: u.id,
          email,
          name,
          phone,
        });
      }
      break;
    }

    case "user.deleted": {
      // Soft-detach: keep the customer row (it owns inspections), null the Clerk ID.
      await supabase
        .from("customers")
        .update({ clerk_user_id: null })
        .eq("clerk_user_id", evt.data.id);
      break;
    }

    case "organization.created":
    case "organization.updated": {
      const o = evt.data;
      const { data: existing } = await supabase
        .from("partner_organizations")
        .select("partner_id")
        .eq("clerk_org_id", o.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("partner_organizations")
          .update({ name: o.name })
          .eq("partner_id", existing.partner_id);
      } else {
        await supabase.from("partner_organizations").insert({
          name: o.name,
          clerk_org_id: o.id,
          active: true,
        });
      }
      break;
    }

    case "organizationMembership.created":
      // Optional: track which Clerk users belong to which partner_organizations.
      // Sporetrust doesn't (yet) need a join table — Clerk owns membership and the
      // 'o.id' claim on the user's session token is the source of truth at query time.
      break;

    case "organization.deleted": {
      await supabase
        .from("partner_organizations")
        .update({ active: false })
        .eq("clerk_org_id", evt.data.id);
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
```

**Clerk dashboard wiring**: Configure → Webhooks → Add endpoint → URL `https://sporetrust.com.au/api/webhooks/clerk` → subscribe to `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`. Copy the **Signing Secret** into `CLERK_WEBHOOK_SIGNING_SECRET`.

**Local development**: use `ngrok http 3000` and register the ngrok URL as a second endpoint. Clerk allows multiple endpoints per app.

---

## 11. RLS policies

Enable RLS on every table that has customer or partner data. The patterns:

- **Authed-customer path**: `auth.jwt()->>'sub'` = Clerk user ID, joined through `customers.clerk_user_id`.
- **Authed-partner path**: `auth.jwt()->'o'->>'id'` = Clerk org ID, joined through `partner_organizations.clerk_org_id`.
- **Public-slug path**: a separate policy where `report_status = 'published'` AND the request comes through the anon Supabase key (`auth.jwt()` is NULL).

**Helper function** for the customer-id lookup — avoids a subquery in every policy:

```sql
CREATE OR REPLACE FUNCTION current_customer_id()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT customer_id FROM customers
  WHERE clerk_user_id = auth.jwt()->>'sub'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_partner_id()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT partner_id FROM partner_organizations
  WHERE clerk_org_id = auth.jwt()->'o'->>'id'
  LIMIT 1;
$$;
```

Mark both `STABLE` so Postgres caches per-query. `SECURITY DEFINER` lets the helper itself bypass RLS on the lookup tables — the policies that *call* it still enforce access on the target table.

### 11a. `inspections`

```sql
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Customer sees their own inspections.
CREATE POLICY inspections_customer_own ON inspections FOR SELECT
  USING (customer_id = current_customer_id());

-- Anyone with the unguessable slug can read a *published* report.
CREATE POLICY inspections_public_slug ON inspections FOR SELECT
  USING (
    report_status = 'published'
    AND report_slug IS NOT NULL
    AND LENGTH(report_slug) >= 16
  );

-- Matched partner sees inspections they've been handed off.
CREATE POLICY inspections_partner_handoff ON inspections FOR SELECT
  USING (
    inspection_id IN (
      SELECT inspection_id FROM partner_handoffs
      WHERE partner_id = current_partner_id()
    )
  );
```

> **Note on the slug policy**: it allows *anyone* (anon key, no JWT) to `SELECT * FROM inspections WHERE report_slug = '<slug>'`. That's intentional — slugs are 16+ chars and unguessable. To stop a brute-force scan, also revoke wide-open SELECT on the table from the `anon` role and force callers to query *by slug*:
> ```sql
> -- The policy permits the row, but the query MUST filter by slug.
> -- Enforced at the API layer by always doing .eq('report_slug', slug).limit(1).
> ```
> If you want defence in depth, expose published reports through a Postgres function (RPC) instead of a direct table SELECT, and pass the slug as an argument.

### 11b. `sample_locations`, `image_captures`, `moisture_readings`, `location_findings`, `location_sources`, `air_samples`, `air_sample_fungal_counts`, `air_sample_particulate_counts`, `air_sample_notable_objects`, `scope_items`

Every per-location and per-air-sample table is reachable through its `inspection_id` (directly or via `sample_location_id → inspections`). Reuse the inspection policies:

```sql
ALTER TABLE sample_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY sample_locations_via_inspection ON sample_locations FOR SELECT
  USING (
    inspection_id IN (
      -- delegates to inspections RLS via the helper
      SELECT inspection_id FROM inspections
      WHERE customer_id = current_customer_id()
         OR (report_status = 'published'
             AND report_slug IS NOT NULL
             AND LENGTH(report_slug) >= 16)
         OR inspection_id IN (
           SELECT inspection_id FROM partner_handoffs
           WHERE partner_id = current_partner_id()
         )
    )
  );
```

Repeat the pattern for the rest, hopping `sample_locations` for the per-location tables:

```sql
ALTER TABLE air_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY air_samples_via_location ON air_samples FOR SELECT
  USING (
    sample_location_id IN (SELECT sample_location_id FROM sample_locations)
  );
```

Because `sample_locations` already has RLS, the IN subquery is naturally filtered. This means **enable RLS on every descendant table and let the policy on the root (`inspections`) do the gating** — descendant policies just say "you may see rows whose parent you can see".

### 11c. `subscriptions`

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_customer_own ON subscriptions FOR SELECT
  USING (customer_id = current_customer_id());
```

No public/partner path — subscription info is customer-private.

### 11d. `partner_handoffs`

```sql
ALTER TABLE partner_handoffs ENABLE ROW LEVEL SECURITY;

-- Customer sees handoffs for their own inspections.
CREATE POLICY partner_handoffs_customer ON partner_handoffs FOR SELECT
  USING (
    inspection_id IN (
      SELECT inspection_id FROM inspections
      WHERE customer_id = current_customer_id()
    )
  );

-- Partner sees handoffs to themselves.
CREATE POLICY partner_handoffs_partner ON partner_handoffs FOR SELECT
  USING (partner_id = current_partner_id());

-- Partner can update status on their own handoff rows (quoted/engaged/declined).
CREATE POLICY partner_handoffs_partner_update ON partner_handoffs FOR UPDATE
  USING (partner_id = current_partner_id())
  WITH CHECK (partner_id = current_partner_id());
```

### 11e. `partner_organizations`

```sql
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;

-- Partner sees their own org.
CREATE POLICY partner_orgs_own ON partner_organizations FOR SELECT
  USING (clerk_org_id = auth.jwt()->'o'->>'id');

-- Partner admin can update their own org's contact/credentials/service_areas.
CREATE POLICY partner_orgs_admin_update ON partner_organizations FOR UPDATE
  USING (
    clerk_org_id = auth.jwt()->'o'->>'id'
    AND auth.jwt()->'o'->>'rol' = 'admin'
  )
  WITH CHECK (
    clerk_org_id = auth.jwt()->'o'->>'id'
    AND auth.jwt()->'o'->>'rol' = 'admin'
  );
```

`o.rol` carries Clerk's organization role — the default values are `admin` and `member` (unless you've added custom org roles in Clerk dashboard).

### 11f. `customers`

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Self-read only. No public, no partner.
CREATE POLICY customers_self ON customers FOR SELECT
  USING (clerk_user_id = auth.jwt()->>'sub');

CREATE POLICY customers_self_update ON customers FOR UPDATE
  USING (clerk_user_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_user_id = auth.jwt()->>'sub');
```

**Inserts** to `customers` happen via the service-role webhook handler (which bypasses RLS), so no INSERT policy is needed.

### 11g. Reference tables (`trade_categories`, `fungal_classifications`, `particulate_types`)

Public read, no writes from clients:

```sql
ALTER TABLE trade_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY trade_categories_read ON trade_categories FOR SELECT USING (true);
-- (no INSERT/UPDATE/DELETE policy = locked down to service role)
```

---

## 12. Internal staff / inspectors — recommendation

Two viable approaches:

**A. A single Sporetrust Clerk organization**, with members holding role `org:admin` or a custom `org:inspector`. Sporetrust staff sign in, Clerk emits `o.id = org_xxx_sporetrust` and `o.rol = admin|inspector`.

**B. Clerk public metadata** on the user record (`{ "role": "staff" }`), surfaced as a custom claim via Clerk's customization of the session token.

**Recommendation: Approach A.** Reasons:
1. The Clerk Organizations primitive already exists in your stack for partners. Reusing it for staff is one mental model, not two.
2. Clerk org roles ship through the session token in `o.rol` — no JWT template customisation needed.
3. When the team grows you can scope inspector data ownership to `partner_id`-style rows trivially (see §14).

The schema doesn't currently model staff explicitly — but it doesn't need to. Until you give inspectors their own dashboard, just gate `/admin` routes with `auth.protect({ role: 'org:admin' })` in the middleware, and treat them as having read-all access via the service-role client on the server side.

Add to `middleware.js` when the admin surface arrives:

```js
const isAdmin = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdmin(req)) {
    await auth.protect((has) => has({ role: "org:admin" }));
  } else if (isProtected(req)) {
    await auth.protect();
  }
});
```

---

## 13. Wiring the booking flow

The existing booking flow (`BookingForm` → `/api/cal/bookings`) does not require auth — that's correct, you want anonymous booking. **Don't gate it.**

What you *can* do post-booking: if `auth()` returns a user, attach the new `inspections.customer_id` to that user's `customers` row right in the booking route handler. Use the server Supabase client; RLS will permit the insert because the row's `customer_id` resolves via the helper.

If the booker is anonymous, the existing email-based customer creation in the booking route still works; the webhook in §10 will later attach `clerk_user_id` when that customer signs up with the same email.

---

## 14. Future: scope staff/inspector data once the team grows

When you need per-inspector ownership (e.g. "show me the inspections I personally captured"), add:

```sql
ALTER TABLE inspections
  ADD COLUMN inspector_clerk_user_id TEXT
    REFERENCES customers(clerk_user_id) ON DELETE SET NULL;
-- Or, if you split staff into their own table:
ALTER TABLE inspections
  ADD COLUMN inspector_id BIGINT REFERENCES staff(staff_id);
```

Then add an inspector-scoped RLS policy:

```sql
CREATE POLICY inspections_inspector ON inspections FOR SELECT
  USING (
    auth.jwt()->'o'->>'id' = '<sporetrust-clerk-org-id>'
    AND (
      auth.jwt()->'o'->>'rol' = 'admin'                    -- admins see all
      OR inspector_clerk_user_id = auth.jwt()->>'sub'      -- inspectors see own
    )
  );
```

Hard-coding the Sporetrust org ID in the policy is fine because it's stable and not secret. Cleaner: store it in a `app_settings(key, value)` table and look it up via a `STABLE` SQL function.

---

## 15. Verification checklist

After wiring everything:

1. `npm run dev`, hit `/sign-up`, create a test user. Confirm `customers` has a new row with `clerk_user_id` populated.
2. In Supabase SQL editor as the **anon** role:
   ```sql
   SET request.jwt.claims TO '{"sub":"user_TEST"}';
   SELECT * FROM customers;
   ```
   Should return only the row matching that sub.
3. Hit `/account` while signed in — should fetch the right customer's inspections. Sign out — should redirect.
4. Open a published report at `/r/<slug>` while signed *out* — should load. Open `/r/wrong-slug` — should 404.
5. Create a Clerk organization, invite a user with role `admin`, confirm the session token contains `o.id` and `o.rol = "admin"` (decode it at jwt.io with the JWKS).
6. Trigger a `user.created` webhook from the Clerk dashboard (Test endpoint) and confirm the handler returns 200 and inserts/updates a row.

---

[^1]: Supabase docs explicitly mark the JWT-template integration as deprecated as of 1 Apr 2025; Clerk's changelog entry "Supabase Third-Party Auth Integration" (31 Mar 2025) is the authoritative announcement. The deprecated path keeps working through 1 Jan 2026 but loses TP-MAU billing exclusion after that — no reason to build new code against it.

[^2]: Clerk changelog "Session Token JWT v2" (14 Apr 2025). v1 used `org_id`, `org_role`, `org_slug`, `org_permissions` as flat claims. v2 nests them under `o`. If you ever decode a token and see flat `org_*` keys, the project is still on v1 — toggle v2 in the Clerk dashboard before writing RLS that depends on the `o` shape.
