export const fungalClassifications = {
  slug: "fungal-classifications",
  label: "Fungal classifications",
  endpoint: "/api/admin/fungal-classifications",
  rowKey: "fungal_classification_id",
  description: "Persistent glossary scraped from a lab partner (e.g. sporecyte.com/fungal-glossary/). Referenced by air_sample_fungal_counts + notable_objects.",
  columns: [
    { key: "fungal_classification_id", label: "ID",          mono: true, width: 60 },
    { key: "slug",                     label: "Slug",         mono: true },
    { key: "name",                     label: "Name" },
    { key: "classification_group",     label: "Group",        cell: "badge" },
    { key: "habitat",                  label: "Habitat",      muted: true },
    { key: "health_notes",             label: "Health notes", muted: true },
    { key: "source_url",               label: "Source",       muted: true },
    { key: "updated_at",               label: "Updated",      cell: "datetime" },
  ],
};
