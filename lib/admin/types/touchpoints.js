// Touchpoint: one row per customer contact event — calls, SMS, emails,
// notes, system events. Doubles as the outbound action queue (draft →
// approved → sending → sent → delivered/failed); the queue UI lives at
// /admin/crm/queue — this table is the raw audit view.
export const touchpoints = {
  slug: "touchpoints",
  label: "Touchpoints",
  endpoint: "/api/admin/touchpoints",
  rowKey: "touchpoint_id",
  description: "Every contact event and queued action, per CRM card. Timeline + action queue in one table.",
  embeds: ["crm_cards(card_id, customers(name))"],
  orderBy: [{ column: "created_at", ascending: false }],
  columns: [
    { key: "touchpoint_id", label: "ID",       mono: true, width: 60 },
    { key: "card_id",       label: "Card",     mono: true, width: 60 },
    { key: "channel",       label: "Channel",  cell: "badge" },
    { key: "direction",     label: "Dir",      muted: true },
    { key: "status",        label: "Status",   cell: "badge" },
    { key: "origin",        label: "Origin",   muted: true },
    { key: "template_key",  label: "Template", muted: true, mono: true },
    { key: "body",          label: "Body",     muted: true },
    { key: "disposition",   label: "Disposition", muted: true },
    { key: "schedule_at",   label: "Scheduled", cell: "datetime" },
    { key: "sent_at",       label: "Sent",     cell: "datetime" },
    { key: "created_at",    label: "Created",  cell: "datetime" },
  ],
};
