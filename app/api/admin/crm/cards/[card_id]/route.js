import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../../lib/supabase";

export const runtime = "nodejs";

// Card workspace payload — everything the operator needs on one screen:
// identity, every lead (full quiz/symptom text), the touchpoint timeline,
// linked properties and any inspections.
export async function GET(_req, ctx) {
  const { card_id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: card, error: cardErr } = await supabase
    .from("crm_cards")
    .select(
      "card_id, customer_id, stage, stage_changed_at, snoozed_until, auto_mode, created_at, updated_at, " +
        "customers(customer_id, name, email, phone, address_line, postcode, state, customer_type, notes), " +
        "primary_property:properties!crm_cards_primary_property_id_fkey(property_id, address_line, postcode)",
    )
    .eq("card_id", card_id)
    .maybeSingle();
  if (cardErr) return NextResponse.json({ error: cardErr.message }, { status: 400 });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customerId = card.customer_id;
  const [leadsRes, touchRes, linksRes, inspRes] = await Promise.all([
    supabase
      .from("leads")
      .select("lead_id, audience, message, utm_source, utm_medium, utm_campaign, landing_page, form, submitted_at")
      .eq("customer_id", customerId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("touchpoints")
      .select("*")
      .eq("card_id", card.card_id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("customer_properties")
      .select("relationship, source, properties(property_id, address_line, postcode)")
      .eq("customer_id", customerId),
    supabase
      .from("inspections")
      .select("inspection_id, status, inspection_type, scheduled_at, report_status")
      .eq("customer_id", customerId)
      .order("scheduled_at", { ascending: false }),
  ]);

  const err = leadsRes.error || touchRes.error || linksRes.error || inspRes.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });

  return NextResponse.json({
    card: {
      card_id: card.card_id,
      stage: card.stage,
      stage_changed_at: card.stage_changed_at,
      snoozed_until: card.snoozed_until,
      auto_mode: card.auto_mode,
      created_at: card.created_at,
      primary_property: card.primary_property ?? null,
    },
    customer: card.customers ?? null,
    leads: leadsRes.data ?? [],
    touchpoints: touchRes.data ?? [],
    properties: (linksRes.data ?? []).map((l) => ({
      ...l.properties,
      relationship: l.relationship,
      source: l.source,
    })),
    inspections: inspRes.data ?? [],
  });
}
