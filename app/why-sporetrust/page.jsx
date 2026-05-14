// UtilityBanner, MegaNav, Footer, and the takeovers live in app/layout.jsx now.
import FaqAccordion from "../../components/FaqAccordion";
import QuizCtaBanner from "../../components/QuizCtaBanner";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import WhySporetrustHero from "../../components/WhySporetrustHero";
import ArrowIcon from "../../components/icons/ArrowIcon";
import Eyebrow from "../../components/Eyebrow";

function ThermalGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 14V5a2 2 0 0 0-4 0v9a3.5 3.5 0 1 0 4 0Z" />
      <path d="M12 9v6.5" />
    </svg>
  );
}

function MoistureGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2c3.5 4.1 6 7.2 6 10.3a6 6 0 0 1-12 0c0-3.1 2.5-6.2 6-10.3Z" />
      <path d="M9 13.5a3 3 0 0 0 3 3" />
    </svg>
  );
}

function HumidityGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 11c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <circle cx="8" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LabGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6" />
      <path d="M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3" />
      <path d="M7.5 14h9" />
    </svg>
  );
}

const diagnosisPillars = [
  {
    key: "thermal",
    tag: "Thermal",
    desc: "Surface-temperature differentials surface hidden moisture, cold bridges and leak paths.",
    Glyph: ThermalGlyph,
  },
  {
    key: "moisture",
    tag: "Moisture",
    desc: "Pin and pinless readings across timber, gypsum, masonry, tile and skirting cavities.",
    Glyph: MoistureGlyph,
  },
  {
    key: "humidity",
    tag: "Humidity",
    desc: "Continuous on-site hygrometer logging — dew-point risk and ventilation load.",
    Glyph: HumidityGlyph,
  },
  {
    key: "lab",
    tag: "Lab",
    desc: "Optional NATA-accredited sampling for claim- and tribunal-ready evidence.",
    Glyph: LabGlyph,
  },
];

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

const diyMisconceptions = [
  {
    num: "D.01",
    tag: "Bleach",
    title: "Spray and pray.",
    measure: "Bleach clears what you see. On tile or grout, it works.",
    but: "If moisture's still feeding it, the patch returns within weeks.",
  },
  {
    num: "D.02",
    tag: "Laundry",
    title: "Wash, soak, repeat.",
    measure: "Hot wash, vinegar soak and sun-drying do rescue spotted clothes, hopefully.",
    but: "The spores came from somewhere. Fresh laundry keeps spotting.",
  },
  {
    num: "D.03",
    tag: "Airflow",
    title: "Crack a window.",
    measure: "Cross-flow ventilation lowers indoor humidity. It's worth doing.",
    but: "You can't ventilate a wall cavity, or an AC compressor leaking behind the unit.",
  },
];

const blameRows = [
  {
    pair: "Tenant ↔ Landlord",
    noise: "Did you ventilate properly?",
    signal: "We can help show if mould is structural, and who's responsible for returning your home to a liveable standard.",
  },
  {
    pair: "Homeowner ↔ Insurer",
    noise: "Was this caused by lack of maintenance?",
    signal: "We can help establish the cause and timeline of damage — defensible evidence for the insurance pathway.",
  },
  {
    pair: "Homeowner ↔ Themselves",
    noise: "Did we do something wrong?",
    signal: "Mould is a building defect, not a hygiene failure. We can help find the source of elevated spore count and prevent long-term damage to your home.",
  },
];

const diagnosticPathways = [
  {
    href: "/visible-mould",
    title: "I have mould already",
    desc: "Document cause, extent and a defensible cost range.",
  },
  {
    href: "/suspected-mould",
    title: "I suspect mould",
    desc: "Thermal, moisture and optional air sampling for what's behind the surface.",
  },
  {
    href: "/mould-prevention",
    title: "Mould prevention",
    desc: "Humidity, ventilation and earlier detection through Sentinel.",
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
    <main>
        <WhySporetrustHero />

        <section className="diagnosis-ground">
          <div className="wrap">
            <div className="diagnosis-ground__grid">
              <div className="diagnosis-ground__copy">
                <Reveal>
                  <Eyebrow>where it starts</Eyebrow>
                  <h2 className="diagnosis-ground__title">It starts with better diagnosis.</h2>
                  <p className="diagnosis-ground__lede lede">
                    Year-round monitoring, lab-backed reporting and a vetted remediation pathway only work if what's underneath is rigorous. We run the same four-layer protocol on every home — regardless of what the symptoms look like or who's reading the report.
                  </p>
                  <a className="diagnosis-ground__link" href="/how-it-works">
                    See the full protocol
                    <ArrowIcon />
                  </a>
                </Reveal>
              </div>
              <Reveal delay={120}>
                <ul className="diagnosis-ground__tiles" role="list">
                  {diagnosisPillars.map(({ key, tag, desc, Glyph }) => (
                    <li className="diagnosis-tile" key={key}>
                      <span className="diagnosis-tile__glyph" aria-hidden="true">
                        <Glyph />
                      </span>
                      <span className="diagnosis-tile__tag">{tag}</span>
                      <span className="diagnosis-tile__desc">{desc}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="honesty-section">
          <div className="wrap">
            <div className="honesty-section__grid">
              <div className="honesty-section__copy">
                <Reveal>
                  <Eyebrow>our mission</Eyebrow>
                  <h2 className="honesty-section__title">Independence and honesty is our mission.</h2>
                  <p className="lede honesty-section__lede">
                    The mould inspection industry typically runs on remediation revenue — the company quoting the inspection often quotes the cleanup. Scope grows.
                  </p>
                  <p className="honesty-section__body">
                    Sporetrust took the opposite position. Zero revenue from remediation, repair, fogging or treatment work. We charge for the diagnostic, deliver the evidence, and step back when the works begin. What's in the report is what we found — not what we're trying to sell next.
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
                      <img src="/logos/nata-dark.png" alt="" loading="lazy" />
                    </span>
                    <div className="credential-card__body">
                      <span className="credential-card__label">NATA-Accredited Lab Analysis</span>
                      <span className="credential-card__sublabel">
                        National Association of Testing Authorities, Australia
                      </span>
                      <p className="credential-card__desc">
                        Air samples and surface tape lifts go to a NATA-accredited lab. Spore counts, species identification and certificates of analysis meet the standard insurers, tribunals and courts already use.
                      </p>
                    </div>
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="blame-section">
          <div className="wrap">
            <div className="blame-section__grid">
              <div className="blame-section__copy">
                <Reveal>
                  <Eyebrow>for everyone involved</Eyebrow>
                  <h2 className="blame-section__title">An end to the blame game.</h2>
                  <p className="lede blame-section__lede">
                    Mould becomes a tussle. Landlords ask if tenants ventilated. Insurers ask if you maintained the home. Owners blame themselves for not catching it sooner. Nobody learns anything, the moisture keeps going, and the bill compounds.
                  </p>
                  <p className="blame-section__body">
                    Sporetrust steps in as the neutral party with one job — find what's there, document what caused it, and write down what comes next. The report reads the same whether you're a tenant, a landlord, an owner, a building manager or an insurer.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={120}>
                <ul className="blame-stack" role="list">
                  {blameRows.map((row) => (
                    <li className="blame-card" key={row.pair}>
                      <span className="blame-card__pair">{row.pair}</span>
                      <p className="blame-card__noise">
                        <svg className="compare-icon compare-icon--x" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M4 4 L12 12 M12 4 L4 12" />
                        </svg>
                        <em>&ldquo;{row.noise}&rdquo;</em>
                      </p>
                      <p className="blame-card__signal">
                        <svg className="compare-icon compare-icon--check" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                        </svg>
                        <span>{row.signal}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

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

        <section className="diy-section diy-section--why">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                align="center"
                eyebrow="the reframe"
                title="Mould is not a hygiene problem."
                lede="Pests happen to the house. Burst pipes happen to the house. Mould is a plumbing, waterproofing, or ventilation failure that hasn't surfaced yet. Not your guilty reminder."
                ledeMax="60ch"
              />
            </Reveal>
            <div className="methodology-grid diy-grid">
              {diyMisconceptions.map((card) => (
                <article className="method method--text" key={card.num}>
                  <div className="method-meta">
                    <span className="num">{card.num}</span>
                    <span className="tag">{card.tag}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="m-measure">{card.measure}</p>
                  <div className="m-divider" />
                  <p className="m-reveals">
                    <strong>But</strong>
                    {card.but}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="diagnostics-lead" id="diagnostics">
          <div className="wrap">
            <div className="diagnostics-lead__grid">
              <div className="diagnostics-lead__main">
                <Reveal>
                  <SectionHeader
                    eyebrow="choose your pathway"
                    title="Mould doesn't look the same to every home."
                    lede="What you're seeing — or not seeing yet — determines the right diagnostic. Pick the pathway that matches your situation."
                    titleMax="32ch"
                    ledeMax="58ch"
                  />
                </Reveal>
                <Reveal delay={120}>
                  <div className="diagnostics-lead__links">
                    <span className="mega-panel__col-title">Diagnostics</span>
                    {diagnosticPathways.map((pathway) => (
                      <a key={pathway.href} className="mega-link" href={pathway.href}>
                        <span className="mega-link__label">
                          {pathway.title}
                          <ArrowIcon />
                        </span>
                        <span className="mega-link__desc">{pathway.desc}</span>
                      </a>
                    ))}
                  </div>
                </Reveal>
              </div>
              <div className="diagnostics-lead__quiz">
                <Reveal delay={180}>
                  <QuizCtaBanner stacked />
                </Reveal>
              </div>
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
      </main>
  );
}
