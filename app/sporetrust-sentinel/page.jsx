import FaqAccordion from "../../components/FaqAccordion";
import RouteIntroPage from "../../components/pages/RouteIntroPage";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import SentinelCard from "../../components/SentinelCard";
import StatRow from "../../components/StatRow";
import Timeline from "../../components/Timeline";
import { routePages } from "../../lib/routePageContent";

const sentinelStats = [
  {
    tag: "Cadence",
    figure: "1 / year",
    label: "One on-site inspection annually — same protocol, fresh evidence, year after year.",
    source: "Sentinel membership",
    diagram: "clock",
    diagramProps: { minutes: 12, max: 12 },
  },
  {
    tag: "Tracking",
    figure: "Year-on-year",
    label: "Reports stack so you can see what changed, what improved and what's drifting.",
    source: "Member portal",
    diagram: "report",
    diagramProps: { hours: 48 },
  },
  {
    tag: "Member rate",
    figure: "Discounted",
    label: "Re-inspections, lab-backed air sampling and post-remediation clearance — when you need them.",
    source: "Add-on pricing",
    diagram: "donut",
    diagramProps: { percent: 100 },
  },
];

const sentinelTimeline = [
  {
    title: "Baseline visit.",
    meta: "Year 0",
    copy:
      "Your first Sporetrust diagnostic establishes the baseline — moisture map, humidity profile, materials at risk, anything visible or hidden right now.",
    signals: ["Thermal", "Moisture", "Humidity", "Air sampler"],
  },
  {
    title: "First Sentinel cycle.",
    meta: "Year 1",
    copy:
      "Annual on-site inspection. Compare every reading against your baseline. Catch the conditions that are drifting before they cost.",
    signals: ["Year-on-year", "Trend tracking", "Fresh report"],
  },
  {
    title: "Compounding evidence.",
    meta: "Year 2 +",
    copy:
      "Three years of consistent records becomes a different kind of asset for insurers, tribunal disputes, future buyers and your own peace of mind.",
    signals: ["Compounded evidence", "Member rates", "Priority booking"],
  },
];

const sentinelFaqs = [
  [
    "Can I cancel anytime?",
    "Yes. Sentinel is a month-to-month membership — pause or cancel from your portal at any time. You keep all reports from inspections completed during the membership.",
  ],
  [
    "Does the annual inspection cover the whole home?",
    "Yes. Same protocol as a Standard Diagnostic — thermal, moisture, humidity and ventilation across the home, plus the rooms you flag at re-engagement.",
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
    <RouteIntroPage {...routePages.sentinel} cards={[]} cta="Ask about Sentinel">
      <section className="pricing">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the membership"
              title="One inspection a year. One running record."
              lede="Industry-first annual mould prevention and pre-contamination diagnostics subscription — at the price of a streaming service."
            />
          </Reveal>
          <SentinelCard />
        </div>
      </section>

      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="what you get"
              title="The compounding value of consistent records."
              ledeMax="58ch"
              lede="Sentinel is built around a simple idea: the second inspection is worth more than the first, because now you have something to compare it to."
            />
          </Reveal>
          <Reveal delay={120}>
            <StatRow stats={sentinelStats} />
          </Reveal>
        </div>
      </section>

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the annual cycle"
              title="From baseline to compounding evidence."
              lede="Every Sentinel year builds on the last. Three years in, you don't just have a current report — you have a record."
              titleMax="32ch"
            />
          </Reveal>
          <Timeline items={sentinelTimeline} />
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
    </RouteIntroPage>
  );
}
