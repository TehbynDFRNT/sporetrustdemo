import ArrowIcon from "./icons/ArrowIcon";
import ReviewStars from "./ReviewStars";

const DEFAULT_INCLUSIONS = [
  {
    title: "Full on-site protocol",
    copy: "thermal, moisture and humidity inspection across walls, ceilings, plumbing and HVAC",
  },
  {
    title: "AIHA-lab air sampling",
    copy: "indoor + outdoor control samples with lab-analysed spore count and species profile",
  },
  {
    title: "48-hour digital report",
    copy: "cause, extent, damage map, lab evidence and a defensible repair-cost range",
  },
];

function CheckGlyph() {
  return (
    <svg
      className="diagnostic-hero__check"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DiagnosticHero({
  inclusions = DEFAULT_INCLUSIONS,
  pricing = {
    figure: "$995",
    meta: "Lab-Backed Diagnostic · GST inc",
    sub: "On-site protocol + AIHA-lab analysis (ISO/IEC 17025). Plain-English digital report within 48 hours.",
    pill: "Most booked",
  },
  cta = { label: "Book diagnostic", href: "#book" },
  background = "/images/book-diagnostic-banner.jpg",
  backgroundAlt = "Sporetrust inspector with thermal and moisture diagnostic equipment",
  badge = {
    kicker: "Independent",
    label: "Of remediation and repair",
  },
  proof = "IICRC certified · AIHA-accredited lab partners (ISO/IEC 17025)",
}) {
  return (
    <section className="diagnostic-hero" aria-labelledby="diagnostic-hero-title">
      <div className="wrap diagnostic-hero__wrap">
        <div className="diagnostic-hero__visual">
          <div
            className="diagnostic-hero__media"
            role="img"
            aria-label={backgroundAlt}
            style={{ backgroundImage: `url("${background}")` }}
          />
          <div className="diagnostic-hero__visual-veil" aria-hidden="true" />
          {badge ? (
            <div className="diagnostic-hero__badge">
              <img
                src="/sporetrace-icon.svg"
                alt=""
                width="36"
                height="36"
                className="diagnostic-hero__badge-mark"
                aria-hidden="true"
              />
              <div className="diagnostic-hero__badge-text">
                <span className="diagnostic-hero__badge-kicker">{badge.kicker}</span>
                <span className="diagnostic-hero__badge-label">{badge.label}</span>
              </div>
            </div>
          ) : null}
        </div>

        <article className="diagnostic-hero__card">
          <span className="diagnostic-hero__eyebrow">[ independent diagnostic ]</span>
          <h1 className="diagnostic-hero__title" id="diagnostic-hero-title">
            Lab-Backed Diagnostic
          </h1>

          <div className="diagnostic-hero__proof">
            <ReviewStars className="diagnostic-hero__stars" />
            <span className="diagnostic-hero__proof-text">{proof}</span>
          </div>

          <p className="diagnostic-hero__lede">
            Independent thermal, moisture and humidity inspection — delivered as a defensible diagnostic report within 48 hours. No remediation upsell, no callout fees.
          </p>

          <div className="diagnostic-hero__divider" aria-hidden="true" />

          <ul className="diagnostic-hero__inclusions" role="list">
            {inclusions.map((item) => (
              <li className="diagnostic-hero__inclusion" key={item.title}>
                <CheckGlyph />
                <span>
                  <strong>{item.title}</strong> {item.copy}
                </span>
              </li>
            ))}
          </ul>

          <div className="diagnostic-hero__pricing">
            <div className="diagnostic-hero__price">
              <span className="diagnostic-hero__price-figure">{pricing.figure}</span>
              <span className="diagnostic-hero__price-meta">{pricing.meta}</span>
            </div>
            {pricing.pill ? <span className="diagnostic-hero__pill">{pricing.pill}</span> : null}
          </div>

          <a className="diagnostic-hero__cta" href={cta.href}>
            {cta.label}
            <ArrowIcon />
          </a>
        </article>
      </div>
    </section>
  );
}
