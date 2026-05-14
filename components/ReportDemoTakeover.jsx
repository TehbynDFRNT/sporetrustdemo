"use client";

import { useEffect, useRef, useState } from "react";
import Brand from "./Brand";
import ArrowIcon from "./icons/ArrowIcon";

const OPEN_REPORT_DEMO_EVENT = "sporetrust:open-report-demo";
const OPEN_BOOKING_EVENT = "sporetrust:open-booking";

const REPORT_META = {
  id: "ST-2024-05-0187",
  date: "12 May 2024",
  inspector: "J. Rivera · IICRC-cert.",
  method: "AS/NZS 4849 · ASTM D7391",
  address: "Sample residence · Coorparoo, Brisbane QLD",
};

const LOCATIONS = [
  { id: "bedroom-1", label: "Bedroom #1", tier: "Severe" },
  { id: "ensuite", label: "Ensuite", tier: "Moderate" },
  { id: "living", label: "Living", tier: "Normal" },
  { id: "subfloor", label: "Subfloor", tier: "Severe" },
];

const ACTIVE_LOCATION_ID = "bedroom-1";

const RATING = {
  tier: "Severe",
  label: "Mould pressure",
  sub: "Localised wetting event with measurable airborne particulate elevation. Active source, repairable scope.",
};

const MOISTURE_READINGS = [
  { id: 1, surface: "Ceiling — centre", value: 9.2, level: "Normal", x: 50, y: 14, dir: "down-right" },
  { id: 2, surface: "Wall — SE corner", value: 17.8, level: "Severe", x: 72, y: 44, dir: "up-left" },
  { id: 3, surface: "Skirting — SE", value: 15.4, level: "Moderate", x: 78, y: 82, dir: "up-left" },
  { id: 4, surface: "Wall — S", value: 11.1, level: "Normal", x: 22, y: 56, dir: "up-right" },
];

const AIR_SAMPLES = {
  outdoor: { label: "Outdoor", value: "32", unit: "cts/L", level: "Normal" },
  indoor: { label: "Bedroom #1", value: "487", unit: "cts/L", level: "Severe" },
  ratio: "15.2×",
  dominant: "Aspergillus / Penicillium-like",
};

const CAUSES = [
  {
    rank: "Primary",
    copy: "Cold-bridge condensation behind cavity at SE corner — single-glazed sliding-door reveal + insufficient sub-floor ventilation.",
  },
  {
    rank: "Secondary",
    copy: "Trace vapour-barrier damage at door sill — re-inspect during remediation.",
  },
];

const RESOLUTION_STEPS = [
  { kind: "Mechanical", copy: "Sub-floor ventilation upgrade + exhaust re-routing." },
  { kind: "Structural", copy: "Lift skirting at affected corner, re-flash door sill." },
  { kind: "Monitor", copy: "Week-4 moisture re-read before closing the wall." },
  { kind: "Verify", copy: "Repeat air sample to confirm return to baseline." },
];

const RESOLUTION_FOOT = [
  { label: "Indicative scope", value: "$2,400 – $4,100" },
  { label: "Timeframe", value: "2 – 4 weeks" },
];

function tierClass(tier) {
  const key = String(tier || "").toLowerCase();
  if (key === "normal") return "report-demo__pill--ok";
  if (key === "moderate") return "report-demo__pill--warn";
  if (key === "severe") return "report-demo__pill--bad";
  return "";
}

function MoistureMarkers({ activeId, onHover }) {
  return (
    <div className="report-demo__visual-markers" aria-hidden="true">
      {MOISTURE_READINGS.map((r) => (
        <button
          type="button"
          key={r.id}
          className={`report-demo__visual-marker report-demo__visual-marker--${r.dir}${
            activeId === r.id ? " is-active" : ""
          }`}
          style={{ left: `${r.x}%`, top: `${r.y}%` }}
          onMouseEnter={() => onHover(r.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(r.id)}
          onBlur={() => onHover(null)}
          aria-label={`Moisture recording ${String(r.id).padStart(2, "0")} — ${r.surface}, ${r.value}% (${r.level})`}
        >
          <span className="report-demo__visual-marker-dot">{r.id}</span>
          <span className="report-demo__visual-marker-leader-v" aria-hidden="true" />
          <span className="report-demo__visual-marker-leader-h" aria-hidden="true" />
          <span className="report-demo__visual-marker-label">
            <span className="report-demo__visual-marker-eyebrow">
              Moisture recording {String(r.id).padStart(2, "0")}
            </span>
            <strong>
              {r.value.toFixed(1)}<em>%</em> · {r.level}
            </strong>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function ReportDemoTakeover() {
  const [open, setOpen] = useState(false);
  const [activeReading, setActiveReading] = useState(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    function openDemo() {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    }

    function handleClick(event) {
      const trigger = event.target?.closest?.('a[href="#report-demo"], [data-report-demo-trigger]');
      if (!trigger) return;
      event.preventDefault();
      openDemo();
    }

    document.addEventListener("click", handleClick);
    window.addEventListener(OPEN_REPORT_DEMO_EVENT, openDemo);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener(OPEN_REPORT_DEMO_EVENT, openDemo);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  function closeDemo() {
    setOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus?.());
  }

  function openBooking() {
    setOpen(false);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: {} }));
    });
  }

  if (!open) return null;

  return (
    <div className="report-demo" role="dialog" aria-modal="true" aria-label="Sporetrust digital report — demo">
      <header className="report-demo__chrome">
        <div className="report-demo__chrome-left">
          <div className="report-demo__chrome-brand">
            <Brand />
          </div>
          <nav className="report-demo__tabs" aria-label="Inspection locations">
            <ul role="tablist">
              {LOCATIONS.map((loc) => {
                const isActive = loc.id === ACTIVE_LOCATION_ID;
                return (
                  <li key={loc.id} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`report-demo__tab${isActive ? " is-active" : ""}`}
                      disabled={!isActive}
                    >
                      <span className="report-demo__tab-label">{loc.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <button type="button" className="report-demo__close" onClick={closeDemo} autoFocus>
          Exit demo
        </button>
      </header>

      <section className="report-demo__subhead">
        <div className="report-demo__subhead-left">
          <h1>Bedroom #1</h1>
          <p className="report-demo__subhead-meta">
            {REPORT_META.address} <span aria-hidden>·</span> {REPORT_META.id} <span aria-hidden>·</span> {REPORT_META.date} <span aria-hidden>·</span> {REPORT_META.inspector}
          </p>
        </div>
        <div className="report-demo__subhead-right">
          <div className="report-demo__rating-mini" aria-label={`Mould pressure rating: ${RATING.tier}`}>
            <span className={`report-demo__pill ${tierClass(RATING.tier)} report-demo__rating-mini-pill`}>
              {RATING.tier}
            </span>
            <strong>{RATING.label}</strong>
          </div>
        </div>
      </section>

      <main className="report-demo__pane">
        <div className="report-demo__zone report-demo__zone--evidence">
          <div className="report-demo__evidence-grid">
            <article className="report-demo__card report-demo__card--visual">
              <header className="report-demo__card-head">
                <h3>Visual evidence</h3>
                <span className="report-demo__card-aside">Visible light + thermal imaging · same frame</span>
              </header>
              <div className="report-demo__visual-split">
                <figure className="report-demo__visual-figure">
                  <img src="/images/bedroom-visible.jpg" alt="Bedroom in visible light — SE corner appears clean" loading="lazy" />
                  <figcaption>Visible</figcaption>
                  <MoistureMarkers activeId={activeReading} onHover={setActiveReading} />
                </figure>
                <figure className="report-demo__visual-figure">
                  <img src="/images/bedroom-thermal.jpg" alt="Thermal capture of the same wall showing a cold patch" loading="lazy" />
                  <figcaption>Thermal</figcaption>
                  <MoistureMarkers activeId={activeReading} onHover={setActiveReading} />
                </figure>
              </div>
              <p className="report-demo__card-foot">Δ −6.3 °C vs room · cavity wetting at SE corner — invisible at the surface, mapped in thermal.</p>
            </article>

            <article className="report-demo__card report-demo__card--air">
              <header className="report-demo__card-head">
                <h3>Air sample</h3>
                <div className="report-demo__air-stats">
                  <span>
                    <em>Outdoor</em>
                    <strong>{AIR_SAMPLES.outdoor.value}<i>{AIR_SAMPLES.outdoor.unit}</i></strong>
                  </span>
                  <span>
                    <em>Bedroom #1</em>
                    <strong className="report-demo__air-stats-alarm">{AIR_SAMPLES.indoor.value}<i>{AIR_SAMPLES.indoor.unit}</i></strong>
                  </span>
                  <span>
                    <em>vs baseline</em>
                    <strong>{AIR_SAMPLES.ratio}</strong>
                  </span>
                </div>
              </header>
              <figure className="report-demo__air-figure">
                <img
                  src="/images/air-sample-comparison.jpg"
                  alt="Air-sample slides side by side: outdoor control (clean) and Bedroom #1 (heavy dark spore burden)"
                />
              </figure>
              <p className="report-demo__card-foot">Dominant morphotype: {AIR_SAMPLES.dominant}</p>
            </article>

            <article className="report-demo__card report-demo__card--data">
              <header className="report-demo__card-head">
                <h3>Moisture readings</h3>
                <span className="report-demo__card-aside">Pinless · Wagner Orion 940 · 25 mm depth</span>
              </header>
              <table className="report-demo__readings">
                <tbody>
                  {MOISTURE_READINGS.map((r) => (
                    <tr
                      key={r.id}
                      className={activeReading === r.id ? "is-active" : ""}
                      onMouseEnter={() => setActiveReading(r.id)}
                      onMouseLeave={() => setActiveReading(null)}
                    >
                      <td>
                        <span className="report-demo__readings-index" aria-hidden="true">{String(r.id).padStart(2, "0")}</span>
                        {r.surface}
                      </td>
                      <td className="report-demo__readings-value">{r.value.toFixed(1)}</td>
                      <td>
                        <span className={`report-demo__pill ${tierClass(r.level)}`}>{r.level}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </div>

        <div className="report-demo__zone report-demo__zone--interp">
          <div className="report-demo__interp-stack">
            <article className="report-demo__card report-demo__card--narrative">
              <header className="report-demo__card-head">
                <h3>Findings</h3>
              </header>
              <div className="report-demo__card-body">
                <p>
                  Localised moisture concentration at the SE wall corner, ~1.2 m above floor. Thermal shows
                  a <strong>−6.3 °C</strong> cold patch; pinless moisture confirms <strong>15.4 – 17.8 %</strong> in
                  substrate without visible staining. Air sample reads <strong>15.2×</strong> outdoor baseline —
                  early-stage cavity event, present but not yet broken to surface.
                </p>
                <div className="report-demo__findings-cause">
                  <h4>Most likely source</h4>
                  <ul className="report-demo__causes">
                    {CAUSES.map((c) => (
                      <li key={c.rank}>
                        <span className="report-demo__cause-rank">{c.rank}</span>
                        <span>{c.copy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="report-demo__card report-demo__card--resolution">
              <header className="report-demo__resolution-head">
                <div>
                  <span className="report-demo__resolution-eyebrow">Recommended path</span>
                  <h3>Best-path resolution</h3>
                </div>
                <div className="report-demo__resolution-stats">
                  {RESOLUTION_FOOT.map((f) => (
                    <span key={f.label}>
                      <em>{f.label}</em>
                      <strong>{f.value}</strong>
                    </span>
                  ))}
                </div>
              </header>
              <ol className="report-demo__resolution">
                {RESOLUTION_STEPS.map((s, i) => (
                  <li key={s.kind}>
                    <span className="report-demo__resolution-step">{i + 1}</span>
                    <div>
                      <strong>{s.kind}</strong>
                      <p>{s.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="report-demo__resolution-cta">
                <span className="report-demo__resolution-cta-text">
                  Ready to act? We'll coordinate the works with a vetted partner.
                </span>
                <button
                  type="button"
                  className="report-demo__resolution-cta-btn"
                  onClick={openBooking}
                >
                  Schedule the works
                  <ArrowIcon />
                </button>
              </div>
            </article>
          </div>
        </div>
      </main>

      <div className="report-demo__cta-bar" role="region" aria-label="Book an assessment">
        <div className="report-demo__cta-text">
          <strong>Sample report.</strong>
          <span>See what we'd find at your place — 45-minute on-site, 48-hour report.</span>
        </div>
        <div className="report-demo__cta-actions">
          <button type="button" className="report-demo__cta-btn" onClick={openBooking}>
            Book your diagnostic
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
