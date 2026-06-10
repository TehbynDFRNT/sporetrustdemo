import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

// Single-location workspace endpoint. The per-location wizard fetches GET on
// mount to render every step's state in one round-trip, then issues
// debounced PATCHes as the technician edits.

const config = {
  slug: "sample-locations",
  rowKey: "sample_location_id",
  embeds: [
    "image_captures(image_capture_id, capture_kind, storage_path, caption, pair_group, captured_at)",
    "moisture_readings(moisture_reading_id, surface_label, reading_value, reading_unit, level, image_capture_id, marker_x_pct, marker_y_pct, evidence_image_capture_id, technician_equipment_id, instrument_model, depth_mm, measured_at)",
    "location_findings(finding_id, observation, display_order, recorded_at)",
    "location_sources(source_id, rank, source_category, description, display_order)",
    "air_samples(air_sample_id, lab_sample_id, sampled_at, lab_partner, total_spores_per_m3, slide_trace_4x_outside_path, slide_trace_4x_inside_path, slide_30x_zoomed_path, lab_notes, intake_evidence_image_capture_id, technician_equipment_id)",
  ],
  // inspection_id is set at creation time and shouldn't drift on PATCH.
  patchDeny: ["inspection_id"],
};

export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  return adminRowGet(config, id);
}

export async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const patch = await req.json();
  return adminRowPatch(config, id, patch);
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  return adminRowDelete(config, id);
}
