/* Automated lifecycle comms — the transactional counterpart to the rules
   engine. Where rules (lib/crm/rules.js) queue a DRAFT for a human to review,
   lifecycle messages SEND immediately (booking confirmations, reminders,
   report-ready) and log as sent touchpoints on the customer's card so the
   timeline shows exactly what the customer received and when.

   fireLifecycle is fire-and-forget: it NEVER throws into its caller. Every
   trigger site (lead API, Cal webhook, cron, report publish) calls it after
   its own primary write has committed, so a provider hiccup can never break
   lead capture, a booking, or a publish.

   Idempotency: each send is keyed by template_key `lifecycle:<trigger>` plus
   an optional dedupeKey scope (e.g. the inspection id + date for reminders).
   Before sending we check the card for an existing touchpoint with that exact
   template_key and skip the whole trigger if found — retriggered webhooks,
   double lead submits and repeated cron runs can't double-contact a customer.

   Australian English throughout. SMS sign-off "— Sporetrust"; business line
   07 4802 3011. Delivery stamps (delivered/failed) arrive later via the
   existing Twilio/Postmark webhooks — we only stamp `sent` here. */

import { sendSms, isTwilioConfigured } from "../twilio";
import { sendEmail, isPostmarkConfigured } from "../postmark";
import { normalizeAuPhone } from "../phone";
import { ensureCrmCard } from "./cards";

const PHONE = "07 4802 3011";
const SITE = "https://sporetrust.com.au";
const SIGN = "— Sporetrust"; // em-dash

// Format an ISO instant as "Tue 14 Jul, 9:00am" in Brisbane time.
function fmtBrisbane(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t)?.value ?? "";
  const ampm = g("dayPeriod").toLowerCase().replace(/\s/g, ""); // "am"/"pm"
  return `${g("weekday")} ${g("day")} ${g("month")}, ${g("hour")}:${g("minute")}${ampm}`;
}

function firstName(name) {
  const n = String(name || "").trim();
  return n ? n.split(/\s+/)[0] : "there";
}

// Per-trigger channel policy. 'always' sends whenever the address exists;
// 'fallback' sends only when the OTHER channel is unavailable; 'never' skips.
const CHANNELS = {
  lead_received: { sms: "always", email: "fallback" },
  booking_confirmed: { sms: "always", email: "always" },
  booking_rescheduled: { sms: "always", email: "never" },
  booking_cancelled: { sms: "always", email: "never" },
  booking_reminder: { sms: "always", email: "never" },
  report_published: { sms: "fallback", email: "always" },
};

// Renders { sms, email } content for a trigger. sms → { body } | null.
// email → { subject, textBody, htmlBody } | null.
function render(trigger, ctx) {
  const name = firstName(ctx.name);
  const when = fmtBrisbane(ctx.scheduledAt);
  const addr = String(ctx.address || "").trim();
  const url = `${SITE}/r2/${ctx.reportSlug || ""}`;

  const emailFoot = `\n\n${SIGN}\nIndependent mould & moisture diagnostics`;

  switch (trigger) {
    case "lead_received":
      return {
        sms: {
          body:
            `Hi ${name}, thanks for your enquiry with Sporetrust. We've got your details and ` +
            `we'll be in touch shortly to arrange your mould inspection. Questions? Call ${PHONE}. ${SIGN}`,
        },
        email: {
          subject: "We've got your enquiry — Sporetrust",
          textBody:
            `Hi ${name},\n\nThanks for reaching out to Sporetrust about mould at your place. ` +
            `We've received your enquiry and we'll be in touch shortly to arrange your inspection.\n\n` +
            `If you'd like to talk it through sooner, call us on ${PHONE}.` +
            emailFoot,
        },
      };

    case "booking_confirmed": {
      const where = addr ? ` at ${addr}` : "";
      return {
        sms: {
          body:
            `Hi ${name}, your Sporetrust mould inspection is confirmed for ${when}${where}. ` +
            `It's a 45–90 min visit — a whole-home walkthrough plus air samples. Please don't ` +
            `clean or disturb the mould beforehand; it's the evidence we test. Qs? ${PHONE}. ${SIGN}`,
        },
        email: {
          subject: `Your mould inspection is confirmed — ${when}`,
          textBody:
            `Hi ${name},\n\nYour Sporetrust mould inspection is confirmed for ${when}${where}.\n\n` +
            `What to expect: a 45–90 minute visit covering a whole-home walkthrough and air ` +
            `samples so we can measure exactly what's going on.\n\n` +
            `One important thing before we arrive: please don't clean, wipe or disturb the mould. ` +
            `It's the evidence we test — cleaning it removes what we need to see.\n\n` +
            `Need to change anything? Reply to this email or call ${PHONE}.` +
            emailFoot,
          htmlBody:
            `<p>Hi ${name},</p>` +
            `<p>Your Sporetrust mould inspection is <strong>confirmed for ${when}${where}</strong>.</p>` +
            `<p><strong>What to expect:</strong> a 45–90 minute visit covering a whole-home ` +
            `walkthrough and air samples so we can measure exactly what's going on.</p>` +
            `<p><strong>Before we arrive:</strong> please don't clean, wipe or disturb the mould. ` +
            `It's the evidence we test — cleaning it removes what we need to see.</p>` +
            `<p>Need to change anything? Reply to this email or call ${PHONE}.</p>` +
            `<p>— Sporetrust<br>Independent mould &amp; moisture diagnostics</p>`,
        },
      };
    }

    case "booking_rescheduled":
      return {
        sms: {
          body:
            `Hi ${name}, your Sporetrust mould inspection has been moved to ${when}. ` +
            `As before, please don't clean or disturb the mould before we arrive. ` +
            `Need to change it again? Call ${PHONE}. ${SIGN}`,
        },
        email: null,
      };

    case "booking_cancelled":
      return {
        sms: {
          body:
            `Hi ${name}, your Sporetrust mould inspection has been cancelled. Want to rebook? ` +
            `Just reply to this text or call ${PHONE} and we'll find you a new time. ${SIGN}`,
        },
        email: null,
      };

    case "booking_reminder":
      return {
        sms: {
          body:
            `Hi ${name}, a reminder your Sporetrust mould inspection is tomorrow, ${when}. ` +
            `Please don't clean or disturb the mould before we arrive — it's the evidence we test. ` +
            `Need to reschedule? Call ${PHONE}. ${SIGN}`,
        },
        email: null,
      };

    case "report_published":
      return {
        sms: {
          body:
            `Hi ${name}, your Sporetrust mould report is ready — view it here: ${url} ` +
            `That's within our 48-hour promise. Questions? Reply or call ${PHONE}. ${SIGN}`,
        },
        email: {
          subject: "Your Sporetrust mould report is ready",
          textBody:
            `Hi ${name},\n\nYour inspection report is ready — you can view it here:\n${url}\n\n` +
            `As promised, that's within 48 hours of your visit. The report sets out what we found, ` +
            `where, and what it means for your place.\n\n` +
            `If anything's unclear or you'd like to talk it through, just reply to this email or ` +
            `call us on ${PHONE}.` +
            emailFoot,
          htmlBody:
            `<p>Hi ${name},</p>` +
            `<p>Your inspection report is ready — <a href="${url}">view it here</a>.</p>` +
            `<p>As promised, that's within 48 hours of your visit. The report sets out what we ` +
            `found, where, and what it means for your place.</p>` +
            `<p>If anything's unclear or you'd like to talk it through, just reply to this email ` +
            `or call us on ${PHONE}.</p>` +
            `<p>— Sporetrust<br>Independent mould &amp; moisture diagnostics</p>`,
        },
      };

    default:
      return { sms: null, email: null };
  }
}

async function insertTouchpoint(supabase, row) {
  const { error } = await supabase.from("touchpoints").insert(row);
  if (error) {
    // A unique-violation on (provider, provider_message_id) means a concurrent
    // fire already logged this send — safe to ignore. Anything else we log.
    if (error.code !== "23505") {
      console.error("[lifecycle] touchpoint insert failed:", error.message);
    }
  }
}

/* fireLifecycle — resolve the customer + card, render the trigger's
   template(s), send via the available channels, and log a touchpoint per
   send. Never throws.

   opts: { trigger, customerId, data }
     data may carry:
       - scheduledAt : ISO instant (booking_* triggers)
       - address     : short address string (booking_confirmed)
       - reportSlug  : report slug (report_published)
       - dedupeKey   : extra scope merged into template_key for idempotency
*/
export async function fireLifecycle(supabase, { trigger, customerId, data = {} }) {
  try {
    if (!supabase || !trigger || !customerId) return { ok: false, reason: "bad_args" };
    const policy = CHANNELS[trigger];
    if (!policy) return { ok: false, reason: "unknown_trigger" };

    // 1. Resolve customer.
    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .select("customer_id, name, email, phone")
      .eq("customer_id", customerId)
      .maybeSingle();
    if (cErr) throw new Error(`Lookup customer: ${cErr.message}`);
    if (!customer) return { ok: false, reason: "no_customer" };

    // 2. Ensure the card.
    const { card_id } = await ensureCrmCard(supabase, customerId);

    // 3. Idempotency — template_key scoped by optional dedupeKey.
    const templateKey = `lifecycle:${trigger}${data.dedupeKey ? `:${data.dedupeKey}` : ""}`;
    if (trigger === "lead_received") {
      // Time-window dedupe: skip if we already welcomed this card in the last
      // 24h (double submit / a second quiz run must not double-text).
      const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
      const { data: recent } = await supabase
        .from("touchpoints")
        .select("touchpoint_id")
        .eq("card_id", card_id)
        .eq("template_key", templateKey)
        .gte("created_at", since)
        .limit(1);
      if ((recent?.length ?? 0) > 0) return { ok: true, deduped: true };
    } else {
      const { data: existing } = await supabase
        .from("touchpoints")
        .select("touchpoint_id")
        .eq("card_id", card_id)
        .eq("template_key", templateKey)
        .limit(1);
      if ((existing?.length ?? 0) > 0) return { ok: true, deduped: true };
    }

    // 4. Which channels fire.
    const phone = customer.phone ? normalizeAuPhone(customer.phone) : "";
    const email = String(customer.email || "").trim();
    const hasPhone = Boolean(phone);
    const hasEmail = Boolean(email);
    const want = (mode, mine, other) =>
      mode === "always" ? mine : mode === "fallback" ? mine && !other : false;
    const sendSmsFlag = want(policy.sms, hasPhone, hasEmail);
    const sendEmailFlag = want(policy.email, hasEmail, hasPhone);

    const content = render(trigger, {
      name: customer.name,
      scheduledAt: data.scheduledAt,
      address: data.address,
      reportSlug: data.reportSlug,
    });

    const sent = [];
    const nowIso = new Date().toISOString();

    // 5a. SMS.
    if (sendSmsFlag && content.sms && isTwilioConfigured()) {
      try {
        const { sid } = await sendSms({ to: phone, body: content.sms.body });
        await insertTouchpoint(supabase, {
          card_id,
          channel: "sms",
          direction: "outbound",
          status: "sent",
          origin: "system",
          template_key: templateKey,
          to_address: phone,
          body: content.sms.body,
          provider: "twilio",
          provider_message_id: sid,
          sent_at: nowIso,
        });
        sent.push({ channel: "sms", provider_message_id: sid });
      } catch (smsErr) {
        console.error(`[lifecycle] ${trigger} sms failed:`, smsErr?.message || smsErr);
      }
    }

    // 5b. Email.
    if (sendEmailFlag && content.email && isPostmarkConfigured()) {
      try {
        const { messageId } = await sendEmail({
          to: email,
          subject: content.email.subject,
          textBody: content.email.textBody,
          htmlBody: content.email.htmlBody,
          tag: `lifecycle-${trigger}`,
          metadata: { card_id: String(card_id), trigger },
        });
        await insertTouchpoint(supabase, {
          card_id,
          channel: "email",
          direction: "outbound",
          status: "sent",
          origin: "system",
          template_key: templateKey,
          to_address: email,
          subject: content.email.subject,
          body: content.email.textBody,
          provider: "postmark",
          provider_message_id: messageId,
          sent_at: nowIso,
        });
        sent.push({ channel: "email", provider_message_id: messageId });
      } catch (emailErr) {
        console.error(`[lifecycle] ${trigger} email failed:`, emailErr?.message || emailErr);
      }
    }

    return { ok: true, sent };
  } catch (err) {
    console.error(`[lifecycle] ${trigger} failed:`, err?.message || err);
    return { ok: false, reason: err?.message || String(err) };
  }
}
