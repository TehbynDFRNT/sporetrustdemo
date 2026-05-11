import { NextResponse } from "next/server";
import { CAL_EVENT_LENGTH, CAL_TIME_ZONE, calFetch, getCalEventTypeId, isCalTestMode } from "../../../../lib/cal";

export const runtime = "nodejs";

function brisbaneDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: CAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function toDateString({ year, month, day }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));

  return toDateString({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  });
}

function normalizeSlotDays(slotData) {
  return Object.entries(slotData || {})
    .map(([date, slots]) => ({
      date,
      slots: (slots || []).map((slot) => ({
        start: slot.start,
        end: slot.end || null,
      })),
    }))
    .filter((day) => day.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function brisbaneIso(date, hour, minute = 0) {
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+10:00`;
}

function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

function createTestSlotDays(start) {
  const times = [
    [9, 0],
    [11, 30],
    [14, 0],
  ];

  return Array.from({ length: 6 }, (_, index) => {
    const date = addDaysToDateString(start, index + 1);

    return {
      date,
      slots: times.map(([hour, minute]) => {
        const slotStart = brisbaneIso(date, hour, minute);

        return {
          start: slotStart,
          end: addMinutes(slotStart, CAL_EVENT_LENGTH),
        };
      }),
    };
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") || 21), 1), 42);
  const start = searchParams.get("start") || toDateString(brisbaneDateParts());
  const end = searchParams.get("end") || addDaysToDateString(start, days);

  try {
    const params = new URLSearchParams({
      eventTypeId: String(getCalEventTypeId()),
      start,
      end,
      timeZone: CAL_TIME_ZONE,
      duration: String(CAL_EVENT_LENGTH),
      format: "range",
    });

    const payload = await calFetch(`/slots?${params.toString()}`, {
      apiVersion: "2024-09-04",
    });
    const liveDays = normalizeSlotDays(payload.data);
    const useTestSlots = isCalTestMode() && liveDays.length === 0;

    return NextResponse.json({
      days: useTestSlots ? createTestSlotDays(start) : liveDays,
      testMode: useTestSlots,
      window: { start, end, timeZone: CAL_TIME_ZONE },
    });
  } catch (error) {
    if (isCalTestMode()) {
      return NextResponse.json({
        days: createTestSlotDays(start),
        testMode: true,
        window: { start, end, timeZone: CAL_TIME_ZONE },
      });
    }

    return NextResponse.json(
      { error: error.message || "Could not load booking slots." },
      { status: 500 }
    );
  }
}
