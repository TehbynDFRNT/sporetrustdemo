import { randomBytes } from "node:crypto";

import { ensureProperty, linkCustomerProperty } from "./properties";
import { ensureCrmCard } from "./crm/cards";
import { createServerSupabaseClient } from "./supabase";

// Generates the public `report_slug` for an inspection. The customer
// receives this URL fragment in their Cal.com confirmation flow and
// returns to it through the entire lifecycle (Booked → In progress →
// Lab → Published report). The schema constraint requires
// `LENGTH(report_slug) >= 16`; 12 bytes of randomness in base64url
// produces a 16-char suffix → 20-char total slug with the `rpt_` prefix.
export function generateReportSlug() {
  return `rpt_${randomBytes(12).toString("base64url")}`;
}

// Idempotent: creates the customer + property + inspection rows that
// back a Cal.com booking. Safe to call from both the bookings POST
// handler (synchronous, in-flow with the booking creation) and the
// `BOOKING_CREATED` webhook handler (out-of-band reconciliation).
//
// If an inspection already exists for the given `cal_booking_id`, the
// existing row is returned untouched — callers don't need to check
// first. The returned object always has `{ inspection_id, report_slug }`
// so the caller can build the customer-facing URL.
export async function ensureInspectionFromBooking(input) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");

  if (!input?.cal_booking_id) {
    throw new Error("cal_booking_id is required");
  }

  // 1. Short-circuit if we've already created the inspection for this
  //    booking (race between webhook + POST handler, or webhook retries).
  const { data: existing, error: existingErr } = await supabase
    .from("inspections")
    .select("inspection_id, report_slug, status")
    .eq("cal_booking_id", input.cal_booking_id)
    .maybeSingle();
  if (existingErr) throw new Error(`Lookup inspection: ${existingErr.message}`);
  if (existing) return existing;

  // 2. Customer — re-use by email. No unique constraint on email so
  //    duplicates are possible if two booking emails differ in case;
  //    keep it simple and trust the input.
  const email = String(input.attendee?.email || "").trim();
  if (!email) throw new Error("attendee.email is required");
  let customerId;
  const { data: foundCustomer, error: cLookupErr } = await supabase
    .from("customers")
    .select("customer_id")
    .eq("email", email)
    .order("customer_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cLookupErr) throw new Error(`Lookup customer: ${cLookupErr.message}`);
  if (foundCustomer) {
    customerId = foundCustomer.customer_id;
  } else {
    const { data: newCustomer, error: cInsertErr } = await supabase
      .from("customers")
      .insert({
        email,
        name: String(input.attendee?.name || "").trim() || email,
        phone: input.attendee?.phone || null,
        customer_type: "individual",
      })
      .select("customer_id")
      .single();
    if (cInsertErr) throw new Error(`Insert customer: ${cInsertErr.message}`);
    customerId = newCustomer.customer_id;
  }

  // 3. Property — find-or-create via the shared helper (lib/properties.js),
  //    then record who booked it. The booking is the strongest evidence of a
  //    customer↔property relationship we get.
  if (!String(input.address || "").trim()) throw new Error("address is required");
  if (!String(input.postcode || "").trim()) throw new Error("postcode is required");
  const propertyId = await ensureProperty(supabase, {
    address_line: input.address,
    postcode: input.postcode,
    state: input.state,
    google_place_id: input.placeId,
    lat: input.lat,
    lng: input.lng,
  });
  await linkCustomerProperty(supabase, customerId, propertyId, { source: "booking" });

  // The booking is the strongest property signal — make it the card's primary
  // property unconditionally. The card may not exist yet (booking without a
  // prior lead), so ensure it first. Best-effort: CRM bookkeeping must not
  // fail the inspection creation.
  try {
    const { card_id } = await ensureCrmCard(supabase, customerId);
    await supabase
      .from("crm_cards")
      .update({ primary_property_id: propertyId })
      .eq("card_id", card_id);
  } catch (crmErr) {
    console.error("[inspectionsFromBooking] set primary property failed:", crmErr?.message || crmErr);
  }

  // 4. Inspection — generate the slug here so the bookings POST can
  //    return it immediately and redirect the customer to /r2/{slug}.
  const reportSlug = generateReportSlug();
  const startIso = input.start
    ? new Date(input.start).toISOString()
    : new Date().toISOString();
  const { data: inspection, error: iInsertErr } = await supabase
    .from("inspections")
    .insert({
      customer_id: customerId,
      property_id: propertyId,
      cal_booking_id: input.cal_booking_id,
      scheduled_at: startIso,
      duration_minutes: input.duration_minutes || 90,
      status: "scheduled",
      inspection_type: input.inspection_type || "standard",
      report_slug: reportSlug,
      report_status: "draft",
    })
    .select("inspection_id, report_slug, status")
    .single();
  if (iInsertErr) throw new Error(`Insert inspection: ${iInsertErr.message}`);

  return inspection;
}
