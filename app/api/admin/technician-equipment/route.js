import { adminListHandler } from "../../../../lib/admin/handler";
import { technicianEquipment } from "../../../../lib/admin/types/technician-equipment";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(technicianEquipment);
}

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 503 });
  const body = await req.json();
  const technician_id = Number(body?.technician_id);
  const equipment_type_id = Number(body?.equipment_type_id);
  if (!Number.isFinite(technician_id) || !Number.isFinite(equipment_type_id)) {
    return Response.json({ error: "technician_id + equipment_type_id required" }, { status: 400 });
  }
  const row = {
    technician_id,
    equipment_type_id,
    asset_tag: body?.asset_tag ?? null,
    serial: body?.serial ?? null,
    acquired_at: body?.acquired_at ?? null,
    active: body?.active ?? true,
    notes: body?.notes ?? null,
  };
  const { data, error } = await supabase
    .from("technician_equipment")
    .insert(row)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ row: data });
}
