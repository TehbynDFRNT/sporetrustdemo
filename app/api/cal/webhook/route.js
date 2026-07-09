import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { ensureInspectionFromBooking } from "../../../../lib/inspectionsFromBooking";
import { fireLifecycle } from "../../../../lib/crm/lifecycle";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cal.com v2 webhook receiver.
//
// Cal sends the raw JSON body + an `X-Cal-Signature-256` header which is
// the HMAC-SHA256 of the body keyed with the shared secret you configure
// when creating the webhook subscription in the Cal dashboard. The shared
// secret lives in `CAL_WEBHOOK_SECRET`.
//
// We persist every delivery to `webhook_events` BEFORE dispatching, keyed
// by a computed `event_id` (triggerEvent + booking uid + createdAt) since
// Cal v2 doesn't expose a stable per-delivery identifier in the headers.
// The UNIQUE (provider, event_id) constraint makes the insert itself the
// dedupe primitive — duplicate retries become 23505 conflicts that we
// short-circuit out of, never re-processing the inspection state.
//
// Handlers update the inspection row keyed by `cal_booking_id`. They're
// idempotent: BOOKING_CREATED upserts via `ensureInspectionFromBooking`,
// RESCHEDULED + CANCELLED are SQL updates that no-op if the row is
// already in the target state.

const PROVIDER = "cal";

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function verifySignature(rawBody, signature) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CAL_WEBHOOK_SECRET is not configured.");
  }
  if (!signature) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Cal sometimes prefixes with `sha256=` — strip if present.
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return safeEqual(computed, provided);
}

function computeEventId(payload) {
  const inner = payload?.payload || {};
  const uid = inner.uid || inner.bookingUid || inner.bookingId || "unknown";
  const createdAt = payload?.createdAt || inner.startTime || "";
  return `${payload?.triggerEvent || "UNKNOWN"}:${uid}:${createdAt}`;
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-cal-signature-256") || "";

  try {
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    console.error("[cal-webhook] signature config error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Signature verification failed" },
      { status: 500 },
    );
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const eventType = payload?.triggerEvent || "UNKNOWN";
  const eventId = computeEventId(payload);

  // Idempotency anchor: insert the event row FIRST. A duplicate delivery
  // hits the UNIQUE (provider, event_id) constraint and we short-circuit
  // with 200 so Cal doesn't keep retrying.
  const { data: event, error: insertErr } = await supabase
    .from("webhook_events")
    .insert({
      provider: PROVIDER,
      event_id: eventId,
      event_type: eventType,
      raw_payload: rawBody.slice(0, 32_000), // hard-cap payload column
    })
    .select("webhook_event_id")
    .single();

  if (insertErr) {
    // Postgres unique-violation code is 23505. PostgREST also exposes it
    // through `code`. Treat as success — we've already processed it.
    if (insertErr.code === "23505" || /duplicate key/i.test(insertErr.message || "")) {
      return NextResponse.json({ status: "ok", deduped: true });
    }
    console.error("[cal-webhook] insert event error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Dispatch — handler errors are captured + logged + retried by Cal.
  let handlerError = null;
  try {
    if (eventType === "BOOKING_CREATED") {
      await handleBookingCreated(supabase, payload);
    } else if (eventType === "BOOKING_RESCHEDULED") {
      await handleBookingRescheduled(supabase, payload);
    } else if (eventType === "BOOKING_CANCELLED") {
      await handleBookingCancelled(supabase, payload);
    } else {
      // Unknown trigger — record and move on. Cal sends a bunch of
      // others (FORM_SUBMITTED, MEETING_ENDED, ...) we don't subscribe
      // to yet.
      console.info("[cal-webhook] unhandled triggerEvent:", eventType);
    }
  } catch (err) {
    handlerError = err?.message || String(err);
    console.error("[cal-webhook] handler failed:", eventType, err);
  }

  await supabase
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      error: handlerError,
    })
    .eq("webhook_event_id", event.webhook_event_id);

  if (handlerError) {
    // 500 → Cal retries. If the handler is non-recoverable (e.g. bad
    // payload shape), the next retry hits the dedupe row and we
    // short-circuit. Either way we don't block downstream events.
    return NextResponse.json({ error: handlerError }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}

async function handleBookingCreated(supabase, payload) {
  const data = payload?.payload || {};
  const attendee = (data.attendees || [])[0] || {};
  const metadata = data.metadata || {};

  const inspection = await ensureInspectionFromBooking({
    cal_booking_id: data.uid,
    start: data.startTime || data.start,
    duration_minutes: data.length || data.lengthInMinutes || 90,
    attendee: {
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phoneNumber || metadata.phone || null,
    },
    address: metadata.address || "",
    postcode: metadata.postcode || "",
    placeId: metadata.placeId || null,
    lat: metadata.lat || null,
    lng: metadata.lng || null,
  });

  // LIFECYCLE: confirm the booking (SMS + email). Deduped per inspection so a
  // second BOOKING_CREATED delivery can't re-confirm. Best-effort.
  await fireLifecycle(supabase, {
    trigger: "booking_confirmed",
    customerId: inspection.customer_id,
    data: {
      scheduledAt: data.startTime || data.start,
      address: metadata.address || "",
      dedupeKey: String(inspection.inspection_id),
    },
  });
}

async function handleBookingRescheduled(supabase, payload) {
  const data = payload?.payload || {};
  // Cal can deliver the reschedule under either shape depending on the
  // event-type config. Try the common keys.
  const newUid = data.uid;
  const oldUid =
    data.rescheduleUid ||
    data.bookingUid ||
    data.previousBookingUid ||
    data.fromBookingUid;
  const newStart = data.startTime || data.start;

  if (!newUid) {
    throw new Error("RESCHEDULED payload missing new booking uid");
  }

  // Prefer matching by the OLD uid (so our existing row is updated to
  // point at the new Cal uid). Fall back to matching the new uid if the
  // old isn't on the payload — that's the case when Cal preserves the
  // same uid across a reschedule.
  const matchUid = oldUid || newUid;
  const newStartIso = newStart ? new Date(newStart).toISOString() : null;
  const { data: updated, error } = await supabase
    .from("inspections")
    .update({
      cal_booking_id: newUid,
      scheduled_at: newStartIso,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("cal_booking_id", matchUid)
    .select("inspection_id, customer_id, scheduled_at")
    .maybeSingle();
  if (error) throw new Error(`Update on RESCHEDULED: ${error.message}`);

  // LIFECYCLE: tell the customer the new time. Deduped per (inspection, time)
  // so a further reschedule to a different slot fires again. Best-effort.
  if (updated?.customer_id) {
    await fireLifecycle(supabase, {
      trigger: "booking_rescheduled",
      customerId: updated.customer_id,
      data: {
        scheduledAt: updated.scheduled_at,
        dedupeKey: `${updated.inspection_id}:${updated.scheduled_at}`,
      },
    });
  }
}

async function handleBookingCancelled(supabase, payload) {
  const data = payload?.payload || {};
  const uid = data.uid || data.bookingUid;
  if (!uid) throw new Error("CANCELLED payload missing uid");

  const { data: updated, error } = await supabase
    .from("inspections")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("cal_booking_id", uid)
    .select("inspection_id, customer_id")
    .maybeSingle();
  if (error) throw new Error(`Update on CANCELLED: ${error.message}`);

  // LIFECYCLE: acknowledge the cancellation + offer an easy rebook.
  // Best-effort.
  if (updated?.customer_id) {
    await fireLifecycle(supabase, {
      trigger: "booking_cancelled",
      customerId: updated.customer_id,
      data: { dedupeKey: String(updated.inspection_id) },
    });
  }
}
