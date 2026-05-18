export const partnerHandoffs = {
  slug: "partner-handoffs",
  label: "Partner handoffs",
  endpoint: "/api/admin/partner-handoffs",
  rowKey: "handoff_id",
  description: "Partner introductions made for an inspection. Lifecycle: matched → introduced → quoted → engaged.",
  columns: [
    { key: "handoff_id",     label: "ID",         mono: true, width: 60 },
    { key: "inspection_id",  label: "Inspection", mono: true, width: 90 },
    { key: "partner_id",     label: "Partner",    mono: true, width: 80 },
    { key: "status",         label: "Status",     cell: "badge" },
    { key: "introduced_at",  label: "Introduced", cell: "datetime" },
    { key: "notes",          label: "Notes",      muted: true },
    { key: "created_at",     label: "Created",    cell: "datetime" },
  ],
};
