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
   Paid-media landing page — HOMEOWNER template, form arm. Same skeleton as
   the tenant arm (/renting-mould-assessment) but a different engine: the
   tenant page runs on leverage (someone else must fix it), this one runs on
   stewardship (catch it before it gets expensive). No landlord, no rights,
   no adversary. Flow: hero w/ form → situations (recognition) → escalation
   stakes → easy explanations rebutted → the report → process → proof →
   form → objections → closing CTA. Every CTA drives to #enquire; no price,
   no booking calendar. Sections inlined per convention.
   -------------------------------------------------------------------------- */

export const metadata = {
  title: "Mould in your home? Find the moisture feeding it in 48 hours · Sporetrust",
  description:
    "Independent thermal, moisture and lab-backed mould diagnostics for Brisbane & South-East Queensland homeowners. The source, the extent and the fix scope in plain English — before small damage becomes structural.",
  alternates: {
    canonical: "/homeowner-mould-inspection",
  },
  openGraph: {
    title: "Mould in your home? Find what's feeding it — in 48 hours",
    description:
      "Independent diagnosis of cause, extent and fix scope. Measured, photographed and lab-backed — for quotes, insurers and peace of mind. Brisbane & South-East Queensland.",
    images: [
      {
        url: "/images/book-diagnostic-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Sporetrust inspector documenting mould and moisture in a Queensland home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mould in your home? Find what's feeding it — in 48 hours",
    description:
      "Independent diagnosis of cause, extent and fix scope — measured, photographed, lab-backed. Brisbane & SEQ.",
    images: ["/images/book-diagnostic-banner.jpg"],
  },
};

/* The stakes ladder — why measuring now beats waiting. Rank framing on the
   insurance stat (the ranking is the fact; dollar figures are illustrative). */
const escalationStakes = [
  {
    tag: "Insured Damage",
    figure: "#1",
    label:
      "Water damage is the leading cause of home-insurance claims in Australia — and almost every claim history starts with a small leak nobody measured while it was still cheap.",
    source: "Home insurance claims frequency",
    diagram: "invoice",
  },
  {
    tag: "Early Warning",
    figure: "Stage 1",
    label:
      "Mould is the first visible stage of a moisture problem. Left unmeasured, the same damp feeds timber rot and the conducive conditions that attract termites — and the repair bill climbs at every stage.",
    source: "Moisture escalation pathway",
    diagram: "alert",
  },
  {
    tag: "Defined Scope",
    figure: "48 hrs",
    label:
      "Cause, extent and fix scope in plain English within 48 hours — measured, photographed and lab-backed. Every quote that follows answers to a defined problem instead of an open chequebook.",
    source: "Sporetrust diagnostic report",
    diagram: "clock",
  },
];

/* Situation-matched — the four ways homeowners end up here. */
const homeownerScenarios = [
  {
    num: "H.01",
    tag: "Recurring",
    title: "You clean it. It comes back.",
    image: "/images/sign-returning-mould.png",
    imageAlt: "Mould returning on an interior wall after repeated surface cleaning",
    measure:
      "The bleach works for a few weeks, then the same patch is back — because the moisture feeding it is still active behind the surface.",
    evidence:
      "Readings at surface and depth find the source, so you fix the cause once instead of cleaning the symptom forever.",
  },
  {
    num: "H.02",
    tag: "Hidden",
    title: "You can smell it. You can't find it.",
    image: "/images/sign-condensation.png",
    imageAlt: "Condensation and damp air of the kind that carries a musty smell with no visible source",
    measure:
      "A musty room, mould specks in the aircon, symptoms that ease when you leave the house — and nothing visible on any wall.",
    evidence:
      "Thermal imaging and air sampling find growth inside cavities and ceilings without opening anything up.",
  },
  {
    num: "H.03",
    tag: "After Repairs",
    title: "The roof was “fixed.” The stain says otherwise.",
    image: "/images/sign-water-staining.png",
    imageAlt: "Water staining on a ceiling after storm damage and a questionable repair",
    measure:
      "Storm damage, an insurance repair, a patched leak — and now a stain or smell that suggests the fix didn't hold.",
    evidence:
      "Moisture mapping shows whether water is still getting in, dated and documented for the insurer or the trade who did the work.",
  },
  {
    num: "H.04",
    tag: "Unverified",
    title: "You paid for remediation. Did it work?",
    image: "/images/sign-splitting-paint.png",
    imageAlt: "Splitting paint over a wall that was remediated but never verified dry",
    measure:
      "The mould was treated, the walls repainted — but nobody measured afterwards, and now something smells familiar.",
    evidence:
      "Clearance testing compares moisture and airborne counts against normal — proof the job's actually done, or early warning it isn't.",
  },
];

/* The easy explanations — each granted its kernel of truth, then answered
   with what the instruments actually show. Same ledger as the tenant arm's
   deflections, but these are the stories homeowners tell themselves. */
const easyExplanations = [
  {
    num: "E.01",
    tag: "Condensation",
    title: "“It's just condensation.”",
    measure: "Cool surfaces do condense in a Queensland winter — some of it is exactly that.",
    reality:
      "Condensation has a measurable pattern. It doesn't explain a damp reading deep in a wall cavity or under a floor.",
  },
  {
    num: "E.02",
    tag: "Bleach",
    title: "“The bleach seems to handle it.”",
    measure: "Surface cleaning clears what you can see — on tile and grout it genuinely works.",
    reality:
      "Regrowth within weeks means an active source. You're not fixing the problem, you're maintaining it on a schedule.",
  },
  {
    num: "E.03",
    tag: "Old Repair",
    title: "“We had that fixed a while back.”",
    measure: "The repair may well be sound — many are.",
    reality:
      "Only readings prove it. A failed membrane or a slow re-leak looks identical from the outside until it's structural.",
  },
];

const reportItems = [
  [
    "Where the moisture is — mapped and dated",
    "Every affected room and surface, with photos, thermal images and moisture readings — a dated baseline for insurers and for comparing against later.",
  ],
  [
    "What's feeding it — the actual cause",
    "Plumbing, waterproofing, ventilation or ingress — the failure behind the growth, in plain English. It's the answer that decides which trade you actually need.",
  ],
  [
    "What needs to happen, and how urgently",
    "Affected materials, health risk, and what's cosmetic versus structural — so you fix things in the right order and skip what can wait.",
  ],
  [
    "A defined scope for quotes, insurers and trades",
    "A shareable PDF remediators and builders can quote against — a measured problem, not a walkthrough guess. In the format insurers expect.",
  ],
];

const instruments = [
  [
    "Thermal imaging",
    "Finds moisture behind walls and ceilings without opening them.",
    "/images/thermal-before-after.jpg",
    "Thermal imaging comparison revealing hidden moisture in a wall",
  ],
  [
    "Moisture metering",
    "Surface and depth readings at every suspect point — photographed and logged.",
    "/images/metal-ball-moisture-detector.jpg",
    "Pinless moisture detector reading a damp wall",
  ],
  [
    "Air sampling",
    "Indoor spore counts compared against an outdoor control — the ratio is the proof.",
    "/images/air-sample.jpg",
    "Air sampling cassette capturing airborne mould spores",
  ],
  [
    "Lab analysis",
    "AIHA ISO 17025 lab certificate for spore counts and species — the format insurers and tribunals accept.",
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
    meta: "After the visit",
    copy:
      "Cause, extent and fix scope in plain English. We tell you exactly what kind of trade to call — and what they should be quoting against.",
    signals: ["Trade-ready", "Insurer-ready", "Dated baseline"],
  },
];

const testimonials = [
  {
    quote:
      "The first quote covered half the house. The readings put it in one wall and a failed shower membrane — the actual fix was a fraction of what we'd braced for.",
    meta: "Homeowner · Carindale",
  },
  {
    quote:
      "We'd bleached the same corner for two years. Turned out to be a slow leak under the slab — no amount of airing the room out was ever going to fix that.",
    meta: "Owner · North Lakes",
  },
  {
    quote:
      "Clearance testing was the part nobody offered us the first time around. This time the counts were on paper before the painters went back in.",
    meta: "Homeowner · Birkdale",
  },
];

const faqs = [
  [
    "How is this different from a building or pest inspection?",
    "Those inspections flag moisture as a line item — 'conducive conditions noted' — and move on. This is the follow-up that actually measures it: where the moisture is, what's feeding it, what species are growing and what's in your air. Different job, different depth.",
  ],
  [
    "Should I get this before getting remediation quotes?",
    "That's the ideal order. A remediator quoting off a walkthrough is guessing at scope — and they're incentivised to guess big. A measured report gives every quote the same defined problem to price against, and we have no stake in the answer.",
  ],
  [
    "Will my insurer accept the report?",
    "The report is built for that use: dated photos, thermal images, moisture readings and lab certificates from an AIHA-accredited, ISO 17025 lab — the documentation format insurers expect. Whether a specific policy responds is between you and them, but the evidence won't be the weak link.",
  ],
  [
    "Can you check whether a past remediation actually worked?",
    "Yes — that's clearance testing. Moisture readings plus airborne spore counts, compared against normal reference levels. Either the job's verifiably done, or you've caught the failure while it's still small.",
  ],
  [
    "What if you don't find anything serious?",
    "Then you get that in writing — which is worth having. A documented all-clear ends the speculation, sets a dated baseline for the property, and is a genuinely useful thing to hold at sale time.",
  ],
  [
    "How long does it take?",
    "Around 45 minutes on-site, then a plain-English report within 48 hours. If lab air-sampling is included, that appendix follows a few days later depending on lab turnaround.",
  ],
  [
    "Do you do the mould removal too?",
    "No — deliberately. Sporetrust takes zero revenue from remediation, repair or treatment work, so the report has nothing to sell you. That's what makes the scope trustworthy when you hand it to the people who do quote for the fix.",
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

export default function HomeownerLandingPage() {
  return (
    <main>
      {/* Offer + persuasion + the form itself, above the fold. */}
      <ServiceHero variant="homeowner" />

      {/* Recognition first — mirror the situation before arguing anything. */}
      <section className="problem-bg" id="signs">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="is this you?"
              title="Mould you can see — or moisture you can't?"
              lede="1 in 2 Queensland homes had mould or damp in the past 12 months. When it's your own home, the question isn't whose job it is — it's how far it's gone and what it'll cost to stop. Four situations we hear every week:"
            />
          </Reveal>
          <div className="methodology-grid">
            {homeownerScenarios.map((card) => (
              <article className="method signs-card" key={card.num}>
                <figure className="method-media">
                  <img src={card.image} alt={card.imageAlt} loading="lazy" />
                </figure>
                <h3>{card.title}</h3>
                <p className="m-measure">{card.measure}</p>
                <div className="m-divider" />
                <p className="m-reveals">
                  <strong>Measured</strong>
                  {card.evidence}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stakes — why measuring now beats waiting for it to get expensive. */}
      <section className="stat-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="why now"
              title="Mould is the cheap warning. What follows isn't."
              ledeMax="62ch"
              lede="Moisture damage compounds quietly — mould first, timber and structure later. Measuring early is the difference between a defined fix and an open-ended one."
            />
          </Reveal>
          <div className="problem-cta">
            <a className="btn" href="#enquire">
              Request your inspection <ArrowIcon />
            </a>
          </div>
          <Reveal delay={120}>
            <StatRow variant="stacked" stats={escalationStakes} />
          </Reveal>
          <p className="stat-section__note">
            General guidance, not financial or insurance advice — the readings hold up the same either way.
          </p>
        </div>
      </section>

      {/* Rehearse the self-talk — grant each easy explanation its truth, then answer it. */}
      <section className="diy-section">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              eyebrow="the easy explanations"
              title="Every “it's probably nothing” has a measurable answer."
              lede="Mould is a plumbing, waterproofing or ventilation failure showing itself early. The stories that keep it unmeasured:"
            />
          </Reveal>
          <div className="told-ledger">
            {easyExplanations.map((row) => (
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
            A lab-backed diagnosis in 48 hours.
          </h2>
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
              The instruments behind every finding
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
              Get this report for your home <ArrowIcon />
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
              title="From “what is that?” to a defined fix, in days."
              lede="No callout fee, no treatment upsell, no quote pressure. We diagnose and document — what you do with it stays entirely your call."
              titleMax="28ch"
            />
          </Reveal>
          <Timeline items={timelineItems} />
        </div>
      </section>

      {/* Why Sporetrust — independence. For homeowners the sharp edge is scope:
          an inspection sold by a remediator prices the job it hopes to win. */}
      <section className="honesty-section">
        <div className="wrap">
          <div className="honesty-section__grid">
            <div className="honesty-section__copy">
              <Reveal>
                <Eyebrow>why sporetrust</Eyebrow>
                <h2 className="honesty-section__title">A report with no cleanup to sell.</h2>
                <p className="lede honesty-section__lede">
                  Most mould inspections are free because the remediation quote attached to them
                  isn&rsquo;t. The inspection finds what the quote needs it to find.
                </p>
                <p className="honesty-section__body">
                  Sporetrust takes zero revenue from remediation, repair, fogging or treatment
                  work. We charge for the diagnostic, hand over the evidence, and step back.
                  What&rsquo;s in the report is what we measured — not what we&rsquo;re selling
                  next — which is exactly what you want in your hand when the quotes start
                  arriving.
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
                      spore counts and certificates in the format insurers and tribunals already
                      accept.
                    </p>
                  </div>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Social proof — owner voices only on the homeowner arm. */}
      <section className="testimonials">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="from homeowners"
              title="Found early. Scoped honestly. Fixed once."
              ledeMax="56ch"
              lede="The usual ending: the real cause gets found, the fix gets scoped to what's actually wrong, and the cleaning-it-every-month era ends. What owners say after the report:"
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
      <LeadForm variant="homeowner" />

      {/* Objection handling — incl. the silent ones: scope-inflation, insurance, "is it worth it". */}
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
            <h2>Know what you&rsquo;re dealing with. The call costs nothing.</h2>
            <p>
              Send the form — we call today, confirm a fixed price, and you decide from there.
              Whatever we find, you&rsquo;ll know exactly what it is, what caused it, and what
              fixing it should involve.
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
