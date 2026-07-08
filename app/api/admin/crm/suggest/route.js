import { NextResponse } from "next/server";
import { suggestNextAction, isAnthropicConfigured } from "../../../../../lib/anthropic";
import { logSystemTouchpoint } from "../../../../../lib/crm/cards";
import { buildCardContext } from "../../../../../lib/crm/context";
import { STAGE_SLUGS } from "../../../../../lib/crm/stages";
import { getTemplate } from "../../../../../lib/crm/templates";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

// POST { card_id } — build the card's context, ask the model for the next
// action, validate it server-side, and materialise it as a touchpoint so the
// queue survives reloads. The touchpoints_one_pending_ai unique index means
// a concurrent second suggest 23505s — we return the existing draft instead.

const BUSINESS_START_HOUR = 9; // Australia/Brisbane
const BUSINESS_END_HOUR = 19;

function clampToBusinessHours(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  if (date < now) date.setTime(now.getTime());
  // Brisbane has no DST: UTC+10 year-round, so hour math is safe.
  const brisbaneHour = (date.getUTCHours() + 10) % 24;
  if (brisbaneHour < BUSINESS_START_HOUR) {
    date.setUTCHours(BUSINESS_START_HOUR - 10 + 24, 0, 0, 0);
    if (date.getTime() - Date.now() > 86_400_000) date.setTime(date.getTime() - 86_400_000);
  } else if (brisbaneHour >= BUSINESS_END_HOUR) {
    // Push to 9am Brisbane the next day.
    date.setTime(date.getTime() + (24 - brisbaneHour + BUSINESS_START_HOUR) * 3_600_000);
    date.setUTCMinutes(0, 0, 0);
  }
  return date.toISOString();
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const cardId = Number(body.card_id);
  if (!Number.isFinite(cardId) || cardId <= 0) {
    return NextResponse.json({ error: "card_id is required." }, { status: 400 });
  }
  if (!isAnthropicConfigured()) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  // Existing pending AI draft → return it instead of paying for a new one.
  const { data: existing } = await supabase
    .from("touchpoints")
    .select("*")
    .eq("card_id", cardId)
    .eq("origin", "ai")
    .eq("status", "draft")
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ touchpoint: existing, existing: true });
  }

  let context;
  let result;
  try {
    context = await buildCardContext(supabase, cardId);
    result = await suggestNextAction(context);
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Suggestion failed" }, { status: 502 });
  }

  const suggestion = result.suggestion;

  // Server-side validation — the model is constrained by schema, but enum
  // membership of template/stage and time sanity are ours to enforce.
  if (suggestion.template_key && !getTemplate(suggestion.template_key)) {
    suggestion.template_key = null;
  }
  if (suggestion.stage_to && !STAGE_SLUGS.includes(suggestion.stage_to)) {
    suggestion.stage_to = null;
    if (suggestion.action === "stage_move") suggestion.action = "wait";
  }
  suggestion.schedule_at = clampToBusinessHours(suggestion.schedule_at);

  const customer = context.customer;

  try {
    if (suggestion.action === "wait") {
      const until = suggestion.schedule_at ?? new Date(Date.now() + 3 * 86_400_000).toISOString();
      await supabase.from("crm_cards").update({ snoozed_until: until }).eq("card_id", cardId);
      await logSystemTouchpoint(supabase, cardId, `AI: wait until ${until} — ${suggestion.reasoning}`);
      return NextResponse.json({ suggestion, snoozed_until: until, usage: result.usage });
    }

    const row = {
      card_id: cardId,
      origin: "ai",
      status: "draft",
      direction: "outbound",
      ai_reasoning: String(suggestion.reasoning ?? "").slice(0, 2000),
      schedule_at: suggestion.schedule_at,
      template_key: suggestion.template_key,
    };

    if (suggestion.action === "call") {
      Object.assign(row, {
        channel: "call",
        body: (suggestion.talking_points ?? []).map((p) => `• ${p}`).join("\n") || suggestion.body,
      });
    } else if (suggestion.action === "sms") {
      Object.assign(row, {
        channel: "sms",
        body: String(suggestion.body ?? "").slice(0, 1000),
        to_address: customer.phone ?? null,
      });
    } else if (suggestion.action === "email") {
      Object.assign(row, {
        channel: "email",
        subject: String(suggestion.subject ?? "").slice(0, 300) || "From Sporetrust",
        body: String(suggestion.body ?? "").slice(0, 10_000),
        to_address: customer.email ?? null,
      });
    } else if (suggestion.action === "stage_move") {
      Object.assign(row, {
        channel: "system",
        body: `Move to ${suggestion.stage_to}`,
        template_key: `stage:${suggestion.stage_to}`,
      });
    }

    const { data: touchpoint, error: insertErr } = await supabase
      .from("touchpoints")
      .insert(row)
      .select()
      .single();

    if (insertErr) {
      // Unique partial index: someone else created a pending AI draft first.
      if (insertErr.code === "23505") {
        const { data: raced } = await supabase
          .from("touchpoints")
          .select("*")
          .eq("card_id", cardId)
          .eq("origin", "ai")
          .eq("status", "draft")
          .maybeSingle();
        if (raced) return NextResponse.json({ touchpoint: raced, existing: true });
      }
      throw new Error(insertErr.message);
    }

    return NextResponse.json({ suggestion, touchpoint, usage: result.usage });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Could not record suggestion" }, { status: 500 });
  }
}
