import { NextResponse } from "next/server";
import { isAnthropicConfigured, suggestNextAction } from "../../../../lib/anthropic";
import { logSystemTouchpoint } from "../../../../lib/crm/cards";
import { buildCardContext } from "../../../../lib/crm/context";
import { sendTouchpoint } from "../../../../lib/crm/send";
import { STAGE_SLUGS } from "../../../../lib/crm/stages";
import { getTemplate } from "../../../../lib/crm/templates";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

/* CRM heartbeat — safe at any cadence (everything is claim-based or
   idempotent). Vercel Cron hits this hourly (vercel.json); Hobby-plan
   fallback is daily. Steps, each try/caught into the summary:
     1. dispatch due approved sms/email (business hours only, cap 20)
     2. clear elapsed snoozes
     3. AI suggestions for stale cards (cap 5 model calls/run)
   Auto-mode cards get their sms/email suggestion inserted as `approved`
   with a business-hours schedule_at — it dispatches on a LATER run, so the
   queue page always shows a review window before anything auto-sends.
   Calls and stage moves are never auto-approved. */

const STALE_DAYS_BY_STAGE = { new: 0, working: 3, waitlist: 7 };
const OUTBOUND_COOLDOWN_MS = 48 * 3_600_000;
const DISPATCH_CAP = 20;
const SUGGEST_CAP = 5;
const BUSINESS_START_HOUR = 9; // Brisbane, UTC+10 year-round (no DST)
const BUSINESS_END_HOUR = 19;

const brisbaneHour = (date = new Date()) => (date.getUTCHours() + 10) % 24;

function inBusinessHours(date = new Date()) {
  const h = brisbaneHour(date);
  return h >= BUSINESS_START_HOUR && h < BUSINESS_END_HOUR;
}

// Next 9am–7pm Brisbane slot from now (used to schedule auto-mode sends).
function nextBusinessSlot() {
  const now = new Date();
  if (inBusinessHours(now)) return now.toISOString();
  const h = brisbaneHour(now);
  const hoursUntilStart = h < BUSINESS_START_HOUR ? BUSINESS_START_HOUR - h : 24 - h + BUSINESS_START_HOUR;
  const slot = new Date(now.getTime() + hoursUntilStart * 3_600_000);
  slot.setUTCMinutes(0, 0, 0);
  return slot.toISOString();
}

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const summary = { sent: 0, send_failures: 0, unsnoozed: 0, suggested: 0, auto_approved: 0, skipped: [], errors: [] };
  const nowIso = new Date().toISOString();

  // ── 1. Dispatch due approved sms/email ────────────────────────────────
  try {
    if (inBusinessHours()) {
      const { data: due, error } = await supabase
        .from("touchpoints")
        .select("touchpoint_id")
        .eq("status", "approved")
        .in("channel", ["sms", "email"])
        .or(`schedule_at.is.null,schedule_at.lte.${nowIso}`)
        .order("schedule_at", { ascending: true, nullsFirst: true })
        .limit(DISPATCH_CAP);
      if (error) throw new Error(error.message);
      for (const tp of due ?? []) {
        const result = await sendTouchpoint(supabase, tp.touchpoint_id);
        if (result.ok) summary.sent += 1;
        else summary.send_failures += 1; // 409s (raced) and provider failures both land here
      }
    } else {
      summary.skipped.push("dispatch: outside business hours");
    }
  } catch (err) {
    summary.errors.push(`dispatch: ${err.message}`);
  }

  // ── 2. Clear elapsed snoozes ──────────────────────────────────────────
  try {
    const { data: woken, error } = await supabase
      .from("crm_cards")
      .update({ snoozed_until: null })
      .lte("snoozed_until", nowIso)
      .select("card_id");
    if (error) throw new Error(error.message);
    summary.unsnoozed = woken?.length ?? 0;
  } catch (err) {
    summary.errors.push(`unsnooze: ${err.message}`);
  }

  // ── 3. AI suggestions for stale cards ─────────────────────────────────
  try {
    if (!isAnthropicConfigured()) {
      summary.skipped.push("suggest: ANTHROPIC_API_KEY not configured");
    } else {
      const [cardsRes, touchRes] = await Promise.all([
        supabase
          .from("crm_cards")
          .select("card_id, stage, auto_mode, snoozed_until, customers(phone, email)")
          .in("stage", Object.keys(STALE_DAYS_BY_STAGE)),
        supabase
          .from("touchpoints")
          .select("card_id, channel, direction, status, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      const err = cardsRes.error || touchRes.error;
      if (err) throw new Error(err.message);

      const lastOutboundByCard = new Map();
      const hasPendingByCard = new Set();
      for (const tp of touchRes.data ?? []) {
        if (["draft", "approved", "sending"].includes(tp.status)) hasPendingByCard.add(tp.card_id);
        if (
          tp.direction === "outbound" &&
          tp.channel !== "system" &&
          ["sent", "delivered", "logged"].includes(tp.status) &&
          !lastOutboundByCard.has(tp.card_id)
        ) {
          lastOutboundByCard.set(tp.card_id, new Date(tp.created_at).getTime());
        }
      }

      const now = Date.now();
      const stale = (cardsRes.data ?? []).filter((card) => {
        if (hasPendingByCard.has(card.card_id)) return false;
        if (card.snoozed_until && new Date(card.snoozed_until) > new Date()) return false;
        const lastOut = lastOutboundByCard.get(card.card_id);
        const staleAfterMs = STALE_DAYS_BY_STAGE[card.stage] * 86_400_000;
        return lastOut == null || now - lastOut >= staleAfterMs;
      });

      for (const card of stale.slice(0, SUGGEST_CAP)) {
        try {
          const context = await buildCardContext(supabase, card.card_id);
          const { suggestion } = await suggestNextAction(context);

          if (suggestion.template_key && !getTemplate(suggestion.template_key)) suggestion.template_key = null;
          if (suggestion.stage_to && !STAGE_SLUGS.includes(suggestion.stage_to)) {
            suggestion.stage_to = null;
            if (suggestion.action === "stage_move") suggestion.action = "wait";
          }

          if (suggestion.action === "wait") {
            const until = suggestion.schedule_at ?? new Date(now + 3 * 86_400_000).toISOString();
            await supabase.from("crm_cards").update({ snoozed_until: until }).eq("card_id", card.card_id);
            await logSystemTouchpoint(supabase, card.card_id, `AI (cron): wait until ${until} — ${suggestion.reasoning}`);
            summary.suggested += 1;
            continue;
          }

          const isMessage = ["sms", "email"].includes(suggestion.action);
          // Auto mode only ever auto-approves messages, and never inside the
          // 48h outbound cooldown (belt-and-braces over the prompt rule).
          const lastOut = lastOutboundByCard.get(card.card_id);
          const cooledDown = lastOut == null || now - lastOut >= OUTBOUND_COOLDOWN_MS;
          const autoApprove = card.auto_mode && isMessage && cooledDown;

          const row = {
            card_id: card.card_id,
            origin: "ai",
            status: autoApprove ? "approved" : "draft",
            direction: "outbound",
            ai_reasoning: String(suggestion.reasoning ?? "").slice(0, 2000),
            schedule_at: autoApprove ? nextBusinessSlot() : suggestion.schedule_at ?? null,
            template_key: suggestion.template_key,
          };
          if (suggestion.action === "call") {
            Object.assign(row, {
              channel: "call",
              body: (suggestion.talking_points ?? []).map((p) => `• ${p}`).join("\n") || suggestion.body,
              status: "draft",
              schedule_at: suggestion.schedule_at ?? null,
            });
          } else if (suggestion.action === "sms") {
            Object.assign(row, { channel: "sms", body: String(suggestion.body ?? "").slice(0, 1000), to_address: card.customers?.phone ?? null });
          } else if (suggestion.action === "email") {
            Object.assign(row, {
              channel: "email",
              subject: String(suggestion.subject ?? "").slice(0, 300) || "From Sporetrust",
              body: String(suggestion.body ?? "").slice(0, 10_000),
              to_address: card.customers?.email ?? null,
            });
          } else if (suggestion.action === "stage_move") {
            Object.assign(row, { channel: "system", body: `Move to ${suggestion.stage_to}`, template_key: `stage:${suggestion.stage_to}`, status: "draft" });
          }

          const { error: insertErr } = await supabase.from("touchpoints").insert(row);
          if (insertErr && insertErr.code !== "23505") throw new Error(insertErr.message);
          summary.suggested += 1;
          if (row.status === "approved") summary.auto_approved += 1;
        } catch (cardErr) {
          summary.errors.push(`suggest card ${card.card_id}: ${cardErr.message}`);
        }
      }
    }
  } catch (err) {
    summary.errors.push(`suggest: ${err.message}`);
  }

  return NextResponse.json(summary);
}
