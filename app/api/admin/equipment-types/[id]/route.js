import {
  adminRowGet,
  adminRowPatch,
  adminRowDelete,
} from "../../../../../lib/admin/row-handler";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

const config = {
  slug: "equipment-types",
  rowKey: "equipment_type_id",
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

// DELETE also removes the image from storage if one was attached.
export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  if (supabase) {
    const { data: existing } = await supabase
      .from("equipment_types")
      .select("image_storage_path")
      .eq("equipment_type_id", id)
      .maybeSingle();
    if (existing?.image_storage_path) {
      await supabase.storage.from("equipment-images").remove([existing.image_storage_path]).catch(() => {});
    }
  }
  return adminRowDelete(config, id);
}
