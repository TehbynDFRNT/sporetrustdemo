import { adminListHandler } from "../../../../lib/admin/handler";
import { moistureReadings } from "../../../../lib/admin/types/moisture-readings";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(moistureReadings);
}

// POST creates a moisture_reading row for a sample_location. The wizard's
// Step 4 calls this when the technician taps "+ Add reading"; defaults
// are placeholder values they overwrite as they capture. We also try to
// auto-link image_capture_id to the location's wide visible reference
// shot so the Step 6 pin-overlay can position it immediately.
export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const body = await req.json();
  const sample_location_id = Number(body?.sample_location_id);
  if (!Number.isFinite(sample_location_id)) {
    return Response.json({ error: "sample_location_id required" }, { status: 400 });
  }

  const { data: visible } = await supabase
    .from("image_captures")
    .select("image_capture_id")
    .eq("sample_location_id", sample_location_id)
    .eq("capture_kind", "visible")
    .eq("pair_group", 1)
    .maybeSingle();

  const row = {
    sample_location_id,
    surface_label: body?.surface_label ?? "(unspecified)",
    reading_value: body?.reading_value ?? 0,
    reading_unit: body?.reading_unit ?? "%MC",
    level: body?.level ?? "normal",
    image_capture_id: visible?.image_capture_id ?? null,
  };

  const { data, error } = await supabase
    .from("moisture_readings")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
