import ArrowIcon from "./icons/ArrowIcon";
import Reveal from "./Reveal";
import SentinelMark from "./SentinelMark";

const DEFAULT_INCLUSIONS = [
  {
    title: "Two annual on-site diagnostics",
    copy:
      "A full thermal, moisture and humidity sweep, twice a year — same Sporetrust protocol, scheduled in advance.",
  },
  {
    title: "Year-on-year property record",
    copy:
      "Each visit stacks into a standing diagnostic history — defensible evidence for insurers, builders, tribunals or future buyers.",
  },
  {
    title: "Member rate on re-checks & lab work",
    copy:
      "Subscriber rate on follow-up re-inspections and lab-backed air sampling when something needs a closer look.",
  },
  {
    title: "Priority booking & subscriber support",
    copy:
      "Front-of-queue scheduling plus a subscriber line for moisture and mould questions between visits.",
  },
];

export default function SentinelCard({
  inclusions = DEFAULT_INCLUSIONS,
  pricing = { figure: "$22.95", meta: "per week" },
  cta = { label: "Join Sentinel", href: "#book" },
  secondaryCta,
  image,
  imageAlt = "",
  tagline = "Two diagnostic visits a year, a stacked record of your home, and reduced subscriber rates whenever something needs a closer look.",
}) {
  const className = `sentinel-card${image ? " sentinel-card--has-image" : ""}`;
  return (
    <Reveal>
      <article className={className} aria-labelledby="sentinel-card-title">
        {image ? (
          <>
            <div
              className="sentinel-card__media"
              role="img"
              aria-label={imageAlt}
              style={{ backgroundImage: `url("${image}")` }}
            />
            <div className="sentinel-card__veil" aria-hidden="true" />
          </>
        ) : null}
        <div className="sentinel-card__head">
          <div className="sentinel-card__mark">
            <SentinelMark size={98} />
          </div>
          <div className="sentinel-card__heading">
            <span className="sentinel-card__supertext">Year-round prevention</span>
            <h3 className="sentinel-card__title" id="sentinel-card-title">
              Sporetrust Sentinel
            </h3>
            <p className="sentinel-card__tagline">{tagline}</p>
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
          {secondaryCta ? (
            <a className="sentinel-card__cta-ghost" href={secondaryCta.href}>
              {secondaryCta.label} <ArrowIcon />
            </a>
          ) : null}
        </div>
      </article>
    </Reveal>
  );
}
