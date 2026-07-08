/* Postmark email — direct REST (repo convention: no SDK).
   Env: POSTMARK_SERVER_TOKEN, POSTMARK_FROM (verified sender signature).
   Everything sends on the transactional "outbound" stream — CRM messages
   are 1:1 replies to people who submitted an enquiry. If waitlist updates
   ever become bulk sends, split a broadcast stream with List-Unsubscribe
   instead of risking the transactional reputation. */

const API_BASE = "https://api.postmarkapp.com";

export function isPostmarkConfigured() {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN && process.env.POSTMARK_FROM);
}

// Send one email. Returns { messageId }. Throws with Postmark's error
// message on non-2xx so the caller can stamp touchpoints.error verbatim.
export async function sendEmail({ to, subject, textBody, htmlBody, tag, metadata }) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) throw new Error("Postmark is not configured");

  const res = await fetch(`${API_BASE}/email`, {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: `Sporetrust <${from}>`,
      To: to,
      Subject: subject,
      TextBody: textBody,
      ...(htmlBody ? { HtmlBody: htmlBody } : {}),
      MessageStream: "outbound",
      ...(tag ? { Tag: tag } : {}),
      ...(metadata ? { Metadata: metadata } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ErrorCode) {
    throw new Error(`Postmark ${data?.ErrorCode ?? res.status}: ${data?.Message || "send failed"}`);
  }
  return { messageId: data.MessageID };
}
