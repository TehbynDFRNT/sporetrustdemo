export const equipmentTypes = {
  slug: "equipment-types",
  label: "Equipment types",
  endpoint: "/api/admin/equipment-types",
  rowKey: "equipment_type_id",
  description: "Catalogue of devices techs can use. Carries an image for card-based identification in the wizard.",
  orderBy: [{ column: "category" }, { column: "name" }],
  columns: [
    { key: "equipment_type_id",  label: "ID",          mono: true, width: 60, cell: "linkId", linkBase: "/admin/data/equipment-types" },
    { key: "name",               label: "Name" },
    { key: "manufacturer",       label: "Manufacturer", muted: true },
    { key: "category",           label: "Category",     cell: "badge" },
    { key: "slug",               label: "Slug",         mono: true, muted: true },
    { key: "image_storage_path", label: "Image",        mono: true, muted: true },
    { key: "active",             label: "Active",       cell: "bool", width: 80 },
  ],
};
