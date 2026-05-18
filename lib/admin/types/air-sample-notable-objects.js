export const airSampleNotableObjects = {
  slug: "air-sample-notable-objects",
  label: "Notable objects",
  endpoint: "/api/admin/air-sample-notable-objects",
  rowKey: "notable_object_id",
  description: "Clipped specimen images from the slide. FK to either fungal_classifications OR particulate_types (free-text label is the fallback). Gold for future ML training data.",
  embeds: ["fungal_classifications(name)", "particulate_types(name)"],
  columns: [
    { key: "notable_object_id",        label: "ID",            mono: true, width: 60 },
    { key: "air_sample_id",            label: "Sample",        mono: true, width: 80 },
    { key: "label",                    label: "Label" },
    { key: "fungal_classification_id", label: "Fungus",        lookup: ["fungal_classifications", "name"], muted: true },
    { key: "particulate_type_id",      label: "Particulate",   lookup: ["particulate_types", "name"], muted: true },
    { key: "image_storage_path",       label: "Image path",    mono: true, muted: true },
    { key: "display_order",            label: "Order",         mono: true, muted: true, align: "right", width: 60 },
    { key: "created_at",               label: "Created",       cell: "datetime" },
  ],
};
