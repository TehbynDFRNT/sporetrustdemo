import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

// Action-queue payload: every pending touchpoint (draft/approved) plus recent
// failures, with enough card/customer context to act inline.
export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ rows: [] });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [pendingRes, failedRes] = await Promise.all([
    supabase
      .from("touchpoints")
      .select("*, crm_cards(card_id, stage, customers(name, email, phone))")
      .in("status", ["draft", "approved"])
      .order("schedule_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("touchpoints")
      .select("*, crm_cards(card_id, stage, customers(name, email, phone))")
      .eq("status", "failed")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const err = pendingRes.error || failedRes.error;
  if (err) {
    return NextResponse.json({ rows: [], error: err.message }, { status: 200 });
  }

  return NextResponse.json({
    pending: pendingRes.data ?? [],
    failed: failedRes.data ?? [],
  });
}
