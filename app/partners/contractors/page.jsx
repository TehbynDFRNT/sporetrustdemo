import Eyebrow from "../../../components/Eyebrow";
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
  background: "/images/partner-repair.jpg",
  backgroundAlt:
    "Vetted repair contractor patching prepared drywall in a daylit Australian home interior",
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

const contractorTrades = [
  {
    num: "T.01",
    tag: "Plumbing",
    title: "Plumbing and pipework repair",
    image: "/images/partner-plumber.jpg",
    imageAlt: "Plumber replacing copper pipework inside an opened wall cavity behind a vanity",
    copy: "Burst pipes, slow leaks, failed connections and slab-edge plumbing failures — replaced and pressure-tested before the wall closes back up.",
    foot: "Walls, slab, wet areas",
  },
  {
    num: "T.02",
    tag: "Roofing",
    title: "Roof and flashing repair",
    image: "/images/partner-roofer.jpg",
    imageAlt: "Roofer re-sealing a roof penetration on a colorbond metal roof",
    copy: "Failed flashings, displaced tiles, ageing penetrations and box-gutter overflow — fixed at the entry point so the next storm doesn't put it back.",
    foot: "Flashings, penetrations, gutters",
  },
  {
    num: "T.03",
    tag: "Carpentry",
    title: "Framing and structural carpentry",
    image: "/images/partner-carpenter.jpg",
    imageAlt: "Carpenter installing replacement ceiling joists in an opened ceiling cavity",
    copy: "Ceiling joists, wall framing, subfloor bearers and timber substrate replaced where structural members were damaged by prolonged wetting.",
    foot: "Joists, framing, subfloor",
  },
  {
    num: "T.04",
    tag: "Glazing",
    title: "Window and glazing replacement",
    image: "/images/partner-glazier.jpg",
    imageAlt: "Glazier carrying a glass panel into a window frame for replacement",
    copy: "Failed window flashings, broken seals and rotted timber frames addressed — including reglaze and reframe where moisture damage took the joinery.",
    foot: "Windows, frames, seals",
  },
  {
    num: "T.05",
    tag: "Plastering",
    title: "Plastering and finishes",
    image: "/images/partner-painter.jpg",
    imageAlt: "Painter applying primer over patched and set plasterboard joins after remediation",
    copy: "Plasterboard patching, joint setting, sealer and finish coats over remediated walls and ceilings — so the room reads finished, not just repaired.",
    foot: "Plaster, paint, finishes",
  },
];

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
          <div className="find-head">
            <div className="copy">
              <span className="eyebrow">[ the trades we coordinate ]</span>
              <h2>The repair trades who put the home back together.</h2>
              <p className="lede">
                Once remediation is done, the home needs rebuilding. Our vetted trade network covers the full set of repair specialists — quoting from the same diagnostic, sequenced so works don't double up or miss scope.
              </p>
            </div>
          </div>
          <div className="find-grid" aria-label="Repair trades coordinated through partners">
            {contractorTrades.map((trade) => (
              <div key={trade.num} className="find-card">
                <div className="find-meta">
                  <span className="num">{trade.num}</span>
                  <span className="tag">{trade.tag}</span>
                </div>
                <figure className="find-card-media">
                  <img src={trade.image} alt={trade.imageAlt} loading="lazy" />
                </figure>
                <h3>{trade.title}</h3>
                <p>{trade.copy}</p>
                <div className="find-foot">
                  <span className="l">Covers</span>
                  <span className="r">{trade.foot}</span>
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
              eyebrow="the handoff"
              title="From diagnosis to repair, sequenced."
              lede="Remediation and repair are often different jobs. The Sporetrust report makes both sides quote from the same facts."
              titleMax="32ch"
            />
          </Reveal>
          <Timeline items={handoffTimeline} />
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
                  Anyone can recommend a contractor. The work is in checking — verified customer feedback, history in the industry, and the willingness to quote from evidence rather than over it.
                </p>
                <p className="honesty-section__body">
                  The pledge against ourselves: Sporetrust doesn't sell remediation, repairs or treatment. The diagnostic stays diagnostic, the report is yours, and the trade you choose works from the same evidence — Sporetrust-vetted or not.
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
            footnote="Brisbane & SEQ · IICRC certified · AIHA-accredited lab analysis (ISO/IEC 17025) available."
            image="/images/partner-repair.jpg"
            imageAlt="Vetted repair contractor finishing prepared drywall after remediation"
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
