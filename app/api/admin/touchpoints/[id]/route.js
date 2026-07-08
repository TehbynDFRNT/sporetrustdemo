import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";

export const runtime = "nodejs";

// Single-touchpoint endpoint. PATCH covers editing drafts (body/subject/
// schedule), approving/cancelling queue items (status), and logging call
// outcomes (disposition/outcome_notes). Provider columns (sent_at,
// provider_message_id, ...) are owned by the send path + webhooks, never
// patched from the UI. DELETE removes junk rows.
const config = {
  slug: "touchpoints",
  rowKey: "touchpoint_id",
  patchAllow: [
    "status",
    "subject",
    "body",
    "schedule_at",
    "disposition",
    "outcome_notes",
    "to_address",
    "template_key",
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

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  return adminRowDelete(config, id);
}
