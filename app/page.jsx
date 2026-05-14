import BookingTakeover from "../components/BookingTakeover";
import QuizCtaBanner from "../components/QuizCtaBanner";
import QuizTakeover from "../components/QuizTakeover";
import ReportDemoTakeover from "../components/ReportDemoTakeover";
import ReportPreviewCard from "../components/ReportPreviewCard";
import Eyebrow from "../components/Eyebrow";
import FaqAccordion from "../components/FaqAccordion";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import MegaNav from "../components/MegaNav";
import Reveal from "../components/Reveal";
import SectionHeader from "../components/SectionHeader";
import SentinelCard from "../components/SentinelCard";
import StatRow from "../components/StatRow";
import Timeline from "../components/Timeline";
import TrustBadge from "../components/TrustBadge";
import TrustBar from "../components/TrustBar";
import UtilityBanner from "../components/UtilityBanner";
import ArrowIcon from "../components/icons/ArrowIcon";

function mouldAttrs({
  mode,
  source,
  intensity,
  speckle,
  stain,
  seed,
  edgeBias,
  coverage,
  growthDuration,
  growthDelay,
  growthFeather,
  growthMode,
  growthSource,
  scrollRoot,
  scrollStart,
  scrollEnd,
  scrollLag,
  scrollMaturity,
  scrollEase,
  seedProgress,
  maxDpr,
  maxPixels,
  opacity,
}) {
  const attrs = {
    "data-mould": "true",
    "data-mould-mode": mode,
    "data-mould-source": source,
    "data-mould-intensity": String(intensity),
    "data-mould-speckle": String(speckle),
    "data-mould-stain": String(stain),
    "data-mould-seed": seed,
  };
  if (edgeBias != null) attrs["data-mould-edge-bias"] = String(edgeBias);
  if (coverage != null) attrs["data-mould-coverage"] = String(coverage);
  if (growthDuration != null) attrs["data-mould-growth-duration"] = String(growthDuration);
  if (growthDelay != null) attrs["data-mould-growth-delay"] = String(growthDelay);
  if (growthFeather != null) attrs["data-mould-growth-feather"] = String(growthFeather);
  if (growthMode != null) attrs["data-mould-growth-mode"] = growthMode;
  if (growthSource != null) attrs["data-mould-growth-source"] = growthSource;
  if (scrollRoot != null) attrs["data-mould-scroll-root"] = scrollRoot;
  if (scrollStart != null) attrs["data-mould-scroll-start"] = String(scrollStart);
  if (scrollEnd != null) attrs["data-mould-scroll-end"] = String(scrollEnd);
  if (scrollLag != null) attrs["data-mould-scroll-lag"] = String(scrollLag);
  if (scrollMaturity != null) attrs["data-mould-scroll-maturity"] = String(scrollMaturity);
  if (scrollEase != null) attrs["data-mould-scroll-ease"] = String(scrollEase);
  if (seedProgress != null) attrs["data-mould-seed-progress"] = String(seedProgress);
  if (maxDpr != null) attrs["data-mould-max-dpr"] = String(maxDpr);
  if (maxPixels != null) attrs["data-mould-max-pixels"] = String(maxPixels);
  if (opacity != null) attrs["data-mould-opacity"] = String(opacity);
  return attrs;
}

const theatreMould = mouldAttrs({
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

const audiencePanels = [
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

const contaminationSigns = [
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

const methods = [
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

const reportItems = [
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

const timelineItems = [
  {
    title: "Book online.",
    meta: "Day 0 · 2 min",
    copy:
      "Tell us what changed: stains, smell, leaks, symptoms, disputes, claims or prior cleanup. We confirm fit and schedule the visit.",
    signals: ["Suburb check", "Brief intake", "Fixed price"],
  },
  {
    title: "Technician visits.",
    meta: "Day 1 to 5 · 45 min",
    copy:
      "Moisture readings, thermal imaging, photos, odour notes, ventilation checks and optional air or surface sampling — all on-site, one visit.",
    signals: ["Thermal", "Moisture meter", "Hygrometer", "Air sampler"],
  },
  {
    title: "Report delivered.",
    meta: "Within 48 hours",
    copy:
      "Plain-English findings: cause, extent, photos, thermal images, moisture record and a defensible repair-cost range — sharable PDF and portal access.",
    signals: ["Cause", "Damage extent", "Cost range", "Shareable PDF"],
  },
  {
    title: "Act on the evidence.",
    meta: "When you are ready",
    copy:
      "No treatment pitch. Use the report with your landlord, insurer, builder or a contractor you trust. We can introduce vetted partners if you want.",
    signals: ["Tenant", "Insurer", "Builder", "Remediator"],
  },
];

const diagnosticPathways = [
  {
    href: "/visible-mould",
    title: "I have mould already",
    desc: "Document cause, extent and a defensible cost range.",
  },
  {
    href: "/suspected-mould",
    title: "I suspect mould",
    desc: "Thermal, moisture and optional air sampling for what's behind the surface.",
  },
  {
    href: "/mould-prevention",
    title: "Mould prevention",
    desc: "Humidity, ventilation and earlier detection through Sentinel.",
  },
];

const trustBadges = [
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

const pricingTiers = [
  {
    title: "Rapid Inspection",
    tag: "For most homes & apartments",
    price: "$695",
    sub: "ONCE-OFF - GST INC",
    featured: false,
    button: "Book Standard",
    bullets: [
      "On-site thermal, moisture & humidity testing",
      "Up to 3 areas of concern + whole-of-home walkthrough",
      "Severity rating & likely cause per area",
      "Damage extent & affected materials, quantified",
      "Defensible repair cost range per area + total",
      "48-hour digital report, sharable PDF",
    ],
  },
  {
    title: "Lab-Backed Diagnostic",
    tag: "When you need defensible evidence",
    price: "$945",
    sub: "ONCE-OFF - GST INC",
    featured: true,
    button: "Book Lab-Backed",
    bullets: [
      "Everything in the Rapid Inspection",
      "Indoor air sample (room of your choice)",
      "Outdoor control sample for comparison",
      "Lab-analysed spore count & species",
      "Health risk indicator from air results",
      "Suitable for insurance & tribunal submissions",
    ],
  },
];

const faqs = [
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
    "Most homes take around 45 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Rapid Inspection reports are delivered to your portal within 48 hours of the on-site visit. Lab-Backed Diagnostic reports include the lab analysis appendix, which arrives 5-7 days after sampling depending on lab turnaround.",
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

function CheckIcon() {
  return (
    <span className="check">
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2 6L5 9L10 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ToolIcon({ type }) {
  if (type === "camera") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="17" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10.5" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="16" y="3" width="5" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  if (type === "meter") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="8" y="3" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 7H14M10 10H14M12 17V21M10 21H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 5V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 10V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <main>
        <div className="problem-theatre mould-strong">
          {/* Mould contamination canvas disabled — restore by adding back:
              <div className="problem-theatre-stage" aria-hidden="true" {...theatreMould} />
              and the <Script src="/mould-contamination.js?v=37" /> tag at the bottom. */}
          <UtilityBanner />
          <MegaNav />
        <Hero
          trust={{
            quote: trustBadges[3].quote,
            meta: trustBadges[3].meta,
          }}
        />

        <TrustBar />

        <section className="problem-bg mould-strong" id="contamination">
          <div className="wrap">
            <div className="find-head">
              <div className="copy">
                <span className="eyebrow">[ signs of contamination ]</span>
                <h2>50% of QLD homes had mould within 12 months. Does yours?</h2>
                <p className="lede">
                  Visible mould is only one signal. We document moisture patterns, material damage, odour and air movement so hidden contamination has somewhere to show itself.
                </p>
              </div>
            </div>
            <div className="find-grid" aria-label="Signs of contamination">
              {contaminationSigns.map((card) => (
                <div
                  key={card.num}
                  className="find-card"
                >
                  <div className="find-meta">
                    <span className="num">{card.num}</span>
                    <span className="tag">{card.tag}</span>
                  </div>
                  <figure className="find-card-media">
                    <img src={card.image} alt={card.imageAlt} loading="lazy" />
                  </figure>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                  <div className="find-foot">
                    <span className="l">Documents</span>
                    <span className="r">{card.foot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="problem-bg mould-strong">
          <div className="wrap">
            <span className="eyebrow">[ evidence before argument ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>
              Unbiased testing and documentation of damage, for everyone involved.
            </h2>
            <p className="lede problem-lede">
              One in two Australians reported mould or dampness at home in the previous year. In Queensland rentals, damp and mould can also become a minimum housing standards issue. A Sporetrust report turns stains, odour, moisture and damage into a record people can act on.
            </p>

            <div className="audience-tabs" aria-label="Evidence pathways by customer type">
              {audiencePanels.map((panel, index) => (
                <input
                  key={panel.id}
                  className="audience-toggle"
                  type="radio"
                  name="audience"
                  id={`audience-${panel.id}`}
                  defaultChecked={index === 0}
                />
              ))}
              <div className="audience-tab-list" role="tablist" aria-label="Customer type">
                {audiencePanels.map((panel) => (
                  <label key={panel.id} htmlFor={`audience-${panel.id}`}>
                    {panel.label}
                  </label>
                ))}
              </div>
              <div className="audience-card-sets">
                {audiencePanels.map((panel) => (
                  <div key={panel.id} className={`problem-grid audience-card-set ${panel.id}`}>
                    {panel.cards.map((card) => (
                      <div key={card.num} className="pcard">
                        <span className="num">{card.num}</span>
                        <h3>{card.title}</h3>
                        <p>{card.copy}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        </div>

        <section className="diagnostics-lead" id="diagnostics">
          <div className="wrap">
            <div className="diagnostics-lead__grid">
              <div className="diagnostics-lead__main">
                <Reveal>
                  <SectionHeader
                    eyebrow="choose your pathway"
                    title="Mould doesn't look the same to every home."
                    lede="What you're seeing — or not seeing yet — determines the right diagnostic. Pick the pathway that matches your situation."
                    titleMax="32ch"
                    ledeMax="58ch"
                  />
                </Reveal>
                <Reveal delay={120}>
                  <div className="diagnostics-lead__links">
                    <span className="mega-panel__col-title">Diagnostics</span>
                    {diagnosticPathways.map((pathway) => (
                      <a key={pathway.href} className="mega-link" href={pathway.href}>
                        <span className="mega-link__label">
                          {pathway.title}
                          <ArrowIcon />
                        </span>
                        <span className="mega-link__desc">{pathway.desc}</span>
                      </a>
                    ))}
                  </div>
                </Reveal>
              </div>
              <div className="diagnostics-lead__quiz">
                <Reveal delay={180}>
                  <QuizCtaBanner stacked />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="solution" id="methodology">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                align="left"
                className="section-header--split"
                eyebrow="how we diagnose"
                title="A complete analysis, every time."
                lede="Every Sporetrust inspection runs the same protocol, so the diagnosis is consistent, defensible and complete."
              >
                <TrustBadge
                  quote={trustBadges[2].quote}
                  meta={trustBadges[2].meta}
                />
              </SectionHeader>
            </Reveal>
            <div className="methodology-grid">
              {methods.map((method) => (
                <article className="method" key={method.num}>
                  <figure className="method-media">
                    <img src={method.image} alt={method.imageAlt} loading="lazy" />
                  </figure>
                  <div className="method-meta">
                    <span className="num">{method.num}</span>
                    <span className="tag">{method.tag}</span>
                  </div>
                  <h3>{method.title}</h3>
                  <p className="m-measure">{method.measure}</p>
                  <div className="m-divider" />
                  <p className="m-reveals">
                    <strong>Reveals</strong>
                    {method.reveals}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="solution" id="report">
          <div className="wrap">
            <span className="eyebrow">[ what's in your report ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "30ch" }}>
              Official evidence for the people who need to act.
            </h2>
            <div className="what-grid">
              <div className="report-checks">
                <ul className="what-list">
                  {reportItems.map(([title, copy]) => (
                    <li key={title}>
                      <CheckIcon />
                      <div>
                        <strong>{title}</strong>
                        <span className="copy">{copy}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="report-stack">
                <ReportPreviewCard />
                <a
                  className="report-stack__cta"
                  href="#report-demo"
                  data-report-demo-trigger
                >
                  Open the digital report demo
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="solution" id="how-it-works">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="how it works"
                title="Four steps to a definitive answer."
                lede="From the moment you book, you'll know what's coming, when it lands and what it costs. No upsell, no callout fees, no quote pressure."
                titleMax="28ch"
              />
            </Reveal>

            <Timeline items={timelineItems} />

            <div className="tools-strip">
              <div className="ts-label">In the kit</div>
              <div className="ts-icons">
                {[
                  ["camera", "Thermal camera"],
                  ["meter", "Moisture meter"],
                  ["clock", "Hygrometer"],
                  ["sampler", "Air sampler"],
                ].map(([type, label]) => (
                  <div className="ts-icon" key={type}>
                    <ToolIcon type={type} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="wrap">
            <span className="eyebrow">[ fixed pricing ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>No hourly rates. No surprises.</h2>
            <div className="price-grid">
              {pricingTiers.map((tier) => (
                <div key={tier.title} className={tier.featured ? "tier featured" : "tier"}>
                  {tier.featured ? <span className="badge">Most booked</span> : null}
                  <h3>{tier.title}</h3>
                  <div className="tag">{tier.tag}</div>
                  <div className="price">{tier.price}</div>
                  <div className="price-sub">{tier.sub}</div>
                  <ul>
                    {tier.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <a className={tier.featured ? "btn btn-light" : "btn"} href="#book">
                    {tier.button} <ArrowIcon />
                  </a>
                </div>
              ))}
            </div>

            <SentinelCard />

            <TrustBadge
              className="pricing-proof"
              quote={trustBadges[1].quote}
              meta={trustBadges[1].meta}
            />
            <div className="price-foot">
              Larger homes, multiple buildings, commercial sites or specialist insurance reports -{" "}
              <a href="#book">request a custom quote</a>.
            </div>
          </div>
        </section>

        <section className="independence">
          <div className="wrap">
            <span className="eyebrow">[ a note on independence ]</span>
            <p className="quote">
              We don't sell mould treatments, fogging, encapsulants or repairs. In an uneven remediation market,
              your first document should come from someone who isn't quoting the cleanup.
            </p>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="wrap">
            <div className="faq-grid">
              <div>
                <span className="eyebrow">[ common questions ]</span>
                <h2 style={{ marginTop: 28 }}>Before you book.</h2>
                <p className="lede" style={{ marginTop: 22 }}>
                  Still unsure? Send us a quick note in the booking form. We'll come back the same business day.
                </p>
              </div>
              <div>
                <FaqAccordion items={faqs} />
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <a className="sticky-cta" href="#book">
        Book inspection -&gt;
      </a>

      <BookingTakeover />
      <QuizTakeover />
      <ReportDemoTakeover />
    </>
  );
}
