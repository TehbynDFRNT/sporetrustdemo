import FaqAccordion from "../../../components/FaqAccordion";
import FeatureCard from "../../../components/FeatureCard";
import RouteIntroPage from "../../../components/pages/RouteIntroPage";
import Reveal from "../../../components/Reveal";
import SectionHeader from "../../../components/SectionHeader";
import Timeline from "../../../components/Timeline";
import { routePages } from "../../../lib/routePageContent";

const visibleTimeline = [
  {
    title: "Document the visible patch.",
    meta: "On-site · minute 1",
    copy:
      "Photos, location, extent and material assessment of what's currently visible — wall, ceiling, skirting, cabinetry or under-sink.",
    signals: ["Photos", "Extent", "Materials"],
  },
  {
    title: "Find the moisture source.",
    meta: "On-site · minutes 5–15",
    copy:
      "Thermal capture and moisture meter readings around the patch and into adjacent walls reveal the active wetting — leak, condensation, slab moisture or historical event.",
    signals: ["Thermal", "Moisture", "Cause"],
  },
  {
    title: "Map damage beyond the patch.",
    meta: "On-site · minutes 15–30",
    copy:
      "The visible patch is usually the late-stage clue. We document affected materials behind, above and around it — what's salvageable, what needs removal.",
    signals: ["Hidden extent", "Salvageable", "Removal"],
  },
  {
    title: "Defensible cost range.",
    meta: "Within 48 hours",
    copy:
      "Repair-cost bands based on materials affected and current South-East Queensland trade rates — for budgeting, insurance, tribunal or remediation quoting.",
    signals: ["Cost range", "Insurance", "Tribunal"],
  },
];

const visibleFaqs = [
  [
    "Can I just clean it myself?",
    "If the patch is small, surface-level and the moisture cause is identified and stopped, yes. The risk is the patch is the late clue — there's often more contamination behind the wall or in adjacent materials. A diagnostic answers that question before you decide.",
  ],
  [
    "Will the report help my insurance claim?",
    "Yes. Insurers need causation, extent, timing and affected materials documented. The report is built for that handoff with photos, readings and a defensible repair-cost range.",
  ],
  [
    "Do you remove the mould?",
    "No. We diagnose and document. If remediation is needed, we can introduce vetted providers — but our independence is the point. The report comes before the remediation quote.",
  ],
  [
    "How accurate are the cost estimates?",
    "Defensible bands based on current South-East Queensland trade rates, the materials affected and the scope indicated by the diagnosis. They let you budget with confidence and benchmark every quote you receive.",
  ],
];

export default function VisibleMouldPage() {
  return (
    <RouteIntroPage {...routePages.visibleMould} cards={[]} cta="Book a diagnostic">
      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the visible-mould protocol"
              title="What we do once we know mould is present."
              lede="The patch you can see is rarely the whole story. The diagnostic stays the same — the report just leads with cause, extent and what comes next."
              titleMax="32ch"
            />
          </Reveal>
          <Timeline items={visibleTimeline} />
        </div>
      </section>

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Book your diagnostic"
            title="Stop guessing what's behind the wall."
            stats={[
              {
                figure: "$695",
                label: "Standard Diagnostic — 45-minute on-site, 48-hour report. Fixed price, GST inc.",
              },
              {
                figure: "48 hours",
                label: "From on-site visit to plain-English digital report with cause, extent and cost range.",
              },
            ]}
            primaryCta={{ label: "Book inspection", href: "#book" }}
            secondaryCta={{ label: "See the pricing", href: "/#pricing" }}
            footnote="No callout fees · independent of remediation · IICRC certified · NATA-accredited lab analysis available."
            image="/images/thermal-imaging.jpg"
            imageAlt="Sporetrust inspector using thermal imaging equipment in a Queenslander interior"
          />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ visible mould FAQ ]</span>
              <h2 style={{ marginTop: 28 }}>When you can already see it.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                The questions homeowners and tenants ask once visible mould has shown up.
              </p>
            </div>
            <div>
              <FaqAccordion items={visibleFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
