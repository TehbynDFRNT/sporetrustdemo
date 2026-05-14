import Eyebrow from "../../../components/Eyebrow";
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

const partnerServices = [
  {
    num: "W.01",
    tag: "Surface",
    title: "HEPA-vacuumed decontamination",
    image: "/images/partner-remediation.jpg",
    imageAlt: "Remediation specialist in PPE using a HEPA-vacuumed sander to clean a mould-affected wall under containment",
    copy: "Sealed containment plus HEPA-vacuumed sanding for affected plaster, drywall and surface materials — so the mould comes off the wall, not into the rest of the home.",
    foot: "Plaster, drywall, finishes",
  },
  {
    num: "W.02",
    tag: "Structural",
    title: "Tear-down and material removal",
    image: "/images/partner-teardown.jpg",
    imageAlt: "Tradie removing damaged batt insulation from an opened ceiling cavity",
    copy: "Ceiling cavities, batt insulation, cabinetry and substrate removed where materials can't be salvaged. Documented disposal under containment.",
    foot: "Ceiling, insulation, substrate",
  },
  {
    num: "W.03",
    tag: "Soft furnishings",
    title: "Carpet and upholstery cleaning",
    image: "/images/partner-carpet.jpg",
    imageAlt: "Operator using a hot-water extraction wand on a residential carpet",
    copy: "Hot-water extraction and antimicrobial treatment for carpet, underlay, upholstery and curtains exposed to moisture or elevated spore load.",
    foot: "Carpet, upholstery, fabric",
  },
  {
    num: "W.04",
    tag: "Fumigation",
    title: "Fumigation and surface treatment",
    image: "/images/partner-fumigation.jpg",
    imageAlt: "Operator in respirator and PPE applying antimicrobial fumigation along a wall skirting",
    copy: "Antimicrobial fogging and surface application for non-porous areas and post-remediation finishing — coordinated through vetted operators with the right PPE and chemistry.",
    foot: "Non-porous, post-works",
  },
  {
    num: "W.05",
    tag: "HVAC",
    title: "Split-system and AC deep clean",
    image: "/images/partner-aircon.jpg",
    imageAlt: "HVAC technician deep-cleaning a split-system air conditioner with a catch-bib and pressure wand",
    copy: "Coil, fan barrel, drip tray and drain line decontamination on split-systems and ducted units — the silent spore reservoirs every contaminated home seems to have.",
    foot: "Split-system, ducted units",
  },
];

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
          <div className="find-head">
            <div className="copy">
              <span className="eyebrow">[ the partner network ]</span>
              <h2>Specialists for what the report actually found.</h2>
              <p className="lede">
                Different damage patterns need different specialists. Our vetted network covers the full range — so the work matches what the diagnostic showed, not a one-size-fits-all quote.
              </p>
            </div>
          </div>
          <div className="find-grid" aria-label="Remediation services organised through partners">
            {partnerServices.map((service) => (
              <div key={service.num} className="find-card">
                <div className="find-meta">
                  <span className="num">{service.num}</span>
                  <span className="tag">{service.tag}</span>
                </div>
                <figure className="find-card-media">
                  <img src={service.image} alt={service.imageAlt} loading="lazy" />
                </figure>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <div className="find-foot">
                  <span className="l">Used on</span>
                  <span className="r">{service.foot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="honesty-section">
        <div className="wrap">
          <div className="honesty-section__grid">
            <div className="honesty-section__copy">
              <Reveal>
                <Eyebrow>how we vet</Eyebrow>
                <h2 className="honesty-section__title">A vetted network, not a referral list.</h2>
                <p className="lede honesty-section__lede">
                  Anyone can recommend a remediator. The work is in checking — verified customer feedback, history in the industry, and the willingness to quote from evidence rather than over it.
                </p>
                <p className="honesty-section__body">
                  The pledge against ourselves: Sporetrust doesn't sell remediation, repairs or treatment. The diagnostic stays diagnostic, the report is yours, and the partner you choose works from the same evidence — Sporetrust-vetted or not.
                </p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <ul className="partner-badge-grid" role="list">
                <li className="partner-badge">
                  <span className="partner-badge__icon" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M24 6L10 12v12c0 8 5.6 14 14 16 8.4-2 14-8 14-16V12L24 6z" />
                      <path d="M17.5 24.5l4.5 4.5 9-9" />
                    </svg>
                  </span>
                  <span className="partner-badge__label">Sporetrust Verified Partner</span>
                  <span className="partner-badge__sublabel">Vetted by customer feedback and track record</span>
                  <p className="partner-badge__desc">
                    Every partner is reviewed on what actually matters — verified customer feedback from past Sporetrust jobs, plus their history in the industry. Reviewed regularly. Removed if standards drift.
                  </p>
                </li>
                <li className="partner-badge">
                  <span className="partner-badge__icon" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M24 8v32" />
                      <path d="M14 40h20" />
                      <path d="M9 14h30" />
                      <path d="M14 14l-5 12c2.5 2 7.5 2 10 0L14 14z" />
                      <path d="M34 14l-5 12c2.5 2 7.5 2 10 0L34 14z" />
                    </svg>
                  </span>
                  <span className="partner-badge__label">Independence Pledge</span>
                  <span className="partner-badge__sublabel">We don't sell the work</span>
                  <p className="partner-badge__desc">
                    Sporetrust doesn't sell remediation, repairs or treatment. The diagnostic stays diagnostic. The report is portable — hand it to a Sporetrust partner, or any qualified trade you already trust.
                  </p>
                </li>
              </ul>
            </Reveal>
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
