import { NextResponse } from "next/server";

import { calFetch } from "../../../../../lib/cal";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

// Cancel an inspection. Mirrors the reschedule pattern:
//   1. Look up inspection by slug.
//   2. POST to Cal /bookings/{uid}/cancel.
//   3. Optimistically set status='cancelled' locally; the
//      BOOKING_CANCELLED webhook reconciles.
//
// Body: { reason?: string }
export async function POST(request, { params }) {
  const { slug } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }
  const reason = String(body?.reason || "").trim().slice(0, 500);

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: inspection, error: lookupErr } = await supabase
    .from("inspections")
    .select("inspection_id, cal_booking_id, status")
    .eq("report_slug", slug)
    .maybeSingle();
  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  }
  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }
  if (inspection.status === "cancelled") {
    return NextResponse.json({ status: "ok", alreadyCancelled: true });
  }
  if (inspection.status !== "scheduled") {
    return NextResponse.json(
      { error: `Cannot cancel an inspection in status "${inspection.status}"` },
      { status: 409 },
    );
  }
  if (!inspection.cal_booking_id) {
    return NextResponse.json(
      { error: "Inspection has no Cal.com booking attached" },
      { status: 409 },
    );
  }

  try {
    await calFetch(`/bookings/${inspection.cal_booking_id}/cancel`, {
      method: "POST",
      apiVersion: "2026-02-25",
      body: { cancellationReason: reason || "Cancelled by customer" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Cal.com cancel failed" },
      { status: 502 },
    );
  }

  const { error: updateErr } = await supabase
    .from("inspections")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("inspection_id", inspection.inspection_id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
