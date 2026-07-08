/* Twilio SMS — direct REST, matching the repo's Cal/Meta convention (no SDK).
   Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (+61 mobile long
   code — alpha sender IDs are one-way and would break "reply with a time"
   templates). Twilio auto-handles STOP opt-outs on long codes; never
   override that. */

import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.twilio.com/2010-04-01";

export function isTwilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM,
  );
}

// Send one SMS. Returns { sid, status }. Throws with Twilio's error message
// on non-2xx so the caller can stamp touchpoints.error verbatim.
export async function sendSms({ to, body, statusCallback }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw new Error("Twilio is not configured");

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  if (statusCallback) params.set("StatusCallback", statusCallback);

  const res = await fetch(`${API_BASE}/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Twilio ${res.status}: ${data?.message || "send failed"}`);
  }
  return { sid: data.sid, status: data.status };
}

// Verify X-Twilio-Signature on delivery callbacks: HMAC-SHA1 over the full
// callback URL + the POST params concatenated key+value in sorted-key order,
// base64. https://www.twilio.com/docs/usage/security#validating-requests
export function verifyTwilioSignature(url, params, signature) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  const expected = createHmac("sha1", token).update(data, "utf8").digest("base64");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
