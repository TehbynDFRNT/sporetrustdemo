export const imageCaptures = {
  slug: "image-captures",
  label: "Image captures",
  endpoint: "/api/admin/image-captures",
  rowKey: "image_capture_id",
  description: "Visible + thermal photo pairs per location (paired via pair_group).",
  columns: [
    { key: "image_capture_id",   label: "ID",            mono: true, width: 60 },
    { key: "sample_location_id", label: "Location",      mono: true, width: 90 },
    { key: "capture_kind",       label: "Kind",          cell: "badge" },
    { key: "pair_group",         label: "Pair",          mono: true, width: 60, align: "right" },
    { key: "storage_path",       label: "Storage path",  mono: true, muted: true },
    { key: "caption",            label: "Caption",       muted: true },
    { key: "captured_at",        label: "Captured",      cell: "datetime" },
  ],
};
