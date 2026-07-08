/* CRM message templates — the grounding catalog for both the composer's
   template picker and the AI suggestion engine (the catalog is serialized
   into the AI's cached system prefix; the model personalises from these
   rather than rendering them verbatim).

   Australian English throughout ("mould", never "mold"). Voice: the
   independent technician — we diagnose, we don't sell the cleanup. Business
   is validation-stage: CRM_CAPACITY_MODE=waitlist means no bookable
   inspection slots yet, so templates never promise a booking. */

export const TEMPLATES = [
  {
    key: "sms.intro_call_tee_up",
    channel: "sms",
    audience: "any",
    intent: "First touch on a fresh lead — tee up the call so it isn't cold.",
    body:
      "Hi {{first_name}}, it's Tehbyn from Sporetrust — got your mould enquiry for {{suburb}}. I'll give you a quick call today to talk through what you described. If there's a better time, just reply with it.",
    guidance:
      "Use within 24h of a new lead when no call has connected yet. Pairs with a call attempt.",
  },
  {
    key: "sms.quiz_followup",
    channel: "sms",
    audience: "any",
    intent: "Follow up a quiz lead using their own score.",
    body:
      "Hi {{first_name}}, thanks for doing the Sporetrust mould risk check — your answers put the place in the {{quiz_tier}} range. Happy to explain what's driving that and what to look for. Want me to call this arvo or tomorrow morning?",
    guidance:
      "Use when the lead's message contains a quiz score and no call has landed. Reference their actual answers.",
  },
  {
    key: "sms.missed_you",
    channel: "sms",
    audience: "any",
    intent: "After an unanswered call — low pressure, invite a time.",
    body:
      "Hi {{first_name}}, Tehbyn from Sporetrust — tried to reach you about your mould enquiry. No stress if now's bad; reply with a good time and I'll call then.",
    guidance: "Use after a no_answer/voicemail/busy call disposition, within a few hours.",
  },
  {
    key: "sms.waitlist_position",
    channel: "sms",
    audience: "any",
    intent: "Confirm waitlist position honestly; keep the door open.",
    body:
      "Hi {{first_name}}, you're on the Sporetrust priority list for {{suburb}}. We're taking bookings in order as inspection slots open — I'll text you the moment yours comes up. If anything changes at your place in the meantime (new growth, leaks), let me know.",
    guidance: "Use when a qualified lead moves to the waitlist stage.",
  },
  {
    key: "email.renter_evidence",
    channel: "email",
    audience: "tenant",
    intent: "The evidence angle for renters being fobbed off.",
    subject: "Getting your mould concerns taken seriously",
    body:
      "Hi {{first_name}},\n\nThanks for reaching out about the mould at your place. A quick thought on where you stand:\n\nAn independent, instrument-backed report is the difference between \"tenant complains about mould\" and documented evidence your landlord or agent has to respond to. In QLD, mould and damp caused by the building are the owner's to fix — the report puts the cause on paper.\n\nTwo things worth doing right now:\n1. Photograph everything before you clean anything — cleaning removes the evidence, not the problem.\n2. Keep your repair requests in writing.\n\nHappy to talk through what an inspection would document at your place. Reply here or let me know a good time to call.\n\nTehbyn\nSporetrust — independent mould & moisture diagnostics",
    guidance:
      "Use for tenant leads describing landlord/agent friction, or after a call where evidence came up.",
  },
  {
    key: "email.homeowner_stewardship",
    channel: "email",
    audience: "homeowner",
    intent: "The stewardship angle for homeowners — find the source before it escalates.",
    subject: "What's actually behind the mould at {{suburb}}",
    body:
      "Hi {{first_name}},\n\nThanks for your enquiry. The short version of how we think about mould in your own home:\n\nMould is a symptom — the moisture feeding it is the problem. Finding the source early (plumbing, waterproofing, ventilation or ingress) is the difference between a defined fix and cleaning the same wall every month while the damage compounds behind it.\n\nA diagnostic visit maps the moisture, tests the air, and scopes exactly what needs fixing — before you spend on cleaning that won't hold or quotes priced off a walkthrough guess. We don't sell remediation, so the report has nothing to sell you.\n\nHappy to talk through what we'd measure at your place. Reply here or send me a good time to call.\n\nTehbyn\nSporetrust — independent mould & moisture diagnostics",
    guidance:
      "Use for homeowner leads, especially recurring mould, failed DIY, or post-repair doubts.",
  },
  {
    key: "email.waitlist_update",
    channel: "email",
    audience: "any",
    intent: "Waitlist touch that carries value, not just a nudge.",
    subject: "Your spot on the Sporetrust priority list",
    body:
      "Hi {{first_name}},\n\nA quick update: you're still holding your place on our priority list, and we're booking inspections in order as slots open.\n\nOne useful thing while you wait — if the mould is visible, photograph it with today's date before cleaning anything. Documented history strengthens whatever comes next (a repair request, an insurance conversation, or our report). Ventilate where you can, but don't repaint over active growth; it hides the evidence without fixing the moisture.\n\nIf anything changes at your place — new growth, a leak, a smell getting worse — reply and tell me, it can move you up the list.\n\nTehbyn\nSporetrust — independent mould & moisture diagnostics",
    guidance: "Use for waitlist leads untouched for ~1-2 weeks. Always include one useful tip.",
  },
  {
    key: "email.booking_invite",
    channel: "email",
    audience: "any",
    intent: "Capacity opened — invite the booking.",
    subject: "An inspection slot has opened up",
    body:
      "Hi {{first_name}},\n\nGood news — an inspection slot has opened up in your area and you're next on the list.\n\nReply with a couple of times that suit you this week and I'll lock one in. The visit takes about 45 minutes and you'll have the full report within 48 hours.\n\nTehbyn\nSporetrust — independent mould & moisture diagnostics",
    guidance:
      "ONLY when capacity_mode is booking_open. Never send in waitlist mode.",
  },
];

export function getTemplate(key) {
  return TEMPLATES.find((t) => t.key === key) ?? null;
}

// Dumb {{var}} replacement for the composer's template picker. Unknown
// placeholders are left visible so a half-filled template is obvious rather
// than silently blank.
export function renderTemplate(template, vars = {}) {
  const fill = (text) =>
    String(text ?? "").replace(/\{\{(\w+)\}\}/g, (match, name) =>
      vars[name] != null && vars[name] !== "" ? String(vars[name]) : match,
    );
  return { subject: template.subject ? fill(template.subject) : null, body: fill(template.body) };
}
