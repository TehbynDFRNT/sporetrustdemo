// Static "what your report looks like" preview — mirrors the visual evidence
// + rating block from ReportDemoTakeover so the home/Sentinel pages show the
// actual product the user will receive, not a generic PDF mock.

const MARKERS = [
  { id: 1, x: 50, y: 14 },
  { id: 2, x: 72, y: 44 },
  { id: 3, x: 78, y: 82 },
  { id: 4, x: 22, y: 56 },
];

export default function ReportPreviewCard() {
  return (
    <article className="report-preview" aria-label="Sample digital report preview">
      <header className="report-preview__head">
        <div>
          <h3>Bedroom #1</h3>
          <p>Sample residence · Coorparoo, Brisbane QLD</p>
        </div>
        <div className="report-preview__rating">
          <span className="report-preview__rating-pill">Severe</span>
          <strong>Mould pressure</strong>
        </div>
      </header>

      <div className="report-preview__visual">
        <figure className="report-preview__figure">
          <img src="/images/bedroom-visible.jpg" alt="Bedroom in visible light — SE corner appears clean" loading="lazy" />
          <figcaption>Visible</figcaption>
          <div className="report-preview__markers" aria-hidden="true">
            {MARKERS.map((m) => (
              <span key={m.id} className="report-preview__marker" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                {m.id}
              </span>
            ))}
          </div>
        </figure>
        <figure className="report-preview__figure">
          <img src="/images/bedroom-thermal.jpg" alt="Thermal capture showing cold patch at SE corner" loading="lazy" />
          <figcaption>Thermal</figcaption>
          <div className="report-preview__markers" aria-hidden="true">
            {MARKERS.map((m) => (
              <span key={m.id} className="report-preview__marker" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                {m.id}
              </span>
            ))}
          </div>
        </figure>
      </div>

      <p className="report-preview__caption">
        Δ <strong>−6.3 °C</strong> vs room · cavity wetting at SE corner — invisible at the surface, mapped in thermal.
      </p>
    </article>
  );
}
