/* CRM card plumbing — cards are the pipeline anchor, one per customer.
   Leads stay append-only enquiry events; every lead ensures its customer has
   a card, and a fresh enquiry revives a card that was marked lost. */

// Find or insert the customer's card. Race-safe on the customer_id UNIQUE
// (23505 → re-select). Returns { card_id, stage }.
export async function ensureCrmCard(supabase, customerId) {
  const findExisting = async () => {
    const { data, error } = await supabase
      .from("crm_cards")
      .select("card_id, stage")
      .eq("customer_id", customerId)
      .maybeSingle();
    if (error) throw new Error(`Lookup crm card: ${error.message}`);
    return data ?? null;
  };

  const existing = await findExisting();
  if (existing) {
    // A new enquiry from a lost card is a live enquiry again.
    if (existing.stage === "lost") {
      const { data, error } = await supabase
        .from("crm_cards")
        .update({ stage: "new" })
        .eq("card_id", existing.card_id)
        .select("card_id, stage")
        .single();
      if (error) throw new Error(`Revive crm card: ${error.message}`);
      return data;
    }
    return existing;
  }

  const { data: created, error: insertErr } = await supabase
    .from("crm_cards")
    .insert({ customer_id: customerId })
    .select("card_id, stage")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      const raced = await findExisting();
      if (raced) return raced;
    }
    throw new Error(`Insert crm card: ${insertErr.message}`);
  }
  return created;
}

// Append a system event to the card's timeline (lead arrived, owner
// notified, AI decided to wait, ...). Never throws into the caller's flow
// beyond the insert error itself — callers wrap in their own try/catch.
export async function logSystemTouchpoint(supabase, cardId, body) {
  const { error } = await supabase.from("touchpoints").insert({
    card_id: cardId,
    channel: "system",
    origin: "system",
    status: "logged",
    body: String(body ?? "").slice(0, 2000),
  });
  if (error) throw new Error(`Log system touchpoint: ${error.message}`);
}
