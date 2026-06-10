import { adminListHandler } from "../../../../lib/admin/handler";
import { sampleLocations } from "../../../../lib/admin/types/sample-locations";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(sampleLocations);
}

// POST creates a new sample_location for an inspection. The wizard hits this
// when the technician taps "Start new location" on the inspection landing
// page. We pick a sensible display_order = max(existing) + 1 server-side so
// the client doesn't have to track ordering. Returns the new row including
// its sample_location_id so the client can redirect into the wizard.
export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const body = await req.json();
  const inspection_id = Number(body?.inspection_id);
  if (!Number.isFinite(inspection_id)) {
    return Response.json({ error: "inspection_id required" }, { status: 400 });
  }

  const { data: maxRow } = await supabase
    .from("sample_locations")
    .select("display_order")
    .eq("inspection_id", inspection_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (maxRow?.display_order ?? 0) + 1;

  const row = {
    inspection_id,
    name: body?.name ?? "Untitled location",
    is_outdoor_control: Boolean(body?.is_outdoor_control),
    display_order,
  };

  const { data, error } = await supabase
    .from("sample_locations")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
