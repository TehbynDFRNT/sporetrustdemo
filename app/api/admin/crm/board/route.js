import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

// Board payload: every card with its customer + rolled-up lead and
// touchpoint context, one row per card. Three cheap queries merged in JS —
// trivially fine at this volume (hundreds of cards, .limit(500) like the
// generic handler).
export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ rows: [], source: "mock" });
  }

  const [cardsRes, leadsRes, touchRes] = await Promise.all([
    supabase
      .from("crm_cards")
      .select(
        "card_id, customer_id, stage, stage_changed_at, snoozed_until, auto_mode, created_at, " +
          "customers(name, email, phone, address_line, postcode, customer_type), " +
          "primary_property:properties!crm_cards_primary_property_id_fkey(property_id, address_line, postcode)",
      )
      .limit(500),
    supabase
      .from("leads")
      .select("lead_id, customer_id, audience, form, utm_source, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(500),
    supabase
      .from("touchpoints")
      .select("card_id, channel, status, direction, schedule_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const err = cardsRes.error || leadsRes.error || touchRes.error;
  if (err) {
    return NextResponse.json({ rows: [], error: err.message }, { status: 200 });
  }

  // Roll leads up per customer (newest first thanks to the order above).
  const leadsByCustomer = new Map();
  for (const lead of leadsRes.data ?? []) {
    const list = leadsByCustomer.get(lead.customer_id) ?? [];
    list.push(lead);
    leadsByCustomer.set(lead.customer_id, list);
  }

  // Latest logged touch + earliest pending action per card.
  const lastTouchByCard = new Map();
  const pendingByCard = new Map();
  for (const tp of touchRes.data ?? []) {
    if (["draft", "approved"].includes(tp.status)) {
      const current = pendingByCard.get(tp.card_id);
      if (!current || (tp.schedule_at ?? "") < (current.schedule_at ?? "")) {
        pendingByCard.set(tp.card_id, tp);
      }
      continue;
    }
    if (!lastTouchByCard.has(tp.card_id)) lastTouchByCard.set(tp.card_id, tp);
  }

  const rows = (cardsRes.data ?? []).map((card) => {
    const custLeads = leadsByCustomer.get(card.customer_id) ?? [];
    const pending = pendingByCard.get(card.card_id) ?? null;
    const lastTouch = lastTouchByCard.get(card.card_id) ?? null;
    return {
      card_id: card.card_id,
      customer_id: card.customer_id,
      stage: card.stage,
      stage_changed_at: card.stage_changed_at,
      snoozed_until: card.snoozed_until,
      auto_mode: card.auto_mode,
      created_at: card.created_at,
      customer: card.customers ?? null,
      primary_property: card.primary_property ?? null,
      lead_count: custLeads.length,
      latest_lead: custLeads[0]
        ? {
            audience: custLeads[0].audience,
            form: custLeads[0].form,
            utm_source: custLeads[0].utm_source,
            submitted_at: custLeads[0].submitted_at,
          }
        : null,
      last_touch: lastTouch
        ? { channel: lastTouch.channel, created_at: lastTouch.created_at }
        : null,
      pending_action: pending
        ? { channel: pending.channel, status: pending.status, schedule_at: pending.schedule_at }
        : null,
    };
  });

  return NextResponse.json({ rows, source: "supabase" });
}
