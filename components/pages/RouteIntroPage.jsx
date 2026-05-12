import BookingTakeover from "../BookingTakeover";
import Footer from "../Footer";
import MegaNav from "../MegaNav";

export default function RouteIntroPage({
  eyebrow,
  title,
  lede,
  cards = [],
  cta = "Book inspection",
}) {
  return (
    <>
      <MegaNav />
      <main>
        <section className="route-page-hero problem-bg">
          <div className="wrap route-page-hero-inner">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="lede">{lede}</p>
            <div className="route-page-actions">
              <a className="btn" href="#book">
                {cta} -&gt;
              </a>
              <a className="btn route-secondary" href="/">
                Back to home
              </a>
            </div>
          </div>
        </section>

        <section className="solution route-page-body">
          <div className="wrap">
            <div className="home-pathway-grid route-card-grid">
              {cards.map((card) => (
                <article className="home-pathway-card" key={card.title}>
                  <span>{card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BookingTakeover />
    </>
  );
}
