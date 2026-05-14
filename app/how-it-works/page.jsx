"use client";

import { useEffect, useRef, useState } from "react";
import BookingTakeover from "../../components/BookingTakeover";
import QuizTakeover from "../../components/QuizTakeover";
import ReportDemoTakeover from "../../components/ReportDemoTakeover";
import ReportPreviewCard from "../../components/ReportPreviewCard";
import DiagnosticHero from "../../components/DiagnosticHero";
import FaqAccordion from "../../components/FaqAccordion";
import Footer from "../../components/Footer";
import MegaNav from "../../components/MegaNav";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import SentinelCard from "../../components/SentinelCard";
import UtilityBanner from "../../components/UtilityBanner";
import ArrowIcon from "../../components/icons/ArrowIcon";
import CheckIcon from "../../components/icons/CheckIcon";

const audiences = {
  homeowners: {
    label: "Homeowner",
    lede:
      "Your report controls the conversation with insurers, contractors and remediators — before quotes start shaping the facts.",
    flowLede:
      "From booking to insurance-ready report. What the protocol delivers when you're the one paying for the fix.",
    timeline: [
      {
        title: "Book online.",
        meta: "Day 0 · 2 min",
        copy:
          "Tell us what's changed — a stain, a smell, a recent leak, an insurance question, a contractor quote you don't trust. We confirm fit, fixed-price and lock in a visit that works around your week.",
        signals: ["Suburb check", "Insurance context", "Fixed price", "Same-day reply"],
        image: "/images/hero-queenslander.jpg",
        imageAlt: "Queenslander home awaiting a Sporetrust diagnostic visit",
      },
      {
        title: "Technician visits.",
        meta: "Day 1 to 5 · 45 min",
        copy:
          "Same Sporetrust protocol — thermal mapping, moisture metering, humidity logging, photography, optional air sampling. We document conditions the way assessors, builders and remediators are used to seeing.",
        signals: ["Thermal", "Moisture meter", "Hygrometer", "Air sampler"],
        image: "/images/book-diagnostic-banner.jpg",
        imageAlt: "Sporetrust technician on-site with thermal and moisture diagnostic equipment",
      },
      {
        title: "Report delivered.",
        meta: "Within 48 hours",
        copy:
          "Insurance-grade evidence in your portal: cause, extent, timing, materials affected, and a defensible repair-cost range based on current South-East Queensland trade rates.",
        signals: ["Cause + timing", "Materials map", "Cost range", "Sharable PDF"],
        image: "/images/sporetrace-report.jpg",
        imageAlt: "Sample Sporetrust diagnostic report showing thermal evidence, moisture readings and summary",
      },
      {
        title: "Act on the evidence.",
        meta: "When you're ready",
        copy:
          "Forward the report to your insurer or claim advocate. Benchmark any remediation quotes against the documented scope. Decide what's urgent, what can wait — and what's worth a second opinion.",
        signals: ["Insurer brief", "Quote benchmark", "Decision phase", "Documented scope"],
        image: "/images/sporetrace-report.jpg",
        imageAlt: "Sporetrust report being reviewed for next-step decisions",
      },
      {
        title: "Connect with vetted partners.",
        meta: "As works begin",
        copy:
          "Our vetted remediation and repair partners read the report and quote against it — not over it. You get comparable, scope-aware quotes from contractors who already understand the cause and extent.",
        signals: ["Partner intros", "Scope-aware quotes", "Comparable bids", "Independent referral"],
        image: "/images/lab-testing.jpg",
        imageAlt: "Trade and lab partners working from a Sporetrust diagnostic report",
      },
      {
        title: "Get the all clear.",
        meta: "After works complete",
        copy:
          "Once remediation or repairs are done, Sporetrust returns to verify — same protocol, same readings. You walk away with a clean record and a documented sign-off, not a hope.",
        signals: ["Clearance check", "Same protocol", "Documented sign-off", "Closed loop"],
        image: "/images/hero-mould-prevention.jpg",
        imageAlt: "Queenslander interior cleared and signed off after works",
      },
    ],
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
    reportItems: [
      [
        "Insurance-grade cause & timing",
        "Plain-English documentation of causation, extent and timing — written for assessors and adjusters, not against them.",
      ],
      [
        "Material damage map",
        "Room-by-room moisture readings, thermal images and a salvageable-vs-replace breakdown.",
      ],
      [
        "Defensible cost range",
        "Independent repair bands based on current South-East Queensland trade rates — benchmark every quote you get.",
      ],
      [
        "Remediation vs repair pathway",
        "Which jobs are decontamination, which are builder/trade — so quotes don't double up or miss scope.",
      ],
      [
        "Sharable PDF + portal access",
        "Forward to your insurer, builder, remediator or claims advocate without rewriting the history.",
      ],
    ],
  },
  tenants: {
    label: "Tenant",
    lede:
      "Photos can be argued with. Moisture readings, likely cause and liveability notes give your repair request a record your landlord or tribunal can respond to.",
    flowLede:
      "From booking to tribunal-ready record. What each step delivers when the conversation is with your landlord, agent or QCAT.",
    timeline: [
      {
        title: "Book online.",
        meta: "Day 0 · 2 min",
        copy:
          "Tell us what you're dealing with — visible mould, persistent smell, unwell occupants, a landlord who's stopped responding. We schedule around your routine and confirm by close of business.",
        signals: ["Brief intake", "Schedule around you", "Fixed price", "Same-day reply"],
        image: "/images/hero-queenslander.jpg",
        imageAlt: "Queenslander rental home awaiting a Sporetrust diagnostic visit",
      },
      {
        title: "Technician visits.",
        meta: "Day 1 to 5 · 45 min",
        copy:
          "Same independent protocol. Cause is measured, not argued — moisture readings settle the building-defect vs tenant-caused question. Photos and thermal images are dated and located in the record.",
        signals: ["Thermal", "Moisture meter", "Cause attribution", "Dated record"],
        image: "/images/book-diagnostic-banner.jpg",
        imageAlt: "Sporetrust technician on-site with thermal and moisture diagnostic equipment",
      },
      {
        title: "Report delivered.",
        meta: "Within 48 hours",
        copy:
          "Tribunal-ready PDF with liveability notes, photographic and thermal evidence, cause attribution, and language you can paste straight into a repair request to your property manager.",
        signals: ["Liveability notes", "Repair-request copy", "QCAT format", "Sharable PDF"],
        image: "/images/sporetrace-report.jpg",
        imageAlt: "Sample Sporetrust diagnostic report formatted for landlord and tribunal handoff",
      },
      {
        title: "Act on the evidence.",
        meta: "When you're ready",
        copy:
          "Send to your property manager or landlord. Attach to a QCAT application. Use as grounds for a rent reduction request — or to break a lease. The document does the talking.",
        signals: ["Agent forward", "QCAT submit", "Rent reduction", "Lease support"],
        image: "/images/hero-mould-prevention.jpg",
        imageAlt: "Rental interior after the landlord has actioned the diagnostic report",
      },
    ],
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
    reportItems: [
      [
        "Liveability and urgency notes",
        "Plain-English impact on whether the home meets Queensland minimum housing standards.",
      ],
      [
        "Cause attribution",
        "Building-defect vs tenant-caused, measured with moisture readings — not opinion.",
      ],
      [
        "Photographic + thermal record",
        "Dated, located evidence you can attach to any repair request or claim.",
      ],
      [
        "Sharable PDF for landlord & agent",
        "Built to forward without explaining the whole history again.",
      ],
      [
        "Tribunal-ready format",
        "Structured the way QCAT and equivalent dispute processes expect to see it.",
      ],
    ],
  },
  managers: {
    label: "Building Manager",
    lede:
      "One independent diagnostic for both sides. Same readings, same cause, same recommended next steps — so the conversation can finally move forward.",
    flowLede:
      "From booking to neutral handoff. Coordinated for owners and tenants, scoped for contractors, dated for your records.",
    timeline: [
      {
        title: "Book online.",
        meta: "Day 0 · 2 min",
        copy:
          "Book on behalf of the owner or tenant. Brief us on the dispute, the access constraints and the parties involved — we confirm scope and coordinate visit timing between both sides.",
        signals: ["Brief intake", "Coordinated access", "Owner + tenant", "Fixed price"],
        image: "/images/hero-queenslander.jpg",
        imageAlt: "Managed property awaiting a coordinated Sporetrust diagnostic visit",
      },
      {
        title: "Technician visits.",
        meta: "Day 1 to 5 · 45 min",
        copy:
          "One Sporetrust protocol, neutral framing. Same readings, same cause attribution — no separate owner and tenant inspections, no he-said-she-said over methodology.",
        signals: ["Thermal", "Moisture meter", "Neutral protocol", "Coordinated visit"],
        image: "/images/book-diagnostic-banner.jpg",
        imageAlt: "Sporetrust technician on-site with thermal and moisture diagnostic equipment",
      },
      {
        title: "Report delivered.",
        meta: "Within 48 hours",
        copy:
          "One document with dual-stakeholder framing — owner-facing and tenant-facing language in the same report. Urgency triage, contractor brief, and an audit-trail timestamp for your records.",
        signals: ["Dual framing", "Urgency triage", "Contractor brief", "Audit trail"],
        image: "/images/sporetrace-report.jpg",
        imageAlt: "Sample Sporetrust diagnostic report framed for owner and tenant handoff",
      },
      {
        title: "Act on the evidence.",
        meta: "When you're ready",
        copy:
          "Forward the report to both parties. Confirm what's urgent, what can wait, and what needs builder vs remediation. One document keeps owner, tenant and trades aligned.",
        signals: ["Dual share", "Triage decisions", "Scope alignment", "Single source"],
        image: "/images/sporetrace-report.jpg",
        imageAlt: "Sporetrust report being reviewed by an owner and tenant in parallel",
      },
      {
        title: "Connect with vetted partners.",
        meta: "As works begin",
        copy:
          "Brief our vetted remediation and trade partners with the report. They quote against the documented scope — so owners get comparable bids and tenants get faster, accountable resolution.",
        signals: ["Partner intros", "Comparable bids", "Faster resolution", "Documented scope"],
        image: "/images/lab-testing.jpg",
        imageAlt: "Trade and lab partners working from a Sporetrust diagnostic report",
      },
      {
        title: "Get the all clear.",
        meta: "After works complete",
        copy:
          "Sporetrust returns for clearance — same protocol, dated readings, documented sign-off. Closes the loop with the owner, the tenant and your records in one document.",
        signals: ["Clearance check", "Owner sign-off", "Tenant confirmation", "Closed loop"],
        image: "/images/hero-mould-prevention.jpg",
        imageAlt: "Managed property cleared and signed off after contractor works",
      },
    ],
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
    reportItems: [
      [
        "Dual-stakeholder framing",
        "Owner-facing and tenant-facing language in one document — no separate report needed.",
      ],
      [
        "Urgency triage",
        "Clean / repair / habitability flag, called out so action priority is obvious.",
      ],
      [
        "Contractor scope brief",
        "Remediation, building or plumbing handoff notes — so quotes come back comparable.",
      ],
      [
        "Time-stamped audit trail",
        "Readings, photos and recommendations dated for your records and any later dispute.",
      ],
      [
        "Clearance pathway",
        "If works happen, the same protocol can return for clearance and post-remediation sign-off.",
      ],
    ],
  },
};

const journeyItems = [
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

const tenantReframeCards = [
  {
    num: "D.01",
    tag: "Bleach",
    title: "Spray and pray.",
    measure: "Bleach clears what you see. On tile or grout, it works.",
    but: "If moisture's still feeding it, the patch returns within weeks.",
  },
  {
    num: "D.02",
    tag: "Laundry",
    title: "Wash, soak, repeat.",
    measure:
      "Hot wash, vinegar soak and sun-drying do rescue spotted clothes, hopefully.",
    but: "The spores came from somewhere. Fresh laundry keeps spotting.",
  },
  {
    num: "D.03",
    tag: "Airflow",
    title: "Crack a window.",
    measure:
      "Cross-flow ventilation lowers indoor humidity. It's worth doing.",
    but: "You can't ventilate a wall cavity, or an AC compressor leaking behind the unit.",
  },
];

const pricingTiers = [
  {
    title: "Rapid Inspection",
    tag: "For most homes & apartments",
    price: "$695",
    sub: "ONCE-OFF · GST INC",
    featured: false,
    button: "Book Rapid",
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
    sub: "ONCE-OFF · GST INC",
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
    "How long does the on-site assessment take?",
    "Most homes take around 45 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Rapid Inspection reports are delivered to your portal within 48 hours of the on-site visit. Lab-Backed Diagnostic reports include the lab analysis appendix, which arrives 5-7 days after sampling depending on lab turnaround.",
  ],
  [
    "Can I share the report with my landlord, builder or insurer?",
    "Yes. The report is built for that handoff: landlord, property manager, insurer, builder, remediation provider or tribunal support file.",
  ],
  [
    "What if you don't find anything serious?",
    "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer.",
  ],
];

export default function HowItWorksPage() {
  const [audienceId, setAudienceId] = useState("homeowners");
  const audience = audiences[audienceId];
  const barRef = useRef(null);
  const isFirstAudienceChange = useRef(true);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    function check() {
      bar.classList.toggle("is-stuck", bar.getBoundingClientRect().top <= 0);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (isFirstAudienceChange.current) {
      isFirstAudienceChange.current = false;
      return;
    }
    const bar = barRef.current;
    if (!bar) return;
    bar.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [audienceId]);

  return (
    <>
      <UtilityBanner />
      <MegaNav />
      <main>
        <DiagnosticHero />

        <div
          ref={barRef}
          className="audience-bar"
          role="tablist"
          aria-label="Pick the situation that applies to you"
        >
          <div className="wrap audience-bar__inner">
            <span className="audience-bar__label">I'm a</span>
            <div className="audience-bar__tabs">
              {Object.entries(audiences).map(([id, data]) => {
                const isActive = audienceId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="hiw-audience-panel"
                    className={`audience-bar__tab${isActive ? " is-active" : ""}`}
                    onClick={() => setAudienceId(id)}
                  >
                    {data.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <section
          className="hiw-flow"
          id="hiw-audience-panel"
          role="tabpanel"
          aria-live="polite"
          aria-label={`The Sporetrust process for ${audience.label.toLowerCase()}s`}
        >
          <ol className="hiw-flow__stack" role="list">
            {audience.timeline.map((step, i) => (
              <li key={step.title} className="hiw-flow__step" style={{ "--step-index": i }}>
                <div className="wrap hiw-flow__panel">
                  <div className="hiw-flow__panel-content">
                    <header className="hiw-flow__step-head">
                      <span className="hiw-flow__step-index">
                        Step {String(i + 1).padStart(2, "0")}
                      </span>
                      {step.meta ? (
                        <span className="hiw-flow__step-meta">{step.meta}</span>
                      ) : null}
                    </header>
                    <h3 className="hiw-flow__step-title">{step.title}</h3>
                    <p className="hiw-flow__step-copy">{step.copy}</p>
                    {step.signals?.length ? (
                      <ul className="hiw-flow__step-signals" role="list">
                        {step.signals.map((signal) => (
                          <li key={signal}>{signal}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {step.image ? (
                    <figure className="hiw-flow__panel-media">
                      <img
                        src={step.image}
                        alt={step.imageAlt || ""}
                        loading="lazy"
                      />
                    </figure>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="solution">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow={`why it matters for ${audience.label.toLowerCase()}s`}
                title={`How we help ${audience.label.toLowerCase()}s prevent and manage mould.`}
                lede={audience.lede}
                ledeMax="60ch"
              />
            </Reveal>
            <div className="problem-grid" style={{ marginTop: 48 }}>
              {audience.cards.map((card) => (
                <div key={card.num} className="pcard">
                  <span className="num">{card.num}</span>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="solution">
          <div className="wrap">
            <span className="eyebrow">[ what your report does for you ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "32ch" }}>
              Built for the conversation a {audience.label.toLowerCase()} actually has next.
            </h2>
            <div className="what-grid">
              <div className="report-checks">
                <ul className="what-list">
                  {audience.reportItems.map(([title, copy]) => (
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

        {audienceId === "tenants" ? (
          <>
            <section className="diy-section">
              <div className="wrap">
                <Reveal>
                  <SectionHeader
                    eyebrow="the reframe"
                    title="Mould is not a hygiene problem."
                    lede="Pests happen to the house. Burst pipes happen to the house. Mould is a plumbing, waterproofing, or ventilation failure that hasn't surfaced yet. Not your guilty reminder."
                  />
                </Reveal>
                <div className="methodology-grid diy-grid">
                  {tenantReframeCards.map((card) => (
                    <article className="method method--text" key={card.num}>
                      <div className="method-meta">
                        <span className="num">{card.num}</span>
                        <span className="tag">{card.tag}</span>
                      </div>
                      <h3>{card.title}</h3>
                      <p className="m-measure">{card.measure}</p>
                      <div className="m-divider" />
                      <p className="m-reveals">
                        <strong>But</strong>
                        {card.but}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="pricing">
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
                <div className="price-foot">
                  Larger homes, multiple buildings, commercial sites or specialist insurance reports —{" "}
                  <a href="#book">request a custom quote</a>.
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="journey">
              <div className="wrap">
                <div className="journey-head">
                  <span className="eyebrow">[ from diagnosis to clearance ]</span>
                  <h2>From mould diagnosis to repaired, cleared and clean.</h2>
                  <p className="lede">
                    Remediation and repair are often different jobs. If your report shows works are needed, Sporetrust
                    helps you connect with trusted remediators and specialist repair contractors as one coordinated
                    pathway, so the likely scope is clear before your home is opened up.
                  </p>
                </div>
                <div className="journey-grid">
                  {journeyItems.map((item) => (
                    <article className="journey-card" key={item.num}>
                      <div className="journey-card-top">
                        <span className="num">Step {Number(item.num)}</span>
                        <span className="title">{item.title}</span>
                      </div>
                      <h3>{item.heading}</h3>
                      <p>{item.copy}</p>
                      <div className="journey-meta">{item.meta}</div>
                    </article>
                  ))}
                </div>
                <div className="journey-callouts">
                  <aside className="journey-warning">
                    <span>Before remediation starts</span>
                    <h3>Know who is putting the home back together.</h3>
                    <p>
                      Some remediation scopes end once contaminated materials are removed and cleaned. That can leave
                      owners, tenants and managers needing urgent builder, plastering, flooring, cabinetry or plumbing
                      quotes after the home is already opened up. We help surface those needs earlier, so remediation and
                      repair can be planned as one pathway.
                    </p>
                  </aside>
                  <aside className="journey-note">
                    <span>Independent diagnosis</span>
                    <h3>Coordinated next steps.</h3>
                    <p>
                      In an unregulated industry, trust matters. We focus on unbiased diagnostics, clear evidence and
                      practical support through the pathway to clearance. If action is needed, we can introduce trusted
                      partners and help manage the information handoff at no extra cost. You decide who to hire, and when.
                      If you want us back for clearance checks and a final prevention clean, we are here to help.
                    </p>
                  </aside>
                </div>
              </div>
            </section>

            <section className="pricing">
              <div className="wrap">
                <Reveal>
                  <SectionHeader
                    eyebrow="ongoing protection"
                    title="Make it annual with Sentinel."
                    lede="Once you've had your first diagnostic, Sentinel keeps the answer current — two visits a year, year-on-year tracking, and the team you already trust on speed dial."
                  />
                </Reveal>
                <SentinelCard />
              </div>
            </section>
          </>
        )}

        <section className="faq">
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
      <BookingTakeover />
      <QuizTakeover />
      <ReportDemoTakeover />
    </>
  );
}
