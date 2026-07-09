import Eyebrow from "../../components/Eyebrow";
import FaqAccordion from "../../components/FaqAccordion";
import FeatureCard from "../../components/FeatureCard";
import RouteIntroPage from "../../components/pages/RouteIntroPage";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import Timeline from "../../components/Timeline";
import ArrowIcon from "../../components/icons/ArrowIcon";
import { routePages } from "../../lib/routePageContent";

const realCauseCards = [
  {
    num: "C.01",
    tag: "Moisture",
    title: "Mould starts with moisture, not black spots.",
    copy: "Damp beats visible spotting as a predictor of moderate to severe contamination. Sporetrust measures the moisture you can, and can't see.",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal imaging revealing hidden moisture inside a wall cavity",
  },
  {
    num: "C.02",
    tag: "Hidden damp",
    title: "Visible mould is only part of the problem.",
    copy: "Most homes silently accumulate damp and moisture in wall cavities where mould grows unchecked. Minor pipe and roof leaks don't always cause a dripping ceiling — instead, your home absorbs damage like a sponge for months before it's detectable.",
    image: "/images/sign-water-staining.png",
    imageAlt: "Subtle water staining hinting at deeper hidden moisture damage",
  },
  {
    num: "C.03",
    tag: "Airborne",
    title: "Patches show where airborne spores find a home.",
    copy: "Mould exposure health risks aren't caused by bathroom spotting. Even spotless homes can show highly elevated spore counts. It's the mould we breathe in that becomes the real risk to your home and family.",
    image: "/images/air-sample.jpg",
    imageAlt: "Air sampling cassette used to capture mould spores",
  },
  {
    num: "C.04",
    tag: "Prevalence",
    title: "1 in 2 homes have mould or damp. Less than 3% test for it.",
    copy: "Mould is 25× more likely to impact your home this year than termites or pests. We regularly check homes for mites and insects, while the most costly building defect goes unseen until it's too late.",
    image: "/images/hero-queenslander.jpg",
    imageAlt: "Typical Queenslander home representative of the housing stock affected",
  },
];

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
      <section className="signs-section signs-section--why">
        <div className="wrap">
          <div className="signs-grid signs-grid--mirror">
            <div className="signs-grid__cards">
              {realCauseCards.map((card) => (
                <article className="method signs-card" key={card.num}>
                  <figure className="method-media">
                    <img src={card.image} alt={card.imageAlt} loading="lazy" />
                  </figure>
                  <div className="method-meta">
                    <span className="num">{card.num}</span>
                    <span className="tag">{card.tag}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="m-measure">{card.copy}</p>
                </article>
              ))}
            </div>
            <div className="signs-grid__copy">
              <Reveal>
                <SectionHeader
                  eyebrow="the cause"
                  title="The real cause of household mould."
                  lede="Visible mould is the symptom. These are the failure modes underneath — what we actually look for, and what most inspections miss."
                />
              </Reveal>
              <a className="btn" href="#book">
                Book a diagnostic <ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

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

      <section className="honesty-section">
        <div className="wrap">
          <div className="honesty-section__grid">
            <div className="honesty-section__copy">
              <Reveal>
                <Eyebrow>our mission</Eyebrow>
                <h2 className="honesty-section__title">Independent analysis, honest reporting.</h2>
                <p className="lede honesty-section__lede">
                  When mould shows up, the instinct is to call the company that removes it. But the company quoting the cleanup is also the one writing the scope — bigger problem, bigger scope, bigger invoice.
                </p>
                <p className="honesty-section__body">
                  Sporetrust took the opposite position. Zero revenue from remediation, repair, fogging or treatment. We diagnose the mould you can see, document everything you can't, and step back when the works begin. The report comes before the remediation quote — and benchmarks every one that follows.
                </p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <ul className="credential-stack" role="list">
                <li className="credential-card">
                  <span className="credential-card__logo">
                    <img src="/logos/iicrc-dark.png" alt="" loading="lazy" />
                  </span>
                  <div className="credential-card__body">
                    <span className="credential-card__label">IICRC Certified</span>
                    <span className="credential-card__sublabel">
                      Institute of Inspection, Cleaning and Restoration Certification
                    </span>
                    <p className="credential-card__desc">
                      The international technical body for moisture, mould and water-damage work. Our diagnostic scope matches the IICRC S520 inspection standard — the same playbook used by accredited inspectors worldwide.
                    </p>
                  </div>
                </li>
                <li className="credential-card">
                  <span className="credential-card__logo">
                    {/* No AIHA asset on hand — neutral ISO/IEC 17025 mark instead of the wrong emblem. */}
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
                      <text x="24" y="21" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600" fill="currentColor">ISO</text>
                      <text x="24" y="33" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="currentColor">17025</text>
                    </svg>
                  </span>
                  <div className="credential-card__body">
                    <span className="credential-card__label">AIHA-Accredited Lab Analysis</span>
                    <span className="credential-card__sublabel">
                      AIHA-LAP accredited · ISO/IEC 17025
                    </span>
                    <p className="credential-card__desc">
                      Air and surface samples go to an AIHA-accredited lab under ISO/IEC 17025 — spore counts and certificates in the format tribunals and insurers already accept.
                    </p>
                  </div>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Book your diagnostic"
            title="Stop guessing what's behind the wall."
            stats={[
              {
                figure: "$995",
                label: "Lab-Backed Diagnostic — 45-minute on-site, 48-hour report. One fixed price, GST inc.",
              },
              {
                figure: "48 hours",
                label: "From on-site visit to plain-English digital report with cause, extent and cost range.",
              },
            ]}
            primaryCta={{ label: "Book inspection", href: "#book" }}
            secondaryCta={{ label: "See the pricing", href: "/#pricing" }}
            footnote="No callout fees · independent of remediation · IICRC certified · AIHA-accredited lab analysis (ISO/IEC 17025) available."
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
