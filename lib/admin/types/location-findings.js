export const locationFindings = {
  slug: "location-findings",
  label: "Findings",
  endpoint: "/api/admin/location-findings",
  rowKey: "finding_id",
  description: "Narrative observation rows per location.",
  embeds: ["sample_locations(name)"],
  orderBy: [
    { column: "sample_location_id" },
    { column: "display_order" },
    { column: "finding_id" },
  ],
  columns: [
    { key: "finding_id",         label: "ID",          mono: true, width: 60 },
    { key: "sample_location_id", label: "Location",    lookup: ["sample_locations", "name"] },
    { key: "observation",        label: "Observation" },
    { key: "display_order",      label: "Order",       mono: true, muted: true, align: "right", width: 60 },
    { key: "recorded_at",        label: "Recorded",    cell: "datetime" },
  ],
};
