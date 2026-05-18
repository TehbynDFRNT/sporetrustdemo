export const subscriptions = {
  slug: "subscriptions",
  label: "Subscriptions",
  endpoint: "/api/admin/subscriptions",
  rowKey: "subscription_id",
  description: "Sentinel memberships. Partial unique index allows one active subscription per (customer, property).",
  columns: [
    { key: "subscription_id",        label: "ID",            mono: true, width: 60 },
    { key: "customer_id",            label: "Customer",      mono: true, width: 80 },
    { key: "property_id",            label: "Property",      mono: true, width: 80 },
    { key: "plan",                   label: "Plan",          cell: "badge" },
    { key: "status",                 label: "Status",        cell: "badge" },
    { key: "weekly_amount",          label: "Weekly",        cell: "currency", align: "right" },
    { key: "current_period_end",    label: "Period ends",   cell: "datetime" },
    { key: "started_at",            label: "Started",       cell: "datetime" },
    { key: "cancelled_at",          label: "Cancelled",     cell: "datetime", muted: true },
    { key: "stripe_subscription_id", label: "Stripe sub",   mono: true, muted: true },
  ],
};
