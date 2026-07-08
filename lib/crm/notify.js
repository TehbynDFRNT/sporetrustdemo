/* Owner notifications — closes the "nothing tells the business a lead
   arrived" gap. Fire-and-forget from the lead API (never blocks capture). */

import { sendEmail, isPostmarkConfigured } from "../postmark";

export async function notifyOwnerNewLead({ customer, lead, cardId }) {
  const to = process.env.OWNER_NOTIFY_EMAIL;
  if (!to || !isPostmarkConfigured()) return false;

  const base = process.env.PUBLIC_BASE_URL || "";
  const lines = [
    `${customer.name} — ${lead.audience}`,
    "",
    `Phone:  ${customer.phone || "—"}`,
    `Email:  ${customer.email || "—"}`,
    `Where:  ${customer.address_line || "—"}${customer.postcode ? ` (${customer.postcode})` : ""}`,
    "",
    lead.message ? `Message:\n${lead.message}` : "Message: (none)",
    "",
    `Source: ${lead.form || "form"} on ${lead.landing_page || "?"}${lead.utm_source ? ` · via ${lead.utm_source}` : " · untracked"}`,
    "",
    base ? `Work the card: ${base}/admin/crm/${cardId}` : "",
  ].filter((l) => l !== undefined);

  await sendEmail({
    to,
    subject: `New ${lead.audience} lead — ${customer.name}${customer.postcode ? ` (${customer.postcode})` : ""}`,
    textBody: lines.join("\n"),
    tag: "lead-notify",
    metadata: { card_id: String(cardId) },
  });
  return true;
}
