import FaqAccordion from "../../components/FaqAccordion";
import RouteIntroPage from "../../components/pages/RouteIntroPage";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import StatRow from "../../components/StatRow";
import Timeline from "../../components/Timeline";
import { routePages } from "../../lib/routePageContent";

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

const diagnosticFaqs = [
  [
    "How do I know which pathway is right for me?",
    "Use the three situations on this page as a starting point: I have mould already, I suspect mould, or I want prevention. The on-site protocol is the same — what the report focuses on differs.",
  ],
  [
    "How long does the on-site assessment take?",
    "Most homes take around 45 minutes. Larger homes, multiple buildings or sites with complex history can take longer. We'll let you know in advance once we've reviewed your booking notes.",
  ],
  [
    "When do I get the report?",
    "Standard Diagnostic reports are delivered to your portal within 48 hours of the on-site visit. Lab-Backed addendums arrive 5-7 days after sampling, depending on lab turnaround.",
  ],
  [
    "Do I need lab-backed sampling?",
    "Only when the situation calls for it — insurance disputes, recurring contamination, tribunal-ready evidence. For most prevention or repair-pathway needs, the Standard Diagnostic is enough.",
  ],
];

export default function DiagnosingMouldPage() {
  return (
    <RouteIntroPage {...routePages.diagnosingMould} cards={[]} cta="Book a diagnostic">
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

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the protocol"
              title="Four steps to a definitive answer."
              lede="The same diagnostic protocol regardless of which situation you're in. The report just emphasises different things."
              titleMax="28ch"
            />
          </Reveal>
          <Timeline items={timelineItems} />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ common questions ]</span>
              <h2 style={{ marginTop: 28 }}>About the diagnostic.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                If you're not sure which situation applies, send a quick note in the booking form and we'll point you to the right starting page.
              </p>
            </div>
            <div>
              <FaqAccordion items={diagnosticFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
