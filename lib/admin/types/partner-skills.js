export const partnerSkills = {
  slug: "partner-skills",
  label: "Partner skills",
  endpoint: "/api/admin/partner-skills",
  rowKey: ["partner_id", "trade_category_id"], // composite PK
  description: "M2M between partners and trade categories. Composite PK (partner_id, trade_category_id).",
  embeds: ["partner_organizations(name)", "trade_categories(name)"],
  columns: [
    { key: "partner_id",        label: "Partner", lookup: ["partner_organizations", "name"] },
    { key: "trade_category_id", label: "Trade",   lookup: ["trade_categories", "name"] },
    { key: "created_at",        label: "Created", cell: "datetime" },
  ],
};
