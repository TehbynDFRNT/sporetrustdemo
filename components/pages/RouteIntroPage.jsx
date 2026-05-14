import Hero from "../Hero";

// UtilityBanner, MegaNav, Footer and the BookingTakeover / QuizTakeover /
// ReportDemoTakeover modals are mounted once at the root in app/layout.jsx
// so they persist across SPA navigation. Don't render them here.
export default function RouteIntroPage({
  eyebrow,
  title,
  lede,
  background,
  backgroundAlt,
  secondaryTags,
  secondaryCta,
  cards = [],
  cta = "Book inspection",
  ctaHref = "#book",
  children,
}) {
  return (
    <main>
      <Hero
        eyebrow={eyebrow}
        title={title}
        lede={lede}
        background={background}
        backgroundAlt={backgroundAlt}
        secondaryTags={secondaryTags}
        secondaryCta={secondaryCta}
        compact
        cta={{ label: cta, href: ctaHref }}
        trust={null}
        availability={null}
      />

      {cards.length > 0 ? (
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
      ) : null}

      {children}
    </main>
  );
}
