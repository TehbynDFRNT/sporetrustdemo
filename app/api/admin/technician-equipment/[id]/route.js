import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

const config = {
  slug: "technician-equipment",
  rowKey: "technician_equipment_id",
  // technician_id / equipment_type_id are identity-shaping — a swap is
  // really a different asset. Force admin to delete + recreate instead.
  patchDeny: ["technician_id", "equipment_type_id"],
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
