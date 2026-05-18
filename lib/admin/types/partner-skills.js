export const partnerSkills = {
  slug: "partner-skills",
  label: "Partner skills",
  endpoint: "/api/admin/partner-skills",
  rowKey: "rowid",
  description: "M2M between partners and trade categories. Composite PK (partner_id, trade_category_id).",
  columns: [
    { key: "partner_id",         label: "Partner",   mono: true, width: 80 },
    { key: "trade_category_id",  label: "Trade",     mono: true, width: 80 },
    { key: "created_at",         label: "Created",   cell: "datetime" },
  ],
};
