/* Shared lead-capture plumbing for the paid-media landers.

   Attribution: UTM / click-id params are captured on land and persisted to
   localStorage (7-day TTL) so they survive not just soft navigation but the
   session itself — FB/IG in-app webviews kill sessions on backgrounding, so
   click-today-convert-tonight leads lose their fbclid under sessionStorage.
   Without the tag the CPL test can't tie a lead back to its ad.

   Submit: builds the lead payload (fields + attribution), fires whichever
   ad-platform tags are present on the page, and dispatches a DOM event for
   anything else listening. The network POST stays stubbed until the CRM /
   endpoint is decided. */

import { normalizeAuPhone } from "./phone";
import { lead as fbLead, mirrorServerEvent } from "./meta-pixel";
import { buildMetaUserData, getMetaBrowserIdentifiers, upsertMetaJourneyCache } from "./meta-funnel";

const ATTRIB_KEY = "sporetrust_attrib";
const ATTRIB_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/* Read the banked attribution, expiring it after the TTL. Falls back to (and
   migrates from) the legacy sessionStorage slot so in-flight visitors keep
   their tags across this deploy. */
function readAttribution() {
  try {
    const raw = window.localStorage.getItem(ATTRIB_KEY) || window.sessionStorage.getItem(ATTRIB_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.stored_at && Date.now() - Date.parse(parsed.stored_at) > ATTRIB_TTL_MS) {
      window.localStorage.removeItem(ATTRIB_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

const ATTRIB_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const search = new URLSearchParams(window.location.search);
    const found = {};
    ATTRIB_PARAMS.forEach((key) => {
      const value = search.get(key);
      if (value) found[key] = value;
    });

    const prior = readAttribution();
    const next = {
      ...prior,
      ...found,
      landing_page: prior.landing_page || window.location.pathname,
      landed_at: prior.landed_at || new Date().toISOString(),
      stored_at: new Date().toISOString(),
    };
    window.localStorage.setItem(ATTRIB_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — attribution is best-effort */
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Friendly per-field validation for the lead forms. Returns trimmed/cleaned
   values alongside errors — phone comes back in E.164 (+61…) when valid, so
   a passing form always submits a callable, canonical number. */
export function validateLead(raw) {
  const values = {
    firstName: String(raw.firstName || "").trim(),
    phone: String(raw.phone || "").trim(),
    email: String(raw.email || "").trim(),
    address: String(raw.address || "").trim(),
  };
  const errors = {};

  if (!values.firstName) {
    errors.firstName = "Please add your first name.";
  }

  const e164 = normalizeAuPhone(values.phone);
  if (!values.phone) {
    errors.phone = "We need a number to call you back on.";
  } else if (!e164) {
    errors.phone = "That number looks incomplete — double-check the digits.";
  } else {
    values.phone = e164;
  }

  if (!values.email) {
    errors.email = "Please add your email.";
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = "That email doesn't look quite right.";
  }

  if (!values.address) {
    errors.address = "Please add the property address.";
  }

  return { errors, values, isValid: Object.keys(errors).length === 0 };
}

/* Persist the lead, THEN fire the ad-platform conversion tags — only on a
   confirmed save. Firing pixels before the POST succeeds (the old behaviour)
   reported phantom leads the business never received. Returns
   { ok, lead_id?, error? } so the caller can gate its success screen. */
export async function submitLead(fields, { form = "lead-form" } = {}) {
  const { stored_at: _storedAt, ...attribution } = readAttribution();

  const payload = {
    ...fields,
    ...attribution,
    form,
    page: window.location.pathname,
    submitted_at: new Date().toISOString(),
  };

  let result;
  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data?.error || `Request failed (${response.status}).` };
    }
    result = { ok: true, lead_id: data?.lead_id ?? null };
  } catch (error) {
    return { ok: false, error: error?.message || "Network error." };
  }

  // Captured for real — now count the conversion. Deduplicated Meta Lead:
  // browser Pixel + CAPI mirror share one deterministic event_id keyed to the
  // saved lead row, so re-submits/refreshes never double-count.
  try {
    const externalId = result.lead_id != null ? String(result.lead_id) : undefined;
    const eventId = `lead_${form}_${externalId ?? "x"}`;
    const browserIds = getMetaBrowserIdentifiers(new URLSearchParams(window.location.search));
    const journey = upsertMetaJourneyCache({
      identity: {
        firstName: fields.firstName,
        email: fields.email,
        phone: fields.phone,
        address: fields.address,
        postcode: fields.postcode,
        placeId: fields.placeId,
        externalId,
      },
      browserIds,
    });
    fbLead({
      contentName: "Inspection enquiry",
      contentCategory: "mould_inspection",
      customData: { lead_source: form, audience: fields.audience },
      eventId,
    });
    void mirrorServerEvent({
      eventName: "Lead",
      eventId,
      user: buildMetaUserData({ identity: journey.identity, browserIds, externalId }),
      customData: { content_name: "Inspection enquiry", content_category: "mould_inspection", lead_source: form },
    });
  } catch (err) {
    console.warn("[lead] Meta pixel/CAPI fire failed", err);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", { form });
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: "lead_submit", form });
  }
  window.dispatchEvent(new CustomEvent("sporetrust:lead-submitted", { detail: payload }));

  return result;
}
