export default function JourneySection({ items }) {
  return (
    <section className="journey" id="journey">
      <div className="wrap">
        <div className="journey-head">
          <span className="eyebrow">[ from diagnosis to clearance ]</span>
          <h2>From mould diagnosis to repaired, cleared and clean.</h2>
          <p className="lede">
            Remediation and repair are often different jobs. If your report shows works are needed, Sporetrust helps
            you connect with trusted remediators and specialist repair contractors as one coordinated pathway, so the
            likely scope is clear before your home is opened up.
          </p>
        </div>
        <div className="journey-grid">
          {items.map((item) => (
            <article className="journey-card" key={item.num}>
              <div className="journey-card-top">
                <span className="num">Step {Number(item.num)}</span>
                <span className="title">{item.title}</span>
              </div>
              <h3>{item.heading}</h3>
              <p>{item.copy}</p>
              <div className="journey-meta">{item.meta}</div>
            </article>
          ))}
        </div>
        <div className="journey-callouts">
          <aside className="journey-warning">
            <span>Before remediation starts</span>
            <h3>Know who is putting the home back together.</h3>
            <p>
              Some remediation scopes end once contaminated materials are removed and cleaned. That can leave owners,
              tenants and managers needing urgent builder, plastering, flooring, cabinetry or plumbing quotes after the
              home is already opened up. We help surface those needs earlier, so remediation and repair can be planned
              as one pathway.
            </p>
          </aside>
          <aside className="journey-note">
            <span>Independent diagnosis</span>
            <h3>Coordinated next steps.</h3>
            <p>
              In an unregulated industry, trust matters. We focus on unbiased diagnostics, clear evidence and practical
              support through the pathway to clearance. If action is needed, we can introduce trusted partners and help
              manage the information handoff at no extra cost. You decide who to hire, and when. If you want us back for
              clearance checks and a final prevention clean, we are here to help.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
