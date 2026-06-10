import { adminListHandler } from "../../../../lib/admin/handler";
import { scopeItems } from "../../../../lib/admin/types/scope-items";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { nextDisplayOrder } from "../../../../lib/admin/next-display-order";

export const runtime = "nodejs";

export async function GET() {
  return adminListHandler(scopeItems);
}

export async function POST(req) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const body = await req.json();
  const inspection_id = Number(body?.inspection_id);
  const trade_category_id = Number(body?.trade_category_id);
  if (!Number.isFinite(inspection_id) || !Number.isFinite(trade_category_id)) {
    return Response.json(
      { error: "inspection_id + trade_category_id required" },
      { status: 400 },
    );
  }
  const display_order = await nextDisplayOrder(supabase, "scope_items", {
    column: "inspection_id",
    value: inspection_id,
  });

  const row = {
    inspection_id,
    trade_category_id,
    scope_tier: body?.scope_tier ?? "minor",
    detail: body?.detail ?? "",
    cost_min: body?.cost_min ?? null,
    cost_max: body?.cost_max ?? null,
    display_order,
  };
  const { data, error } = await supabase
    .from("scope_items")
    .insert(row)
    .select()
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ row: data });
}
