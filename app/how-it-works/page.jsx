import BookingTakeover from "../../components/BookingTakeover";
import FaqAccordion from "../../components/FaqAccordion";
import Footer from "../../components/Footer";
import MegaNav from "../../components/MegaNav";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import SentinelCard from "../../components/SentinelCard";
import StatRow from "../../components/StatRow";
import Timeline from "../../components/Timeline";
import UtilityBanner from "../../components/UtilityBanner";

const audiencePanels = [
  {
    id: "homeowners",
    label: "Homeowner",
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
    id: "tenants",
    label: "Tenant",
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
    id: "managers",
    label: "Building Manager",
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

const engagementStats = [
  {
    tag: "Prevalence",
    figure: "1 in 2",
    label: "Queensland homes show signs of dampness or mould within any 12-month window.",
    source: "ABS / AIHW housing data",
    diagram: "donut",
    diagramProps: { percent: 50 },
  },
  {
    tag: "On-site",
    figure: "45 minutes",
    label: "One technician visit covers thermal, moisture, humidity and ventilation across the home.",
    source: "Per Sporetrust diagnostic protocol",
    diagram: "clock",
    diagramProps: { minutes: 45, max: 60 },
  },
  {
    tag: "Turnaround",
    figure: "48 hours",
    label: "Plain-English digital report with cause, extent, evidence and a defensible repair-cost range.",
    source: "Standard diagnostic SLA",
    diagram: "report",
    diagramProps: { hours: 48 },
  },
];

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

const faqs = [
  [
    "How long does the on-site assessment take?",
    "Most homes take around 45 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Standard Diagnostic reports are delivered to your portal within 48 hours of the on-site visit. Lab-Backed addendums arrive 5-7 days after sampling, depending on lab turnaround.",
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
  return (
    <>
      <UtilityBanner />
      <MegaNav />
      <main>
        <section className="route-page-hero problem-bg">
          <div className="wrap route-page-hero-inner">
            <Reveal>
              <SectionHeader
                eyebrow="how sporetrust works"
                title="The same diagnostic, different evidence needs."
                lede="Tenants, homeowners and property managers all use the same Sporetrust protocol — but the report meets different ends. Pick where you sit."
                ledeMax="68ch"
              />
            </Reveal>

            <div className="audience-tabs" aria-label="Evidence pathways by customer type">
              {audiencePanels.map((panel, index) => (
                <input
                  key={panel.id}
                  className="audience-toggle"
                  type="radio"
                  name="audience-howitworks"
                  id={`hiw-audience-${panel.id}`}
                  defaultChecked={index === 0}
                />
              ))}
              <div className="audience-tab-list" role="tablist" aria-label="Customer type">
                {audiencePanels.map((panel) => (
                  <label key={panel.id} htmlFor={`hiw-audience-${panel.id}`}>
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

        <section className="solution">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="the diagnostic"
                title="Four steps to a definitive answer."
                lede="From the moment you book, you'll know what's coming, when it lands and what it costs. No upsell, no callout fees, no quote pressure."
                titleMax="28ch"
              />
            </Reveal>
            <Timeline items={timelineItems} />
          </div>
        </section>

        <section className="stat-section">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="by the numbers"
                title="What the engagement looks like."
                ledeMax="58ch"
                lede="One technician, one visit, one report. The shape of the work doesn't change — it just gets more thorough where the evidence demands it."
              />
            </Reveal>
            <Reveal delay={120}>
              <StatRow stats={engagementStats} />
            </Reveal>
          </div>
        </section>

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
          </div>
        </section>

        <section className="pricing">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                eyebrow="ongoing protection"
                title="Make it annual with Sentinel."
                lede="Once you've had your first diagnostic, Sentinel keeps the answer current — one inspection a year, year-on-year tracking, and the team you already trust on speed dial."
              />
            </Reveal>
            <SentinelCard />
          </div>
        </section>

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
    </>
  );
}
