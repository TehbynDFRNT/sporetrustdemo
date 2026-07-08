import { adminRowGet, adminRowPatch } from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

// Single-card endpoint. PATCH is how the kanban moves cards (stage), snoozes
// them, and toggles auto-mode — stage_changed_at is restamped by a DB trigger
// so this route stays dumb. Cards are never deleted from admin (they cascade
// with their customer).
const config = {
  slug: "crm-cards",
  rowKey: "card_id",
  embeds: ["customers(name, email, phone)"],
  patchAllow: ["stage", "snoozed_until", "auto_mode"],
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
