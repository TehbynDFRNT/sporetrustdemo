export default function AudienceEvidenceSection({ panels }) {
  return (
    <section className="problem-bg mould-strong">
      <div className="wrap">
        <span className="eyebrow">[ evidence before argument ]</span>
        <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>
          Unbiased testing and documentation of damage, for everyone involved.
        </h2>
        <p className="lede problem-lede">
          One in two Australians reported mould or dampness at home in the previous year. In Queensland rentals, damp
          and mould can also become a minimum housing standards issue. A Sporetrust report turns stains, odour, moisture
          and damage into a record people can act on.
        </p>

        <div className="audience-tabs" aria-label="Evidence pathways by customer type">
          {panels.map((panel, index) => (
            <input
              key={panel.id}
              className="audience-toggle"
              type="radio"
              name="audience"
              id={`audience-${panel.id}`}
              defaultChecked={index === 0}
            />
          ))}
          <div className="audience-tab-list" role="tablist" aria-label="Customer type">
            {panels.map((panel) => (
              <label key={panel.id} htmlFor={`audience-${panel.id}`}>
                {panel.label}
              </label>
            ))}
          </div>
          <div className="audience-card-sets">
            {panels.map((panel) => (
              <div key={panel.id} className={`problem-grid audience-card-set ${panel.id}`}>
                {panel.cards.map((card) => (
                  <div key={card.num} className="pcard">
                    <span className="num">{card.num}</span>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
