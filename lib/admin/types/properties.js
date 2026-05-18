export const properties = {
  slug: "properties",
  label: "Properties",
  endpoint: "/api/admin/properties",
  rowKey: "property_id",
  description: "Physical addresses that get inspected. One property can have many inspections.",
  columns: [
    { key: "property_id",     label: "ID",        mono: true, width: 60 },
    { key: "address_line",    label: "Address" },
    { key: "postcode",        label: "Postcode",  mono: true, width: 90 },
    { key: "state",           label: "State",     mono: true, width: 70 },
    { key: "lat",             label: "Lat",       mono: true, muted: true, align: "right" },
    { key: "lng",             label: "Lng",       mono: true, muted: true, align: "right" },
    { key: "google_place_id", label: "Place ID",  mono: true, muted: true },
    { key: "created_at",      label: "Created",   cell: "datetime" },
  ],
};
