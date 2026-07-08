/* CRM rules engine — deterministic, no AI. Each trigger drops ONE draft
   action onto a card's queue, and only if the card has no pending action
   already (one pending action per card; rules never stack).

   Rule catalog (template_key `rule:<ruleKey>`):
     - new_lead_call      — a fresh lead arrives → queue a call to the lead.
     - reply_inbound_sms  — customer texts in → queue an outbound SMS reply
                            (operator writes the body).
     - return_missed_call — an inbound call is logged → queue a call back.
     - callback_requested — a call is dispositioned callback_requested →
                            queue the callback.

   The existing partial unique index touchpoints_one_pending_ai only covers
   origin='ai'; these rows are origin='system', so dedupe happens in code via
   hasPendingAction(). Every trigger is fire-and-forget in its caller — a
   failure here must never break the primary write. */

// True if the card already has a queued action (draft or approved).
export async function hasPendingAction(supabase, cardId) {
  const { data, error } = await supabase
    .from("touchpoints")
    .select("touchpoint_id")
    .eq("card_id", cardId)
    .in("status", ["draft", "approved"])
    .limit(1);
  if (error) throw new Error(`Check pending action: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

// Insert a rule-created draft touchpoint. Skips (returns null) when the card
// already has a pending action. Returns the inserted row, or null.
export async function createRuleAction(
  supabase,
  { cardId, channel, body, toAddress = null, scheduleAt = null, ruleKey },
) {
  if (await hasPendingAction(supabase, cardId)) return null;

  const { data, error } = await supabase
    .from("touchpoints")
    .insert({
      card_id: cardId,
      channel,
      direction: "outbound",
      status: "draft",
      origin: "system",
      template_key: `rule:${ruleKey}`,
      body: String(body ?? "").slice(0, 1000),
      to_address: toAddress || null,
      schedule_at: scheduleAt || null,
    })
    .select()
    .single();
  if (error) throw new Error(`Create rule action: ${error.message}`);
  return data;
}
