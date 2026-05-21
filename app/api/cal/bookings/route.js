import { NextResponse } from "next/server";
import { CAL_EVENT_LENGTH, CAL_TIME_ZONE, calFetch, getCalEventTypeId, isCalTestMode, toShortMetadata } from "../../../../lib/cal";
import { ensureInspectionFromBooking } from "../../../../lib/inspectionsFromBooking";

export const runtime = "nodejs";

function normalizePhone(phone) {
  const value = String(phone || "").trim();
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (value.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;

  return `+${digits}`;
}

function requireText(body, key, label = key) {
  const value = String(body?.[key] || "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const start = requireText(body, "start", "Inspection time");
    const name = requireText(body, "name", "Name");
    const email = requireText(body, "email", "Email");
    const phone = requireText(body, "phone", "Phone");
    const address = requireText(body, "address", "Address");
    const locationLabel = requireText(body, "locationLabel", "Suburb");
    const postcode = toShortMetadata(body.postcode || "");
    const placeId = toShortMetadata(body.placeId || "");
    const lat = toShortMetadata(body.lat || "");
    const lng = toShortMetadata(body.lng || "");
    const role = toShortMetadata(body.role || "Not provided");
    const message = toShortMetadata(body.message || "");
    const startIso = new Date(start).toISOString();
    const phoneNumber = normalizePhone(phone);

    const notes = [
      `Phone: ${phone}`,
      `Address: ${address}`,
      `Suburb/location: ${locationLabel}`,
      postcode ? `Postcode: ${postcode}` : null,
      placeId ? `Google place ID: ${placeId}` : null,
      lat && lng ? `Coordinates: ${lat}, ${lng}` : null,
      `Role: ${role}`,
      message ? `Notes: ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (isCalTestMode()) {
      const testUid = `test-${Date.now()}`;
      const inspection = await ensureInspectionFromBooking({
        cal_booking_id: testUid,
        start: startIso,
        attendee: { name, email, phone },
        address,
        postcode,
        placeId,
        lat,
        lng,
      });
      return NextResponse.json({
        booking: {
          uid: testUid,
          title: `Sporetrust diagnostic - ${locationLabel}`,
          start: startIso,
          status: "accepted",
        },
        inspection: {
          slug: inspection.report_slug,
          url: `/r2/${inspection.report_slug}`,
        },
        testMode: true,
      });
    }

    const payload = await calFetch("/bookings", {
      method: "POST",
      apiVersion: "2026-02-25",
      body: {
        start: startIso,
        eventTypeId: getCalEventTypeId(),
        lengthInMinutes: CAL_EVENT_LENGTH,
        attendee: {
          name,
          email,
          phoneNumber,
          language: "en",
          timeZone: CAL_TIME_ZONE,
        },
        bookingFieldsResponses: {
          title: `Sporetrust diagnostic - ${locationLabel}`,
          notes,
        },
        metadata: {
          source: "sporetrust_site",
          location: toShortMetadata(locationLabel),
          postcode,
          placeId,
          lat,
          lng,
          phone: toShortMetadata(phone),
          address: toShortMetadata(address),
          role,
          message,
        },
      },
    });

    const booking = payload.data;

    // Mirror the Cal booking into our DB so the customer has a slug to
    // land on immediately. If this fails we don't tear down the Cal
    // booking — the BOOKING_CREATED webhook will reconcile (the helper
    // is idempotent on cal_booking_id).
    let inspection = null;
    try {
      inspection = await ensureInspectionFromBooking({
        cal_booking_id: booking?.uid,
        start: booking?.start || startIso,
        attendee: { name, email, phone },
        address,
        postcode,
        placeId,
        lat,
        lng,
      });
    } catch (mirrorErr) {
      console.error("[cal/bookings] inspection mirror failed:", mirrorErr?.message || mirrorErr);
    }

    return NextResponse.json({
      booking: {
        uid: booking?.uid,
        title: booking?.title,
        start: booking?.start,
        status: booking?.status,
      },
      inspection: inspection
        ? { slug: inspection.report_slug, url: `/r2/${inspection.report_slug}` }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not create the booking." },
      { status: 400 }
    );
  }
}
