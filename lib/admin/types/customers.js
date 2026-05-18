export const customers = {
  slug: "customers",
  label: "Customers",
  endpoint: "/api/admin/customers",
  rowKey: "customer_id",
  description: "Person or organisation that requested a diagnostic.",
  columns: [
    { key: "customer_id",        label: "ID",     mono: true, width: 60 },
    { key: "name",               label: "Name" },
    { key: "email",              label: "Email" },
    { key: "phone",              label: "Phone",  muted: true },
    { key: "customer_type",      label: "Type",   cell: "badge" },
    { key: "clerk_user_id",      label: "Clerk",  mono: true, muted: true },
    { key: "stripe_customer_id", label: "Stripe", mono: true, muted: true },
    { key: "created_at",         label: "Created", cell: "datetime" },
  ],
};
