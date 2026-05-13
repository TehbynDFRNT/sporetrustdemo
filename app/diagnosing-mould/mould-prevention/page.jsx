import ArrowIcon from "../../../components/icons/ArrowIcon";
import FaqAccordion from "../../../components/FaqAccordion";
import FeatureCard from "../../../components/FeatureCard";
import RouteIntroPage from "../../../components/pages/RouteIntroPage";
import Reveal from "../../../components/Reveal";
import SectionHeader from "../../../components/SectionHeader";
import StatRow from "../../../components/StatRow";
import Timeline from "../../../components/Timeline";
import { routePages } from "../../../lib/routePageContent";

function CompareCellValue({ text }) {
  const yesMatch = text.match(/^Yes(?:\s*[—-]\s*(.+))?$/);
  const noMatch = text.match(/^No(?:\s*[—-]\s*(.+))?$/);
  if (yesMatch) {
    return (
      <>
        <span className="compare-primary">
          <svg className="compare-icon compare-icon--check" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
          </svg>
          Yes
        </span>
        {yesMatch[1] ? <span className="compare-note">{yesMatch[1]}</span> : null}
      </>
    );
  }
  if (noMatch) {
    return (
      <>
        <span className="compare-primary">
          <svg className="compare-icon compare-icon--x" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4 L12 12 M12 4 L4 12" />
          </svg>
          No
        </span>
        {noMatch[1] ? <span className="compare-note">{noMatch[1]}</span> : null}
      </>
    );
  }
  return <span>{text}</span>;
}

const preventionStats = [
  {
    tag: "Annual risk",
    figure: "50%",
    label: "Over 12 months, your home has a 50% chance of developing mould or damp.",
    source: "ABS / AIHW housing data",
    diagram: "recurrence",
    diagramProps: { percent: 50 },
  },
  {
    tag: "Costliest",
    figure: "1st",
    label: "Water damage is the costliest home risk in Australia. In 2018 the average claim was $30,361 — more than fire or burglary.",
    source: "Australian insurance industry data",
    diagram: "costBars",
  },
  {
    tag: "Predictor",
    figure: "2 in 3",
    label: "Self-reported damp beats visible spotting as a predictor in lab tests. Sporetrust measures the moisture behind that instinct.",
    source: "Building science research",
    diagram: "donut",
    diagramProps: { percent: 67 },
  },
];

const preventionTimeline = [
  {
    title: "Find water damage before the claim.",
    meta: "Mitigation",
    copy:
      "Hidden roof, plumbing, AC and waterproofing failures often run for months before they show. Annual testing finds them before water damage becomes a $30k insurance claim.",
    signals: ["Roof", "Plumbing", "AC", "Waterproofing"],
  },
  {
    title: "Find hidden mould before it shows.",
    meta: "Detection",
    copy:
      "Moisture build-up predicts mould more reliably than visible spotting. Catch the conditions inside walls, cavities and subfloors before the bloom appears on the surface.",
    signals: ["Hidden moisture", "Pre-visible", "Lab-tested"],
  },
  {
    title: "Keep repair costs small.",
    meta: "Cost",
    copy:
      "An issue caught at six months costs a fraction of one caught at six years. Yearly inspection keeps scope contained and the work cheap — small fixes, not full rebuilds.",
    signals: ["Smaller scope", "Lower spend", "No surprises"],
  },
  {
    title: "Protect your family and peace of mind.",
    meta: "Wellbeing",
    copy:
      "Mould and damp is more than just a building defect. It can impact your family and wellness. A current diagnostic means knowing your home is healthy — not hoping it is.",
    signals: ["Family", "Wellness", "Confidence"],
  },
];

const pestVsMouldRows = [
  { label: "Causes significant damage", pest: "Yes", mould: "Yes" },
  { label: "Early detection prevents catastrophic costs", pest: "Yes", mould: "Yes" },
  { label: "Insurance excluded as standard", pest: "Yes", mould: "Yes — slow-build damp and mould is often uncovered" },
  { label: "Most costly insurance category", pest: "No", mould: "Yes" },
  { label: "Chance of contamination (12 months)", pest: "1.6%", mould: "50%" },
  { label: "Causes harm to occupants", pest: "No", mould: "Yes" },
  { label: "Lab-backed diagnosis available", pest: "No", mould: "Yes" },
  { label: "Treated as a building defect", pest: "Yes", mould: "No — seen as a hygiene issue" },
];

const detectionMethods = [
  {
    num: "M.01",
    tag: "Thermal",
    title: "Thermal mapping",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal imaging comparison used during a mould and moisture inspection",
    measure:
      "Surface temperature differentials across walls, ceilings, floors, plumbing lines and HVAC penetrations.",
    reveals: "Hidden moisture, cold bridges and leak paths.",
  },
  {
    num: "M.02",
    tag: "Moisture",
    title: "Moisture metering",
    image: "/images/metal-ball-moisture-detector.jpg",
    imageAlt: "Moisture detector used to check damp building materials",
    measure:
      "Pin and pinless readings at surface and depth across timber, gypsum, masonry, tile substrates and skirting cavities.",
    reveals: "Active wetting and moisture migration.",
  },
  {
    num: "M.03",
    tag: "Air sample",
    title: "Air sampling",
    image: "/images/air-sample.jpg",
    imageAlt: "Air sampling cassette used for mould spore capture",
    measure:
      "Continuous hygrometer logging on-site, plus optional indoor and outdoor control air samples to an accredited lab.",
    reveals: "Humidity load and airborne spore count.",
  },
  {
    num: "M.04",
    tag: "Lab",
    title: "Lab analysis",
    image: "/images/lab-testing.jpg",
    imageAlt: "Laboratory testing equipment for mould sample analysis",
    measure:
      "Independent sample handling and lab analysis where spore count, species profile or claim-ready evidence is needed.",
    reveals: "Contamination indicators and evidence support.",
  },
];

const preventionFaqs = [
  [
    "How often should I have a diagnostic?",
    "Once a year is the Sentinel cadence — enough to catch drift, not so much that it becomes overkill. After major weather events (cyclone season, flood) is also worth considering.",
  ],
  [
    "Is prevention worth it if I've never had a problem?",
    "Yes — the diagnostic gives you a baseline. Without a baseline, year two has nothing to compare against. The first reading is the one that makes every future reading useful.",
  ],
  [
    "Do I need to do anything between visits?",
    "Sporetrust prevention guidance covers humidity, ventilation and cleaning rhythm in plain English — practical things, not a full home retrofit. Sentinel members can also call for guidance between visits.",
  ],
  [
    "Does Sentinel include the annual visit?",
    "Yes — that's the core of it. One on-site inspection a year, a fresh report, plus member rates on any add-ons and priority booking if a quick follow-up is needed.",
  ],
];

export default function MouldPreventionPage() {
  return (
    <RouteIntroPage {...routePages.mouldPrevention} cards={[]}>
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="the case for prevention"
              title="Catch mould before it becomes remediation."
              ledeMax="60ch"
              lede="The earlier the diagnostic, the smaller the fix. Three numbers explain why prevention pays off."
            />
          </Reveal>
          <div className="problem-cta">
            <a className="btn" href="#book">
              Book a diagnostic <ArrowIcon />
            </a>
          </div>
          <Reveal delay={120}>
            <StatRow variant="stacked" stats={preventionStats} />
          </Reveal>
        </div>
      </section>

      <section className="comparison-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="pest vs mould"
              title="Pests are a building defect. Mould is too."
              lede="We inspect homes for pests as a matter of course, yet more common defects — moisture, damp and mould — get treated as an occupant hygiene problem. Mould is a symptom of hidden water damage, not your shameful reminder."
              titleMax="40ch"
              ledeMax="64ch"
            />
          </Reveal>
          <div className="compare-table">
            <div className="compare-row compare-row--head">
              <div className="compare-cell compare-cell--label"></div>
              <div className="compare-cell">Pest &amp; termites</div>
              <div className="compare-cell compare-cell--ours">Mould &amp; damp</div>
            </div>
            {pestVsMouldRows.map((row) => (
              <div className="compare-row" key={row.label}>
                <div className="compare-cell compare-cell--label">{row.label}</div>
                <div className="compare-cell"><CompareCellValue text={row.pest} /></div>
                <div className="compare-cell compare-cell--ours"><CompareCellValue text={row.mould} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="regular testing"
              title="Mould prevention starts with early diagnosis."
              lede="Mould detection is moisture damage detection. It's not just about finding mould — it's about catching the water damage that goes unnoticed for months."
              titleMax="32ch"
            />
          </Reveal>
          <Timeline items={preventionTimeline} />
        </div>
      </section>

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="how we detect"
              title="Uniquely capable diagnostics for early detection."
              lede="Plumbers and roofers repair the leaks you can see. We detect the damage before your home is inundated."
              titleMax="36ch"
            />
          </Reveal>
          <div className="methodology-grid">
            {detectionMethods.map((method) => (
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
            eyebrow="Sporetrust Sentinel"
            title="Keep the answer current with year round monitoring."
            stats={[
              {
                figure: "$13.95 / week",
                label: "GST inc · cancel anytime · members move to the front of the queue.",
              },
              {
                figure: "1 visit / year",
                label: "Annual on-site sweep, year-on-year report tracking, member rates on add-ons.",
              },
            ]}
            primaryCta={{ label: "Join Sentinel", href: "#book" }}
            secondaryCta={{ label: "How Sentinel works", href: "/sporetrust-sentinel" }}
            footnote="Industry-first annual mould prevention and pre-contamination diagnostics subscription."
            image="/images/thermal-imaging.jpg"
            imageAlt="Sporetrust inspector using thermal imaging equipment in a Queenslander interior"
          />
        </div>
      </section>

      <section className="faq faq--white">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ prevention FAQ ]</span>
              <h2 style={{ marginTop: 28 }}>Before you subscribe.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                Common questions homeowners ask when they're moving from reactive to preventative.
              </p>
            </div>
            <div>
              <FaqAccordion items={preventionFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
