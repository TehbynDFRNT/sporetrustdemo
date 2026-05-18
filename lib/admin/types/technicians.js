export const technicians = {
  slug: "technicians",
  label: "Technicians",
  endpoint: "/api/admin/technicians",
  rowKey: "technician_id",
  description: "Sporetrust staff who conduct inspections. role gates the qualified-tech sign-off permission.",
  orderBy: [
    { column: "role" },
    { column: "name" },
    { column: "technician_id" },
  ],
  columns: [
    { key: "technician_id",   label: "ID",            mono: true, width: 60 },
    { key: "name",            label: "Name" },
    { key: "role",            label: "Role",          cell: "badge" },
    { key: "qualifications",  label: "Qualifications", muted: true },
    { key: "email",           label: "Email",         muted: true },
    { key: "phone",           label: "Phone",         muted: true },
    { key: "active",          label: "Active",        cell: "bool", width: 80 },
    { key: "clerk_user_id",   label: "Clerk",         mono: true, muted: true },
    { key: "created_at",      label: "Created",       cell: "datetime" },
  ],
};
