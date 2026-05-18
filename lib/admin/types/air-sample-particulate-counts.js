export const airSampleParticulateCounts = {
  slug: "air-sample-particulate-counts",
  label: "Particulate counts",
  endpoint: "/api/admin/air-sample-particulate-counts",
  rowKey: "air_sample_particulate_count_id",
  description: "Non-fungal particulates + size-bucket totals per air sample.",
  columns: [
    { key: "air_sample_particulate_count_id", label: "ID",      mono: true, width: 60 },
    { key: "air_sample_id",      label: "Sample",          mono: true, width: 80 },
    { key: "particulate_type_id", label: "Type",           mono: true, width: 80 },
    { key: "particles_per_m3",   label: "Particles/m³",     mono: true, align: "right", width: 120 },
    { key: "created_at",         label: "Created",         cell: "datetime" },
  ],
};
