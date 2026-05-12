export default function ReviewStars({ count = 5, className = "", label = "Five star rating" }) {
  return (
    <div className={`review-stars${className ? ` ${className}` : ""}`} aria-label={label} role="img">
      {Array.from({ length: count }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.6L12.4 6.7L18 7.5L14 11.5L14.9 17.1L10 14.4L5.1 17.1L6 11.5L2 7.5L7.6 6.7L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}
