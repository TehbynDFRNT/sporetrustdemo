const DEFAULT_LOGOS = [
  {
    key: "iicrc",
    src: "/logos/iicrc.svg",
    alt: "IICRC certified — Institute of Inspection, Cleaning and Restoration Certification",
  },
  {
    key: "nata",
    src: "/logos/nata.png",
    alt: "NATA accredited laboratory analysis — National Association of Testing Authorities, Australia",
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
            <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" />
          </li>
        ))}
      </ul>
    </div>
  );
}
