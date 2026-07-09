import { NextResponse } from "next/server";
import { ensureCrmCard, logSystemTouchpoint } from "../../../lib/crm/cards";
import { createRuleAction } from "../../../lib/crm/rules";
import { fireLifecycle } from "../../../lib/crm/lifecycle";
import { notifyOwnerNewLead } from "../../../lib/crm/notify";
import { ensureProperty, linkCustomerProperty } from "../../../lib/properties";
import { normalizeAuPhone } from "../../../lib/phone";
import { createServerSupabaseClient } from "../../../lib/supabase";

export const runtime = "nodejs";

const AUDIENCES = ["tenant", "homeowner", "property_manager"];

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max) || null;
}

function num(value) {
  // Empty string coerces to 0 via Number() — treat missing as null, not 0,0.
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Capture a paid-funnel lead: upsert the customer (identity + address-on-file
// + geocode) keyed on email, then record the enquiry + ad attribution in
// `leads`. Properties/inspections stay owned by the booking flow.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = clean(body.firstName || body.name, 200);
  const email = clean(body.email, 200)?.toLowerCase();
  const phone = clean(body.phone, 50);
  const audience = AUDIENCES.includes(body.audience) ? body.audience : "tenant";

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Lead capture is not configured." },
      { status: 503 }
    );
  }

  const addressFields = {
    address_line: clean(body.address),
    postcode: clean(body.postcode, 16),
    state: "QLD",
    google_place_id: clean(body.placeId, 200),
    lat: num(body.lat),
    lng: num(body.lng),
  };
  const hasAddress = Boolean(addressFields.address_line);
  const customer_type = audience === "property_manager" ? "property_manager" : "individual";

  try {
    // --- Upsert customer by email (unique on LOWER(email)) ---
    let customerId;
    const { data: found, error: lookupErr } = await supabase
      .from("customers")
      .select("customer_id")
      .ilike("email", email)
      .order("customer_id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupErr) throw new Error(`Lookup customer: ${lookupErr.message}`);

    if (found) {
      customerId = found.customer_id;
      // Latest enquiry refreshes contact; only overwrite address when supplied.
      const update = { name, phone, customer_type, ...(hasAddress ? addressFields : {}) };
      const { error: updErr } = await supabase
        .from("customers")
        .update(update)
        .eq("customer_id", customerId);
      if (updErr) throw new Error(`Update customer: ${updErr.message}`);
    } else {
      const { data: created, error: insErr } = await supabase
        .from("customers")
        .insert({ email, name, phone, customer_type, ...addressFields })
        .select("customer_id")
        .single();
      if (insErr) throw new Error(`Insert customer: ${insErr.message}`);
      customerId = created.customer_id;
    }

    // --- Record the lead (enquiry + attribution) ---
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        customer_id: customerId,
        audience,
        message: clean(body.detail || body.message, 2000),
        utm_source: clean(body.utm_source),
        utm_medium: clean(body.utm_medium),
        utm_campaign: clean(body.utm_campaign),
        utm_content: clean(body.utm_content),
        utm_term: clean(body.utm_term),
        gclid: clean(body.gclid),
        fbclid: clean(body.fbclid),
        landing_page: clean(body.landing_page || body.page),
        form: clean(body.form, 50),
        submitted_at: body.submitted_at || new Date().toISOString(),
      })
      .select("lead_id")
      .single();
    if (leadErr) throw new Error(`Insert lead: ${leadErr.message}`);

    // --- CRM plumbing: card + property + timeline event. Own try/catch —
    //     lead capture must never fail because CRM bookkeeping did. ---
    try {
      const { card_id } = await ensureCrmCard(supabase, customerId);
      if (hasAddress && addressFields.postcode) {
        const propertyId = await ensureProperty(supabase, addressFields);
        await linkCustomerProperty(supabase, customerId, propertyId, {
          relationship:
            audience === "property_manager" ? "manager"
            : audience === "homeowner" ? "owner"
            : "resident",
          source: "lead",
        });
        // Fill the card's primary property if it doesn't have one yet.
        // Bookings (the stronger signal) overwrite this later.
        await supabase
          .from("crm_cards")
          .update({ primary_property_id: propertyId })
          .eq("card_id", card_id)
          .is("primary_property_id", null);
      }
      // RULE: new lead → queue a call. Dedupes against any pending action.
      const normalizedPhone = phone ? normalizeAuPhone(phone) : null;
      await createRuleAction(supabase, {
        cardId: card_id,
        channel: "call",
        ruleKey: "new_lead_call",
        body: `Call new ${audience} lead — ${
          clean(body.detail || body.message, 200) ?? "no message"
        }`,
        toAddress: normalizedPhone,
      });
      await logSystemTouchpoint(
        supabase,
        card_id,
        `New ${audience} lead via ${clean(body.form, 50) ?? "form"} — ${clean(body.landing_page || body.page) ?? "unknown page"}`,
      );
      const notified = await notifyOwnerNewLead({
        customer: { name, email, phone, address_line: addressFields.address_line, postcode: addressFields.postcode },
        lead: {
          audience,
          message: clean(body.detail || body.message, 2000),
          form: clean(body.form, 50),
          landing_page: clean(body.landing_page || body.page),
          utm_source: clean(body.utm_source),
        },
        cardId: card_id,
      });
      if (notified) {
        await logSystemTouchpoint(supabase, card_id, "Owner notified by email");
      }
      // LIFECYCLE: welcome the enquirer. 24h dedupe inside fireLifecycle means
      // a double submit or a second quiz run won't double-text.
      await fireLifecycle(supabase, { trigger: "lead_received", customerId });
    } catch (crmErr) {
      console.error("[api/lead] CRM plumbing failed:", crmErr?.message || crmErr);
    }

    return NextResponse.json({ ok: true, lead_id: lead.lead_id, customer_id: customerId });
  } catch (error) {
    console.error("[api/lead]", error?.message || error);
    return NextResponse.json(
      { error: error.message || "Could not capture the lead." },
      { status: 500 }
    );
  }
}
