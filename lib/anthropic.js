/* Anthropic Messages API — direct REST (repo convention: Cal/Meta/Twilio/
   Postmark are all wired the same way; no SDK dependency for one call site).

   suggestNextAction(context) asks Claude for the single best next CRM action
   for one card, constrained to a JSON schema via structured outputs, so the
   response always parses. The stable system prompt + template catalog carry
   a cache_control breakpoint — the volatile per-card context rides in the
   user turn, keeping the prefix cacheable across suggestion calls. Never
   interpolate timestamps into SYSTEM_PROMPT or the cache never hits. */

import { TEMPLATES } from "./crm/templates";
import { STAGE_SLUGS } from "./crm/stages";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// All properties required; nullability via type unions (structured-outputs
// schema rules: additionalProperties:false everywhere, no min/max).
const SUGGESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "action",
    "template_key",
    "subject",
    "body",
    "schedule_at",
    "stage_to",
    "talking_points",
    "reasoning",
  ],
  properties: {
    action: { type: "string", enum: ["call", "sms", "email", "wait", "stage_move"] },
    template_key: { type: ["string", "null"] },
    subject: { type: ["string", "null"] },
    body: { type: ["string", "null"] },
    schedule_at: { type: ["string", "null"], format: "date-time" },
    stage_to: { type: ["string", "null"] },
    talking_points: { type: "array", items: { type: "string" } },
    reasoning: { type: "string" },
  },
};

const SYSTEM_PROMPT = `You are the sales assistant for Sporetrust, a one-person independent mould and moisture diagnostics startup in Brisbane / South-East Queensland. Your job: given one customer's full CRM context, choose the single best next action and draft it ready to send.

Rules of engagement:
- Prefer a CALL for new or hot leads — it is the highest-value action. For a call, set action="call" and put 3-6 short talking points in talking_points, grounded in the customer's own enquiry (their quiz answers, their words).
- Never suggest an outbound sms/email within 48 hours of the most recent outbound touch (history.days_since_last_outbound < 2 → prefer "wait" or a call).
- Respect capacity_mode. In "waitlist" mode there are NO bookable inspection slots: never promise, offer, or imply a booking; frame qualified leads toward the waitlist. Only when capacity_mode="booking_open" may you invite a booking.
- Two or more unanswered call attempts → switch channel (sms/email), don't suggest a third consecutive call.
- A failed email (bounce) → prefer sms, and vice versa. An inbound reply or answered call means engagement — respond to what they said.
- Write in Australian English ("mould", never "mold"; "arvo" is fine in SMS). Voice: the technician explaining what the instruments measure — plain, direct, zero sales-speak. We diagnose; we never sell the cleanup.
- SMS ≤ 300 characters. Emails: short paragraphs, sign off "Tehbyn\\nSporetrust — independent mould & moisture diagnostics".
- Ground drafts in the customer's own words and situation. Use the template catalog below as grounding — adapt freely, don't parrot. Set template_key to the closest template, or null if none fits.
- schedule_at must fall between 09:00 and 19:00 Australia/Brisbane, and must not be in the past. For "send soon" leave schedule_at null. For action="wait", schedule_at is when to revisit the card.
- action="stage_move" (with stage_to) only when history clearly warrants it — e.g. 5+ unanswered attempts over 2+ weeks → "lost"; an inspection was booked → "booked". Valid stages: ${STAGE_SLUGS.join(", ")}.
- For sms/email: body is required. For call: talking_points required, body null. For wait/stage_move: body null, reasoning explains.

Template catalog (grounding, not gospel):
${JSON.stringify(TEMPLATES, null, 1)}`;

export async function suggestNextAction(context) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 8000, // adaptive thinking (on by default) shares this budget
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SUGGESTION_SCHEMA },
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: JSON.stringify(context) }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${data?.error?.message || "request failed"}`);
  }
  if (data.stop_reason === "refusal") {
    throw new Error("Model declined to suggest an action");
  }
  if (data.stop_reason === "max_tokens") {
    throw new Error("Suggestion truncated (max_tokens)");
  }

  const text = (data.content ?? []).find((b) => b.type === "text")?.text;
  if (!text) throw new Error("No text block in Anthropic response");

  return { suggestion: JSON.parse(text), usage: data.usage ?? null };
}
