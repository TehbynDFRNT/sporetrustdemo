import { adminListHandler } from "../../../../lib/admin/handler";
import { locationSources } from "../../../../lib/admin/types/location-sources";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { nextDisplayOrder } from "../../../../lib/admin/next-display-order";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(locationSources);
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
  const display_order = await nextDisplayOrder(supabase, "location_sources", {
    column: "sample_location_id",
    value: sample_location_id,
  });

  const row = {
    sample_location_id,
    rank: body?.rank ?? "primary",
    source_category: body?.source_category ?? "unknown",
    description: body?.description ?? "",
    display_order,
  };
  const { data, error } = await supabase
    .from("location_sources")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
