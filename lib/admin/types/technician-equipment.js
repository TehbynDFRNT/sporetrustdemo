export const technicianEquipment = {
  slug: "technician-equipment",
  label: "Technician kit",
  endpoint: "/api/admin/technician-equipment",
  rowKey: "technician_equipment_id",
  description: "Each technician's personal asset list — one row per physical instrument they own.",
  embeds: [
    "technicians(name, role)",
    "equipment_types(equipment_type_id, name, slug, category, manufacturer, image_storage_path)",
  ],
  orderBy: [{ column: "technician_id" }, { column: "technician_equipment_id" }],
  columns: [
    { key: "technician_equipment_id", label: "ID",         mono: true, width: 60, cell: "linkId", linkBase: "/admin/data/technician-equipment" },
    { key: "technician_id",           label: "Technician", lookup: ["technicians", "name"] },
    { key: "equipment_type_id",       label: "Equipment",  lookup: ["equipment_types", "name"] },
    { key: "asset_tag",               label: "Asset tag",  mono: true },
    { key: "serial",                  label: "Serial",     mono: true, muted: true },
    { key: "acquired_at",             label: "Acquired",   muted: true },
    { key: "active",                  label: "Active",     cell: "bool", width: 80 },
  ],
};
