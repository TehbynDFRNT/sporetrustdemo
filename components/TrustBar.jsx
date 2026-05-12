import ReviewStars from "./ReviewStars";
import TrustLogos from "./TrustLogos";

export default function TrustBar({
  ratingLabel = "Trusted by Australian homes",
  logos,
}) {
  return (
    <div className="trust-bar" role="region" aria-label="Trust and accreditation">
      <div className="wrap trust-bar__inner">
        <div className="trust-bar__rating">
          <ReviewStars className="review-stars--bar" label={`5-star rated · ${ratingLabel}`} />
          <span className="trust-bar__rating-label">{ratingLabel}</span>
        </div>
        <TrustLogos className="trust-logos--bar" logos={logos} />
      </div>
    </div>
  );
}
