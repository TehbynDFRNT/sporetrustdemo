import TrustBadge from "../ui/TrustBadge";

export default function MethodologySection({ methods, trustBadge }) {
  return (
    <section className="solution">
      <div className="wrap">
        <div className="section-intro split">
          <div>
            <span className="eyebrow">[ how we diagnose ]</span>
            <h2>A complete analysis, every time.</h2>
            <p className="lede">
              Every Sporetrust inspection runs the same protocol, so the diagnosis is consistent, defensible and
              complete.
            </p>
          </div>
          <TrustBadge quote={trustBadge.quote} meta={trustBadge.meta} />
        </div>
        <div className="methodology-grid">
          {methods.map((method) => (
            <article className="method" key={method.num}>
              <figure className="method-media">
                <img src={method.image} alt={method.imageAlt} loading="lazy" />
              </figure>
              <div className="method-meta">
                <span className="num">{method.num}</span>
                <span className="tag">{method.tag}</span>
              </div>
              <h3>{method.title}</h3>
              <p className="m-measure">{method.measure}</p>
              <div className="m-divider" />
              <p className="m-reveals">
                <strong>Reveals</strong>
                {method.reveals}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
