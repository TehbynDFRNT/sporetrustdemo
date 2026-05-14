import FaqAccordion from "../FaqAccordion";

export default function FaqSection({ items }) {
  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="faq-grid">
          <div>
            <span className="eyebrow">[ common questions ]</span>
            <h2 style={{ marginTop: 28 }}>Before you book.</h2>
            <p className="lede" style={{ marginTop: 22 }}>
              Still unsure? Send us a quick note in the booking form. We'll come back the same business day.
            </p>
          </div>
          <div>
            <FaqAccordion items={items} />
          </div>
        </div>
      </div>
    </section>
  );
}
