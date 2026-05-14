import FaqAccordion from "../../../components/FaqAccordion";
import FeatureCard from "../../../components/FeatureCard";
import RouteIntroPage from "../../../components/pages/RouteIntroPage";
import Reveal from "../../../components/Reveal";
import SectionHeader from "../../../components/SectionHeader";

const page = {
  eyebrow: "remediation partners",
  title: "Remediation providers who work from evidence.",
  lede:
    "Sporetrust connects customers with remediation providers suited to the report findings, containment needs and clearance expectations.",
  background: "/images/partner-remediation.jpg",
  backgroundAlt:
    "Remediation specialist in Tyvek suit and respirator using a HEPA-vacuumed sander to remove mould from a wall under containment",
  cards: [
    {
      eyebrow: "Containment",
      title: "Control the affected area.",
      copy:
        "Good remediation starts with understanding what is contaminated and how to prevent spread during works.",
    },
    {
      eyebrow: "Removal",
      title: "Remove what cannot be cleaned.",
      copy:
        "Some affected plaster, carpet, cabinetry or ceiling materials need removal before repair can happen.",
    },
    {
      eyebrow: "Cleaning",
      title: "Decontaminate properly.",
      copy:
        "Surface treatment alone is not enough when contaminated material or hidden moisture remains.",
    },
    {
      eyebrow: "Clearance",
      title: "Verify the result.",
      copy:
        "We can return after works to check whether the issue has been addressed and document the result.",
    },
  ],
};

const remediationMethods = [
  {
    num: "R.01",
    tag: "Containment",
    title: "Plastic, negative air, scope discipline",
    image: "/images/sign-water-staining.png",
    imageAlt: "Containment setup before remediation begins",
    measure:
      "Affected area is isolated before disturbance. Negative-air machines, plastic barriers and decontamination zones prevent spores migrating to clean areas.",
    reveals: "Spread risk during works.",
  },
  {
    num: "R.02",
    tag: "Removal",
    title: "Affected materials out",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Affected materials marked for removal during remediation",
    measure:
      "Saturated plaster, carpet, underlay, cabinetry or ceiling material that can't be cleaned gets removed under containment to bagged disposal.",
    reveals: "Salvageable vs replaceable.",
  },
  {
    num: "R.03",
    tag: "Cleaning",
    title: "HEPA + antimicrobial",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Antimicrobial cleaning during a remediation job",
    measure:
      "HEPA vacuuming, wipe-down with appropriate antimicrobial agents and air scrubbing — not just surface fogging.",
    reveals: "Residual contamination.",
  },
  {
    num: "R.04",
    tag: "Clearance",
    title: "Independent verification",
    image: "/images/air-sample.jpg",
    imageAlt: "Air sampling during a clearance check after remediation",
    measure:
      "Sporetrust can return for clearance checks — moisture readings, surface and air sampling — to verify the works met scope.",
    reveals: "Whether the issue is actually addressed.",
  },
];

const remediationFaqs = [
  [
    "Do you do the remediation yourselves?",
    "No. Sporetrust diagnoses, documents and supports the handoff. We do not contract, perform or take a margin on remediation works — that's what keeps the report independent.",
  ],
  [
    "How are partner remediators vetted?",
    "We look for containment discipline, willingness to work from evidence and a track record of passing clearance checks. We do not take introduction fees that would compromise the report.",
  ],
  [
    "Can I use my own remediation provider?",
    "Always. The report is built to be portable — any qualified remediator can quote and work from it. Partner introductions are a convenience.",
  ],
  [
    "What's a clearance check?",
    "A post-remediation visit by Sporetrust to verify the works met scope — moisture readings, surface inspection and optional air sampling. Documents that the issue is actually addressed.",
  ],
];

export default function RemediationPartnersPage() {
  return (
    <RouteIntroPage {...page} cards={[]} cta="Book diagnosis">
      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="what good remediation looks like"
              title="Containment, removal, cleaning, clearance."
              lede="The four-step pattern that separates remediation from surface treatment. Each step has its own evidence trail."
              titleMax="32ch"
            />
          </Reveal>
          <div className="methodology-grid">
            {remediationMethods.map((method) => (
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

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Start with the diagnostic"
            title="The report tells the remediator what the scope should be."
            stats={[
              {
                figure: "Independent",
                label: "Diagnosis comes before the remediation quote — so the scope isn't written by the company selling the work.",
              },
              {
                figure: "Defensible",
                label: "Cause, extent, affected materials, containment needs and clearance expectations, in one shareable file.",
              },
            ]}
            primaryCta={{ label: "Book diagnosis", href: "#book" }}
            secondaryCta={{ label: "See the report", href: "/#report" }}
            footnote="Brisbane & SEQ · IICRC certified · NATA-accredited lab analysis available."
            image="/images/partner-remediation.jpg"
            imageAlt="Remediation specialist removing mould under containment, with HEPA-vacuumed equipment and full PPE"
          />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ remediation FAQ ]</span>
              <h2 style={{ marginTop: 28 }}>About working with remediators.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                Common questions about how Sporetrust connects diagnostic to specialist decontamination teams.
              </p>
            </div>
            <div>
              <FaqAccordion items={remediationFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
