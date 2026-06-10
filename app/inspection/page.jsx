import ServiceHero from "../../components/ServiceHero";
import FaqAccordion from "../../components/FaqAccordion";
import LeadForm from "../../components/LeadForm";
import ReportPreviewCard from "../../components/ReportPreviewCard";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/SectionHeader";
import StatRow from "../../components/StatRow";
import Timeline from "../../components/Timeline";
import TrustBadge from "../../components/TrustBadge";
import ArrowIcon from "../../components/icons/ArrowIcon";
import CheckIcon from "../../components/icons/CheckIcon";
import Eyebrow from "../../components/Eyebrow";

/* --------------------------------------------------------------------------
   Paid-media landing page — TENANT template, form arm. The visitor arrives
   problem-aware (they clicked a "mould in your rental" ad), so the page skips
   "do I have mould?" education and answers their actual question: who's
   responsible, and how do I make them fix it. Flow: hero w/ form → situations
   (recognition) → rights (leverage) → deflection rebuttals → the report →
   process → tenant proof → form → objections → closing CTA. Every CTA drives
   to #enquire; no price, no booking calendar. Sections inlined per convention.
   -------------------------------------------------------------------------- */

export const metadata = {
  title: "Mould in your rental? Get landlord-ready evidence in 48 hours · Sporetrust",
  description:
    "Independent thermal, moisture and lab-backed mould inspection for Brisbane & South-East Queensland renters. Proof of cause and whether it's a building defect — the record to get repairs actioned, meet minimum housing standards, or take to QCAT.",
  alternates: {
    canonical: "/inspection",
  },
  openGraph: {
    title: "Mould in your rental? Independent, landlord-ready evidence in 48 hours",
    description:
      "Proof it's the building, not you. Cause, extent and liveability notes for your agent, landlord or QCAT. Brisbane & South-East Queensland.",
    images: [
      {
        url: "/images/book-diagnostic-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Sporetrust inspector documenting mould and moisture evidence in a rental property",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mould in your rental? Landlord-ready evidence in 48 hours",
    description:
      "Independent proof of cause and building defect — for repair requests, housing standards or QCAT. Brisbane & SEQ.",
    images: ["/images/book-diagnostic-banner.jpg"],
  },
};

const tenantRights = [
  {
    tag: "Standards",
    figure: "Their job",
    label:
      "QLD rentals must be weatherproof, structurally sound and free of damp or mould caused by the property. Building-defect mould is the lessor's to fix — not yours to tolerate.",
    source: "QLD minimum housing standards",
    diagram: "alert",
  },
  {
    tag: "Emergency",
    figure: "Urgent",
    label:
      "Serious damp or mould that affects health can qualify as an emergency repair — work the lessor or agent must action fast, not whenever it suits. Evidence is what makes it urgent on paper.",
    source: "RTRA Act — emergency repairs",
    diagram: "clock",
  },
  {
    tag: "Recoverable",
    figure: "Refundable",
    label:
      "Where the mould is the property's fault, the cost of having it independently documented can be recoverable from the lessor — so the evidence needn't come out of your pocket.",
    source: "Recoverable where building-caused",
    diagram: "invoice",
  },
];

/* Situation-matched, not symptom-matched — the visitor already knows the
   mould is there; these meet the decision-state they're stuck in. */
const tenantScenarios = [
  {
    num: "T.01",
    tag: "Ignored",
    title: "You report it. They “look into it.” Nothing happens.",
    image: "/images/sign-water-staining.png",
    imageAlt: "Water staining on a rental ceiling that has been reported but never repaired",
    measure:
      "Requests disappear into the agent's inbox, weeks pass, and eventually someone wipes the wall down and calls it handled.",
    evidence:
      "A documented cause, framed against their repair obligations, puts a clock on the fix — it stops being optional.",
  },
  {
    num: "T.02",
    tag: "Blamed",
    title: "They say it's your lifestyle.",
    image: "/images/sign-condensation.png",
    imageAlt: "Condensation on a cold window — the moisture renters get blamed for",
    measure:
      "“Open a window, dry your clothes outside” — the standard reply that quietly makes the building's problem your fault.",
    evidence: "Moisture readings settle building defect vs lifestyle on paper, not opinion.",
  },
  {
    num: "T.03",
    tag: "Recurring",
    title: "It comes back after every clean.",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Mould returning on an interior wall after surface cleaning",
    measure:
      "You bleach it, it returns within weeks — because the moisture source behind the surface is still active.",
    evidence: "Documented regrowth plus an active source is proof it was never a cleaning problem.",
  },
  {
    num: "T.04",
    tag: "Bond",
    title: "You're worried it lands on your bond.",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Splitting paint and moisture damage of the kind that appears on exit reports",
    measure:
      "Mould “damage” has a way of appearing on exit reports. Without a record, it's your word against theirs.",
    evidence: "Independent proof it was the building, on file before you hand back the keys.",
  },
];

/* The three deflections every renter hears — each granted its kernel of
   truth, then answered with what the instruments actually show. */
const toldLines = [
  {
    num: "D.01",
    tag: "Bleach",
    title: "“Just give it a clean with bleach.”",
    measure: "Surface cleaning clears what you can see — on tile and grout it genuinely works.",
    reality:
      "If it returns, the moisture source is still active. Regrowth is evidence of a building problem, not poor housekeeping.",
  },
  {
    num: "D.02",
    tag: "Ventilation",
    title: "“You need to air the place out more.”",
    measure: "Cross-flow ventilation does lower indoor humidity. It's worth doing.",
    reality: "You can't ventilate a wall cavity, a slab leak or a failed waterproofing membrane.",
  },
  {
    num: "D.03",
    tag: "Lifestyle",
    title: "“It's from drying clothes inside.”",
    measure: "Living produces moisture — cooking, showers, laundry. Every household makes it.",
    reality: "A compliant building handles normal living. Readings show whether yours can't — and why.",
  },
];

const reportItems = [
  [
    "Building defect vs tenant-caused — settled",
    "The question that decides who's responsible. Moisture readings and cause analysis answer it on paper, not opinion.",
  ],
  [
    "The likely cause, named",
    "Leak, roof, waterproofing, ventilation, slab or building defect — so the right repair lands on the right party.",
  ],
  [
    "Where the mould is — mapped and dated",
    "Every affected room and surface, with photos, thermal images and moisture readings — dated proof that protects your bond at exit.",
  ],
  [
    "Liveability & minimum-standards notes",
    "A plain-English read on whether the property meets its obligations — the language a repair request or QCAT needs.",
  ],
  [
    "What needs to happen, and how urgently",
    "Affected materials, health risk and whether it qualifies as an emergency repair — so “we'll get to it” gets a deadline.",
  ],
  [
    "Shareable PDF for your landlord, agent or QCAT",
    "Formatted to forward straight to the people who can action it — or submit as evidence.",
  ],
];

const instruments = [
  [
    "Thermal imaging",
    "Moisture paths behind walls and ceilings, visible on camera.",
    "/images/thermal-before-after.jpg",
    "Thermal imaging comparison revealing hidden moisture in a wall",
  ],
  [
    "Moisture metering",
    "Surface and depth readings that map and date the wetting.",
    "/images/metal-ball-moisture-detector.jpg",
    "Pinless moisture detector reading a damp wall",
  ],
  [
    "Air sampling",
    "Indoor vs outdoor spore counts that quantify what you're breathing.",
    "/images/air-sample.jpg",
    "Air sampling cassette capturing airborne mould spores",
  ],
  [
    "Lab analysis",
    "AIHA ISO 17025 lab confirmation — counts and species they can't dispute.",
    "/images/lab-testing.jpg",
    "Laboratory analysis of mould samples",
  ],
];

const timelineItems = [
  {
    title: "Send the form.",
    meta: "Today · 1 min",
    copy:
      "Tell us what you're seeing and where. No payment, no calendar — it goes straight to the inspection team, not a call centre.",
    signals: ["No obligation", "Same-day reply"],
  },
  {
    title: "We call you back.",
    meta: "Same business day",
    copy:
      "We confirm what's happening, quote a fixed price on the phone and book a time around you. If an inspection isn't the right move, we'll say so.",
    signals: ["Fixed price", "Your schedule"],
  },
  {
    title: "We inspect — 45 minutes.",
    meta: "At the property",
    copy:
      "Thermal imaging, moisture readings at surface and depth, humidity logging and optional air sampling — documented room by room while you watch.",
    signals: ["Thermal", "Moisture", "Air sample"],
  },
  {
    title: "Report in 48 hours.",
    meta: "Then it's on them",
    copy:
      "Cause, extent and liveability findings in plain English, formatted to forward straight to your landlord, agent or QCAT. We tell you exactly what to send, and to whom.",
    signals: ["Landlord-ready", "QCAT-ready", "Recoverable cost"],
  },
];

const testimonials = [
  {
    quote:
      "Eight months of “we'll send someone”. The report went to the agent on a Tuesday — a plumber was booked by Friday, and nobody has mentioned our “lifestyle” since.",
    meta: "Tenant · Annerley",
  },
  {
    quote:
      "Our property manager swore it was condensation from drying clothes inside. The readings found a slab leak. Hard to argue with a number.",
    meta: "Renter · Logan",
  },
  {
    quote:
      "We were bracing for it to come out of the bond when we moved. The report put it on the building before we handed back the keys.",
    meta: "Tenant · Gold Coast",
  },
];

const faqs = [
  [
    "Can my landlord refuse to let you in?",
    "You're entitled to arrange your own assessment, and entry for repairs and inspections follows normal notice rules. Most issues are settled once there's independent evidence on the table — not a standoff at the door.",
  ],
  [
    "What if they blame my lifestyle?",
    "That's exactly what the report settles. Moisture readings and cause analysis show whether it's a building defect or genuinely tenant-caused — so 'you're not airing the place out' stops being the end of the conversation.",
  ],
  [
    "Will this sour things with my landlord or agent?",
    "It usually does the opposite. A standoff is two opinions; a report is a path. Most lessors action repairs once the cause and their obligation are documented — ignoring written evidence is what creates risk for them. Queensland tenancy law also restricts retaliatory action against renters for exercising their rights.",
  ],
  [
    "How long does it take?",
    "Around 45 minutes on-site, then a plain-English report within 48 hours. If lab air-sampling is included, that appendix follows a few days later depending on lab turnaround.",
  ],
  [
    "Can I share the report with my agent or QCAT?",
    "Yes — that's what it's built for. Forward the PDF straight to your landlord or property manager, or submit it as evidence in a repair dispute or QCAT application.",
  ],
  [
    "Do I have to pay for it?",
    "You arrange and pay up front, but where the mould is the property's fault the cost can be recoverable from the lessor. We'll talk you through it when we call.",
  ],
  [
    "What if you don't find anything serious?",
    "That's still a useful answer, documented. An independent record that the mould isn't serious — or isn't the building's fault — protects your bond at exit and ends the speculation either way.",
  ],
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function InspectionLandingPage() {
  return (
    <main>
      {/* Offer + persuasion + the form itself, above the fold. */}
      <ServiceHero />

      {/* Recognition first — mirror the stuck-state before arguing anything. */}
      <section className="problem-bg" id="signs">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="is this you?"
              title="In a rental, the fight isn't the mould. It's whose fault it is."
              lede="Half of Queensland homes had mould inside 12 months — renters just carry the extra fight over responsibility. Four situations we hear every week; the way out of all of them is the same."
            />
          </Reveal>
          <div className="methodology-grid">
            {tenantScenarios.map((card) => (
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
                  <strong>Evidence</strong>
                  {card.evidence}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Leverage — the situation's been named; now the obligation framework that unsticks it. */}
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="your rights as a renter"
              title="In Queensland, mould isn't yours to just live with."
              ledeMax="62ch"
              lede="Renters have more leverage than most realise — when the mould is the property's fault. The right evidence is what turns 'we'll look into it' into an obligation."
            />
          </Reveal>
          <div className="problem-cta">
            <a className="btn" href="#enquire">
              Request your inspection <ArrowIcon />
            </a>
          </div>
          <Reveal delay={120}>
            <StatRow variant="stacked" stats={tenantRights} />
          </Reveal>
          <p className="stat-section__note">
            General guidance, not legal advice — but the evidence holds up the same either way.
          </p>
        </div>
      </section>

      {/* Rehearse the dispute — grant each deflection its truth, then answer it. */}
      <section className="diy-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="what you'll be told"
              title="Three lines every renter hears."
              lede="Mould is not a hygiene problem. It's a plumbing, waterproofing or ventilation failure that hasn't been named yet — and every one of these deflections has a measurable answer."
            />
          </Reveal>
          <div className="told-ledger">
            {toldLines.map((row) => (
              <div className="told-ledger__row" key={row.num}>
                <div className="told-ledger__line">
                  <div className="told-ledger__meta">
                    <span className="num">{row.num}</span>
                    <span className="tag">{row.tag}</span>
                  </div>
                  <h3>{row.title}</h3>
                </div>
                <div className="told-ledger__answer">
                  <p className="told-ledger__truth">{row.measure}</p>
                  <p className="told-ledger__say">
                    <strong>Readings say</strong>
                    {row.reality}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The deliverable — outcomes first, instrument credibility folded in below. */}
      <section className="solution" id="report">
        <div className="wrap">
          <span className="eyebrow">[ what's in your report ]</span>
          <h2 style={{ marginTop: 28, maxWidth: "32ch" }}>
            The record your landlord or agent can't wave away.
          </h2>
          <ul className="outcome-chips" role="list">
            <li>Repairs actioned</li>
            <li>Bond protected</li>
            <li>QCAT-ready</li>
            <li>Cost recoverable</li>
          </ul>
          <div className="what-grid">
            <div className="report-checks">
              <ul className="what-list">
                {reportItems.map(([title, copy]) => (
                  <li key={title}>
                    <CheckIcon />
                    <div>
                      <strong>{title}</strong>
                      <span className="copy">{copy}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <ReportPreviewCard />
          </div>
          <div className="evidence-strip">
            <span className="evidence-strip__kicker">
              The instruments behind it — readings an agent can&rsquo;t argue with
            </span>
            <ul className="evidence-strip__grid" role="list">
              {instruments.map(([title, copy, image, imageAlt]) => (
                <li key={title}>
                  <figure className="evidence-strip__media">
                    <img src={image} alt={imageAlt} loading="lazy" />
                  </figure>
                  <strong>{title}</strong>
                  <span>{copy}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Belief peak of the page — deliverable shown, outcomes chipped, instruments proven. */}
          <div className="problem-cta problem-cta--left">
            <a className="btn" href="#enquire">
              Get this report for your rental <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* Process — mirrors the form's three steps, kills "what does this involve". */}
      <section className="solution" id="how-it-works">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="how it works"
              title="From the form to a forwarded report, inside a week."
              lede="No callout fee, no treatment upsell, no quote pressure. We diagnose and document — what you do with it stays in your hands."
              titleMax="28ch"
            />
          </Reveal>
          <Timeline items={timelineItems} />
        </div>
      </section>

      {/* Why Sporetrust — independence, condensed from /why-sporetrust. The
          reason the report can't be dismissed as a sales pitch. */}
      <section className="honesty-section">
        <div className="wrap">
          <div className="honesty-section__grid">
            <div className="honesty-section__copy">
              <Reveal>
                <Eyebrow>why sporetrust</Eyebrow>
                <h2 className="honesty-section__title">We don&rsquo;t sell the cleanup.</h2>
                <p className="lede honesty-section__lede">
                  The mould inspection industry typically runs on remediation revenue — the company
                  quoting the inspection often quotes the cleanup. Scope grows.
                </p>
                <p className="honesty-section__body">
                  Sporetrust took the opposite position. Zero revenue from remediation, repair,
                  fogging or treatment work — we charge for the diagnostic, deliver the evidence,
                  and step back. So when your landlord or agent reads the report, there&rsquo;s no
                  angle to dismiss: what&rsquo;s in it is what we found, not what we&rsquo;re trying
                  to sell next. And it reads the same whoever it lands with — you, the lessor,
                  or QCAT.
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
                      Diagnostics scoped to the IICRC S520 inspection standard — the same playbook
                      accredited inspectors use worldwide.
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
                      Air and surface samples go to an AIHA-accredited lab under ISO/IEC 17025 —
                      spore counts and certificates in the format tribunals and insurers already
                      accept.
                    </p>
                  </div>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Social proof — tenant voices only on the tenant arm. */}
      <section className="testimonials">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="from renters"
              title="Taken seriously. Fixed fast. Bond intact."
              ledeMax="56ch"
              lede="What tenants say once the report lands in the agent's inbox."
            />
          </Reveal>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <Reveal key={t.meta}>
                <TrustBadge quote={t.quote} meta={t.meta} className="trust-badge--feature" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The catch-all conversion for readers who needed the whole story first. */}
      <LeadForm />

      {/* Objection handling — incl. the silent ones: retaliation, cost, bond. */}
      <section className="faq" id="faq">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="wrap">
          <div className="faq-grid">
            <div>
              <span className="eyebrow">[ common questions ]</span>
              <h2 style={{ marginTop: 28 }}>Before you ask.</h2>
              <p className="lede" style={{ marginTop: 22 }}>
                Still unsure? Add a note when you request your inspection — we'll come back the same business day.
              </p>
            </div>
            <div>
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </div>
      </section>

      {/* Closing action — a DR page never ends on an accordion. Ink surface per
          the background convention: direct-CTA moments run dark. */}
      <section className="lander-closer">
        <div className="wrap lander-closer__wrap">
          <div className="lander-closer__copy">
            <span className="eyebrow">[ the no-pressure next step ]</span>
            <h2>Still weighing it up? The call costs nothing.</h2>
            <p>
              Send the form — we call today, confirm a fixed price, and you decide from there.
              Often recoverable from the lessor when the building&rsquo;s at fault.
            </p>
          </div>
          <a className="btn btn-light" href="#enquire">
            Request your inspection <ArrowIcon />
          </a>
        </div>
      </section>
    </main>
  );
}
