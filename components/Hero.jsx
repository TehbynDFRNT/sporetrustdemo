import Eyebrow from "./Eyebrow";
import HeroAvailabilityForm from "./HeroAvailabilityForm";
import TrustBadge from "./TrustBadge";

const DEFAULT_TRUST = {
  quote:
    "Clear findings, photos and next steps made it easy to forward without explaining the whole history again.",
  meta: "Fast report handoff",
};

export default function Hero({
  eyebrow = "Independent Mould Diagnostics and Reporting",
  title = "Catch hidden mould with lab-verified testing",
  lede = "Independent inspection, moisture mapping and reporting for tenants, homeowners and property managers. We document the cause, extent and likely repair pathway before anyone starts selling you the fix.",
  background = "/images/hero-queenslander.jpg",
  backgroundAlt = "Queenslander bedroom interior opening through French doors onto a verandah at golden hour",
  trust = DEFAULT_TRUST,
}) {
  return (
    <section className="hero hero--cinematic">
      <div
        className="hero__media"
        role="img"
        aria-label={backgroundAlt}
        style={{ backgroundImage: `url("${background}")` }}
      />
      <div className="hero__veil" aria-hidden="true" />

      <div className="wrap hero__wrap">
        <div className="hero__content">
          <Eyebrow className="hero__eyebrow">{eyebrow}</Eyebrow>
          <h1 className="hero__title">{title}</h1>
          <p className="hero__lede lede">{lede}</p>
          <HeroAvailabilityForm />
          {trust ? (
            <TrustBadge
              className="trust-badge--cinematic"
              quote={trust.quote}
              meta={trust.meta}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
