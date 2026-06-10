import {
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

const config = {
  slug: "image-captures",
  rowKey: "image_capture_id",
  // Storage path and pairing are set at upload time; the wizard only edits
  // caption and (rarely) capture_kind through PATCH.
  patchDeny: ["sample_location_id", "storage_path", "captured_at"],
};

export async function PATCH(req, ctx) {
  const { id } = await ctx.params;
  const patch = await req.json();
  return adminRowPatch(config, id, patch);
}

// DELETE removes both the row and the underlying storage object so re-shoots
// don't leak files. Best-effort on the storage side — we still drop the row
// even if storage fails, because the row is what the UI reads from.
export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { data: existing } = await supabase
    .from("image_captures")
    .select("storage_path")
    .eq("image_capture_id", id)
    .maybeSingle();
  if (existing?.storage_path) {
    await supabase.storage.from("inspection-images").remove([existing.storage_path]).catch(() => {});
  }
  return adminRowDelete(config, id);
}
