import { mouldAttrs } from "./mouldAttrs";

export const theatreMould = mouldAttrs({
  mode: "severe-colony",
  source: "top-left",
  intensity: 0.86,
  speckle: 1,
  stain: 0.72,
  edgeBias: 0.46,
  coverage: 1,
  growthMode: "time",
  growthSource: "top-left",
  growthDuration: 25000,
  seedProgress: 0,
  growthFeather: 0.4,
  maxDpr: 0.68,
  maxPixels: 900000,
  opacity: 0.76,
  seed: "problem-theatre-scene-v1",
});

export const audiencePanels = [
  {
    id: "tenants",
    label: "Tenants",
    cards: [
      {
        num: "01 / Hidden",
        title: "Not all contamination is visible.",
        copy:
          "Odour, damp materials and elevated indoor spores can show a problem before a wall turns black. We look past the surface without turning the home into a demolition site.",
      },
      {
        num: "02 / Standards",
        title: "Mould can become a liveability issue.",
        copy:
          "Queensland rental homes must meet minimum housing standards during the tenancy, including damp and mould rules unless the issue is tenant-caused. Evidence matters.",
      },
      {
        num: "03 / Leverage",
        title: "A report changes the conversation.",
        copy:
          "Photos can be argued with. Moisture readings, likely cause, affected materials and liveability notes give your request a record people can act on.",
      },
    ],
  },
  {
    id: "homeowners",
    label: "Homeowners",
    cards: [
      {
        num: "01 / Cause",
        title: "Find the moisture source first.",
        copy:
          "Leak, condensation, ventilation and historical wetting can look similar from the room. The repair path changes once the cause is measured.",
      },
      {
        num: "02 / Insurance",
        title: "Claims need more than photos.",
        copy:
          "Insurers need causation, extent and timing. We document what is affected and why, before repair quotes start shaping the facts.",
      },
      {
        num: "03 / Scope",
        title: "Control the cost before works begin.",
        copy:
          "An independent report helps you compare remediation, building and cleaning scopes against the actual damage, not the most expensive version of the story.",
      },
    ],
  },
  {
    id: "managers",
    label: "Managers",
    cards: [
      {
        num: "01 / Record",
        title: "A neutral record for both sides.",
        copy:
          "When mould is reported, owners and tenants need the same independent picture: what is present, what caused it and what needs to happen next.",
      },
      {
        num: "02 / Priority",
        title: "Know what is urgent.",
        copy:
          "Moisture readings, material damage and room conditions help separate a cleaning issue from a repair issue, and a minor concern from a habitability risk.",
      },
      {
        num: "03 / Scope",
        title: "Brief contractors with evidence.",
        copy:
          "A diagnostic report gives remediation and building providers a clearer scope, while keeping the advice independent from the company quoting the fix.",
      },
    ],
  },
];

export const contaminationSigns = [
  {
    num: "01",
    tag: "Visible",
    title: "Water staining on walls or ceilings",
    copy:
      "Brown rings, tide marks, swollen paint and shadowing can point to roof leaks, plumbing failures, condensation or historical wetting. The cause changes the response.",
    foot: "Moisture path",
    image: "/images/sign-water-staining.png",
    imageAlt: "Water staining on a ceiling and wall surface",
    mould: mouldAttrs({
      mode: "corner-bloom",
      source: "top-left",
      intensity: 0.66,
      speckle: 0.8,
      stain: 0.38,
      growthDelay: 180,
      seed: "find-1-bathroom-h3jq",
    }),
  },
  {
    num: "02",
    tag: "Weather",
    title: "Wet weather, storms and floods",
    copy:
      "Heavy rain, stormwater overflow and flood events can push moisture into places that look dry again by inspection day. We check what the weather left behind.",
    foot: "Event history",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Wet weather and storm moisture affecting an interior room",
    mould: mouldAttrs({
      mode: "corner-bloom",
      source: "top-right",
      intensity: 0.68,
      speckle: 0.8,
      stain: 0.44,
      growthDelay: 220,
      seed: "find-2-wet-weather-r8qp",
    }),
  },
  {
    num: "03",
    tag: "Hidden",
    title: "Musty odour without visible growth",
    copy:
      "A persistent smell can come from wall cavities, cabinetry, underlay, HVAC or damp contents. We pair odour notes with readings instead of guessing.",
    foot: "Likely reservoir",
    image: "/images/sign-musty-odour.png",
    imageAlt: "Room corner representing musty odour and hidden dampness",
    mould: mouldAttrs({
      mode: "bottom-edge",
      source: "bottom",
      intensity: 0.64,
      speckle: 0.85,
      stain: 0.36,
      growthDelay: 260,
      seed: "find-2-wardrobe-p7nm",
    }),
  },
  {
    num: "04",
    tag: "Moisture",
    title: "Condensation, humidity and cold surfaces",
    copy:
      "Wet windows, cold external walls and damp cupboards can create mould without a pipe leak. Dew-point risk is measurable, not a matter of opinion.",
    foot: "Dew-point risk",
    image: "/images/sign-condensation.png",
    imageAlt: "Condensation and humidity on cold indoor surfaces",
    mould: mouldAttrs({
      mode: "corner-bloom",
      source: "top-right",
      intensity: 0.68,
      speckle: 0.75,
      stain: 0.4,
      growthDelay: 340,
      seed: "find-3-window-x4kw",
    }),
  },
  {
    num: "05",
    tag: "Materials",
    title: "Soft plaster, lifted paint, swollen timber",
    copy:
      "Material failure tells us how long moisture has been present and whether cleaning is enough. Sometimes the affected material has already lost the argument.",
    foot: "Damage extent",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Splitting paint and damaged plaster caused by moisture",
    mould: mouldAttrs({
      mode: "patch-bloom",
      source: "center",
      intensity: 0.64,
      speckle: 0.72,
      stain: 0.42,
      growthDelay: 420,
      seed: "find-4-undersink-w9bz",
    }),
  },
  {
    num: "06",
    tag: "Recurring",
    title: "Mould that returns after cleaning",
    copy:
      "Regrowth usually means the moisture source is still active or the contaminated material was never properly dealt with. Surface cleaning is not a diagnosis.",
    foot: "Root cause",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Returning mould on an interior surface after cleaning",
    mould: mouldAttrs({
      mode: "top-edge",
      source: "top",
      intensity: 0.7,
      speckle: 0.78,
      stain: 0.42,
      growthDelay: 500,
      seed: "find-5-roof-t2gh",
    }),
  },
  {
    num: "07",
    tag: "Airflow",
    title: "Dust, HVAC and indoor-air symptoms",
    copy:
      "Air movement can carry spores away from the source. We check the room, the system and the surrounding moisture conditions before pointing at the obvious patch.",
    foot: "Exposure pathway",
    image: "/images/sign-aircon.png",
    imageAlt: "Air conditioning vent as an indoor air movement and mould exposure pathway",
    mould: mouldAttrs({
      mode: "corner-bloom",
      source: "bottom-right",
      intensity: 0.66,
      speckle: 0.82,
      stain: 0.38,
      growthDelay: 580,
      seed: "find-6-aircon-y6lp",
    }),
  },
];

export const methods = [
  {
    num: "M.01",
    tag: "Thermal",
    title: "Thermal mapping",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal imaging comparison used during a mould and moisture inspection",
    measure:
      "Surface temperature differentials across walls, ceilings, floors, plumbing lines and HVAC penetrations.",
    reveals: "Hidden moisture, cold bridges and leak paths.",
  },
  {
    num: "M.02",
    tag: "Moisture",
    title: "Moisture metering",
    image: "/images/metal-ball-moisture-detector.jpg",
    imageAlt: "Moisture detector used to check damp building materials",
    measure:
      "Pin and pinless readings at surface and depth across timber, gypsum, masonry, tile substrates and skirting cavities.",
    reveals: "Active wetting and moisture migration.",
  },
  {
    num: "M.03",
    tag: "Air sample",
    title: "Air sampling",
    image: "/images/air-sample.jpg",
    imageAlt: "Air sampling cassette used for mould spore capture",
    measure:
      "Continuous hygrometer logging on-site, plus optional indoor and outdoor control air samples to an accredited lab.",
    reveals: "Humidity load and airborne spore count.",
  },
  {
    num: "M.04",
    tag: "Lab",
    title: "Lab analysis",
    image: "/images/lab-testing.jpg",
    imageAlt: "Laboratory testing equipment for mould sample analysis",
    measure:
      "Independent sample handling and lab analysis where spore count, species profile or claim-ready evidence is needed.",
    reveals: "Contamination indicators and evidence support.",
  },
];

export const reportItems = [
  [
    "Where moisture, damage and mould indicators were found",
    "Mapped against rooms and surfaces with photos, readings and thermal images.",
  ],
  [
    "The likely cause",
    "Leak, condensation, ventilation, roof, waterproofing, slab moisture or building defect.",
  ],
  [
    "Liveability and urgency notes",
    "Clear language for tenants, owners, managers, insurers and contractors.",
  ],
  [
    "Damage extent & affected materials",
    "What's wet, contaminated, salvageable, or likely to need removal.",
  ],
  [
    "Defensible repair cost range",
    "Independent cost bands based on current South-East Queensland trade rates.",
  ],
  [
    "Sharable PDF + portal access",
    "Ready for landlords, property managers, insurers, builders and remediation providers.",
  ],
];

export const steps = [
  {
    num: "Step 01",
    title: "Book online.",
    copy:
      "Tell us what changed: stains, smell, leaks, symptoms, disputes, claims or prior cleanup.",
  },
  {
    num: "Step 02",
    title: "Technician visits.",
    copy:
      "Moisture readings, thermal imaging, photos, odour notes, ventilation checks and optional sampling.",
  },
  {
    num: "Step 03",
    title: "Get your report.",
    copy:
      "Cause, extent, evidence, images, recommended next step and repair-cost guidance within 48 hours.",
  },
  {
    num: "Step 04",
    title: "Decide what's next.",
    copy:
      "No treatment pitch. Use the report with your landlord, insurer, builder or a contractor you already trust.",
  },
];

export const journeyItems = [
  {
    num: "01",
    title: "Diagnose",
    heading: "Diagnose the contamination.",
    copy:
      "We inspect, test and document visible mould, hidden moisture, affected materials, likely cause and evidence needed for owners, tenants, managers, insurers or contractors.",
    meta: "Report + evidence",
  },
  {
    num: "02",
    title: "Scope",
    heading: "Understand the full pathway upfront.",
    copy:
      "If works are needed, we help identify whether the job is likely to involve remediation only, or remediation plus repair, rebuild, plumbing, roofing, ventilation or waterproofing.",
    meta: "Remediation + repair pathway",
  },
  {
    num: "03",
    title: "Remediate",
    heading: "Connect to trusted remediators.",
    copy:
      "We can introduce vetted remediation providers who take decontamination seriously, understand containment and removal requirements, and work from the evidence in your report.",
    meta: "Specialist decontamination",
  },
  {
    num: "04",
    title: "Repair",
    heading: "Plan home repairs before it's in pieces.",
    copy:
      "Many remediators remove affected materials but do not put them back. Where repair or rebuild is likely, we help connect you with suitable builders or trade contractors before remediation begins.",
    meta: "Builder/trade handoff",
  },
  {
    num: "05",
    title: "Clear",
    heading: "Verify, clean and close the loop.",
    copy:
      "Once remediation or repairs are complete, we can return for clearance checks and a post-remediation clean so you have documented evidence that the issue has been addressed.",
    meta: "Clearance + prevention",
  },
];

export const trustBadges = [
  {
    meta: "Tenant repair request",
    quote:
      "The report turned a messy back-and-forth into a document everyone could respond to.",
  },
  {
    meta: "Homeowner insurance pathway",
    quote:
      "We knew what was actually wet, what was likely damaged and where to spend money first.",
  },
  {
    meta: "Manager handover record",
    quote:
      "It gave both sides the same facts before contractors started quoting the fix.",
  },
  {
    meta: "Fast report handoff",
    quote:
      "Clear findings, photos and next steps made it easy to forward without explaining the whole history again.",
  },
];

export const pricingTiers = [
  {
    title: "Lab-Backed Diagnostic",
    tag: "One thorough inspection — everything included",
    price: "$995",
    sub: "ONCE-OFF - GST INC",
    featured: true,
    button: "Book your inspection",
    bullets: [
      "Whole-of-home thermal, moisture & humidity walkthrough",
      "Up to 3 areas of concern investigated in depth — severity & likely cause per area",
      "Damage extent & affected materials, quantified",
      "Defensible repair cost range per area + total",
      "Indoor air sample + outdoor control, lab-analysed spore count & species",
      "Suitable for insurance & tribunal submissions",
      "48-hour digital report, sharable PDF",
    ],
  },
];

export const faqs = [
  [
    "Are you a remediation company?",
    "No. We inspect, document and report. If remediation or building work is needed, we can point you toward vetted providers with the right speciality, but we do not clip the ticket on the cleanup.",
  ],
  [
    "Why not call a remediation company first?",
    "Some remediation providers are excellent. Others overscope, underscope or sell surface treatments that miss the moisture source. There is no single mould-remediation licence that guarantees the scope is right, so diagnosis should come before the quote.",
  ],
  [
    "How long does the on-site assessment take?",
    "Most homes take 60-90 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Your digital report lands in your portal within 48 hours of the on-site visit. The lab analysis appendix — spore count and species — arrives 5-7 days after sampling, depending on lab turnaround.",
  ],
  [
    "What if you don't find anything serious?",
    "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer.",
  ],
  [
    "How accurate are your repair cost estimates?",
    "Our cost ranges are defensible bands based on current South-East Queensland trade rates, the materials affected and the scope indicated by the diagnosis. They let you budget with confidence and benchmark every quote you receive.",
  ],
  [
    "Can I share the report with my landlord, builder or insurer?",
    "Yes. The report is built for that handoff: landlord, property manager, insurer, builder, remediation provider or tribunal support file.",
  ],
  [
    "Do you service my area?",
    "We currently service Brisbane and South-East Queensland. Use the suburb check at the top of the page. If we don't yet service your area, we'll let you know when we do.",
  ],
];
