import ArrowIcon from "./icons/ArrowIcon";
import ReviewStars from "./ReviewStars";
import SentinelMark from "./SentinelMark";

const DEFAULT_INCLUSIONS = [
  {
    title: "Two annual diagnostics",
    copy: "full thermal, moisture and humidity sweep, twice a year — same Sporetrust protocol",
  },
  {
    title: "Standing property record",
    copy: "year-on-year reports to share with insurers, builders, landlords or future buyers",
  },
  {
    title: "Member rate on re-checks",
    copy: "subscriber re-inspections at $549.50 if something changes between scheduled visits",
  },
  {
    title: "Priority booking & support",
    copy: "front-of-queue follow-ups and a subscriber line for questions between scheduled visits",
  },
];

function CheckGlyph() {
  return (
    <svg
      className="sentinel-hero__check"
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

export default function SentinelHero({
  inclusions = DEFAULT_INCLUSIONS,
  pricing = {
    figure: "$22.95",
    meta: "per week",
    sub: "12-month minimum, billed weekly. Cancel before your first inspection or after 12 months.",
    pill: "12-month plan",
  },
  cta = { label: "Join Sentinel", href: "#book" },
  background = "/images/book-diagnostic-banner.jpg",
  backgroundAlt = "Sporetrust inspector working through an annual Sentinel diagnostic",
  badge = {
    kicker: "Industry-first",
    label: "Annual mould prevention subscription",
  },
  proof = "Industry-first annual mould prevention subscription",
}) {
  return (
    <section className="sentinel-hero" aria-labelledby="sentinel-hero-title">
      <div className="wrap sentinel-hero__wrap">
        <div className="sentinel-hero__visual">
          <div
            className="sentinel-hero__media"
            role="img"
            aria-label={backgroundAlt}
            style={{ backgroundImage: `url("${background}")` }}
          />
          <div className="sentinel-hero__visual-veil" aria-hidden="true" />
          {badge ? (
            <div className="sentinel-hero__badge">
              <img
                src="/sporetrace-icon.svg"
                alt=""
                width="36"
                height="36"
                className="sentinel-hero__badge-mark"
                aria-hidden="true"
              />
              <div className="sentinel-hero__badge-text">
                <span className="sentinel-hero__badge-kicker">{badge.kicker}</span>
                <span className="sentinel-hero__badge-label">{badge.label}</span>
              </div>
            </div>
          ) : null}
        </div>

        <article className="sentinel-hero__card">
          <header className="sentinel-hero__card-head">
            <SentinelMark size={56} className="sentinel-hero__card-mark" />
            <div className="sentinel-hero__card-heading">
              <span className="sentinel-hero__eyebrow">Year-round prevention</span>
              <h1 className="sentinel-hero__title" id="sentinel-hero-title">
                Sporetrust Sentinel
              </h1>
            </div>
          </header>

          <div className="sentinel-hero__proof">
            <ReviewStars className="sentinel-hero__stars" />
            <span className="sentinel-hero__proof-text">{proof}</span>
          </div>

          <p className="sentinel-hero__lede">
            Two on-site diagnostics a year, a standing report on your home, and the team you trust on speed dial. Hidden water damage runs for months before it shows — Sentinel finds it while the fix is still small.
          </p>

          <div className="sentinel-hero__divider" aria-hidden="true" />

          <span className="sentinel-hero__features-label">Membership includes</span>
          <ul className="sentinel-hero__inclusions" role="list">
            {inclusions.map((item) => (
              <li className="sentinel-hero__inclusion" key={item.title}>
                <CheckGlyph />
                <span>
                  <strong>{item.title}</strong> {item.copy}
                </span>
              </li>
            ))}
          </ul>

          <div className="sentinel-hero__pricing">
            <div className="sentinel-hero__price">
              <span className="sentinel-hero__price-figure">{pricing.figure}</span>
              <span className="sentinel-hero__price-meta">{pricing.meta}</span>
            </div>
            <p className="sentinel-hero__price-sub">{pricing.sub}</p>
            {pricing.pill ? (
              <span className="sentinel-hero__pill">{pricing.pill}</span>
            ) : null}
          </div>

          <a className="sentinel-hero__cta" href={cta.href}>
            {cta.label}
            <ArrowIcon />
          </a>
        </article>
      </div>
    </section>
  );
}
