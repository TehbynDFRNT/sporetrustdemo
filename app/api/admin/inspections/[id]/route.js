import { adminRowGet, adminRowPatch } from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

// Single-inspection workspace endpoint. The wizard's landing page calls GET
// to render the header + locations list. PATCH is reserved for status /
// sign-off / completion mutations issued at wrap-up time.

const config = {
  slug: "inspections",
  rowKey: "inspection_id",
  embeds: [
    "customers(name, email, phone)",
    "properties(address_line, postcode, state, lat, lng)",
    "technician:technicians!inspections_technician_id_fkey(name, role)",
    "signoff:technicians!inspections_signed_off_by_technician_id_fkey(name, role)",
    "sample_locations(sample_location_id, name, is_outdoor_control, mould_pressure_tier, thermal_delta_c, display_order, sampled_at, moisture_readings(moisture_reading_id, level), air_samples(air_sample_id, lab_sample_id))",
    "scope_items(scope_item_id, trade_category_id, scope_tier, cost_min, cost_max, detail, display_order, trade_categories(name, group_label))",
    // The technician's kit checked off for this inspection. We embed two
    // levels deep so the wizard's chip select can render image + name +
    // asset tag without further fetches.
    "inspection_equipment(technician_equipment_id, added_at, technician_equipment(technician_equipment_id, technician_id, asset_tag, serial, equipment_types(equipment_type_id, name, slug, category, manufacturer, image_storage_path)))",
  ],
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
