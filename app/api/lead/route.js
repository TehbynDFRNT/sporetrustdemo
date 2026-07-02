import { NextResponse } from "next/server";
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

    return NextResponse.json({ ok: true, lead_id: lead.lead_id, customer_id: customerId });
  } catch (error) {
    console.error("[api/lead]", error?.message || error);
    return NextResponse.json(
      { error: error.message || "Could not capture the lead." },
      { status: 500 }
    );
  }
}
