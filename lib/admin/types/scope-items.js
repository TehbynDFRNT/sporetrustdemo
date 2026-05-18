export const scopeItems = {
  slug: "scope-items",
  label: "Scope items",
  endpoint: "/api/admin/scope-items",
  rowKey: "scope_item_id",
  description: "Technician-selected works per inspection. Set of distinct trade_category_ids drives partner matching.",
  embeds: ["trade_categories(name, group_label)"],
  columns: [
    { key: "scope_item_id",     label: "ID",         mono: true, width: 60 },
    { key: "inspection_id",     label: "Inspection", mono: true, width: 90 },
    { key: "trade_category_id", label: "Trade",      lookup: ["trade_categories", "name"] },
    { key: "scope_tier",        label: "Tier",       cell: "badge" },
    { key: "cost_min",          label: "Cost min",   cell: "currency", align: "right" },
    { key: "cost_max",          label: "Cost max",   cell: "currency", align: "right" },
    { key: "detail",            label: "Detail" },
    { key: "display_order",     label: "Order",      mono: true, muted: true, align: "right", width: 60 },
  ],
};
