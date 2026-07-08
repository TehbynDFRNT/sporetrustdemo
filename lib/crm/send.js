/* Touchpoint dispatch — the ONE code path that talks to providers, shared by
   the send route (human click) and the cron (due scheduled sends).

   Idempotency is the atomic claim: UPDATE ... WHERE status IN
   ('draft','approved') RETURNING. Two concurrent send attempts race on that
   UPDATE; exactly one gets the row, the other gets nothing and reports
   not-claimable. A claimed touchpoint that fails at the provider is stamped
   'failed' (retry = PATCH back to approved, which re-claims cleanly). */

import { sendSms } from "../twilio";
import { sendEmail } from "../postmark";

export async function sendTouchpoint(supabase, touchpointId) {
  // 1. Atomic claim.
  const { data: claimed, error: claimErr } = await supabase
    .from("touchpoints")
    .update({ status: "sending" })
    .eq("touchpoint_id", touchpointId)
    .in("status", ["draft", "approved"])
    .select("*, crm_cards(customer_id, customers(name, email, phone))")
    .maybeSingle();
  if (claimErr) return { ok: false, status: 400, error: claimErr.message };
  if (!claimed) {
    return { ok: false, status: 409, error: "Not sendable (already sent, sending, or cancelled)." };
  }

  const fail = async (message) => {
    await supabase
      .from("touchpoints")
      .update({ status: "failed", error: String(message).slice(0, 1000) })
      .eq("touchpoint_id", touchpointId);
    return { ok: false, status: 502, error: String(message) };
  };

  // 2. Resolve destination — snapshot from the customer when the draft
  //    didn't carry one.
  const customer = claimed.crm_cards?.customers ?? {};
  const to =
    claimed.to_address ||
    (claimed.channel === "sms" ? customer.phone : customer.email) ||
    null;
  if (!to) return await fail(`No destination ${claimed.channel === "sms" ? "phone" : "email"} on file`);
  if (!claimed.body) return await fail("Touchpoint has no body");

  // 3. Provider send.
  let provider;
  let providerMessageId;
  try {
    if (claimed.channel === "sms") {
      provider = "twilio";
      const base = process.env.PUBLIC_BASE_URL;
      const { sid } = await sendSms({
        to,
        body: claimed.body,
        statusCallback: base ? `${base}/api/webhooks/twilio` : undefined,
      });
      providerMessageId = sid;
    } else if (claimed.channel === "email") {
      provider = "postmark";
      if (!claimed.subject) return await fail("Email touchpoint has no subject");
      const { messageId } = await sendEmail({
        to,
        subject: claimed.subject,
        textBody: claimed.body,
        tag: "crm",
        metadata: { touchpoint_id: String(touchpointId) },
      });
      providerMessageId = messageId;
    } else {
      return await fail(`Channel ${claimed.channel} is not sendable`);
    }
  } catch (err) {
    return await fail(err?.message || "Provider send failed");
  }

  // 4. Stamp sent. If this update somehow fails the provider send still
  //    happened — surface the mismatch rather than pretending.
  const { data: sent, error: stampErr } = await supabase
    .from("touchpoints")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      to_address: to,
      provider,
      provider_message_id: providerMessageId,
      error: null,
    })
    .eq("touchpoint_id", touchpointId)
    .select()
    .single();
  if (stampErr) {
    return { ok: false, status: 500, error: `Sent (${providerMessageId}) but stamp failed: ${stampErr.message}` };
  }
  return { ok: true, status: 200, row: sent };
}
