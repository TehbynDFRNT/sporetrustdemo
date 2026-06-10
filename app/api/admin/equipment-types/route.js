import { adminListHandler } from "../../../../lib/admin/handler";
import { equipmentTypes } from "../../../../lib/admin/types/equipment-types";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(equipmentTypes);
}

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 503 });
  const body = await req.json();
  const row = {
    slug: body?.slug,
    name: body?.name,
    manufacturer: body?.manufacturer ?? null,
    category: body?.category,
    image_storage_path: body?.image_storage_path ?? null,
    notes: body?.notes ?? null,
    active: body?.active ?? true,
  };
  if (!row.slug || !row.name || !row.category) {
    return Response.json({ error: "slug, name, category required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("equipment_types")
    .insert(row)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ row: data });
}
