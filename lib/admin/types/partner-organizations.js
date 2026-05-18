export const partnerOrganizations = {
  slug: "partner-organizations",
  label: "Partner orgs",
  endpoint: "/api/admin/partner-organizations",
  rowKey: "partner_id",
  description: "Partner companies (remediators, plumbers, roofers, etc.). service_areas[] holds postcodes for matching.",
  columns: [
    { key: "partner_id",    label: "ID",          mono: true, width: 60 },
    { key: "name",          label: "Name" },
    { key: "credentials",   label: "Credentials", muted: true },
    { key: "contact_email", label: "Email",       muted: true },
    { key: "contact_phone", label: "Phone",       muted: true },
    { key: "service_areas", label: "Service postcodes", cell: "jsonish" },
    { key: "rating",        label: "Rating",      mono: true, align: "right", width: 80 },
    { key: "reviews_count", label: "Reviews",     mono: true, muted: true, align: "right", width: 80 },
    { key: "active",        label: "Active?",     cell: "bool", width: 80 },
    { key: "clerk_org_id",  label: "Clerk Org",   mono: true, muted: true },
  ],
};
