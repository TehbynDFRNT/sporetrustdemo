export const sampleLocations = {
  slug: "sample-locations",
  label: "Sample locations",
  endpoint: "/api/admin/sample-locations",
  rowKey: "sample_location_id",
  description: "One per room / zone within an inspection (incl. outdoor control).",
  embeds: ["inspections(inspection_id, scheduled_at)"],
  columns: [
    { key: "sample_location_id",  label: "ID",          mono: true, width: 60 },
    { key: "inspection_id",       label: "Inspection",  mono: true, width: 80 },
    { key: "name",                label: "Name" },
    { key: "is_outdoor_control",  label: "Outdoor?",    cell: "bool", width: 80 },
    { key: "mould_pressure_tier", label: "Pressure",    cell: "badge" },
    { key: "thermal_delta_c",     label: "ΔT °C",       mono: true, align: "right", width: 80 },
    { key: "display_order",       label: "Order",       mono: true, muted: true, width: 60, align: "right" },
    { key: "sampled_at",          label: "Sampled",     cell: "datetime" },
  ],
};
