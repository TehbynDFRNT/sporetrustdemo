export const particulateTypes = {
  slug: "particulate-types",
  label: "Particulate types",
  endpoint: "/api/admin/particulate-types",
  rowKey: "particulate_type_id",
  description: "Non-fungal particulates + size-bucket totals (kind = 'category' | 'size_total'). Referenced by air_sample_particulate_counts.",
  orderBy: [
    { column: "display_order" },
    { column: "particulate_type_id" },
  ],
  columns: [
    { key: "particulate_type_id", label: "ID",     mono: true, width: 60 },
    { key: "slug",                label: "Slug",   mono: true },
    { key: "name",                label: "Name" },
    { key: "kind",                label: "Kind",   cell: "badge" },
    { key: "description",         label: "Description", muted: true },
    { key: "display_order",       label: "Order",  mono: true, muted: true, align: "right", width: 60 },
    { key: "created_at",          label: "Created", cell: "datetime" },
  ],
};
