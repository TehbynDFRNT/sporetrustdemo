/* Shared property plumbing — find-or-create against the natural key
   (LOWER(address_line), postcode) and customer↔property linkage.

   Extracted from lib/inspectionsFromBooking.js so the lead API can populate
   properties too (previously only the booking flow wrote them). Both callers
   pass their own supabase client (service role). */

// Find or insert a property. Lookup order matters: google_place_id first
// (authoritative — the same physical place arrives with different address
// text from Places autocomplete vs booking forms), then the natural key
// (LOWER(address_line), postcode). Race-safe: an insert losing to either
// unique index (23505) falls back to re-select.
export async function ensureProperty(supabase, input) {
  const address = String(input.address_line || "").trim();
  const postcode = String(input.postcode || "").trim();
  const placeId = String(input.google_place_id || "").trim() || null;
  if (!address) throw new Error("address_line is required");
  if (!postcode) throw new Error("postcode is required");

  const findExisting = async () => {
    if (placeId) {
      const { data, error } = await supabase
        .from("properties")
        .select("property_id")
        .eq("google_place_id", placeId)
        .maybeSingle();
      if (error) throw new Error(`Lookup property by place: ${error.message}`);
      if (data) return data.property_id;
    }
    const { data, error } = await supabase
      .from("properties")
      .select("property_id")
      .ilike("address_line", address)
      .eq("postcode", postcode)
      .maybeSingle();
    if (error) throw new Error(`Lookup property: ${error.message}`);
    return data?.property_id ?? null;
  };

  const existing = await findExisting();
  if (existing) return existing;

  const { data: created, error: insertErr } = await supabase
    .from("properties")
    .insert({
      address_line: address,
      postcode,
      state: input.state || "QLD",
      google_place_id: placeId,
      lat: input.lat != null && input.lat !== "" ? Number(input.lat) : null,
      lng: input.lng != null && input.lng !== "" ? Number(input.lng) : null,
    })
    .select("property_id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      const raced = await findExisting();
      if (raced) return raced;
    }
    throw new Error(`Insert property: ${insertErr.message}`);
  }
  return created.property_id;
}

// Upsert the customer↔property link. Duplicate links are a no-op; a booking
// link upgrades a lead link's source (stronger evidence of the relationship).
export async function linkCustomerProperty(
  supabase,
  customerId,
  propertyId,
  { relationship = "unknown", source = "lead" } = {},
) {
  const { error } = await supabase
    .from("customer_properties")
    .upsert(
      { customer_id: customerId, property_id: propertyId, relationship, source },
      { onConflict: "customer_id,property_id", ignoreDuplicates: source !== "booking" },
    );
  if (error && error.code !== "23505") {
    throw new Error(`Link customer property: ${error.message}`);
  }
}
