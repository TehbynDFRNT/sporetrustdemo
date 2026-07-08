import { verifyTwilioSignature } from "../../../../lib/twilio";
import { normalizeAuPhone } from "../../../../lib/phone";

export const runtime = "nodejs";

/* TwiML App voice webhook — Twilio POSTs here when the browser dialler
   places a call (device.connect({ params: { To } })). We bridge it to the
   customer's number with the business number as caller ID.

   Toll-fraud guard: only Australian numbers, and only ones that survive
   normalizeAuPhone. Anything else gets a spoken rejection, not a Dial. */

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const twiml = (inner) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${inner}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });

export async function POST(request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const signature = request.headers.get("x-twilio-signature") || "";

  const base = process.env.PUBLIC_BASE_URL || "";
  if (!verifyTwilioSignature(`${base}/api/voice/outgoing`, params, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const to = normalizeAuPhone(params.To || "");
  const callerId = process.env.TWILIO_FROM;

  if (!to || !to.startsWith("+61") || !callerId) {
    return twiml(`<Say language="en-AU">Sorry, that number can't be dialled from here.</Say>`);
  }

  return twiml(
    `<Dial callerId="${xmlEscape(callerId)}" timeout="30"><Number>${xmlEscape(to)}</Number></Dial>`,
  );
}
