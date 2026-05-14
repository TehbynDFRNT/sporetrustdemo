export default function HomePathwaysSection({ pathways }) {
  return (
    <section className="home-pathways solution">
      <div className="wrap">
        <div className="section-intro split">
          <div>
            <span className="eyebrow">[ what brought you here ]</span>
            <h2>Mould problems do not all start in the same place.</h2>
          </div>
        </div>

        <div className="home-pathway-grid">
          {pathways.map((item) => (
            <a className="home-pathway-card" href={item.href} key={item.title}>
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <strong>{item.link} -&gt;</strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
