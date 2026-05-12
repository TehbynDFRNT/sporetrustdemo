import ArrowIcon from "./icons/ArrowIcon";
import Reveal from "./Reveal";
import SentinelMark from "./SentinelMark";

const DEFAULT_INCLUSIONS = [
  {
    title: "Annual on-site inspection",
    copy:
      "A full thermal, moisture and humidity sweep — same protocol, fresh evidence — at the cadence your home actually needs.",
  },
  {
    title: "Updated digital report",
    copy:
      "Year-on-year tracking so changes are easy to see and share with insurers, builders, landlords or your future buyer.",
  },
  {
    title: "Member rates on add-ons",
    copy:
      "Discounted re-inspections, lab-backed air sampling and post-remediation clearance checks — only if and when you need them.",
  },
  {
    title: "Priority booking",
    copy:
      "Sentinel members move to the front of the queue when a quick reading or follow-up visit is needed.",
  },
];

export default function Sentinel({
  inclusions = DEFAULT_INCLUSIONS,
  pricing = { figure: "$13.95", meta: "per week" },
  cta = { label: "Join Sentinel", href: "#book" },
}) {
  return (
    <section className="sentinel" id="sentinel">
      <div className="wrap">
        <Reveal>
          <article className="sentinel-card" aria-labelledby="sentinel-card-title">
            <div className="sentinel-card__head">
              <div className="sentinel-card__mark">
                <SentinelMark size={98} />
              </div>
              <div className="sentinel-card__heading">
                <span className="sentinel-card__supertext">Year-round prevention</span>
                <h3 className="sentinel-card__title" id="sentinel-card-title">
                  Sporetrust Sentinel
                </h3>
                <p className="sentinel-card__tagline">
                  Industry-first mould prevention and pre-contamination diagnostics subscription. Prevent building damage and protect your family through wet weather seasons.
                </p>
              </div>
              {pricing ? (
                <div className="sentinel-card__price">
                  <span className="sentinel-card__price-figure">{pricing.figure}</span>
                  <span className="sentinel-card__price-meta">{pricing.meta}</span>
                </div>
              ) : null}
            </div>

            <ul className="sentinel-card__inclusions" role="list">
              {inclusions.map((item, index) => (
                <li className="sentinel-card__inclusion" key={item.title}>
                  <span className="sentinel-card__inclusion-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="sentinel-card__foot">
              <a className="btn sentinel-card__cta" href={cta.href}>
                {cta.label} <ArrowIcon />
              </a>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
