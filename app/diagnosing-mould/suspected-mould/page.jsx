import ArrowIcon from "../../../components/icons/ArrowIcon";
import FaqAccordion from "../../../components/FaqAccordion";
import FeatureCard from "../../../components/FeatureCard";
import RouteIntroPage from "../../../components/pages/RouteIntroPage";
import Reveal from "../../../components/Reveal";
import SectionHeader from "../../../components/SectionHeader";
import StatRow from "../../../components/StatRow";
import { routePages } from "../../../lib/routePageContent";

const problemStats = [
  {
    tag: "Prevalence",
    figure: "1 in 2",
    label: "Mould or dampness is reported in Australian homes far more often than most owners expect.",
    source: "ABS / AIHW housing data",
    diagram: "donut",
    diagramProps: { percent: 50 },
  },
  {
    tag: "Recurrence",
    figure: "40%",
    label: "Mould regrew within 12 months in homes where remediation didn't address the root cause.",
    source: "Remediation follow-up data",
    diagram: "recurrence",
    diagramProps: { percent: 40 },
  },
  {
    tag: "Source check",
    figure: "Find the cause",
    label: "A visible patch may be the symptom. The diagnostic checks moisture, extent and source before the fix gets bigger.",
    source: "Diagnostic protocol",
    diagram: "rootCause",
  },
];

const invisibleSigns = [
  {
    num: "S.01",
    tag: "Laundry",
    title: "Spotting on laundry or stored fabrics",
    image: "/images/sign-musty-odour.png",
    imageAlt: "Stored fabric in a cupboard developing mould spotting",
    measure:
      "Towels, linen and clothes developing dark specks in cupboards, wardrobes or sealed rooms — usually where soft goods sit close to a wall or in still air.",
    reveals: "Humidity reservoir behind storage and ventilation failure.",
  },
  {
    num: "S.02",
    tag: "Wet areas",
    title: "Black grout in bathrooms and laundries",
    image: "/images/sign-water-staining.png",
    imageAlt: "Wet area showing staining around grout and joints",
    measure:
      "Black-staining grout in showers, splashbacks or wet-room corners — and the contamination usually extends past where it's visible into substrate.",
    reveals: "Waterproofing failure or persistent humidity load.",
  },
  {
    num: "S.03",
    tag: "Recurring",
    title: "Mould keeps returning after cleaning",
    image: "/images/sign-recurring-mould.png",
    imageAlt: "Mould returning after surface cleaning",
    measure:
      "Regrowth in the same spot after a clean. Surface treatment isn't a diagnosis — the conditions that caused the bloom are still in the room.",
    reveals: "Active moisture source or unaddressed affected material.",
  },
  {
    num: "S.04",
    tag: "Atmosphere",
    title: "The air feels heavy in certain rooms",
    image: "/images/sign-aircon.png",
    imageAlt: "Air vent in a room with heavy humid air",
    measure:
      "A musty smell that won't air out, rooms that feel close or damp, or a persistent sense that something's not quite right indoors.",
    reveals: "Hidden moisture, ventilation failure or HVAC carrying spores.",
  },
  {
    num: "S.05",
    tag: "Recent event",
    title: "Recent leaks, storms or wet weather",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Room affected by recent wet weather or a leak",
    measure:
      "After a roof leak, plumbing failure or significant storm event, materials can stay wet long after they look dry to the eye.",
    reveals: "Material that's still saturated despite looking surface-dry.",
  },
];

const diyMisconceptions = [
  {
    num: "D.01",
    tag: "Bleach",
    title: "Spray and pray.",
    measure:
      "Bleach clears what you see. On tile or grout, it works.",
    but: "If moisture's still feeding it, the patch returns within weeks.",
  },
  {
    num: "D.02",
    tag: "Laundry",
    title: "Wash, soak, repeat.",
    measure:
      "Hot wash, vinegar soak and sun-drying do rescue spotted clothes, hopefully.",
    but: "The spores came from somewhere. Fresh laundry keeps spotting.",
  },
  {
    num: "D.03",
    tag: "Airflow",
    title: "Crack a window.",
    measure:
      "Cross-flow ventilation lowers indoor humidity. It's worth doing.",
    but: "You can't ventilate a wall cavity, or an AC compressor leaking behind the unit.",
  },
];

const suspectedMethods = [
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

const sourceCategories = [
  {
    num: "C.01",
    tag: "Roof",
    title: "Roof leaks",
    image: "/images/sign-wet-weather.jpg",
    imageAlt: "Roof leak placeholder",
    copy: "Failed flashings, displaced tiles, ageing penetrations around vents and chimneys, sarking gaps and box-gutter overflow.",
    foot: "Water entry",
  },
  {
    num: "C.02",
    tag: "Walls",
    title: "Wall and window leaks",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Wall and window leak placeholder",
    copy: "Failed window flashings, render cracks, blocked weep-holes and brick-cavity moisture migrating into internal linings.",
    foot: "Wall entry",
  },
  {
    num: "C.03",
    tag: "Drainage",
    title: "Blocked gutters and drainage",
    image: "/images/sign-water-staining.png",
    imageAlt: "Drainage failure placeholder",
    copy: "Blocked gutters, downpipes discharging at the base of walls, and surface water pooling against slab edges instead of running to drain.",
    foot: "Surface water",
  },
  {
    num: "C.04",
    tag: "Showers",
    title: "Leaking showers and bathrooms",
    image: "/images/sign-recurring-mould.png",
    imageAlt: "Leaking shower placeholder",
    copy: "Ageing waterproofing under shower bases, sealant gaps at tile junctions and compromised membranes behind tiles and at hob upstands.",
    foot: "Failed seal",
  },
  {
    num: "C.05",
    tag: "Plumbing",
    title: "Hidden plumbing leaks",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Hidden plumbing leak placeholder",
    copy: "Hairline supply leaks behind walls, weeping shower-waste fittings and slab penetration faults that wet surrounding material long before it shows.",
    foot: "Concealed leak",
  },
  {
    num: "C.06",
    tag: "Appliances",
    title: "Leaking appliances",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Leaking appliance placeholder",
    copy: "Dishwashers, washing machines and fridge water lines slowly seeping into joinery, flooring and the wall behind them.",
    foot: "Slow drip",
  },
  {
    num: "C.07",
    tag: "Air-con",
    title: "Air conditioner leaks",
    image: "/images/sign-aircon.png",
    imageAlt: "Air conditioner leak placeholder",
    copy: "Overflowing drip trays, blocked or poorly graded condensate lines, and split-system heads seeping into the wall behind them.",
    foot: "AC condensate",
  },
  {
    num: "C.08",
    tag: "Ventilation",
    title: "Poor ventilation",
    image: "/images/sign-musty-odour.png",
    imageAlt: "Ventilation failure placeholder",
    copy: "Exhaust fans dumping into roof voids instead of outside, recirculating range hoods, blocked subfloor vents and rooms with no cross-flow.",
    foot: "Trapped humidity",
  },
  {
    num: "C.09",
    tag: "Subfloor",
    title: "Damp under the house",
    image: "/images/thermal-imaging.jpg",
    imageAlt: "Subfloor moisture placeholder",
    copy: "Undercroft dampness, slab-edge moisture, poor site fall and groundwater migrating up into bearers, joists and finished floors.",
    foot: "Ground water",
  },
];

const suspectedFaqs = [
  [
    "What if you don't find anything?",
    "That's still a useful answer, and you'll get it documented. A low-risk report with prevention guidance is valuable to have on file, especially as a tenant, owner or buyer.",
  ],
  [
    "Should I get lab-backed sampling?",
    "Worth it when you need claim-ready or tribunal-ready evidence, or when an inspection has revealed something the eye and meters alone can't characterise. Otherwise the Standard Diagnostic is enough for most prevention or repair-pathway needs.",
  ],
  [
    "Can you tell if the smell is mould?",
    "Often, yes — we pair odour notes with moisture readings, surface temperature differentials and (if needed) air sampling. The smell could also be drains, cabinetry, HVAC or damp contents; the diagnostic tells you which.",
  ],
  [
    "How long does it take?",
    "Most homes take around 45 minutes on-site, then 48 hours to deliver the report. Lab-Backed addendums arrive 5-7 days after sampling.",
  ],
];

export default function SuspectedMouldPage() {
  return (
    <RouteIntroPage {...routePages.suspectedMould} cards={[]} cta="Book a diagnostic">
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="the broader problem"
              title="Mould starts with moisture, not black spots."
              ledeMax="60ch"
              lede="Half of Queensland homes show signs of dampness or mould in any 12-month window. By the time it shows on the wall, moisture and spore counts have usually been building for weeks. The earlier the diagnostic, the smaller the fix."
            />
          </Reveal>
          <div className="problem-cta">
            <a className="btn" href="#book">
              Book a diagnostic <ArrowIcon />
            </a>
          </div>
          <Reveal delay={120}>
            <StatRow variant="stacked" stats={problemStats} />
          </Reveal>
        </div>
      </section>

      <section className="signs-section">
        <div className="wrap">
          <div className="signs-grid">
            <div className="signs-grid__copy">
              <Reveal>
                <SectionHeader
                  eyebrow="signs of invisible mould"
                  title="Stop living in mould uncertainty."
                  lede="Five quiet signs the house gives you first."
                />
              </Reveal>
              <a className="btn" href="#book">
                Book a diagnostic <ArrowIcon />
              </a>
            </div>
            <div className="signs-grid__cards">
              {invisibleSigns.map((card) => (
                <article className="method signs-card" key={card.num}>
                  <figure className="method-media">
                    <img src={card.image} alt={card.imageAlt} loading="lazy" />
                  </figure>
                  <div className="method-meta">
                    <span className="num">{card.num}</span>
                    <span className="tag">{card.tag}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="m-measure">{card.measure}</p>
                  <div className="m-divider" />
                  <p className="m-reveals">
                    <strong>Reveals</strong>
                    {card.reveals}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="diy-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the reframe"
              title="Mould is not a hygiene problem."
              lede="Pests happen to the house. Burst pipes happen to the house. Mould is a plumbing, waterproofing, or ventilation failure that hasn't surfaced yet. Not your guilty reminder."
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

      <section className="solution">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="how we diagnose"
              title="Four ways to look behind the surface."
              lede="When you suspect mould but can't see it, the protocol stacks methods so nothing diagnostic-worthy gets missed."
              titleMax="32ch"
            />
          </Reveal>
          <div className="methodology-grid">
            {suspectedMethods.map((method) => (
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

      <section className="sources-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="what we surface"
              title="Finding the source of mould stops the cycle."
              lede="The patch is the symptom. These are the failure modes we typically trace it back to."
              titleMax="32ch"
            />
          </Reveal>
          <div className="find-grid" aria-label="Source failure modes">
            {sourceCategories.map((source) => (
              <div key={source.num} className="find-card">
                <div className="find-meta">
                  <span className="num">{source.num}</span>
                  <span className="tag">{source.tag}</span>
                </div>
                <figure className="find-card-media">
                  <img src={source.image} alt={source.imageAlt} loading="lazy" />
                </figure>
                <h3>{source.title}</h3>
                <p>{source.copy}</p>
                <div className="find-foot">
                  <span className="l">Documents</span>
                  <span className="r">{source.foot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="route-page-banner">
        <div className="wrap">
          <FeatureCard
            eyebrow="Book a diagnostic"
            title="Get the evidence before the wall turns black."
            stats={[
              {
                figure: "45 min",
                label: "On-site visit covering thermal, moisture, humidity and ventilation across the home.",
              },
              {
                figure: "48 hr",
                label: "Plain-English digital report with cause, extent, evidence and a defensible cost range.",
              },
            ]}
            primaryCta={{ label: "Book inspection", href: "#book" }}
            secondaryCta={{ label: "See the pricing", href: "/#pricing" }}
            footnote="No callout fees · independent of remediation · IICRC certified · NATA-accredited lab analysis available."
            image="/images/book-diagnostic-banner.jpg"
            imageAlt="Sporetrust mould and moisture diagnostic"
          />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ suspected mould FAQ ]</span>
              <h2 style={{ marginTop: 28 }}>When something doesn't feel right.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                Common questions for owners and tenants who suspect a problem but can't yet see one.
              </p>
            </div>
            <div>
              <FaqAccordion items={suspectedFaqs} />
            </div>
          </div>
        </div>
      </section>
    </RouteIntroPage>
  );
}
