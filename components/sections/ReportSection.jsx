import CheckIcon from "../icons/CheckIcon";
import TrustBadge from "../ui/TrustBadge";

export default function ReportSection({ reportItems, trustBadge }) {
  return (
    <section className="solution" id="report">
      <div className="wrap">
        <span className="eyebrow">[ what's in your report ]</span>
        <h2 style={{ marginTop: 28, maxWidth: "30ch" }}>
          Official evidence for the people who need to act.
        </h2>
        <div className="what-grid">
          <div className="report-checks">
            <ul className="what-list">
              {reportItems.map(([title, copy]) => (
                <li key={title}>
                  <CheckIcon />
                  <div>
                    <strong>{title}</strong>
                    <span className="copy">{copy}</span>
                  </div>
                </li>
              ))}
            </ul>
            <TrustBadge quote={trustBadge.quote} meta={trustBadge.meta} />
          </div>

          <figure className="report report-image-only">
            <img
              src="/images/sporetrace-report.jpg"
              alt="Sample mould diagnostic report showing visual evidence, thermal evidence, moisture record, air sample record and summary"
              loading="lazy"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
