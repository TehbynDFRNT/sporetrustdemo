export const inspectionEquipment = {
  slug: "inspection-equipment",
  label: "Inspection kit",
  endpoint: "/api/admin/inspection-equipment",
  rowKey: ["inspection_id", "technician_equipment_id"], // composite PK
  description: "Which of a technician's kit they checked off as on-hand for a given inspection.",
  embeds: [
    "technician_equipment(asset_tag, serial, equipment_types(name, category))",
  ],
  orderBy: [{ column: "inspection_id" }, { column: "technician_equipment_id" }],
  columns: [
    { key: "inspection_id",           label: "Inspection", mono: true, width: 90 },
    { key: "technician_equipment_id", label: "Kit ID",     mono: true, width: 70 },
    { key: "added_at",                label: "Added",      cell: "datetime" },
  ],
};
