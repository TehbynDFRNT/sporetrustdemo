import { NextResponse } from "next/server";
import { verifyTwilioSignature } from "../../../../lib/twilio";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

/* Twilio SMS status callbacks → touchpoint delivery state. Clones the Cal
   webhook's idempotency pattern: signature verify → insert webhook_events
   FIRST (UNIQUE provider+event_id turns retries into 23505 → 200 deduped) →
   process → stamp processed_at/error. Twilio fires one callback per status
   transition, so event_id is `${MessageSid}:${MessageStatus}`. */

const PROVIDER = "twilio";

// Statuses we act on. `sent` from Twilio just means handed to carrier — our
// row is already 'sent', so only terminal transitions update it.
const STATUS_MAP = {
  delivered: "delivered",
  undelivered: "failed",
  failed: "failed",
};

export async function POST(request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const signature = request.headers.get("x-twilio-signature") || "";

  const base = process.env.PUBLIC_BASE_URL || "";
  const url = `${base}/api/webhooks/twilio`;
  if (!verifyTwilioSignature(url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const messageSid = params.MessageSid || params.SmsSid || "unknown";
  const messageStatus = params.MessageStatus || params.SmsStatus || "unknown";
  const eventId = `${messageSid}:${messageStatus}`;

  const { data: event, error: insertErr } = await supabase
    .from("webhook_events")
    .insert({
      provider: PROVIDER,
      event_id: eventId,
      event_type: `sms.${messageStatus}`,
      raw_payload: rawBody.slice(0, 32_000),
    })
    .select("webhook_event_id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505" || /duplicate key/i.test(insertErr.message || "")) {
      return NextResponse.json({ status: "ok", deduped: true });
    }
    console.error("[twilio-webhook] insert event error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  let handlerError = null;
  try {
    const nextStatus = STATUS_MAP[messageStatus];
    if (nextStatus) {
      const patch =
        nextStatus === "delivered"
          ? { status: "delivered", delivered_at: new Date().toISOString() }
          : {
              status: "failed",
              error: `Twilio ${messageStatus}${params.ErrorCode ? ` (error ${params.ErrorCode})` : ""}`,
            };
      // Only move forward from 'sent' — a late/replayed callback must never
      // regress a delivered row.
      const { error } = await supabase
        .from("touchpoints")
        .update(patch)
        .eq("provider", PROVIDER)
        .eq("provider_message_id", messageSid)
        .eq("status", "sent");
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    handlerError = err?.message || String(err);
    console.error("[twilio-webhook] handler failed:", handlerError);
  }

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), error: handlerError })
    .eq("webhook_event_id", event.webhook_event_id);

  // Always 200 to Twilio once recorded — their retries are for transport
  // failures, not our handler bugs (those are visible in webhook_events).
  return NextResponse.json({ status: "ok" });
}
