import ArrowIcon from "./icons/ArrowIcon";
import Eyebrow from "./Eyebrow";
import TrustLogos from "./TrustLogos";

const DEFAULT_INCLUSIONS = [
  {
    title: "Mould is a building defect.",
    copy: "Visible spotting is a signal, not the source — moisture and waterproofing come first.",
  },
  {
    title: "Diagnosis independent of the fix.",
    copy: "No remediation, repair or treatment revenue. The report is the product.",
  },
  {
    title: "Year-round Sentinel monitoring.",
    copy: "Industry-first subscription that keeps a home on a documented diagnostic cadence.",
  },
  {
    title: "AI- and lab-confirmed reporting.",
    copy: "Digital classification plus NATA-accredited sampling — evidence that holds up.",
  },
  {
    title: "Vetted remediation & repair pathway.",
    copy: "Quality partners you can hand the report to, instead of juggling cowboy quotes.",
  },
];

function CheckGlyph() {
  return (
    <svg className="why-hero__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WhySporetrustHero({
  eyebrow = "our position",
  title = "A better way to prevent and treat mould.",
  lede = "Between scrubbing it yourself and a $20k tear-out, there's never been a professional middle. Sporetrust is the layer that should have been there — built for owners and tenants who want to manage moisture before it becomes major works.",
  cta = { label: "Book a diagnostic", href: "#book" },
  inclusions = DEFAULT_INCLUSIONS,
}) {
  return (
    <section className="why-hero" aria-labelledby="why-hero-title">
      <div className="wrap why-hero__wrap">
        <div className="why-hero__content">
          <Eyebrow className="why-hero__eyebrow">{eyebrow}</Eyebrow>
          <h1 className="why-hero__title" id="why-hero-title">{title}</h1>
          <p className="why-hero__lede lede">{lede}</p>
          <a className="why-hero__cta" href={cta.href}>
            <span>{cta.label}</span>
            <ArrowIcon />
          </a>
        </div>

        <aside className="why-hero__manifesto" aria-label="What Sporetrust delivers">
          <span className="why-hero__manifesto-label">Sporetrust at a glance</span>
          <ul className="why-hero__inclusions" role="list">
            {inclusions.map((item) => (
              <li key={item.title} className="why-hero__inclusion">
                <CheckGlyph />
                <div className="why-hero__inclusion-text">
                  <strong>{item.title}</strong>
                  <span>{item.copy}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="why-hero__divider" aria-hidden="true" />
          <TrustLogos className="trust-logos--why-hero" label="Accreditation" />
        </aside>
      </div>
    </section>
  );
}
