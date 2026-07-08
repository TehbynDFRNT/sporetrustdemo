import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

/* Postmark delivery/bounce webhooks → touchpoint delivery state. Postmark
   doesn't sign payloads, so the endpoint is protected with Basic auth
   embedded in the webhook URL configured in Postmark:
     https://x:${POSTMARK_WEBHOOK_SECRET}@sporetrust.com.au/api/webhooks/postmark
   Same webhook_events insert-first dedupe as the Cal/Twilio hooks;
   event_id = `${MessageID}:${RecordType}`. */

const PROVIDER = "postmark";

function safeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function verifyBasicAuth(request) {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const pass = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
  return safeEqual(pass, secret);
}

export async function POST(request) {
  if (!verifyBasicAuth(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rawBody = await request.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const messageId = payload.MessageID || "unknown";
  const recordType = payload.RecordType || "Unknown";
  const eventId = `${messageId}:${recordType}`;

  const { data: event, error: insertErr } = await supabase
    .from("webhook_events")
    .insert({
      provider: PROVIDER,
      event_id: eventId,
      event_type: `email.${recordType}`,
      raw_payload: rawBody.slice(0, 32_000),
    })
    .select("webhook_event_id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505" || /duplicate key/i.test(insertErr.message || "")) {
      return NextResponse.json({ status: "ok", deduped: true });
    }
    console.error("[postmark-webhook] insert event error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  let handlerError = null;
  try {
    if (recordType === "Delivery") {
      const { error } = await supabase
        .from("touchpoints")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("provider", PROVIDER)
        .eq("provider_message_id", messageId)
        .eq("status", "sent"); // never regress a terminal state
      if (error) throw new Error(error.message);
    } else if (recordType === "Bounce" || recordType === "SpamComplaint") {
      const detail = payload.Description || payload.Details || recordType;
      const { error } = await supabase
        .from("touchpoints")
        .update({ status: "failed", error: `Postmark ${recordType}: ${String(detail).slice(0, 500)}` })
        .eq("provider", PROVIDER)
        .eq("provider_message_id", messageId)
        .in("status", ["sent", "delivered"]); // a bounce after delivery still matters
      if (error) throw new Error(error.message);
    }
    // Open/Click/etc — recorded in webhook_events, no touchpoint change.
  } catch (err) {
    handlerError = err?.message || String(err);
    console.error("[postmark-webhook] handler failed:", handlerError);
  }

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), error: handlerError })
    .eq("webhook_event_id", event.webhook_event_id);

  return NextResponse.json({ status: "ok" });
}
