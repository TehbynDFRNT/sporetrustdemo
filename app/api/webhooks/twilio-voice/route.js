import { verifyTwilioSignature } from "../../../../lib/twilio";
import { normalizeAuPhone } from "../../../../lib/phone";
import { ensureCrmCard } from "../../../../lib/crm/cards";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

/* Twilio Voice webhook — inbound calls to the Sporetrust numbers. Point the
   number's "A call comes in" webhook at ${PUBLIC_BASE_URL}/api/webhooks/twilio-voice.

   Behaviour:
   - CALL_FORWARD_TO set → greet briefly, then Dial through to that number
     (callee sees the original caller ID). Falls through to the callback
     message if unanswered.
   - CALL_FORWARD_TO unset → answering-machine-lite: ask the caller to text
     this number, promise a callback.
   Either way the call is matched to a customer by From number and logged as
   an inbound touchpoint on their card, so calls surface in CRM history and
   the AI's context. Dedupe follows the SMS webhook's webhook_events pattern
   (event_id = CallSid); retries replay the same TwiML.

   Twilio must always receive TwiML (text/xml), including on dedupes — a JSON
   body would play the "application error" message to the caller. */

const PROVIDER = "twilio";

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const FALLBACK_SAY =
  "Thanks for calling Sporetrust. We can't take your call right now. " +
  "Send us a text on this number with your name and suburb, and we'll call you back as soon as we're free.";

function buildTwiml() {
  const forwardTo = process.env.CALL_FORWARD_TO;
  if (forwardTo) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-AU">Thanks for calling Sporetrust, connecting you now.</Say>
  <Dial timeout="25">${xmlEscape(forwardTo)}</Dial>
  <Say language="en-AU">${xmlEscape(FALLBACK_SAY)}</Say>
</Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-AU">${xmlEscape(FALLBACK_SAY)}</Say>
</Response>`;
}

const twimlResponse = () =>
  new Response(buildTwiml(), { status: 200, headers: { "Content-Type": "text/xml" } });

export async function POST(request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const signature = request.headers.get("x-twilio-signature") || "";

  const base = process.env.PUBLIC_BASE_URL || "";
  const url = `${base}/api/webhooks/twilio-voice`;
  if (!verifyTwilioSignature(url, params, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    // Still answer the caller properly even if logging is unavailable.
    return twimlResponse();
  }

  const callSid = params.CallSid || "unknown";
  const from = params.From || "";

  const { error: insertErr } = await supabase.from("webhook_events").insert({
    provider: PROVIDER,
    event_id: `${callSid}:voice-inbound`,
    event_type: "voice.inbound",
    raw_payload: rawBody.slice(0, 32_000),
  });
  if (insertErr) {
    // Duplicate (Twilio retry) or insert failure — answer the call either way.
    return twimlResponse();
  }

  // Best-effort CRM logging; never let it break the caller's experience.
  try {
    const phone = normalizeAuPhone(from);
    if (phone) {
      const { data: customers } = await supabase
        .from("customers")
        .select("customer_id, name")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1);
      const customer = customers?.[0];
      if (customer) {
        const card = await ensureCrmCard(supabase, customer.customer_id);
        await supabase.from("touchpoints").insert({
          card_id: card.card_id,
          channel: "call",
          direction: "inbound",
          origin: "system",
          status: "logged",
          to_address: from,
          body: `Inbound call from ${from}${process.env.CALL_FORWARD_TO ? " (forwarded)" : " (played callback message)"}`,
        });
      }
    }
  } catch (err) {
    console.error("[twilio-voice] CRM logging failed:", err?.message || err);
  }

  return twimlResponse();
}
