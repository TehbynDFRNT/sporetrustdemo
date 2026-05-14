export default function PartnerPathwaySection({ routes }) {
  return (
    <section className="partner-pathway solution">
      <div className="wrap partner-pathway-grid">
        <div>
          <span className="eyebrow">[ trusted partner pathways ]</span>
          <h2>Independent diagnosis first. Coordinated action next.</h2>
          <p className="lede">
            We do not perform remediation or building work ourselves. That keeps the report independent while still
            giving you support through the contractor handoff.
          </p>
        </div>
        <div className="partner-route-list">
          {routes.map((route) => (
            <a href={route.href} className="partner-route-card" key={route.title}>
              <h3>{route.title}</h3>
              <p>{route.copy}</p>
              <span>Open pathway -&gt;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
