export const locationSources = {
  slug: "location-sources",
  label: "Sources",
  endpoint: "/api/admin/location-sources",
  rowKey: "source_id",
  description: "Ranked likely cause(s) per location.",
  columns: [
    { key: "source_id",          label: "ID",          mono: true, width: 60 },
    { key: "sample_location_id", label: "Location",    mono: true, width: 90 },
    { key: "rank",               label: "Rank",        cell: "badge" },
    { key: "source_category",    label: "Category",    cell: "badge" },
    { key: "description",        label: "Description" },
    { key: "display_order",      label: "Order",       mono: true, muted: true, align: "right", width: 60 },
    { key: "created_at",         label: "Created",     cell: "datetime" },
  ],
};
