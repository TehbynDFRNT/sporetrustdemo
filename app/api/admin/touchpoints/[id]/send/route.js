import { NextResponse } from "next/server";
import { sendTouchpoint } from "../../../../../../lib/crm/send";
import { createServerSupabaseClient } from "../../../../../../lib/supabase";

export const runtime = "nodejs";

// Fire a draft/approved sms/email touchpoint now. 409 when the row isn't
// claimable (already sent/sending/cancelled) — that response IS the
// double-send protection surfacing.
export async function POST(_req, ctx) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const result = await sendTouchpoint(supabase, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ row: result.row });
}
