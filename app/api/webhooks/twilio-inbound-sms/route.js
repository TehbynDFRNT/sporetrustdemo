import { verifyTwilioSignature } from "../../../../lib/twilio";
import { normalizeAuPhone } from "../../../../lib/phone";
import { ensureCrmCard } from "../../../../lib/crm/cards";
import { createRuleAction } from "../../../../lib/crm/rules";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

/* Inbound SMS — a customer texting/replying to TWILIO_FROM. Point the phone
   number's "A message comes in" webhook here. (Delivery status callbacks for
   OUR sends are a different route: /api/webhooks/twilio.)

   The reply lands as an inbound touchpoint on the sender's card, so it shows
   in the timeline and the AI context reads it as engagement. No auto-reply —
   the response is empty TwiML. Twilio handles STOP/opt-out upstream. */

const PROVIDER = "twilio";

const emptyTwiml = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });

export async function POST(request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const signature = request.headers.get("x-twilio-signature") || "";

  const base = process.env.PUBLIC_BASE_URL || "";
  if (!verifyTwilioSignature(`${base}/api/webhooks/twilio-inbound-sms`, params, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) return emptyTwiml();

  const messageSid = params.MessageSid || params.SmsSid || "unknown";
  const from = params.From || "";
  const body = params.Body || "";

  const { error: insertErr } = await supabase.from("webhook_events").insert({
    provider: PROVIDER,
    event_id: `${messageSid}:inbound`,
    event_type: "sms.inbound",
    raw_payload: rawBody.slice(0, 32_000),
  });
  if (insertErr) {
    // Duplicate (retry) or insert failure — ack either way so Twilio stops.
    return emptyTwiml();
  }

  try {
    const phone = normalizeAuPhone(from);
    let logged = false;
    if (phone) {
      const { data: customers } = await supabase
        .from("customers")
        .select("customer_id")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1);
      const customer = customers?.[0];
      if (customer) {
        const card = await ensureCrmCard(supabase, customer.customer_id);
        await supabase.from("touchpoints").insert({
          card_id: card.card_id,
          channel: "sms",
          direction: "inbound",
          origin: "system",
          status: "logged",
          to_address: from,
          body: body.slice(0, 2000),
          provider: PROVIDER,
          provider_message_id: messageSid,
        });
        // RULE: inbound reply → queue an outbound SMS (operator writes body).
        await createRuleAction(supabase, {
          cardId: card.card_id,
          channel: "sms",
          ruleKey: "reply_inbound_sms",
          body: "",
          toAddress: from,
        });
        logged = true;
      }
    }
    if (!logged) {
      // Unknown sender — keep the message visible in webhook_events at least.
      console.warn(`[twilio-inbound-sms] no customer match for ${from}`);
    }
  } catch (err) {
    console.error("[twilio-inbound-sms] CRM logging failed:", err?.message || err);
  }

  return emptyTwiml();
}
