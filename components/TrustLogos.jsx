import AihaLabMark from "./AihaLabMark";

const DEFAULT_LOGOS = [
  {
    key: "iicrc",
    src: "/logos/iicrc.svg",
    alt: "IICRC certified — Institute of Inspection, Cleaning and Restoration Certification",
  },
  {
    key: "aiha",
    mark: "aiha",
  },
];

export default function TrustLogos({
  logos = DEFAULT_LOGOS,
  className = "",
  label,
}) {
  return (
    <div
      className={`trust-logos${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={label ?? "Accreditation and certification"}
    >
      {label ? <span className="trust-logos__label">{label}</span> : null}
      <ul className="trust-logos__list" role="list">
        {logos.map((logo) => (
          <li
            key={logo.key || logo.src}
            className={`trust-logos__item trust-logos__item--${logo.key || ""}`}
          >
            {logo.mark === "aiha" ? (
              <AihaLabMark />
            ) : (
              <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
