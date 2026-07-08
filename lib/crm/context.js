/* AI suggestion context builder — assembles everything the model needs to
   pick the next action for one CRM card, as one structured JSON object.

   Design rules:
   - The HISTORY is the feedback loop: dispositions (two no-answers → don't
     suggest a third call), delivery failures (bounced email → prefer SMS),
     inbound replies and elapsed timings are all first-class fields, so the
     model's next suggestion is conditioned on what actually happened.
   - This object goes in the USER turn; the stable rules + template catalog
     live in the cached system prefix (lib/anthropic.js). Keep volatile data
     out of the system prompt or the prompt cache never hits.
   - Hard size cap (~24k chars ≈ ~6k tokens) — cost discipline, not a
     context-window concern. Oldest touchpoints drop first, then oldest lead
     messages truncate. */

const MAX_CONTEXT_CHARS = 24_000;
const MAX_LEADS = 5;
const MAX_LEAD_MESSAGE_CHARS = 1_500;
const MAX_TOUCHPOINTS = 15;
const MAX_TOUCHPOINT_EXCERPT = 300;

const daysAgo = (iso, now) =>
  iso == null ? null : Math.floor((now - new Date(iso).getTime()) / 86_400_000);

export async function buildCardContext(supabase, cardId) {
  const { data: card, error: cardErr } = await supabase
    .from("crm_cards")
    .select(
      "card_id, customer_id, stage, stage_changed_at, snoozed_until, auto_mode, created_at, " +
        "customers(name, email, phone, address_line, postcode, customer_type, notes)",
    )
    .eq("card_id", cardId)
    .maybeSingle();
  if (cardErr) throw new Error(`Context card lookup: ${cardErr.message}`);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const [leadsRes, touchRes, linksRes, inspRes] = await Promise.all([
    supabase
      .from("leads")
      .select("audience, message, utm_source, utm_campaign, landing_page, form, submitted_at")
      .eq("customer_id", card.customer_id)
      .order("submitted_at", { ascending: false })
      .limit(MAX_LEADS),
    supabase
      .from("touchpoints")
      .select(
        "channel, direction, status, origin, template_key, subject, body, disposition, outcome_notes, error, created_at, sent_at, schedule_at",
      )
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
      .limit(MAX_TOUCHPOINTS),
    supabase
      .from("customer_properties")
      .select("relationship, properties(address_line, postcode)")
      .eq("customer_id", card.customer_id),
    supabase
      .from("inspections")
      .select("status, inspection_type, scheduled_at")
      .eq("customer_id", card.customer_id),
  ]);
  const err = leadsRes.error || touchRes.error || linksRes.error || inspRes.error;
  if (err) throw new Error(`Context queries: ${err.message}`);

  const now = Date.now();
  const customer = card.customers ?? {};
  const touchpoints = touchRes.data ?? [];

  const outbound = touchpoints.filter(
    (t) => t.direction === "outbound" && t.channel !== "system" && t.status !== "cancelled",
  );
  const inboundOrAnswered = touchpoints.filter(
    (t) => t.direction === "inbound" || t.disposition === "answered",
  );

  const counts = {
    calls: touchpoints.filter((t) => t.channel === "call").length,
    answered: touchpoints.filter((t) => t.disposition === "answered").length,
    no_answer: touchpoints.filter((t) =>
      ["no_answer", "voicemail", "busy"].includes(t.disposition ?? ""),
    ).length,
    sms_sent: touchpoints.filter((t) => t.channel === "sms" && ["sent", "delivered"].includes(t.status)).length,
    emails_sent: touchpoints.filter((t) => t.channel === "email" && ["sent", "delivered"].includes(t.status)).length,
    failed_sends: touchpoints.filter((t) => t.status === "failed").length,
    pending_actions: touchpoints.filter((t) => ["draft", "approved"].includes(t.status)).length,
  };

  const context = {
    timezone: "Australia/Brisbane",
    business: {
      name: "Sporetrust",
      stage: "pre-launch validation",
      capacity_mode: process.env.CRM_CAPACITY_MODE || "waitlist",
      notes:
        "One operator working every lead personally. In waitlist mode there are NO bookable inspection slots — qualified leads park on the waitlist and must never be promised a booking. Calls are the highest-value action. Never suggest more than one outbound message within 48h of the last outbound touch.",
    },
    customer: {
      first_name: (customer.name ?? "").split(" ")[0] || null,
      name: customer.name ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address_line: customer.address_line ?? null,
      postcode: customer.postcode ?? null,
      customer_type: customer.customer_type ?? null,
      notes: customer.notes ?? null,
    },
    card: {
      stage: card.stage,
      days_in_stage: daysAgo(card.stage_changed_at, now),
      snoozed_until: card.snoozed_until,
      auto_mode: card.auto_mode,
      days_since_created: daysAgo(card.created_at, now),
    },
    leads: (leadsRes.data ?? []).map((lead) => ({
      submitted_at: lead.submitted_at,
      days_ago: daysAgo(lead.submitted_at, now),
      audience: lead.audience,
      form: lead.form,
      landing_page: lead.landing_page,
      utm_source: lead.utm_source,
      utm_campaign: lead.utm_campaign,
      message: lead.message ? String(lead.message).slice(0, MAX_LEAD_MESSAGE_CHARS) : null,
    })),
    properties: (linksRes.data ?? []).map((l) => ({
      address_line: l.properties?.address_line ?? null,
      postcode: l.properties?.postcode ?? null,
      relationship: l.relationship,
    })),
    inspections: inspRes.data ?? [],
    history: {
      touchpoints: touchpoints.map((t) => ({
        at: t.created_at,
        days_ago: daysAgo(t.created_at, now),
        channel: t.channel,
        direction: t.direction,
        status: t.status,
        origin: t.origin,
        template_key: t.template_key,
        disposition: t.disposition,
        excerpt: t.body ? String(t.body).slice(0, MAX_TOUCHPOINT_EXCERPT) : null,
        outcome_notes: t.outcome_notes,
        error: t.error,
      })),
      counts,
      days_since_last_outbound: outbound[0] ? daysAgo(outbound[0].created_at, now) : null,
      days_since_last_inbound_or_answer: inboundOrAnswered[0]
        ? daysAgo(inboundOrAnswered[0].created_at, now)
        : null,
    },
  };

  // Hard budget: drop oldest touchpoints, then truncate oldest lead messages.
  let serialized = JSON.stringify(context);
  while (serialized.length > MAX_CONTEXT_CHARS && context.history.touchpoints.length > 5) {
    context.history.touchpoints.pop();
    serialized = JSON.stringify(context);
  }
  let leadIdx = context.leads.length - 1;
  while (serialized.length > MAX_CONTEXT_CHARS && leadIdx > 0) {
    context.leads[leadIdx].message = context.leads[leadIdx].message?.slice(0, 200) ?? null;
    leadIdx -= 1;
    serialized = JSON.stringify(context);
  }

  return context;
}
