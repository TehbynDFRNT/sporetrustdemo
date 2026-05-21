// Audience templates for the productised inspection report PDF.
//
// Variants change ONLY the cover-page intro and the CTA framing on the
// "Your fix plan" page. The diagnostic body (rooms, evidence, readings,
// scope, costs) is identical across all three. Tenant is a pass-through
// to landlord/PM/agent — full data, NOT a stripped version.
//
// The CTA on every variant directs the reader to the live interactive
// report URL (https://sporetrust.com.au/r/{slug}) where they hit a real
// button to request quotes from matched contractors. No email/phone
// contact in any copy — the partner-connect flow is the only action.

export const SITE_URL = "https://sporetrust.com.au";

export function reportUrl(slug) {
  return `${SITE_URL}/r/${slug}`;
}

export const TEMPLATES = {
  homeowner: {
    id: "homeowner",
    label: "Homeowner",
    recipient: "Homeowner copy",
    coverIntro: [
      "This is the full inspection report for your property. Use it to plan remediation, request quotes, and document the moisture event for your records.",
      "Sporetrust is an independent diagnostic service — we don't perform or quote remediation works ourselves. The scope below is an honest baseline you can take to any qualified trade, or quote directly via the partners matched in your live report.",
    ],
    cta: {
      eyebrow: "Your fix plan",
      headline: "Get this fixed without chasing trades.",
      body: "Your live report has the scope below pre-matched to remediation and repair contractors in your area. Pick the trades you want quoting — they contact you directly with no obligation.",
      buttonLabel: "Request quotes",
      urlEyebrow: "Open the live report",
    },
  },

  tenant: {
    id: "tenant",
    label: "Tenant",
    recipient: "Tenant copy — for delivery to the landlord, property manager, or letting agent",
    coverIntro: [
      "This independent inspection report is provided to the landlord, property manager, or letting agent of the above-referenced property by the tenant, and documents an active moisture and mould condition that requires the lessor's attention.",
      "Sporetrust is independent — we don't perform or quote remediation works ourselves. The findings, methodology, and remediation scope set out below are presented for your review and action consistent with the lessor's obligation to maintain the premises in good repair.",
    ],
    cta: {
      eyebrow: "Action this report",
      headline: "Quote the works — no commission, no chasing.",
      body: "The live report has the scope below pre-matched to remediation and repair contractors in the property's area. Request quotes directly through the report; trades respond with scope and pricing.",
      buttonLabel: "Open report & request quotes",
      urlEyebrow: "Open the live report",
    },
  },

  insurance: {
    id: "insurance",
    label: "Insurance",
    recipient: "Insurer copy — for submission with a claim",
    coverIntro: [
      "This independent inspection report is submitted in support of a claim for water-damage / mould-related loss at the above property.",
      "The inspection was conducted under AS 4849.1 (Indoor Air Quality — Investigation Procedures) by a qualified field technician and signed off by a senior reviewer with IICRC AMRT and S520 credentials. Sample chain-of-custody, instrumentation logs, and lab provenance are documented within.",
      "The diagnostic, methodology, scope of works, and indicative cost ranges below are intended to substantiate the loss and inform the adjuster's determination.",
    ],
    cta: {
      eyebrow: "Live evidence stack",
      headline: "Review the underlying evidence.",
      body: "Instrument calibration records, sample identifiers, slide images, and the indicative remediation scope mapped to vetted contractors are available at the live report URL for the duration of the claim assessment.",
      buttonLabel: "Open live report",
      urlEyebrow: "Live URL",
    },
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

export function resolveTemplate(raw) {
  if (typeof raw === "string" && TEMPLATES[raw]) return TEMPLATES[raw];
  return TEMPLATES.homeowner;
}
