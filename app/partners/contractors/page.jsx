import FaqAccordion from "../../../components/FaqAccordion";
import FeatureCard from "../../../components/FeatureCard";
import RouteIntroPage from "../../../components/pages/RouteIntroPage";
import Reveal from "../../../components/Reveal";
import SectionHeader from "../../../components/SectionHeader";
import Timeline from "../../../components/Timeline";

const page = {
  eyebrow: "repair contractors",
  title: "Plan the repair before the home is in pieces.",
  lede:
    "Many remediation scopes remove affected materials but do not rebuild them. Sporetrust helps surface repair needs earlier so the handoff is less chaotic.",
  cards: [
    {
      eyebrow: "Builders",
      title: "Rebuild affected areas.",
      copy:
        "For plaster, framing, flooring, cabinetry and room reinstatement after contaminated material is removed.",
    },
    {
      eyebrow: "Waterproofing",
      title: "Fix wet-area causes.",
      copy:
        "Bathrooms, laundries, balconies and showers often need trade work before mould risk is actually controlled.",
    },
    {
      eyebrow: "Ventilation",
      title: "Reduce recurrence conditions.",
      copy:
        "Fans, airflow, HVAC and condensation control can be the difference between repair and relapse.",
    },
    {
      eyebrow: "Handoff",
      title: "Quote from the same facts.",
      copy:
        "Contractors receive clearer evidence about affected materials, likely cause and urgency before quoting.",
    },
  ],
};

const handoffTimeline = [
  {
    title: "Report in hand.",
    meta: "Day 0",
    copy:
      "You start with the Sporetrust diagnostic — cause, extent, affected materials and defensible repair-cost range — so contractors quote from the same baseline.",
    signals: ["Cause", "Extent", "Cost range"],
  },
  {
    title: "Match to the right trade.",
    meta: "Same week",
    copy:
      "We help surface whether the job needs plastering, flooring, waterproofing, ventilation, plumbing or a builder coordinating all of the above.",
    signals: ["Plaster", "Flooring", "Waterproofing", "Ventilation"],
  },
  {
    title: "Coordinated quoting.",
    meta: "Pre-works",
    copy:
      "Where remediation and repair overlap, we help sequence the work so removal doesn't outpace what's already booked to put the home back together.",
    signals: ["Sequencing", "Scope discipline", "Handoff"],
  },
  {
    title: "Clearance after works.",
    meta: "Post-works",
    copy:
      "Optional return visit for clearance checks and post-remediation cleaning so you have documented evidence that the issue has actually been addressed.",
    signals: ["Clearance check", "Prevention", "Verified"],
  },
];

const contractorFaqs = [
  [
    "Do you do the repair work yourselves?",
    "No. Sporetrust diagnoses, documents and supports the handoff. We do not quote, contract or perform plaster, flooring, cabinetry, plumbing, waterproofing or building work.",
  ],
  [
    "How are partner contractors vetted?",
    "We look for workmanship, scope discipline and willingness to work from evidence. Independence matters — we do not take introduction fees that would compromise the report.",
  ],
  [
    "Can I use my own contractor?",
    "Always. The report is built to be portable — share it with anyone you want quoting the works. Partner introductions are a convenience, not a requirement.",
  ],
  [
    "What if remediation and repair need to happen together?",
    "That's where the handoff matters most. We help surface the full pathway (remediation + repair + clearance) up front so the work can be sequenced sensibly.",
  ],
];

export default function ContractorPartnersPage() {
  return (
    <RouteIntroPage {...page} cards={[]} cta="Book diagnosis">
      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the handoff"
              title="From diagnosis to repair, sequenced."
              lede="Remediation and repair are often different jobs. The Sporetrust report makes both sides quote from the same facts."
              titleMax="32ch"
            />
          </Reveal>
          <Timeline items={handoffTimeline} />
        </div>
      </section>

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Start with the diagnostic"
            title="The report is the brief contractors actually want."
            stats={[
              {
                figure: "Independent",
                label: "Diagnosis stays diagnosis — no remediation or repair revenue to skew the scope.",
              },
              {
                figure: "Defensible",
                label: "Cause, extent, affected materials and cost range, all in one shareable file.",
              },
            ]}
            primaryCta={{ label: "Book diagnosis", href: "#book" }}
            secondaryCta={{ label: "See the report", href: "/#report" }}
            footnote="Brisbane & SEQ · IICRC certified · NATA-accredited lab analysis available."
            image="/images/thermal-imaging.jpg"
            imageAlt="Sporetrust inspector using thermal imaging equipment in a Queenslander interior"
          />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ contractors FAQ ]</span>
              <h2 style={{ marginTop: 28 }}>About the handoff.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                Common questions about how Sporetrust connects diagnostic to repair contractors.
              </p>
            </div>
            <div>
              <FaqAccordion items={contractorFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
