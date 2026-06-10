"use client";

import { useMemo, useState } from "react";
import Brand from "../../../components/Brand";
import ArrowIcon from "../../../components/icons/ArrowIcon";

// Standalone-page version of the marketing demo's takeover. Reuses
// .report-demo__* classes verbatim so the visual language is identical;
// the parent .report-page wrapper overrides the demo's fixed
// positioning so the page scrolls naturally.
//
// Tab structure for a real inspection:
//   [Outdoor]?, room-1, room-2, ...   one tab per sample_location
//   scope                              whole-inspection scope of works
//   next-steps                         pathway cards (handle / connect)
//   partners                           matched partners (real data)

const PUBLIC_BUCKET_BASE =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
    : "";

const SEVERITY_LABEL = {
  none: "Clear",
  normal: "Normal",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
  minor: "Minor",
  major: "Major",
};

const SOURCE_CATEGORY_LABEL = {
  roof: "Roof",
  walls: "Walls",
  wet_area: "Wet area",
  plumbing: "Plumbing",
  hvac: "HVAC",
  ventilation: "Ventilation",
  drainage: "Drainage",
  subfloor: "Subfloor",
  appliance: "Appliance",
  condensation: "Condensation",
  unknown: "Unknown",
};

function tierClass(tier) {
  const key = String(tier || "").toLowerCase();
  if (key === "normal" || key === "minor" || key === "low" || key === "none") return "report-demo__pill--ok";
  if (key === "moderate") return "report-demo__pill--warn";
  if (key === "severe" || key === "high" || key === "major") return "report-demo__pill--bad";
  return "";
}

function tierDotClass(tier) {
  const key = String(tier || "").toLowerCase();
  if (key === "moderate") return "report-demo__tab-dot--moderate";
  if (key === "severe" || key === "high") return "report-demo__tab-dot--severe";
  return "report-demo__tab-dot--normal";
}

export default function ReportView({ inspection, partners }) {
  // Outdoor control is the inspection-level baseline, not a room. Keep its
  // air-sample count as the comparison number on every room's air card,
  // but don't render it as a tab — customers shouldn't have to navigate
  // to "the place we used as a comparator".
  const allLocations = (inspection.sample_locations || []).slice();
  const outdoor = allLocations.find((l) => l.is_outdoor_control) || null;
  const outdoorAir = normaliseToOne(outdoor?.air_samples);
  const outdoorTotal = outdoorAir?.total_spores_per_m3 ?? null;
  const locations = allLocations
    .filter((l) => !l.is_outdoor_control)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const scope = (inspection.scope_items || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const totals = scope.reduce(
    (acc, s) => ({
      min: acc.min + (Number(s.cost_min) || 0),
      max: acc.max + (Number(s.cost_max) || 0),
    }),
    { min: 0, max: 0 },
  );

  // Tabs: one per room, then next-steps / partners. Scope of works is NOT
  // a separate tab — per the demo, it lives as a persistent card in the
  // right zone of every room view so the customer always sees the path
  // forward alongside the findings they're reading.
  const tabs = useMemo(() => [
    ...locations.map((l) => ({
      id: `loc-${l.sample_location_id}`,
      label: l.name,
      tier: l.mould_pressure_tier,
      kind: "location",
      payload: l,
    })),
    { id: "next-steps", label: "Next steps",           kind: "next-steps" },
    { id: "partners",   label: "Connect with partners", kind: "partners" },
  ], [locations]);

  const [view, setView] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === view) || tabs[0];

  const reportMeta = {
    id: inspection.report_slug,
    date: fmtDate(inspection.completed_at || inspection.scheduled_at),
    inspector: `${inspection.technician?.name || "—"}${inspection.technician?.qualifications ? " · " + inspection.technician.qualifications : ""}`,
    address: [
      inspection.properties?.address_line,
      inspection.properties?.postcode,
      inspection.properties?.state,
    ].filter(Boolean).join(", "),
  };

  // Overall severity = inspection.report_severity if set, otherwise pick
  // the worst location tier as a fallback.
  const overallSeverity = inspection.report_severity || worstTier(locations);

  const subheadTitle =
    active?.kind === "location" ? active.payload.name :
    active?.kind === "next-steps" ? "Next steps" :
    active?.kind === "partners" ? "Connect with partners" :
    "Report";

  const subheadTier =
    active?.kind === "location" ? (active.payload.mould_pressure_tier || overallSeverity)
    : overallSeverity;

  function jumpToPartners() { setView("partners"); }
  function jumpToNextSteps() { setView("next-steps"); }

  return (
    <div className="report-demo" role="document" aria-label="Sporetrust inspection report">
      <header className="report-demo__chrome">
        <div className="report-demo__chrome-left">
          <div className="report-demo__chrome-brand"><Brand /></div>
          <nav className="report-demo__tabs" aria-label="Report sections">
            <ul role="tablist">
              {tabs.map((t) => {
                const isActive = view === t.id;
                return (
                  <li key={t.id} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`report-demo__tab${isActive ? " is-active" : ""}`}
                      onClick={() => setView(t.id)}
                    >
                      {t.kind === "location" && t.tier ? (
                        <span className={`report-demo__tab-dot ${tierDotClass(t.tier)}`} aria-hidden />
                      ) : null}
                      <span className="report-demo__tab-label">{t.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <button
          type="button"
          className="report-demo__close"
          onClick={() => typeof window !== "undefined" && window.print()}
        >
          Print / save PDF
        </button>
      </header>

      <section className="report-demo__subhead">
        <div className="report-demo__subhead-left">
          <h1>{subheadTitle}</h1>
          <p className="report-demo__subhead-meta">
            {reportMeta.address} <span aria-hidden>·</span> {reportMeta.id} <span aria-hidden>·</span> {reportMeta.date} <span aria-hidden>·</span> {reportMeta.inspector}
          </p>
        </div>
        <div className="report-demo__subhead-right">
          {subheadTier ? (
            <div className="report-demo__rating-mini" aria-label={`Mould pressure rating: ${SEVERITY_LABEL[subheadTier] || subheadTier}`}>
              <span className={`report-demo__pill ${tierClass(subheadTier)} report-demo__rating-mini-pill`}>
                {SEVERITY_LABEL[subheadTier] || subheadTier}
              </span>
              <strong>Mould pressure</strong>
            </div>
          ) : null}
        </div>
      </section>

      {active?.kind === "location" ? (
        <LocationView
          location={active.payload}
          outdoorTotal={outdoorTotal}
          scope={scope}
          scopeTotals={totals}
          onNext={jumpToNextSteps}
        />
      ) : null}

      {active?.kind === "next-steps" ? (
        <NextStepsView onPartners={jumpToPartners} hasPartners={partners.length > 0} />
      ) : null}

      {active?.kind === "partners" ? (
        <PartnersView partners={partners} scope={scope} />
      ) : null}

      {/* Persistent sticky bottom bar. On room tabs it's the scope-of-works
          CTA — guiding the customer toward the next-steps tab. On the
          next-steps / partners tabs it switches to the sign-off / brand
          line so it's never empty. */}
      {active?.kind === "location" && scope.length > 0 ? (
        <ScopeStickyBar
          scope={scope}
          totals={totals}
          onNext={jumpToNextSteps}
        />
      ) : (
        <div className="report-demo__cta-bar pr-cta-bar" role="region" aria-label="Report footer">
          <div className="report-demo__cta-text">
            <strong>Independent diagnostics.</strong>
            <span>
              The report is the product.
              {inspection.signoff?.name
                ? ` Signed off ${fmtDate(inspection.signed_off_at)} by ${inspection.signoff.name}.`
                : null}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-room view ─────────────────────────────────────────────────────

function LocationView({ location, outdoorTotal, scope, scopeTotals, onNext }) {
  const captures = location.image_captures || [];
  const visible = captures.find((c) => c.capture_kind === "visible" && c.pair_group === 1);
  const thermal = captures.find((c) => c.capture_kind === "thermal" && c.pair_group === 1);
  const readings = (location.moisture_readings || []).slice().sort((a, b) => a.moisture_reading_id - b.moisture_reading_id);
  const findings = (location.location_findings || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const sources = (location.location_sources || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const air = normaliseToOne(location.air_samples);

  const indoorTotal = air?.total_spores_per_m3 ?? null;
  const ratio = (indoorTotal != null && outdoorTotal != null && outdoorTotal > 0)
    ? (indoorTotal / outdoorTotal)
    : null;

  return (
    <main className="report-demo__pane pr-room-pane">
      {/* Left, big: visible + thermal pair, moisture readings attached
          underneath as the same card's body. Markers on the visible image
          map row-for-row to the readings table — putting them in one card
          makes that link obvious. */}
      <article className="report-demo__card pr-card--visual-merged">
        <header className="report-demo__card-head">
          <h3>Visual evidence</h3>
          <span className="report-demo__card-aside">
            {thermal && location.thermal_delta_c != null
              ? <>Δ {location.thermal_delta_c > 0 ? "+" : ""}{location.thermal_delta_c} °C · visible + thermal</>
              : "Visible + thermal · same frame"}
          </span>
        </header>
        <div className="report-demo__visual-split">
          {visible ? (
            <figure className="report-demo__visual-figure">
              <img src={publicUrl("inspection-images", visible.storage_path)} alt={`Visible light shot of ${location.name}`} loading="lazy" />
              <figcaption>Visible</figcaption>
              <MarkerOverlay readings={readings} />
            </figure>
          ) : <NoImage label="Visible" />}
          {thermal ? (
            <figure className="report-demo__visual-figure">
              <img src={publicUrl("inspection-images", thermal.storage_path)} alt={`Thermal capture of ${location.name}`} loading="lazy" />
              <figcaption>Thermal</figcaption>
              <MarkerOverlay readings={readings} />
            </figure>
          ) : <NoImage label="Thermal" />}
        </div>
        <div className="pr-card__scroll-body">
          <AttachedReadings readings={readings} />
          <AttachedFindings findings={findings} sources={sources} />
        </div>
      </article>

      {/* Right column: air sample — slide row + bars + fungal counts. */}
      <article className="report-demo__card pr-card--air">
        <header className="report-demo__card-head">
          <h3>Air sample</h3>
        </header>
        {air ? <SlideImage air={air} /> : null}
        <AirCompareBars
          outdoorTotal={outdoorTotal}
          indoorTotal={indoorTotal}
          indoorLabel={location.name}
          ratio={ratio}
        />
        {air ? (
          <FungalCounts air={air} />
        ) : (
          <p className="report-demo__card-foot report-demo__muted">No air sample recorded for this location.</p>
        )}
      </article>
    </main>
  );
}

// Narrative findings + ranked source list — rendered as the third
// section of the Visual card so the customer reads "image → readings →
// what the technician concluded" without leaving the card.
function AttachedFindings({ findings, sources }) {
  if (findings.length === 0 && sources.length === 0) return null;
  return (
    <div className="pr-attached-findings">
      <div className="pr-attached-findings__head">
        <h4>Findings &amp; likely sources</h4>
      </div>
      <div className="pr-attached-findings__body">
        {findings.length === 0 ? (
          <p className="report-demo__muted">No narrative findings recorded for this location.</p>
        ) : (
          findings.map((f) => <p key={f.finding_id} className="pr-attached-findings__prose">{f.observation}</p>)
        )}
        {sources.length > 0 ? (
          <ul className="pr-attached-findings__causes">
            {sources.map((s) => (
              <li key={s.source_id}>
                <span className="report-demo__cause-rank">{capitalize(s.rank)}</span>
                <span>
                  <strong>{SOURCE_CATEGORY_LABEL[s.source_category] || s.source_category}.</strong>{" "}
                  {s.description}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

// Moisture readings table — rendered as the body half of the Visual card so
// the pins on the image and the rows in the table read as the same artefact.
// Scrolls inside the card when the list runs long.
function AttachedReadings({ readings }) {
  if (readings.length === 0) {
    return (
      <div className="pr-attached-readings pr-attached-readings--empty">
        <p className="report-demo__muted">No moisture readings recorded.</p>
      </div>
    );
  }
  return (
    <div className="pr-attached-readings">
      <div className="pr-attached-readings__head">
        <h4>Moisture readings</h4>
        <span className="report-demo__card-aside">
          {readings[0]?.instrument_model
            ? `${readings[0].instrument_model}${readings[0].depth_mm ? ` · ${readings[0].depth_mm} mm depth` : ""}`
            : "Pinless surface scan"}
        </span>
      </div>
      <div className="pr-attached-readings__scroll">
        <table className="report-demo__readings">
          <tbody>
            {readings.map((r, idx) => (
              <tr key={r.moisture_reading_id}>
                <td>
                  <span className="report-demo__readings-index" aria-hidden>{String(idx + 1).padStart(2, "0")}</span>
                  {r.surface_label || "(unlabelled)"}
                </td>
                <td className="report-demo__readings-value">{r.reading_value != null ? Number(r.reading_value).toFixed(1) : "—"}</td>
                <td>
                  <span className={`report-demo__pill ${tierClass(r.level)}`}>{SEVERITY_LABEL[r.level] || r.level}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Lab slides. Two natural views ship from the lab:
//   - the 4× trace (a landscape strip showing the outdoor + inside lanes)
//   - the 30× zoom (a roughly-square close-up of the slide contents)
// We render them side-by-side as a single row so the combined block stays
// short. Column widths are allocated proportional to each image's natural
// aspect ratio (trace 1.9:1, 30× ~1:1) so they end up at matching display
// heights without ad-hoc fixed pixel values.
function SlideImage({ air }) {
  const trace = air.slide_trace_4x_inside_path
    || air.slide_trace_4x_outside_path;
  const zoom  = air.slide_30x_zoomed_path;

  if (!trace && !zoom) {
    return (
      <div className="pr-slide pr-slide--empty">
        <div className="pr-slide__placeholder">Slide pending lab return</div>
      </div>
    );
  }

  return (
    <div className="pr-slide">
      <div className="pr-slide__row">
        {trace ? (
          <figure className="pr-slide__col pr-slide__col--trace">
            <img src={publicUrl("air-slides", trace)} alt="4× trace slide" loading="lazy" />
            <figcaption>4× trace</figcaption>
          </figure>
        ) : null}
        {zoom ? (
          <figure className="pr-slide__col pr-slide__col--zoom">
            <img src={publicUrl("air-slides", zoom)} alt="30× zoomed slide" loading="lazy" />
            <figcaption>30× zoomed</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}

// ─── Scope of works (compressed sticky CTA bar at the foot of every
// room view). Persistent. The full breakdown lives on the Next steps
// tab — this bar is the "you can read the rooms; here's what to do
// about it" prompt that's always reachable.

function ScopeStickyBar({ scope, totals, onNext }) {
  return (
    <div className="pr-scope-bar" role="region" aria-label="Scope of works">
      <div className="pr-scope-bar__main">
        <span className="pr-scope-bar__eyebrow">Scope of works</span>
        <strong className="pr-scope-bar__cost">
          ${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}
        </strong>
        <span className="pr-scope-bar__count">
          {scope.length} {scope.length === 1 ? "item" : "items"}
          {" · "}{summariseTrades(scope)}
        </span>
      </div>
      <button type="button" className="pr-scope-bar__cta" onClick={onNext}>
        See your next steps
        <ArrowIcon />
      </button>
    </div>
  );
}

function summariseTrades(scope) {
  const trades = scope
    .map((s) => s.trade_categories?.name)
    .filter(Boolean);
  if (trades.length === 0) return "trades pending";
  if (trades.length <= 2) return trades.join(", ");
  return `${trades.slice(0, 2).join(", ")} +${trades.length - 2}`;
}

// ─── (Unused) full scope-of-works card. Retained because the Next steps
// tab might re-use it later; not currently rendered. ───

function ScopeCard({ scope, totals, onNext }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of scope) {
      const key = item.trade_categories?.group_label || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries());
  }, [scope]);

  return (
    <article className="report-demo__card report-demo__card--resolution">
      <header className="report-demo__resolution-head">
        <div>
          <span className="report-demo__resolution-eyebrow">Recommended path</span>
          <h3>Scope of works</h3>
        </div>
        <div className="report-demo__resolution-stats">
          <span><em>Indicative scope</em><strong>${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}</strong></span>
          <span><em>Items</em><strong>{scope.length}</strong></span>
        </div>
      </header>
      {scope.length === 0 ? (
        <p className="report-demo__muted" style={{ padding: "12px 16px" }}>No scope of works defined for this inspection.</p>
      ) : (
        <div className="report-demo__scope">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel} className="report-demo__scope-group">
              <div className="report-demo__scope-group-head">
                <span className="report-demo__scope-category">{groupLabel}</span>
              </div>
              <ul className="report-demo__scope-items">
                {items.map((s) => (
                  <li key={s.scope_item_id}>
                    <div className="report-demo__scope-item-head">
                      <strong>{s.trade_categories?.name || "—"}</strong>
                      <span className="report-demo__scope-item-cost">
                        ${(s.cost_min ?? 0).toLocaleString()} – ${(s.cost_max ?? 0).toLocaleString()}
                      </span>
                    </div>
                    {s.detail ? <span className="report-demo__scope-item-detail">{s.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="report-demo__resolution-cta">
        <span className="report-demo__resolution-cta-text">
          Ready to act? We'll match you with the right specialist for these works.
        </span>
        <button type="button" className="report-demo__resolution-cta-btn" onClick={onNext}>
          See your next-step options
          <ArrowIcon />
        </button>
      </div>
    </article>
  );
}

// ─── Next steps view ──────────────────────────────────────────────────

function NextStepsView({ onPartners, hasPartners }) {
  return (
    <main className="report-demo__pane report-demo__pane--next">
      <header className="report-demo__next-intro">
        <span className="report-demo__next-eyebrow">Where to from here</span>
        <p>
          Based on the findings, here's how to act on the evidence. Pick the
          pathway that matches how you want to handle the works.
        </p>
      </header>
      <div className="report-demo__next-grid">
        <article className="report-demo__next-card">
          <header className="report-demo__next-card-head">
            <span className="report-demo__next-card-num">01</span>
          </header>
          <h3>Handle it yourself</h3>
          <p>
            Print or save the report and share it directly with your insurer, builder,
            landlord or property manager. Everything they need to scope the work is here.
          </p>
          <button
            type="button"
            className="report-demo__next-card-cta"
            onClick={() => typeof window !== "undefined" && window.print()}
          >
            Print / save PDF
            <ArrowIcon />
          </button>
        </article>

        <article className={`report-demo__next-card${hasPartners ? " is-recommended" : ""}`}>
          <header className="report-demo__next-card-head">
            <span className="report-demo__next-card-num">02</span>
            {hasPartners ? <span className="report-demo__next-card-badge">Recommended</span> : null}
          </header>
          <h3>Connect with our partners</h3>
          <p>
            We'll introduce you to vetted partners across the trades flagged in your scope of
            works. They quote — you decide. No obligation, no kickbacks.
          </p>
          <button type="button" className="report-demo__next-card-cta" onClick={onPartners}>
            {hasPartners ? "View matched partners" : "About our partner network"}
            <ArrowIcon />
          </button>
        </article>
      </div>
    </main>
  );
}

// ─── Partners view ────────────────────────────────────────────────────

function PartnersView({ partners, scope }) {
  return (
    <main className="report-demo__pane report-demo__pane--next">
      <header className="report-demo__next-intro">
        <span className="report-demo__next-eyebrow">Vetted Sporetrust partners</span>
        <p>
          Partners matched to the scope of works flagged in your report. Pick any
          and we'll forward the relevant findings and photos — they'll contact you
          directly to quote.
        </p>
      </header>

      {partners.length === 0 ? (
        <div className="report-demo__next-intro" style={{ textAlign: "center", paddingTop: 0 }}>
          <p className="report-demo__muted">
            No matched partners in our directory for the trades on this report yet.
            We'll be in touch as we onboard partners in your area.
          </p>
        </div>
      ) : (
        <div className="report-demo__partner-grid">
          {partners.map((p) => (
            <article key={p.partner_id} className="report-demo__partner-card">
              <header className="report-demo__partner-head">
                <span className="report-demo__partner-trade">
                  {p.matchedTrades.length > 0 ? p.matchedTrades.join(" · ") : "Multi-trade"}
                </span>
                {p.rating != null ? (
                  <span className="report-demo__partner-rating">
                    <strong>{Number(p.rating).toFixed(1)}</strong>{" "}
                    {p.reviews_count ? <em>({p.reviews_count} reviews)</em> : null}
                  </span>
                ) : null}
              </header>
              <h3>{p.name}</h3>
              {p.credentials ? <p className="report-demo__partner-creds">{p.credentials}</p> : null}
              <dl className="report-demo__partner-meta">
                {Array.isArray(p.service_areas) && p.service_areas.length > 0 ? (
                  <div>
                    <dt>Service area</dt>
                    <dd>{p.service_areas.slice(0, 6).join(", ")}{p.service_areas.length > 6 ? "…" : ""}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Network</dt>
                  <dd>Sporetrust partner</dd>
                </div>
              </dl>
              {p.notes ? <p className="report-demo__partner-summary">{p.notes}</p> : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

// Two horizontal comparison bars: outdoor baseline vs this room's count.
// Both bars share the same scale (max of the two) so the visual length
// difference IS the story — a tiny outdoor stub next to a saturated indoor
// fill says "this room is loaded" without needing to read the numbers.
// Above 5× baseline the indoor bar goes into alarm colour.
function AirCompareBars({ outdoorTotal, indoorTotal, indoorLabel, ratio }) {
  const max = Math.max(outdoorTotal ?? 0, indoorTotal ?? 0, 1);
  // Floor the visible width at ~3% so a tiny non-zero count is still
  // distinguishable from "no sample" (width 0).
  const widthFor = (v) => {
    if (v == null) return 0;
    if (v === 0) return 0;
    return Math.max(3, Math.round((v / max) * 100));
  };
  const isAlarm = ratio != null && ratio >= 5;

  return (
    <div className="pr-air-bars">
      <div className="pr-air-bar">
        <div className="pr-air-bar__head">
          <span className="pr-air-bar__label">Outdoor baseline</span>
          <span className="pr-air-bar__value">
            {outdoorTotal != null ? outdoorTotal.toLocaleString() : "—"}<em>cts/m³</em>
          </span>
        </div>
        <div className="pr-air-bar__track">
          <div
            className="pr-air-bar__fill pr-air-bar__fill--outdoor"
            style={{ width: `${widthFor(outdoorTotal)}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="pr-air-bar">
        <div className="pr-air-bar__head">
          <span className="pr-air-bar__label">{indoorLabel}</span>
          <span className={`pr-air-bar__value ${isAlarm ? "pr-air-bar__value--alarm" : ""}`}>
            {indoorTotal != null ? indoorTotal.toLocaleString() : "—"}<em>cts/m³</em>
          </span>
        </div>
        <div className="pr-air-bar__track">
          <div
            className={`pr-air-bar__fill ${isAlarm ? "pr-air-bar__fill--alarm" : "pr-air-bar__fill--indoor"}`}
            style={{ width: `${widthFor(indoorTotal)}%` }}
            aria-hidden
          />
        </div>
      </div>

      {ratio != null ? (
        <p className="pr-air-bars__note">
          <strong>{ratio.toFixed(1)}×</strong> the outdoor baseline.
        </p>
      ) : outdoorTotal == null ? (
        <p className="pr-air-bars__note pr-air-bars__note--muted">
          No outdoor baseline captured — comparison ratio unavailable.
        </p>
      ) : null}
    </div>
  );
}

// Per-air-sample lab breakdown. Lists every fungal species the lab found
// (with spores/m³ + their banded level), sorted descending by count so
// the biggest contributors sit at the top. Scrolls if the list runs long.
// Falls back to the single "dominant morphotype" callout if no breakdown
// rows were returned (older / partial lab data).
function FungalCounts({ air }) {
  // Order by lab-banded severity first (severe → moderate → normal), then
  // by count desc inside each tier. So the most-meaningful results land at
  // the top of the list and the long tail of trace outdoor species sits
  // below — survives the scroll cut where the in-view portion matters.
  const counts = (air.air_sample_fungal_counts || [])
    .slice()
    .sort((a, b) => {
      const rank = (lvl) => (lvl === "severe" ? 3 : lvl === "moderate" ? 2 : lvl === "normal" ? 1 : 0);
      const dr = rank(b.level) - rank(a.level);
      if (dr !== 0) return dr;
      return (b.spores_per_m3 ?? 0) - (a.spores_per_m3 ?? 0);
    });

  const labProv = [air.lab_partner, air.lab_sample_id].filter(Boolean).join(" · ");

  if (counts.length === 0) {
    // No row-level breakdown — show the dominant morphotype as a fallback.
    return (
      <p className="report-demo__card-foot">
        {air.fungal_classifications?.name
          ? <>Dominant morphotype: <strong>{air.fungal_classifications.name}</strong></>
          : <span className="report-demo__muted">Lab breakdown not yet returned.</span>}
        {labProv ? <> · {labProv}</> : null}
      </p>
    );
  }

  return (
    <div className="pr-fungal">
      <div className="pr-fungal__scroll">
        <table className="report-demo__readings pr-fungal__table">
          <tbody>
            {counts.map((c, idx) => {
              const name = c.fungal_classifications?.name || `Species #${idx + 1}`;
              return (
                <tr key={c.air_sample_fungal_count_id}>
                  <td>
                    <span className="report-demo__readings-index" aria-hidden>{String(idx + 1).padStart(2, "0")}</span>
                    {name}
                  </td>
                  <td className="report-demo__readings-value pr-fungal__value">
                    {(c.spores_per_m3 ?? 0).toLocaleString()}<em>cts/m³</em>
                  </td>
                  <td>
                    {c.level
                      ? <span className={`report-demo__pill ${tierClass(c.level)}`}>{SEVERITY_LABEL[c.level] || c.level}</span>
                      : <span className="report-demo__muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {labProv ? <p className="report-demo__card-foot pr-fungal__foot">{labProv}</p> : null}
    </div>
  );
}

function MarkerOverlay({ readings }) {
  const positioned = readings.filter((r) => r.marker_x_pct != null && r.marker_y_pct != null);
  if (positioned.length === 0) return null;
  return (
    <div className="report-demo__visual-markers" aria-hidden>
      {positioned.map((r, idx) => (
        <span
          key={r.moisture_reading_id}
          className="report-demo__visual-marker"
          style={{ left: `${r.marker_x_pct}%`, top: `${r.marker_y_pct}%` }}
        >
          <span className="report-demo__visual-marker-dot">{idx + 1}</span>
        </span>
      ))}
    </div>
  );
}

function NoImage({ label }) {
  return (
    <figure className="report-demo__visual-figure">
      <div style={{ aspectRatio: "4 / 3", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bone)", border: "1px dashed var(--line)", borderRadius: 12, color: "var(--ink-faint)", fontSize: 12.5 }}>
        Image not available
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function normaliseToOne(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  if (typeof v === "object") return v;
  return null;
}

function publicUrl(bucket, storagePath) {
  if (!PUBLIC_BUCKET_BASE || !storagePath) return "";
  return `${PUBLIC_BUCKET_BASE}/${bucket}/${storagePath}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function worstTier(locations) {
  const order = { severe: 5, high: 4, moderate: 3, low: 2, normal: 1, none: 0 };
  let worst = null;
  for (const l of locations) {
    const t = l.mould_pressure_tier;
    if (!t) continue;
    if (worst == null || (order[t] ?? 0) > (order[worst] ?? 0)) worst = t;
  }
  return worst;
}
