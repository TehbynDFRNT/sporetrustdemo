import ArrowIcon from "./icons/ArrowIcon";
import Eyebrow from "./Eyebrow";
import HeroAvailabilityForm from "./HeroAvailabilityForm";
import TrustBadge from "./TrustBadge";

const DEFAULT_TRUST = {
  quote:
    "Clear findings, photos and next steps made it easy to forward without explaining the whole history again.",
  meta: "Fast report handoff",
};

const DEFAULT_AVAILABILITY = {
  kicker: "Next inspection slot",
  value: "Within 5 days",
  ctaLabel: "Book",
  ctaHref: "#book",
};

export default function Hero({
  eyebrow = "Independent Mould Diagnostics and Reporting",
  title = "Catch hidden mould with lab-verified testing",
  lede = "Independent inspection, moisture mapping and reporting for tenants, homeowners and property managers. We document the cause, extent and likely repair pathway before anyone starts selling you the fix.",
  background = "/images/hero-queenslander.jpg",
  backgroundAlt = "Queenslander bedroom interior opening through French doors onto a verandah at golden hour",
  trust = DEFAULT_TRUST,
  availability = DEFAULT_AVAILABILITY,
  compact = false,
  cta,
  secondaryTags,
  secondaryCta,
}) {
  const className = `hero hero--cinematic${compact ? " hero--compact" : ""}`;
  const hasFooter = (secondaryTags && secondaryTags.length > 0) || secondaryCta;

  return (
    <section className={className}>
      <div
        className="hero__media"
        role="img"
        aria-label={backgroundAlt}
        style={{ backgroundImage: `url("${background}")` }}
      />
      <div className="hero__veil" aria-hidden="true" />

      <div className="wrap hero__wrap">
        <div className="hero__main">
          <div className="hero__content">
            <Eyebrow className="hero__eyebrow">{eyebrow}</Eyebrow>
            <h1 className="hero__title">{title}</h1>
            <p className="hero__lede lede">{lede}</p>
            {cta ? (
              <a className="hero__cta-pill" href={cta.href}>
                <span>{cta.label}</span>
                <ArrowIcon />
              </a>
            ) : (
              <HeroAvailabilityForm />
            )}
            {trust ? (
              <TrustBadge
                className="trust-badge--cinematic"
                quote={trust.quote}
                meta={trust.meta}
              />
            ) : null}
          </div>

          {availability ? (
            <aside className="hero__availability" aria-label="Live booking availability">
              <div className="hero__availability-header">
                <span className="hero__availability-pulse" aria-hidden="true">
                  <span></span>
                </span>
                <span className="hero__availability-kicker">{availability.kicker}</span>
              </div>
              <span className="hero__availability-value">{availability.value}</span>
              <a className="hero__availability-cta" href={availability.ctaHref}>
                <span>{availability.ctaLabel}</span>
                <ArrowIcon />
              </a>
            </aside>
          ) : null}
        </div>

        {hasFooter ? (
          <div className="hero__footer">
            {secondaryTags && secondaryTags.length > 0 ? (
              <div className="hero__footer-tags">
                {secondaryTags.map((tag) => (
                  <span key={tag} className="hero__footer-tag">{tag}</span>
                ))}
              </div>
            ) : <span />}
            {secondaryCta ? (
              <a className="hero__footer-cta" href={secondaryCta.href}>
                <span>{secondaryCta.label}</span>
                <ArrowIcon />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
