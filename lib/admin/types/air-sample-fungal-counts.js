export const airSampleFungalCounts = {
  slug: "air-sample-fungal-counts",
  label: "Fungal counts",
  endpoint: "/api/admin/air-sample-fungal-counts",
  rowKey: "air_sample_fungal_count_id",
  description: "Spores/m³ per fungal classification, per air sample.",
  embeds: ["fungal_classifications(name, classification_group)"],
  columns: [
    { key: "air_sample_fungal_count_id", label: "ID",       mono: true, width: 60 },
    { key: "air_sample_id",              label: "Sample",   mono: true, width: 80 },
    { key: "fungal_classification_id",   label: "Species",  lookup: ["fungal_classifications", "name"] },
    { key: "spores_per_m3",              label: "Spores/m³", mono: true, align: "right", width: 110 },
    { key: "level",                      label: "Level",    cell: "badge" },
    { key: "created_at",                 label: "Created",  cell: "datetime" },
  ],
};
