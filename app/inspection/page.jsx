import { preload } from "react-dom";
import DiagnosticHero from "../../components/DiagnosticHero";
import FaqAccordion from "../../components/FaqAccordion";
import FeatureCard from "../../components/FeatureCard";
import ReportPreviewCard from "../../components/ReportPreviewCard";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import StatRow from "../../components/StatRow";
import Timeline from "../../components/Timeline";
import TrustBadge from "../../components/TrustBadge";
import ArrowIcon from "../../components/icons/ArrowIcon";
import CheckIcon from "../../components/icons/CheckIcon";

/* --------------------------------------------------------------------------
   Paid-media landing page. PAS structure (Problem → Agitate → Solution → CTA).
   Sections inlined per project convention; data is condensed copy from existing
   site pages, ordered to push toward the #book CTA in BookingTakeover.
   -------------------------------------------------------------------------- */

export const metadata = {
  title: "Suspect mould? Get a definitive answer in 48 hours · Sporetrust",
  description:
    "Independent thermal, moisture and lab-backed mould diagnostic for Brisbane and South-East Queensland homes. Cause, damage extent and a defensible repair-cost range in plain English, within 48 hours.",
  alternates: {
    canonical: "/inspection",
  },
  openGraph: {
    title: "Independent mould & moisture diagnostic — report in 48 hours",
    description:
      "Cause, damage extent and a defensible repair-cost range. NATA-lab analysis available. Brisbane & South-East Queensland.",
    images: [
      {
        url: "/images/book-diagnostic-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Sporetrust inspector running a thermal and moisture diagnostic in a Brisbane home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Independent mould diagnostic — report in 48 hours",
    description:
      "Cause, damage extent and a defensible repair-cost range. Brisbane & SEQ.",
    images: ["/images/book-diagnostic-banner.jpg"],
  },
};

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
  },
  {
    num: "02",
    tag: "Weather",
    title: "Wet weather, storms and floods",
    copy:
      "Heavy rain, stormwater overflow and flood events push moisture into places that look dry again by inspection day. We check what the weather left behind.",
    foot: "Event history",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Wet weather and storm moisture affecting an interior room",
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
  },
  {
    num: "04",
    tag: "Moisture",
    title: "Condensation, humidity and cold surfaces",
    copy:
      "Wet windows, cold external walls and damp cupboards create mould without a pipe leak. Dew-point risk is measurable, not a matter of opinion.",
    foot: "Dew-point risk",
    image: "/images/sign-condensation.png",
    imageAlt: "Condensation and humidity on cold indoor surfaces",
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
  },
  {
    num: "07",
    tag: "Airflow",
    title: "Dust, HVAC and indoor-air symptoms",
    copy:
      "Air movement carries spores away from the source. We check the room, the system and the surrounding moisture conditions before pointing at the obvious patch.",
    foot: "Exposure pathway",
    image: "/images/sign-aircon.png",
    imageAlt: "Air conditioning vent as an indoor air movement and mould exposure pathway",
  },
];

const invisibleSigns = [
  {
    num: "S.01",
    tag: "Laundry",
    title: "Spotting on laundry or stored fabrics",
    image: "/images/sign-musty-odour.png",
    imageAlt: "Stored fabric in a cupboard developing mould spotting",
    measure:
      "Towels, linen and clothes developing dark specks in cupboards, wardrobes or sealed rooms — usually where soft goods sit close to a wall or in still air.",
    reveals: "Humidity reservoir behind storage and ventilation failure.",
  },
  {
    num: "S.02",
    tag: "Wet areas",
    title: "Black grout in bathrooms and laundries",
    image: "/images/sign-water-staining.png",
    imageAlt: "Wet area showing staining around grout and joints",
    measure:
      "Black-staining grout in showers, splashbacks or wet-room corners — the contamination usually extends past where it's visible into substrate.",
    reveals: "Waterproofing failure or persistent humidity load.",
  },
  {
    num: "S.03",
    tag: "Recurring",
    title: "Mould keeps returning after cleaning",
    image: "/images/sign-recurring-mould.png",
    imageAlt: "Mould returning after surface cleaning",
    measure:
      "Regrowth in the same spot after a clean. Surface treatment isn't a diagnosis — the conditions that caused the bloom are still in the room.",
    reveals: "Active moisture source or unaddressed affected material.",
  },
  {
    num: "S.04",
    tag: "Atmosphere",
    title: "The air feels heavy in certain rooms",
    image: "/images/sign-aircon.png",
    imageAlt: "Air vent in a room with heavy humid air",
    measure:
      "A musty smell that won't air out, rooms that feel close or damp, or a persistent sense that something's not quite right indoors.",
    reveals: "Hidden moisture, ventilation failure or HVAC carrying spores.",
  },
  {
    num: "S.05",
    tag: "Recent event",
    title: "Recent leaks, storms or wet weather",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Room affected by recent wet weather or a leak",
    measure:
      "After a roof leak, plumbing failure or significant storm event, materials can stay wet long after they look dry to the eye.",
    reveals: "Material that's still saturated despite looking surface-dry.",
  },
];

const costStats = [
  {
    tag: "Annual risk",
    figure: "50%",
    label: "Over any 12-month window, your home has a 50% chance of developing mould or damp.",
    source: "ABS / AIHW housing data",
    diagram: "recurrence",
    diagramProps: { percent: 50 },
  },
  {
    tag: "Costliest",
    figure: "1st",
    label:
      "Water damage is the costliest home risk in Australia. In 2018 the average claim was $30,361 — more than fire or burglary.",
    source: "Australian insurance industry data",
    diagram: "costBars",
  },
  {
    tag: "Predictor",
    figure: "2 in 3",
    label:
      "Self-reported damp beats visible spotting as a predictor in lab tests. Sporetrust measures the moisture behind that instinct.",
    source: "Building science research",
    diagram: "donut",
    diagramProps: { percent: 67 },
  },
];

const diyMisconceptions = [
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
    measure: "Cross-flow ventilation lowers indoor humidity. It's worth doing.",
    but: "You can't ventilate a wall cavity, or an AC compressor leaking behind the unit.",
  },
];

const sourceCategories = [
  {
    num: "C.01",
    tag: "Roof",
    title: "Roof leaks",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Roof leak source",
    copy:
      "Failed flashings, displaced tiles, ageing penetrations around vents and chimneys, sarking gaps and box-gutter overflow.",
    foot: "Water entry",
  },
  {
    num: "C.02",
    tag: "Walls",
    title: "Wall and window leaks",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Wall and window leak source",
    copy:
      "Failed window flashings, render cracks, blocked weep-holes and brick-cavity moisture migrating into internal linings.",
    foot: "Wall entry",
  },
  {
    num: "C.03",
    tag: "Drainage",
    title: "Blocked gutters and drainage",
    image: "/images/sign-water-staining.png",
    imageAlt: "Drainage failure source",
    copy:
      "Blocked gutters, downpipes discharging at the base of walls, and surface water pooling against slab edges instead of running to drain.",
    foot: "Surface water",
  },
  {
    num: "C.04",
    tag: "Showers",
    title: "Leaking showers and bathrooms",
    image: "/images/sign-recurring-mould.png",
    imageAlt: "Leaking shower source",
    copy:
      "Ageing waterproofing under shower bases, sealant gaps at tile junctions and compromised membranes behind tiles and at hob upstands.",
    foot: "Failed seal",
  },
  {
    num: "C.05",
    tag: "Plumbing",
    title: "Hidden plumbing leaks",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Hidden plumbing leak source",
    copy:
      "Hairline supply leaks behind walls, weeping shower-waste fittings and slab penetration faults that wet surrounding material long before it shows.",
    foot: "Concealed leak",
  },
  {
    num: "C.06",
    tag: "Appliances",
    title: "Leaking appliances",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Leaking appliance source",
    copy:
      "Dishwashers, washing machines and fridge water lines slowly seeping into joinery, flooring and the wall behind them.",
    foot: "Slow drip",
  },
  {
    num: "C.07",
    tag: "Air-con",
    title: "Air conditioner leaks",
    image: "/images/sign-aircon.png",
    imageAlt: "Air conditioner leak source",
    copy:
      "Overflowing drip trays, blocked or poorly graded condensate lines, and split-system heads seeping into the wall behind them.",
    foot: "AC condensate",
  },
  {
    num: "C.08",
    tag: "Ventilation",
    title: "Poor ventilation",
    image: "/images/sign-musty-odour.png",
    imageAlt: "Ventilation failure source",
    copy:
      "Exhaust fans dumping into roof voids instead of outside, recirculating range hoods, blocked subfloor vents and rooms with no cross-flow.",
    foot: "Trapped humidity",
  },
  {
    num: "C.09",
    tag: "Subfloor",
    title: "Damp under the house",
    image: "/images/thermal-imaging.jpg",
    imageAlt: "Subfloor moisture source",
    copy:
      "Undercroft dampness, slab-edge moisture, poor site fall and groundwater migrating up into bearers, joists and finished floors.",
    foot: "Ground water",
  },
];

const methods = [
  {
    num: "M.01",
    tag: "Thermal",
    title: "Thermal mapping",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal imaging comparison used during a Sporetrust diagnostic",
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
    title: "Hygrometer + air sampling",
    image: "/images/air-sample.jpg",
    imageAlt: "Air sampling cassette used for mould spore capture",
    measure:
      "Continuous hygrometer logging on-site, plus optional indoor and outdoor control samples to a NATA-accredited lab.",
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
    "Damage extent & affected materials",
    "What's wet, contaminated, salvageable, or likely to need removal.",
  ],
  [
    "Defensible repair cost range",
    "Independent cost bands based on current South-East Queensland trade rates.",
  ],
  [
    "Liveability and urgency notes",
    "Clear language for tenants, owners, managers, insurers and contractors.",
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

const testimonials = [
  {
    quote:
      "Caught a slow drip behind the dishwasher before the floor ever stained. Plumber fix was $220 — without the diagnostic that's a $20k floor and cabinet job.",
    meta: "Homeowner · Brisbane",
  },
  {
    quote:
      "After the November storm we got an inspection within four days. Came back clean — and we had the report ready for our insurer just in case.",
    meta: "Homeowner · Bayside",
  },
  {
    quote:
      "Stacked reports turned a tribunal letter into a five-minute conversation. The document did the talking, not us.",
    meta: "Rental owner · Gold Coast",
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
    "How long does the on-site visit take?",
    "Most homes take around 45 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Rapid Inspection reports are delivered to your portal within 48 hours of the on-site visit. Lab-Backed Diagnostic reports include the lab analysis appendix, which arrives 5–7 days after sampling depending on lab turnaround.",
  ],
  [
    "What if you don't find anything serious?",
    "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer.",
  ],
  [
    "Can I share the report with my landlord, builder or insurer?",
    "Yes. The report is built for that handoff: landlord, property manager, insurer, builder, remediation provider or tribunal support file.",
  ],
  [
    "How accurate are your repair cost estimates?",
    "Defensible bands based on current South-East Queensland trade rates, the materials affected and the scope indicated by the diagnosis. They let you budget with confidence and benchmark every quote you receive.",
  ],
  [
    "Are you a remediation company?",
    "No. We inspect, document and report. If remediation or building work is needed, we can point you toward vetted providers — but we don't clip the ticket on the cleanup.",
  ],
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function InspectionLandingPage() {
  preload("/images/book-diagnostic-banner.jpg", { as: "image" });

  return (
    <main>
      {/* P — product hero with the offer + book CTA visible above the fold */}
      <DiagnosticHero />

      {/* P — pattern-match: "you have at least one of these" */}
      <section className="problem-bg" id="signs">
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
              <div key={card.num} className="find-card">
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

      {/* P — escalate: the hidden signs most owners miss */}
      <section className="signs-section">
        <div className="wrap">
          <div className="signs-grid">
            <div className="signs-grid__copy">
              <Reveal>
                <SectionHeader
                  eyebrow="signs you can't see yet"
                  title="By the time it shows on the wall, the moisture's been there for months."
                  lede="Five quiet signs the house gives you before anything stains."
                />
              </Reveal>
              <a className="btn" href="#book">
                Book inspection <ArrowIcon />
              </a>
            </div>
            <div className="signs-grid__cards">
              {invisibleSigns.map((card) => (
                <article className="method signs-card" key={card.num}>
                  <figure className="method-media">
                    <img src={card.image} alt={card.imageAlt} loading="lazy" />
                  </figure>
                  <div className="method-meta">
                    <span className="num">{card.num}</span>
                    <span className="tag">{card.tag}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="m-measure">{card.measure}</p>
                  <div className="m-divider" />
                  <p className="m-reveals">
                    <strong>Reveals</strong>
                    {card.reveals}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* A — agitate: the cost of doing nothing */}
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="the cost of waiting"
              title="Doing nothing is the expensive option."
              ledeMax="60ch"
              lede="Three numbers explain why the earliest diagnostic is the cheapest one — and why an unchecked drip becomes Australia's costliest insurance claim."
            />
          </Reveal>
          <div className="problem-cta">
            <a className="btn" href="#book">
              Book inspection <ArrowIcon />
            </a>
          </div>
          <Reveal delay={120}>
            <StatRow variant="stacked" stats={costStats} />
          </Reveal>
        </div>
      </section>

      {/* A — burn the DIY/cleaning objection */}
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
            {diyMisconceptions.map((card) => (
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

      {/* A — what we trace damp back to: the failure modes most owners haven't considered */}
      <section className="sources-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="what we surface"
              title="Finding the source stops the cycle."
              lede="The patch is the symptom. These are the failure modes we typically trace it back to."
              titleMax="32ch"
            />
          </Reveal>
          <div className="find-grid" aria-label="Source failure modes">
            {sourceCategories.map((source) => (
              <div key={source.num} className="find-card">
                <div className="find-meta">
                  <span className="num">{source.num}</span>
                  <span className="tag">{source.tag}</span>
                </div>
                <figure className="find-card-media">
                  <img src={source.image} alt={source.imageAlt} loading="lazy" />
                </figure>
                <h3>{source.title}</h3>
                <p>{source.copy}</p>
                <div className="find-foot">
                  <span className="l">Documents</span>
                  <span className="r">{source.foot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S — the protocol: uniquely qualified to catch damp & mould early */}
      <section className="solution" id="methodology">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="how we diagnose"
              title="Uniquely qualified to catch damp & mould early."
              lede="Visual checks find damp after the wall stains. Sporetrust's protocol surfaces it in the cavity, in the substrate and in the air — months before it shows."
              titleMax="36ch"
            />
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

      {/* S — the deliverable: report contents + live preview */}
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
            <ReportPreviewCard />
          </div>
        </div>
      </section>

      {/* S — process: kills the "what does this involve" hesitation */}
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
        </div>
      </section>

      {/* S — social proof */}
      <section className="testimonials">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="from customers"
              title="Caught early. Fixed small. Stayed dry."
              ledeMax="56ch"
              lede="What homeowners and rental owners say once the report is in their hands."
            />
          </Reveal>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <Reveal key={t.meta}>
                <TrustBadge quote={t.quote} meta={t.meta} className="trust-badge--feature" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* S — transparent pricing, two tiers, Lab-Backed featured */}
      <section className="pricing" id="pricing">
        <div className="wrap">
          <span className="eyebrow">[ fixed pricing ]</span>
          <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>
            No hourly rates. No surprises.
          </h2>
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

      {/* Action — last touch before FAQ */}
      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Book a diagnostic"
            title="Get the evidence before the wall turns black."
            stats={[
              {
                figure: "$945",
                label:
                  "Lab-Backed Diagnostic — on-site protocol + NATA-lab analysis + 48-hour report. Fixed price, GST inc.",
              },
              {
                figure: "48 hours",
                label:
                  "Plain-English digital report with cause, extent, evidence and a defensible repair-cost range.",
              },
            ]}
            primaryCta={{ label: "Book inspection", href: "#book" }}
            secondaryCta={{ label: "See pricing", href: "#pricing" }}
            footnote="No callout fees · independent of remediation · IICRC certified · NATA-accredited lab analysis available."
            image="/images/thermal-imaging.jpg"
            imageAlt="Sporetrust inspector using thermal imaging equipment in a Queenslander interior"
          />
        </div>
      </section>

      {/* Action — objection handling */}
      <section className="faq" id="faq">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
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
  );
}
