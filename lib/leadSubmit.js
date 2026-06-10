/* Shared lead-capture plumbing for the paid-media landers.

   Attribution: UTM / click-id params are captured on land and persisted to
   sessionStorage so they survive scrolling, takeovers and soft navigation —
   without them the CPL test can't tie a lead back to its ad.

   Submit: builds the lead payload (fields + attribution), fires whichever
   ad-platform tags are present on the page, and dispatches a DOM event for
   anything else listening. The network POST stays stubbed until the CRM /
   endpoint is decided. */

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
