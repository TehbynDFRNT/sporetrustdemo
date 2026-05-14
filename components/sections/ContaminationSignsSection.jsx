export default function ContaminationSignsSection({ signs }) {
  return (
    <section className="problem-bg mould-strong">
      <div className="wrap">
        <div className="find-head">
          <div className="copy">
            <span className="eyebrow">[ signs of contamination ]</span>
            <h2>50% of QLD homes had mould within 12 months. Does yours?</h2>
            <p className="lede">
              Visible mould is only one signal. We document moisture patterns, material damage, odour and air movement
              so hidden contamination has somewhere to show itself.
            </p>
          </div>
          <figure className="find-head-media">
            <img src="/images/elevated-mould-count.jpg" alt="Elevated mould count viewed through lab testing" />
          </figure>
        </div>
        <div className="find-grid" aria-label="Signs of contamination">
          {signs.map((card) => (
            <div key={card.num} className="find-card">
              <div className="find-meta">
                <span className="num">{card.num}</span>
                <span className="tag">{card.tag}</span>
              </div>
              <figure className="find-card-media">
                <img src={card.image} alt={card.imageAlt} loading="lazy" />
              </figure>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
              <div className="find-foot">
                <span className="l">Documents</span>
                <span className="r">{card.foot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
