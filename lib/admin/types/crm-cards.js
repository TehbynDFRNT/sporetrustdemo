// CRM pipeline card: one per customer, the deduped anchor the kanban board
// renders. Leads roll up under the card; stage/snooze/auto-mode live here.
// The board itself is bespoke (/admin/crm) — this table is the raw view.
export const crmCards = {
  slug: "crm-cards",
  label: "CRM cards",
  endpoint: "/api/admin/crm-cards",
  rowKey: "card_id",
  description: "Pipeline state per customer. One card per person; leads and touchpoints roll up underneath.",
  embeds: ["customers(name, email, phone)"],
  orderBy: [{ column: "updated_at", ascending: false }],
  columns: [
    { key: "card_id",          label: "ID",         mono: true, width: 60 },
    { key: "customer_id",      label: "Customer",   lookup: ["customers", "name"] },
    { key: "customer_email",   label: "Email",      lookup: ["customers", "email"], muted: true },
    { key: "stage",            label: "Stage",      cell: "badge" },
    { key: "stage_changed_at", label: "Stage since", cell: "datetime" },
    { key: "primary_property_id", label: "Property", mono: true, muted: true },
    { key: "auto_mode",        label: "Auto",       cell: "bool" },
    { key: "snoozed_until",    label: "Snoozed",    cell: "datetime", muted: true },
    { key: "created_at",       label: "Created",    cell: "datetime" },
  ],
};
