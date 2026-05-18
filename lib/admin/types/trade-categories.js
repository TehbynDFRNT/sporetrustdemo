export const tradeCategories = {
  slug: "trade-categories",
  label: "Trade categories",
  endpoint: "/api/admin/trade-categories",
  rowKey: "trade_category_id",
  description: "Canonical list of trades. Scope items + partner skills both reference this — it's the matching key.",
  orderBy: [
    { column: "group_label" },
    { column: "display_order" },
    { column: "trade_category_id" },
  ],
  columns: [
    { key: "trade_category_id", label: "ID",     mono: true, width: 60 },
    { key: "slug",              label: "Slug",   mono: true },
    { key: "name",              label: "Name" },
    { key: "group_label",       label: "Group",  cell: "badge" },
    { key: "display_order",     label: "Order",  mono: true, align: "right", muted: true, width: 60 },
    { key: "active",            label: "Active", cell: "bool", width: 80 },
    { key: "created_at",        label: "Created", cell: "datetime" },
  ],
};
