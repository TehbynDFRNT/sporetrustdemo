// Paid-funnel enquiry: a marketing lead + its ad attribution, pointing at
// a customer. Identity + address live on `customers` (no snapshot) — we
// embed the customer name/email so the table is readable without a join
// click-through. Newest first.
export const leads = {
  slug: "leads",
  label: "Leads",
  endpoint: "/api/admin/leads",
  rowKey: "lead_id",
  description: "Paid-funnel enquiries with ad attribution. Identity + address live on the linked customer.",
  embeds: ["customers(name, email, phone)"],
  orderBy: [{ column: "created_at", ascending: false }],
  columns: [
    { key: "lead_id",        label: "ID",       mono: true, width: 60 },
    { key: "customer_id",    label: "Customer", lookup: ["customers", "name"] },
    // Synthetic key (no such column on the row) — the lookup resolves the
    // value; the unique key just keeps React happy vs the Customer column.
    { key: "customer_email", label: "Email",    lookup: ["customers", "email"], muted: true },
    { key: "audience",     label: "Audience",  cell: "badge" },
    { key: "form",         label: "Form",      muted: true },
    { key: "utm_source",   label: "Source" },
    { key: "utm_campaign", label: "Campaign",  muted: true },
    { key: "message",      label: "Message",   muted: true },
    { key: "submitted_at", label: "Submitted", cell: "datetime" },
    { key: "created_at",   label: "Created",   cell: "datetime" },
  ],
};
