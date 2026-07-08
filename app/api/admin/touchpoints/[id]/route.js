import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";
import { createRuleAction } from "../../../../../lib/crm/rules";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

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
  const res = await adminRowPatch(config, id, patch);

  // RULE: a call PATCHed to disposition callback_requested → queue the
  // callback. Fire-and-forget; read the patched row off the response so we
  // never re-query, and never let a rule failure change the response.
  if (res.ok) {
    try {
      const { row } = await res.clone().json();
      if (row?.disposition === "callback_requested" && row?.card_id) {
        const supabase = createServerSupabaseClient();
        if (supabase) {
          await createRuleAction(supabase, {
            cardId: row.card_id,
            channel: "call",
            ruleKey: "callback_requested",
            body: "Callback requested — schedule the call",
            scheduleAt: null,
          });
        }
      }
    } catch (ruleErr) {
      console.error("[api/admin/touchpoints/[id]] callback rule failed:", ruleErr?.message || ruleErr);
    }
  }

  return res;
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  return adminRowDelete(config, id);
}
