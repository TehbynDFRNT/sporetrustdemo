import ArrowIcon from "../icons/ArrowIcon";
import TrustBadge from "../ui/TrustBadge";

export default function PricingSection({ tiers, trustBadge }) {
  return (
    <section className="pricing" id="pricing">
      <div className="wrap">
        <span className="eyebrow">[ fixed pricing ]</span>
        <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>No hourly rates. No surprises.</h2>
        <div className="price-grid">
          {tiers.map((tier) => (
            <div key={tier.title} className={tier.featured ? "tier featured" : "tier"}>
              {tier.featured ? <span className="badge">Most booked</span> : null}
              <h3>{tier.title}</h3>
              <div className="tag">{tier.tag}</div>
              <div className="price">{tier.price}</div>
              <div className="price-sub">{tier.sub}</div>
              <ul>
                {tier.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <a className={tier.featured ? "btn btn-light" : "btn"} href="#book">
                {tier.button} <ArrowIcon />
              </a>
            </div>
          ))}
        </div>
        <TrustBadge className="pricing-proof" quote={trustBadge.quote} meta={trustBadge.meta} />
        <div className="price-foot">
          Larger homes, multiple buildings, commercial sites or specialist insurance reports -{" "}
          <a href="#book">request a custom quote</a>.
        </div>
      </div>
    </section>
  );
}
