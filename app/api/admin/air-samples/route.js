import { adminListHandler } from "../../../../lib/admin/handler";
import { airSamples } from "../../../../lib/admin/types/air-samples";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(airSamples);
}

// POST creates the (single) air_sample row for a sample_location. The
// schema has UNIQUE (sample_location_id), so if one exists the wizard
// just edits it via PATCH /api/admin/air-samples/[id]. We return the
// existing row (with status:"existing") so the client can recover.
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

  const { data: existing } = await supabase
    .from("air_samples")
    .select("*")
    .eq("sample_location_id", sample_location_id)
    .maybeSingle();
  if (existing) {
    return Response.json({ row: existing, status: "existing" });
  }

  const row = {
    sample_location_id,
    lab_partner: body?.lab_partner ?? "lab",
    sampled_at: body?.sampled_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("air_samples")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
