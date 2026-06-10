import { adminListHandler } from "../../../../lib/admin/handler";
import { locationFindings } from "../../../../lib/admin/types/location-findings";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { nextDisplayOrder } from "../../../../lib/admin/next-display-order";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(locationFindings);
}

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
  const display_order = await nextDisplayOrder(supabase, "location_findings", {
    column: "sample_location_id",
    value: sample_location_id,
  });

  const row = {
    sample_location_id,
    observation: body?.observation ?? "",
    display_order,
  };
  const { data, error } = await supabase
    .from("location_findings")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
