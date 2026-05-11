export const CAL_TIME_ZONE = "Australia/Brisbane";
export const CAL_EVENT_LENGTH = 90;

const CAL_API_BASE = "https://api.cal.com/v2";

export function getCalEventTypeId() {
  const eventTypeId = Number(process.env.CAL_EVENT_TYPE_ID);

  if (!Number.isFinite(eventTypeId) || eventTypeId <= 0) {
    throw new Error("CAL_EVENT_TYPE_ID is not configured.");
  }

  return eventTypeId;
}

export function isCalTestMode() {
  return process.env.CAL_TEST_SLOTS === "1" || process.env.CAL_TEST_MODE === "1";
}

export async function calFetch(path, { method = "GET", body, apiVersion } = {}) {
  if (!process.env.CAL_API_KEY) {
    throw new Error("CAL_API_KEY is not configured.");
  }

  const response = await fetch(`${CAL_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CAL_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": apiVersion,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === "error") {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Cal.com request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload;
}

export function toShortMetadata(value) {
  return String(value || "").trim().slice(0, 500);
}
