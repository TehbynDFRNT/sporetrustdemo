import {
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

const config = {
  slug: "scope-items",
  rowKey: "scope_item_id",
  patchDeny: ["inspection_id"],
};

export async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const patch = await req.json();
  return adminRowPatch(config, id, patch);
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  return adminRowDelete(config, id);
}
