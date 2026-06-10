import { adminListHandler } from "../../../../lib/admin/handler";
import { inspectionEquipment } from "../../../../lib/admin/types/inspection-equipment";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(inspectionEquipment);
}

// Toggle a piece of kit on or off for an inspection. Body:
//   { inspection_id, technician_equipment_id, on: true | false }
// We treat this as an "upsert / delete" since the join PK makes that the
// most natural shape — the landing-page checkbox semantics map 1:1.
export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 503 });
  const body = await req.json();
  const inspection_id = Number(body?.inspection_id);
  const technician_equipment_id = Number(body?.technician_equipment_id);
  const on = body?.on !== false; // default true
  if (!Number.isFinite(inspection_id) || !Number.isFinite(technician_equipment_id)) {
    return Response.json({ error: "inspection_id + technician_equipment_id required" }, { status: 400 });
  }

  if (!on) {
    const { error } = await supabase
      .from("inspection_equipment")
      .delete()
      .eq("inspection_id", inspection_id)
      .eq("technician_equipment_id", technician_equipment_id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true, removed: true });
  }

  const { data, error } = await supabase
    .from("inspection_equipment")
    .upsert(
      { inspection_id, technician_equipment_id },
      { onConflict: "inspection_id,technician_equipment_id" },
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ row: data });
}
