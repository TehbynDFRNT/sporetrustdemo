import ReviewStars from "./ReviewStars";

export default function TrustBadge({ quote, meta, className = "" }) {
  return (
    <aside className={`trust-badge${className ? ` ${className}` : ""}`}>
      <ReviewStars />
      <p>{quote}</p>
      <span>{meta}</span>
    </aside>
  );
}
