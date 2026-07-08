import { NextResponse } from "next/server";
import { adminListHandler } from "../../../../lib/admin/handler";
import { touchpoints } from "../../../../lib/admin/types/touchpoints";
import { createRuleAction } from "../../../../lib/crm/rules";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(touchpoints);
}

// Insert validation mirrors the table CHECKs so a bad composer payload fails
// with a readable message instead of a Postgres constraint string.
const CHANNELS = ["call", "sms", "email", "note", "system"];
const DIRECTIONS = ["outbound", "inbound"];
const STATUSES = ["draft", "approved", "sending", "sent", "delivered", "failed", "logged", "cancelled"];
const ORIGINS = ["manual", "ai", "system"];
const DISPOSITIONS = ["answered", "voicemail", "no_answer", "busy", "callback_requested", "wrong_number"];

const clean = (v, max = 2000) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};

// POST — the composer's insert path: log a call/note, or save an sms/email
// draft for the queue. Sending happens via /api/admin/touchpoints/[id]/send.
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
  const channel = String(body.channel ?? "");
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: `channel must be one of ${CHANNELS.join(", ")}.` }, { status: 400 });
  }
  const status = body.status == null ? "logged" : String(body.status);
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${STATUSES.join(", ")}.` }, { status: 400 });
  }
  const direction = body.direction == null ? "outbound" : String(body.direction);
  if (!DIRECTIONS.includes(direction)) {
    return NextResponse.json({ error: "direction must be outbound or inbound." }, { status: 400 });
  }
  const origin = body.origin == null ? "manual" : String(body.origin);
  if (!ORIGINS.includes(origin)) {
    return NextResponse.json({ error: `origin must be one of ${ORIGINS.join(", ")}.` }, { status: 400 });
  }
  const disposition = body.disposition == null ? null : String(body.disposition);
  if (disposition && !DISPOSITIONS.includes(disposition)) {
    return NextResponse.json({ error: `disposition must be one of ${DISPOSITIONS.join(", ")}.` }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("touchpoints")
    .insert({
      card_id: cardId,
      channel,
      direction,
      status,
      origin,
      template_key: clean(body.template_key, 100),
      subject: clean(body.subject, 300),
      body: clean(body.body, 10000),
      to_address: clean(body.to_address, 200),
      schedule_at: body.schedule_at || null,
      disposition,
      outcome_notes: clean(body.outcome_notes, 2000),
      ai_reasoning: clean(body.ai_reasoning, 2000),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // RULE: a call dispositioned callback_requested → queue the callback.
  // Fire-and-forget; never block the composer's response.
  if (data.disposition === "callback_requested") {
    try {
      await createRuleAction(supabase, {
        cardId: data.card_id,
        channel: "call",
        ruleKey: "callback_requested",
        body: "Callback requested — schedule the call",
        scheduleAt: null,
      });
    } catch (ruleErr) {
      console.error("[api/admin/touchpoints] callback rule failed:", ruleErr?.message || ruleErr);
    }
  }

  return NextResponse.json({ row: data }, { status: 201 });
}
