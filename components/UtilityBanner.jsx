import ArrowIcon from "./icons/ArrowIcon";

export default function UtilityBanner({
  kicker = "Next available appointment",
  value = "Within 5 days",
  ctaLabel = "Book now",
  ctaHref = "#book",
}) {
  return (
    <div className="utility-banner" role="status" aria-label="Booking availability">
      <div className="wrap utility-banner__inner">
        <span className="utility-banner__pulse" aria-hidden="true">
          <span></span>
        </span>
        <span className="utility-banner__text">
          <span className="utility-banner__kicker">{kicker}:</span>
          <span className="utility-banner__value">{value}</span>
        </span>
        <span className="utility-banner__sep" aria-hidden="true">·</span>
        <a className="utility-banner__cta" href={ctaHref}>
          {ctaLabel} <ArrowIcon />
        </a>
      </div>
    </div>
  );
}
