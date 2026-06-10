/* Shared lead-capture plumbing for the paid-media landers.

   Attribution: UTM / click-id params are captured on land and persisted to
   sessionStorage so they survive scrolling, takeovers and soft navigation —
   without them the CPL test can't tie a lead back to its ad.

   Submit: builds the lead payload (fields + attribution), fires whichever
   ad-platform tags are present on the page, and dispatches a DOM event for
   anything else listening. The network POST stays stubbed until the CRM /
   endpoint is decided. */

import { normalizeAuPhone } from "./phone";

const ATTRIB_KEY = "sporetrust_attrib";
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

    const prior = JSON.parse(window.sessionStorage.getItem(ATTRIB_KEY) || "{}");
    const next = {
      ...prior,
      ...found,
      landing_page: prior.landing_page || window.location.pathname,
      landed_at: prior.landed_at || new Date().toISOString(),
    };
    window.sessionStorage.setItem(ATTRIB_KEY, JSON.stringify(next));
  } catch {
    /* sessionStorage unavailable — attribution is best-effort */
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

export function submitLead(fields, { form = "lead-form" } = {}) {
  let attribution = {};
  try {
    attribution = JSON.parse(window.sessionStorage.getItem(ATTRIB_KEY) || "{}");
  } catch {
    /* best-effort */
  }

  const payload = {
    ...fields,
    ...attribution,
    form,
    page: window.location.pathname,
    submitted_at: new Date().toISOString(),
  };

  // TODO: POST payload to the CRM / lead endpoint once the backend is decided.

  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", { content_name: form });
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", { form });
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: "lead_submit", form });
  }
  window.dispatchEvent(new CustomEvent("sporetrust:lead-submitted", { detail: payload }));

  return payload;
}
