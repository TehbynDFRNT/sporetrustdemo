// UtilityBanner, MegaNav, Footer, and the takeovers live in app/layout.jsx now.
import ReportPreviewCard from "../../components/ReportPreviewCard";
import FaqAccordion from "../../components/FaqAccordion";
import FeatureCard from "../../components/FeatureCard";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import SentinelHero from "../../components/SentinelHero";
import TrustBadge from "../../components/TrustBadge";
import TrustBar from "../../components/TrustBar";
import ArrowIcon from "../../components/icons/ArrowIcon";
import CheckIcon from "../../components/icons/CheckIcon";

function CompareCellValue({ text }) {
  const yesMatch = text.match(/^Yes(?:\s*[—-]\s*(.+))?$/);
  const noMatch = text.match(/^No(?:\s*[—-]\s*(.+))?$/);
  if (yesMatch) {
    return (
      <>
        <span className="compare-primary">
          <svg className="compare-icon compare-icon--check" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
          </svg>
          Yes
        </span>
        {yesMatch[1] ? <span className="compare-note">{yesMatch[1]}</span> : null}
      </>
    );
  }
  if (noMatch) {
    return (
      <>
        <span className="compare-primary">
          <svg className="compare-icon compare-icon--x" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4 L12 12 M12 4 L4 12" />
          </svg>
          No
        </span>
        {noMatch[1] ? <span className="compare-note">{noMatch[1]}</span> : null}
      </>
    );
  }
  return <span>{text}</span>;
}

const sentinelInclusions = [
  {
    title: "Two annual on-site diagnostics",
    copy:
      "A full thermal, moisture and humidity sweep of your home, twice a year, scheduled in advance. Same Sporetrust protocol as a one-off Rapid Inspection, included in your subscription.",
    value: "Twice yearly",
  },
  {
    title: "Best-in-class early detection",
    copy:
      "Hidden water damage and damp run for months before they show on a wall. Sentinel's protocol catches the conditions during that window — keeping fixes small, scope contained, and the bill manageable.",
    value: "Catches it early",
  },
  {
    title: "A standing property record",
    copy:
      "Each visit stacks into a year-on-year diagnostic history — defensible evidence to share with insurers, builders, tribunals, landlords or future buyers.",
    value: "Compounding record",
  },
  {
    title: "Member rate on re-checks",
    copy:
      "If something changes between scheduled visits, subscribers get re-inspections at the member rate — well below standard pricing, no callout fees.",
    value: "Subscriber rate",
  },
  {
    title: "Priority booking & support",
    copy:
      "Front-of-queue scheduling for any follow-up readings, plus a subscriber line for moisture and mould questions between visits — so you're not figuring it out alone.",
    value: "Direct support",
  },
  {
    title: "Discounted remediation & repair",
    copy:
      "When works are actually needed, our vetted remediation and repair partners extend a member rate to Sentinel subscribers. We don't take a cut on the job — you just get a better price through the network.",
    value: "Vetted partner network",
  },
];

const sentinelCards = [
  {
    num: "01 / Early detection",
    title: "Months earlier.",
    copy:
      "Hidden moisture compounds inside walls, cavities and subfloors for months before it shows. Sentinel's annual sweep catches it during that window — before the bloom, before the bill.",
  },
  {
    num: "02 / Smaller fix",
    title: "Contained scope.",
    copy:
      "Catching the source early keeps repairs small. Treating the patch alone leaves the cause active — and the next quote bigger than the last.",
  },
  {
    num: "03 / Full coverage",
    title: "Whole home, every visit.",
    copy:
      "Thermal, moisture and humidity across every room — wardrobes, subfloor, ceiling void and HVAC included. No corner is the one we didn't check.",
  },
];

const sentinelTestimonials = [
  {
    quote:
      "Caught a slow drip behind the dishwasher on our second annual visit. Plumber fix was $220 — without Sentinel that's a $20k floor and cabinet job by year three.",
    meta: "Sentinel member · Year 2 · Brisbane",
  },
  {
    quote:
      "After the November storm we asked for a follow-up reading and were on-site within four days. Came back clean — and we had the report ready for our insurer just in case.",
    meta: "Homeowner · Bayside",
  },
  {
    quote:
      "Three years of stacked Sentinel reports turned a tribunal letter into a five-minute conversation. Easily the best $14 a week we spend on the place.",
    meta: "Rental owner · Gold Coast",
  },
];

const sentinelMethods = [
  {
    num: "M.01",
    tag: "Thermal",
    title: "Thermal mapping",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal imaging comparison used during a Sentinel diagnostic visit",
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
      "Continuous hygrometer logging across the visit, with optional indoor and outdoor control air samples to an AIHA-accredited lab (ISO/IEC 17025).",
    reveals: "Humidity load and airborne spore count.",
  },
  {
    num: "M.04",
    tag: "Lab",
    title: "Lab analysis (member rate)",
    image: "/images/lab-testing.jpg",
    imageAlt: "Laboratory testing equipment for mould sample analysis",
    measure:
      "Independent sample handling and lab analysis at the Sentinel member rate when spore count, species profile or claim-ready evidence is needed.",
    reveals: "Contamination indicators and evidence support.",
  },
];

const sentinelReportItems = [
  [
    "Where moisture, damage and mould indicators were found",
    "Mapped against rooms and surfaces with photos, readings and thermal images.",
  ],
  [
    "The likely cause",
    "Leak, condensation, ventilation, roof, waterproofing, slab moisture or building defect.",
  ],
  [
    "Year-on-year delta vs your baseline",
    "Visit-over-visit changes in moisture load, humidity profile and material condition — only Sentinel members get this.",
  ],
  [
    "Damage extent & affected materials",
    "What's wet, contaminated, salvageable, or likely to need attention before next visit.",
  ],
  [
    "Liveability and urgency notes",
    "Clear language for tenants, owners, managers, insurers and contractors.",
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

const compareRows = [
  { label: "Cost", standard: "$695 once", sentinel: "$22.95 / week" },
  { label: "On-site visits", standard: "1", sentinel: "2 per year" },
  { label: "Diagnostic report", standard: "Standalone", sentinel: "Year-on-year, stacked" },
  { label: "Re-inspection rate", standard: "$695 each", sentinel: "$549.50 (member rate)" },
  { label: "Booking priority", standard: "Standard queue", sentinel: "Subscriber priority" },
  { label: "Term", standard: "One-off", sentinel: "12-month minimum" },
  { label: "Best for", standard: "One-time concern", sentinel: "Ongoing peace of mind" },
];

const sentinelFaqs = [
  [
    "Can I cancel anytime?",
    "Yes — cancel anytime before your first scheduled inspection, or after your first 12-month term. The 12-month minimum only kicks in once you've used an included inspection.",
  ],
  [
    "Why a 12-month minimum?",
    "The plan covers two scheduled diagnostics and reserved subscriber capacity. The 12-month minimum keeps the weekly rate honest — without it, someone could subscribe for a few weeks just to take an included inspection and then cancel.",
  ],
  [
    "Does the annual inspection cover the whole home?",
    "Yes. Same protocol as a Rapid Inspection — thermal, moisture, humidity and ventilation across the home, plus the rooms you flag at re-engagement.",
  ],
  [
    "What if mould appears between annual visits?",
    "Sentinel members get priority booking for re-inspections at the member rate. Most members never need one — but if you do, you move to the front of the queue.",
  ],
  [
    "Is lab sampling included?",
    "Lab-backed air sampling is offered at the member rate as an add-on when an inspection reveals something worth deeper analysis — not on every visit by default.",
  ],
];

export default function SporetrustSentinelPage() {
  return (
    <main>
        <SentinelHero />

        <TrustBar ratingLabel="IICRC certified · AIHA-accredited lab partners (ISO/IEC 17025) · Independent of remediation" />

        <section className="solution">
          <div className="wrap">
            <span className="eyebrow">[ why annually ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>
              Mould prevention starts with early diagnosis.
            </h2>
            <p className="lede" style={{ marginTop: 22, maxWidth: "60ch" }}>
              Sentinel isn't a once-off diagnostic stretched out — it's a membership built around finding moisture early, keeping the fix small and covering the corners owners forget.
            </p>

            <div className="problem-grid" style={{ marginTop: 48 }}>
              {sentinelCards.map((card) => (
                <div key={card.num} className="pcard">
                  <span className="num">{card.num}</span>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sentinel-inclusions-section">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="what's included"
                title="Everything in your Sentinel year."
                lede="Two diagnostic visits, a standing record of your home, and reduced subscriber rates when something needs a closer look."
                titleMax="32ch"
                ledeMax="58ch"
              />
            </Reveal>
            <Reveal>
              <article className="sentinel-inclusions-card">
                <ul className="sentinel-inclusions-grid" role="list">
                  {sentinelInclusions.map((item, index) => (
                    <li className="sentinel-inclusions-item" key={item.title}>
                      <div className="sentinel-inclusions-item__head">
                        <span className="sentinel-inclusions-item__num">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="sentinel-inclusions-item__value">{item.value}</span>
                      </div>
                      <h3 className="sentinel-inclusions-item__title">{item.title}</h3>
                      <p className="sentinel-inclusions-item__copy">{item.copy}</p>
                    </li>
                  ))}
                </ul>

                <div className="sentinel-inclusions-foot">
                  <div className="sentinel-inclusions-foot__price">
                    <div className="sentinel-inclusions-foot__price-row">
                      <span className="sentinel-inclusions-foot__figure">$22.95</span>
                      <span className="sentinel-inclusions-foot__meta">per week</span>
                    </div>
                    <p className="sentinel-inclusions-foot__terms">
                      12-month minimum, billed weekly. Cancel anytime before your first scheduled inspection — or after your 12-month term.
                    </p>
                  </div>
                  <a className="sentinel-inclusions-foot__cta" href="#book">
                    Join Sentinel
                    <ArrowIcon />
                  </a>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        <section className="solution" id="methodology">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="what every visit covers"
                title="Uniquely qualified to catch damp & mould early."
                titleMax="36ch"
                lede="Visual checks find damp after the wall stains. Sporetrust's protocol surfaces it in the cavity, in the substrate and in the air — months before it shows."
              />
            </Reveal>
            <div className="methodology-grid">
              {sentinelMethods.map((method) => (
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
            <span className="eyebrow">[ your annual report ]</span>
            <h2 style={{ marginTop: 28, maxWidth: "30ch" }}>
              Two reports a year, stacked into a defensible record.
            </h2>
            <div className="what-grid">
              <div className="report-checks">
                <ul className="what-list">
                  {sentinelReportItems.map(([title, copy]) => (
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

        <section className="comparison-section">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                align="center"
                eyebrow="sentinel vs once-off"
                title="When Sentinel makes more sense."
                titleMax="36ch"
                ledeMax="64ch"
                lede="If you only ever expect one diagnostic, a once-off Rapid Inspection is the right call. If you want a moving record, reserved capacity and reduced re-check rates, Sentinel does the math."
              />
            </Reveal>
            <div className="compare-table">
              <div className="compare-row compare-row--head">
                <div className="compare-cell compare-cell--label"></div>
                <div className="compare-cell">Rapid Inspection</div>
                <div className="compare-cell compare-cell--ours">Sentinel</div>
              </div>
              {compareRows.map((row) => (
                <div className="compare-row" key={row.label}>
                  <div className="compare-cell compare-cell--label">{row.label}</div>
                  <div className="compare-cell"><CompareCellValue text={row.standard} /></div>
                  <div className="compare-cell compare-cell--ours"><CompareCellValue text={row.sentinel} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonials">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                align="center"
                eyebrow="from members"
                title="Caught early. Fixed small. Stayed dry."
                ledeMax="56ch"
                lede="What members say after a year (or three) on Sentinel."
              />
            </Reveal>
            <div className="testimonial-grid">
              {sentinelTestimonials.map((t) => (
                <Reveal key={t.meta}>
                  <TrustBadge
                    quote={t.quote}
                    meta={t.meta}
                    className="trust-badge--feature"
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="route-page-banner">
          <div className="wrap">
            <FeatureCard
              eyebrow="Start your year"
              title="Two diagnostics, one weekly rate, year after year."
              stats={[
                {
                  figure: "$22.95",
                  label: "Per week — 12-month minimum service term, billed weekly.",
                },
                {
                  figure: "2 / yr",
                  label: "Scheduled diagnostic visits, plus member rates on follow-up re-inspections and lab work.",
                },
              ]}
              primaryCta={{ label: "Join Sentinel", href: "#book" }}
              secondaryCta={{ label: "Compare to Rapid Inspection", href: "#methodology" }}
              footnote="Cancel anytime before your first scheduled inspection — or after your 12-month term."
              image="/images/hero-mould-prevention.jpg"
              imageAlt="Queenslander interior under year-round Sentinel prevention"
            />
          </div>
        </section>

        <section className="faq">
          <div className="wrap">
            <div className="faq-grid">
              <div>
                <span className="eyebrow">[ membership FAQ ]</span>
                <h2 style={{ marginTop: 28 }}>Before you subscribe.</h2>
                <p className="lede" style={{ marginTop: 22 }}>
                  Send a quick note in the booking form if your question isn't here — same-business-day reply.
                </p>
              </div>
              <div>
                <FaqAccordion items={sentinelFaqs} />
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
