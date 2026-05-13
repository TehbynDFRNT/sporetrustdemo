import FaqAccordion from "../../components/FaqAccordion";
import FeatureCard from "../../components/FeatureCard";
import RouteIntroPage from "../../components/pages/RouteIntroPage";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import StatRow from "../../components/StatRow";
import TrustBadge from "../../components/TrustBadge";
import { routePages } from "../../lib/routePageContent";

const independenceStats = [
  {
    tag: "Conflict-free",
    figure: "0%",
    label: "Revenue from remediation, fogging, treatments or repairs. The report is the product.",
    source: "Sporetrust business model",
    diagram: "donut",
    diagramProps: { percent: 0 },
  },
  {
    tag: "Accreditation",
    figure: "IICRC + NATA",
    label: "Institute of Inspection, Cleaning and Restoration certified. NATA-accredited lab analysis available.",
    source: "Industry accreditation",
    diagram: "report",
    diagramProps: { hours: 48 },
  },
  {
    tag: "Turnaround",
    figure: "48 hours",
    label: "From on-site visit to plain-English digital report with cause, extent and defensible cost range.",
    source: "Standard SLA",
    diagram: "clock",
    diagramProps: { minutes: 48, max: 72 },
  },
];

const testimonials = [
  {
    quote:
      "The report turned a messy back-and-forth into a document everyone could respond to.",
    meta: "Tenant repair request",
  },
  {
    quote:
      "We knew what was actually wet, what was likely damaged and where to spend money first.",
    meta: "Homeowner insurance pathway",
  },
  {
    quote:
      "It gave both sides the same facts before contractors started quoting the fix.",
    meta: "Manager handover record",
  },
];

const whyFaqs = [
  [
    "Are you a remediation company?",
    "No. We inspect, document and report. If remediation or building work is needed, we can point you toward vetted providers with the right speciality, but we do not clip the ticket on the cleanup.",
  ],
  [
    "Why not call a remediation company first?",
    "Some remediation providers are excellent. Others overscope, underscope or sell surface treatments that miss the moisture source. There is no single mould-remediation licence that guarantees the scope is right, so diagnosis should come before the quote.",
  ],
  [
    "How accurate are your repair cost estimates?",
    "Our cost ranges are defensible bands based on current South-East Queensland trade rates, the materials affected and the scope indicated by the diagnosis. They let you budget with confidence and benchmark every quote you receive.",
  ],
  [
    "What if you don't find anything serious?",
    "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer.",
  ],
];

export default function WhySporetrustPage() {
  return (
    <RouteIntroPage {...routePages.whySporetrust} cards={[]} cta="Book a diagnostic">
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="independent by design"
              title="The numbers that keep us honest."
              ledeMax="58ch"
              lede="Sporetrust is built so the report comes before the remediation quote — not the other way around. Here's what that looks like in practice."
            />
          </Reveal>
          <Reveal delay={120}>
            <StatRow stats={independenceStats} />
          </Reveal>
        </div>
      </section>

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Independent by design"
            title="The report is the product."
            stats={[
              {
                figure: "Independent",
                label: "No remediation, fogging, treatments or repair revenue. Diagnosis stays diagnosis.",
              },
              {
                figure: "Evidence-led",
                label: "Thermal, moisture, humidity and lab analysis — the same protocol regardless of who's reading.",
              },
            ]}
            primaryCta={{ label: "Book a diagnostic", href: "#book" }}
            secondaryCta={{ label: "How it works", href: "/how-it-works" }}
            footnote="Brisbane & South-East Queensland · IICRC certified · NATA-accredited lab analysis."
            image="/images/thermal-imaging.jpg"
            imageAlt="Sporetrust inspector using thermal imaging equipment in a Queenslander interior"
          />
        </div>
      </section>

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="from the file"
              title="What people use the report for."
              ledeMax="54ch"
              lede="The same protocol gets used very differently depending on who needs the evidence next."
            />
          </Reveal>
          <div className="why-trust-row">
            {testimonials.map((item) => (
              <TrustBadge key={item.meta} quote={item.quote} meta={item.meta} />
            ))}
          </div>
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ common questions ]</span>
              <h2 style={{ marginTop: 28 }}>How we think about independence.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                The questions people ask when they're deciding whether to use a diagnostic that doesn't sell the fix.
              </p>
            </div>
            <div>
              <FaqAccordion items={whyFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
