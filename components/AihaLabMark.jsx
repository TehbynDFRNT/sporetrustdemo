/* Inline ISO/IEC 17025 + AIHA lab-accreditation mark. No emblem asset is held
   on file (reproducing a testing-authority's actual logo would be a wrong or
   unlicensed claim), so accreditation surfaces render this neutral text badge
   instead. Colour follows `currentColor`; height is set per context in globals.css. */
export default function AihaLabMark({ className = "" }) {
  return (
    <svg
      className={`aiha-mark${className ? ` ${className}` : ""}`}
      viewBox="0 0 128 34"
      role="img"
      aria-label="AIHA-accredited lab analysis — ISO/IEC 17025"
    >
      <rect
        x="1.2"
        y="1.2"
        width="125.6"
        height="31.6"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.5"
      />
      <text
        x="64"
        y="15"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="8.5"
        fontWeight="600"
        letterSpacing="0.08em"
        fill="currentColor"
      >
        AIHA · ISO/IEC
      </text>
      <text
        x="64"
        y="27"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="0.12em"
        fill="currentColor"
      >
        17025
      </text>
    </svg>
  );
}
