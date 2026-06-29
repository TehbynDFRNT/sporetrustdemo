import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

// Single-lead row endpoint. PATCH is reserved for light corrections
// (e.g. fixing an audience tag); DELETE removes a junk/spam enquiry.
// Identity + address are edited on the customer record, not here.
const config = {
  slug: "leads",
  rowKey: "lead_id",
  embeds: ["customers(name, email, phone)"],
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
