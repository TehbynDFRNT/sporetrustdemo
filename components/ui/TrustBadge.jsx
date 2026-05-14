function ReviewStars() {
  return (
    <div className="review-stars" aria-label="Five star review style markers">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.6L12.4 6.7L18 7.5L14 11.5L14.9 17.1L10 14.4L5.1 17.1L6 11.5L2 7.5L7.6 6.7L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}

export default function TrustBadge({ quote, meta, className = "" }) {
  return (
    <aside className={`trust-badge${className ? ` ${className}` : ""}`}>
      <ReviewStars />
      <p>{quote}</p>
      <span>{meta}</span>
    </aside>
  );
}
