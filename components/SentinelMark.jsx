export default function SentinelMark({ size = 64, className = "", alt = "Sentinel — year-round prevention" }) {
  return (
    <img
      src="/logos/sentinel.png"
      alt={alt}
      width={size}
      height={size}
      className={`sentinel-mark${className ? ` ${className}` : ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}
