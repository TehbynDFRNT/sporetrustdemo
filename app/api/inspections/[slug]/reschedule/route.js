import { NextResponse } from "next/server";

import { calFetch } from "../../../../../lib/cal";
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export const runtime = "nodejs";

// Reschedule an inspection. The customer hits this from the BookedView
// on /r2/[slug] after picking a new time. We:
//   1. Look up the inspection by slug to get the Cal booking uid.
//   2. Tell Cal to reschedule. Cal creates a new booking + cancels the
//      old; the new uid comes back in the response.
//   3. Optimistically update our row so the page reflects the change
//      immediately. The BOOKING_RESCHEDULED webhook fires async and
//      reconciles — both writes are keyed by the new uid, so they
//      converge.
//
// Body: { start: "ISO date string" }
export async function POST(request, { params }) {
  const { slug } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const start = String(body?.start || "").trim();
  if (!start) {
    return NextResponse.json({ error: "start is required" }, { status: 400 });
  }
  const startIso = (() => {
    const d = new Date(start);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  })();
  if (!startIso) {
    return NextResponse.json({ error: "start must be a valid ISO date" }, { status: 400 });
  }

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
  if (inspection.status !== "scheduled") {
    return NextResponse.json(
      { error: `Cannot reschedule an inspection in status "${inspection.status}"` },
      { status: 409 },
    );
  }
  if (!inspection.cal_booking_id) {
    return NextResponse.json(
      { error: "Inspection has no Cal.com booking attached" },
      { status: 409 },
    );
  }

  let newUid = inspection.cal_booking_id;
  try {
    const result = await calFetch(`/bookings/${inspection.cal_booking_id}/reschedule`, {
      method: "POST",
      apiVersion: "2026-02-25",
      body: { start: startIso, rescheduledBy: "customer" },
    });
    newUid = result?.data?.uid || newUid;
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Cal.com reschedule failed" },
      { status: 502 },
    );
  }

  // Optimistic local update. The BOOKING_RESCHEDULED webhook will fire
  // shortly and confirm — both writes converge on the new uid.
  const { error: updateErr } = await supabase
    .from("inspections")
    .update({
      cal_booking_id: newUid,
      scheduled_at: startIso,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("inspection_id", inspection.inspection_id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", scheduled_at: startIso, cal_booking_id: newUid });
}
