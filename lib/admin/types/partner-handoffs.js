export const partnerHandoffs = {
  slug: "partner-handoffs",
  label: "Partner handoffs",
  endpoint: "/api/admin/partner-handoffs",
  rowKey: "handoff_id",
  description: "Partner introductions made for an inspection. Lifecycle: matched → introduced → quoted → engaged.",
  embeds: ["partner_organizations(name)"],
  columns: [
    { key: "handoff_id",     label: "ID",         mono: true, width: 60 },
    { key: "inspection_id",  label: "Inspection", mono: true, width: 90 },
    { key: "partner_id",     label: "Partner",    lookup: ["partner_organizations", "name"] },
    { key: "status",         label: "Status",     cell: "badge" },
    { key: "introduced_at",  label: "Introduced", cell: "datetime" },
    { key: "notes",          label: "Notes",      muted: true },
    { key: "created_at",     label: "Created",    cell: "datetime" },
  ],
};
