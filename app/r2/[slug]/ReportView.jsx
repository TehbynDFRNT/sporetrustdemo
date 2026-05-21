"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export const SEVERITY_LABEL = {
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

export function tierClass(tier) {
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

  // Detail flow on /r2/: rooms in sequence. "Our Recommended Fix" is a
  // modal dialog overlay opened from the Overview's secondary CTA or the
  // last room's Continue bar — not a separate view in the tab list. The
  // tabs structure stays as the data source for prev/next labels in the
  // Continue → bar; the chrome doesn't render them.
  const tabs = useMemo(() => [
    { id: "overview", label: "Overview", kind: "overview" },
    ...locations.map((l) => ({
      id: `loc-${l.sample_location_id}`,
      label: l.name,
      tier: l.mould_pressure_tier,
      kind: "location",
      payload: l,
    })),
  ], [locations]);

  const [isFixOpen, setFixOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);

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
    active?.kind === "overview" ? "Inspection report" :
    active?.kind === "location" ? active.payload.name :
    active?.kind === "next-steps" ? "Next steps" :
    active?.kind === "partners" ? "Connect with partners" :
    "Report";

  const subheadTier =
    active?.kind === "location" ? (active.payload.mould_pressure_tier || overallSeverity)
    : overallSeverity;

  function jumpToFirstRoom() {
    const firstRoom = tabs.find((t) => t.kind === "location");
    if (firstRoom) setView(firstRoom.id);
  }

  function jumpToPartners() { setView("partners"); }
  function jumpToNextSteps() { setView("next-steps"); }
  function jumpToOverview() { setView("overview"); }

  // Two chromes:
  //   - Overview: brand + Print. The page IS the menu, no tabs.
  //   - Detail: brand + "← Overview" + Print. No tabs — the detail flow
  //     is a sequential journey (rooms → recommended works → partners)
  //     driven by the Continue → bar at the bottom, not by sideways
  //     tab navigation.
  const isOverview = active?.kind === "overview";
  const detailViews = tabs.filter((t) => t.kind !== "overview");
  const currentIdx = detailViews.findIndex((t) => t.id === view);
  const nextView = currentIdx >= 0 && currentIdx < detailViews.length - 1
    ? detailViews[currentIdx + 1]
    : null;
  const prevView = currentIdx > 0 ? detailViews[currentIdx - 1] : null;

  return (
    <div className="report-demo" role="document" aria-label="Sporetrust inspection report">
      <header className={`report-demo__chrome ${isOverview ? "pr-chrome--overview" : ""}`}>
        <div className="report-demo__chrome-left">
          <div className="report-demo__chrome-brand"><Brand /></div>
        </div>
        {!isOverview ? (
          <button
            type="button"
            className="report-demo__close"
            onClick={jumpToOverview}
          >
            Exit report
          </button>
        ) : null}
      </header>

      {/* The subhead is the per-section title row. The Overview cover
          carries its own address + inspector line so the subhead would
          duplicate; hide it there. */}
      {!isOverview ? (
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
      ) : null}

      {active?.kind === "overview" ? (
        <OverviewView
          inspection={inspection}
          locations={locations}
          scope={scope}
          totals={totals}
          partners={partners}
          overallSeverity={overallSeverity}
          onFix={() => setFixOpen(true)}
          onShare={() => setShareOpen(true)}
          onDetail={jumpToFirstRoom}
        />
      ) : null}

      {active?.kind === "location" ? (
        <LocationView
          location={active.payload}
          outdoorTotal={outdoorTotal}
          scope={scope}
          scopeTotals={totals}
          onNext={jumpToNextSteps}
        />
      ) : null}


      {/* Sticky bottom — two modes (Overview has no sticky bar; its
       *   sign-off line lives inside the page itself):
       *   - Detail with a next view: Continue → bar walks the funnel.
       *   - Detail with no next (last view, e.g. Partners): signoff footer
       *     plus a "Back to overview" link as the escape hatch. */}
      {isOverview ? null : active?.kind === "location" ? (
        <ContinueBar
          prev={prevView}
          next={nextView}
          onPrev={() => prevView && setView(prevView.id)}
          onNext={() => nextView && setView(nextView.id)}
          onFix={!nextView ? () => setFixOpen(true) : null}
        />
      ) : (
        <ReportSignoffBar inspection={inspection} onOverview={jumpToOverview} />
      )}

      {isFixOpen ? (
        <FixDialog
          scope={scope}
          totals={totals}
          partners={partners}
          inspection={inspection}
          onClose={() => setFixOpen(false)}
        />
      ) : null}

      {isShareOpen ? (
        <ShareReportDialog
          slug={inspection.report_slug}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}

// ─── Sticky bottom: sequential Continue → bar for the detail flow.
// On the last room (no `next`) the right-side CTA pivots to "See our
// recommended fix" — opening the FixDialog. ──────────────────────────
function ContinueBar({ prev, next, onPrev, onNext, onFix }) {
  return (
    <div className="pr-continue-bar" role="region" aria-label="Continue">
      <div className="pr-continue-bar__left">
        {prev ? (
          <button
            type="button"
            className="pr-continue-bar__prev"
            onClick={onPrev}
            aria-label={`Back to ${prev.label}`}
          >
            ← {prev.label}
          </button>
        ) : null}
      </div>
      {next ? (
        <button type="button" className="pr-continue-bar__cta" onClick={onNext}>
          Continue to {next.label}
          <ArrowIcon />
        </button>
      ) : onFix ? (
        <button type="button" className="pr-continue-bar__cta" onClick={onFix}>
          See our recommended fix
          <ArrowIcon />
        </button>
      ) : null}
    </div>
  );
}

function ReportSignoffBar({ inspection, onOverview }) {
  return (
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
      {onOverview ? (
        <button
          type="button"
          className="pr-cta-bar__back"
          onClick={onOverview}
        >
          ← Back to overview
        </button>
      ) : null}
    </div>
  );
}

// ─── Overview / cover view ─────────────────────────────────────────────
//
// Cover-page take on the report. Lands the customer here on open.
// Frames the report's value (severity + headline + scope cost) and
// drives to the conversion (matched partners) before drilling into
// per-room evidence. Pros forwarding the URL can hit "Print or forward"
// or jump to the diagnostic tabs.

function OverviewView({ inspection, locations, scope, totals, partners, overallSeverity, onFix, onShare, onDetail }) {
  const rooms = locations.filter((l) => !l.is_outdoor_control);
  const hasOutdoor = locations.some((l) => l.is_outdoor_control);
  const findingsCount = locations.reduce((n, l) => n + (l.location_findings?.length || 0), 0);
  const readingsCount = locations.reduce((n, l) => n + (l.moisture_readings?.length || 0), 0);
  const trades = Array.from(new Set(scope.map((s) => s.trade_categories?.name).filter(Boolean)));

  return (
    <main className="report-demo__pane pr-overview-pane">
      <div className="pr-overview">
        <div className="pr-overview__hero">
          {overallSeverity ? (
            <span className={`report-demo__pill ${tierClass(overallSeverity)} pr-overview__pill`}>
              {SEVERITY_LABEL[overallSeverity] || overallSeverity}
            </span>
          ) : null}
          <h2 className="pr-overview__headline">
            {inspection.report_title || "Inspection complete"}
          </h2>
          {inspection.report_summary ? (
            <p className="pr-overview__summary">{inspection.report_summary}</p>
          ) : null}
          <p className="pr-overview__sub">
            {inspection.properties?.address_line}
            {inspection.properties?.postcode ? ` · ${inspection.properties.postcode}` : ""}
            {" · "}
            Inspected {fmtDate(inspection.completed_at || inspection.scheduled_at)} by {inspection.technician?.name || "—"}
          </p>
        </div>

        <dl className="pr-overview__stats">
          <div>
            <dt>Rooms inspected</dt>
            <dd>
              {rooms.length}
              {hasOutdoor ? <span className="pr-overview__sub-inline"> · outdoor control</span> : null}
            </dd>
          </div>
          <div>
            <dt>Moisture readings</dt>
            <dd>{readingsCount}</dd>
          </div>
          <div>
            <dt>Findings</dt>
            <dd>{findingsCount}</dd>
          </div>
          <div>
            <dt>Scope of works</dt>
            <dd>
              {totals.max > 0
                ? <>${totals.min.toLocaleString()}<span className="pr-overview__sub-inline"> – ${totals.max.toLocaleString()}</span></>
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Trades flagged</dt>
            <dd>
              {trades.length > 0
                ? trades.slice(0, 2).join(", ") + (trades.length > 2 ? ` +${trades.length - 2}` : "")
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Matched partners</dt>
            <dd>
              {partners.length > 0
                ? `${partners.length} ready`
                : <span className="report-demo__muted">none yet in your area</span>}
            </dd>
          </div>
        </dl>

        <div className="pr-overview__actions">
          <div className="pr-overview__step">
            <p className="pr-overview__step-label">Step 01</p>
            <button
              type="button"
              className="pr-overview__cta pr-overview__cta--primary"
              onClick={onDetail}
            >
              <span className="pr-overview__cta-label">
                <strong>Read your diagnostic</strong>
                <em>{rooms.length} room{rooms.length === 1 ? "" : "s"} · evidence, readings, findings</em>
              </span>
              <ArrowIcon />
            </button>
          </div>

          <div className="pr-overview__step">
            <p className="pr-overview__step-label">Step 02</p>
            <button
              type="button"
              className="pr-overview__cta pr-overview__cta--ghost"
              onClick={onFix}
            >
              <span className="pr-overview__cta-label">
                <strong>See our recommended fix</strong>
                <em>Scope of works · matched contractors · quote request</em>
              </span>
              <ArrowIcon />
            </button>
          </div>

          <div className="pr-overview__step">
            <p className="pr-overview__step-label">Step 03</p>
            <button
              type="button"
              className="pr-overview__cta pr-overview__cta--ghost"
              onClick={onShare}
            >
              <span className="pr-overview__cta-label">
                <strong>Download or forward as PDF</strong>
                <em>Three versions — for your records, for your landlord, or for your insurer</em>
              </span>
              <ArrowIcon />
            </button>
          </div>
        </div>

        {inspection.signoff?.name ? (
          <p className="pr-overview__signoff">
            Reviewed and signed off by <strong>{inspection.signoff.name}</strong>
            {inspection.signoff.qualifications ? ` · ${inspection.signoff.qualifications}` : ""}
            {inspection.signed_off_at ? ` · ${fmtDate(inspection.signed_off_at)}` : ""}
          </p>
        ) : null}
      </div>
    </main>
  );
}


// ─── Per-room view ─────────────────────────────────────────────────────

export function LocationView({ location, outdoorTotal, scope, scopeTotals, onNext }) {
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
        <AttachedReadings readings={readings} />
        <AttachedFindings findings={findings} sources={sources} />
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

// ─── Our Recommended Fix — modal dialog ─────────────────────────────────
// Replaces the old standalone Next Steps + Connect with Partners views.
// Opens as an overlay on top of the report (Esc / backdrop / × to close).
// Step machine:
//   intro          → "I'd like to resolve this" OR "Forward / share"
//   forward        → print + share affordances
//   contractors-q  → "Find my own" OR "Show vetted contractors"
//   find-own       → encouragement + print
//   select         → partner cards (.report-demo__partner-card) + terms
//   sent           → confirmation
//
// Reuses the demo's .report-demo__next-card and .report-demo__partner-card
// styles so the dialog matches the rest of the report's visual language.

function FixDialog({ scope, totals, partners, inspection, onClose }) {
  const [step, setStep] = useState("intro");
  const [selectedPartners, setSelectedPartners] = useState(() => new Set());
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Esc-to-close.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock background scroll while the dialog's mounted.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function submitQuoteRequests() {
    // eslint-disable-next-line no-console
    console.info("[fix] Requesting quotes from:", Array.from(selectedPartners));
    setStep("sent");
  }

  function togglePartner(partnerId) {
    setSelectedPartners((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  }

  // Per-step back target (null = terminal / first step).
  const backOf = {
    intro: null,
    forward: () => setStep("intro"),
    "contractors-q": () => setStep("intro"),
    "find-own": () => setStep("contractors-q"),
    select: () => setStep("contractors-q"),
    sent: null,
  };
  const onBack = backOf[step];

  return (
    <div
      className="pr-fix-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Our recommended fix"
    >
      <button
        type="button"
        className="pr-fix-dialog__backdrop"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="pr-fix-dialog__card" role="document">
        <header className="pr-fix-dialog__head">
          {onBack ? (
            <button
              type="button"
              className="pr-fix-dialog__back"
              onClick={onBack}
              aria-label="Previous step"
            >
              ← Back
            </button>
          ) : <span />}
          <span className="pr-fix-dialog__title">Our recommended fix</span>
          <button
            type="button"
            className="pr-fix-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="pr-fix-dialog__body">
          {step === "intro" ? (
            <FixIntro
              scope={scope}
              totals={totals}
              onResolve={() => setStep("contractors-q")}
              onForward={() => setStep("forward")}
            />
          ) : null}

          {step === "forward" ? (
            <FixForward />
          ) : null}

          {step === "contractors-q" ? (
            <FixContractorsQuestion
              onOwn={() => setStep("find-own")}
              onVetted={() => setStep("select")}
              hasPartners={partners.length > 0}
            />
          ) : null}

          {step === "find-own" ? (
            <FixFindOwn totals={totals} />
          ) : null}

          {step === "select" ? (
            <FixSelectPartners
              partners={partners}
              scope={scope}
              selected={selectedPartners}
              onToggle={togglePartner}
              terms={termsAccepted}
              onTerms={setTermsAccepted}
              onSubmit={submitQuoteRequests}
            />
          ) : null}

          {step === "sent" ? (
            <FixQuoteSent
              selectedCount={selectedPartners.size}
              onClose={onClose}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// All step components reuse the demo's .report-demo__next-card pattern
// for choice cards (same look as "Handle it yourself" / "Connect with
// partners" in the marketing demo) and .report-demo__partner-card for
// the partner selection list. "← Back" lives in the dialog header so
// each step's body is just the question + cards.

// ── Step intro: cost-of-works card + resolve/share choice
function FixIntro({ scope, totals, onResolve, onForward }) {
  const grouped = useMemo(() => {
    const m = new Map();
    for (const s of scope) {
      const key = s.trade_categories?.group_label || "Other";
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(s);
    }
    return Array.from(m.entries());
  }, [scope]);

  return (
    <>
      <FixStepIntro
        eyebrow="Indicative scope"
        title="What we'd expect this to cost"
      />
      <div className="pr-fix-cost">
        <div className="pr-fix-cost__total">
          ${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}
        </div>
        <p className="pr-fix-cost__sub">
          {scope.length} item{scope.length === 1 ? "" : "s"} ·
          {" "}{(new Set(scope.map((s) => s.trade_categories?.name).filter(Boolean))).size} trade
          {scope.length === 1 ? "" : "s"} flagged
        </p>
        <div className="pr-fix-cost__groups">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel} className="report-demo__scope-group">
              <div className="report-demo__scope-group-head">
                <span className="report-demo__scope-category">{groupLabel}</span>
              </div>
              <ul className="report-demo__scope-items">
                {items.map((s) => (
                  <li key={s.scope_item_id}>
                    <div className="report-demo__scope-item-head pr-fix-cost__item-head">
                      <strong>{s.trade_categories?.name || "—"}</strong>
                      {s.scope_tier ? (
                        <span className={`report-demo__pill ${tierClass(s.scope_tier)}`}>
                          {s.scope_tier}
                        </span>
                      ) : null}
                      <span className="report-demo__scope-item-cost">
                        ${(s.cost_min ?? 0).toLocaleString()} – ${(s.cost_max ?? 0).toLocaleString()}
                      </span>
                    </div>
                    {s.detail ? (
                      <span className="report-demo__scope-item-detail">{s.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="pr-fix-dialog__question">What would you like to do?</p>
      <div className="report-demo__next-grid pr-fix-dialog__choices">
        <FixChoiceCard
          recommended
          title="I'd like to resolve this"
          copy="Get quotes from trusted contractors matched to your scope of works."
          cta="Continue"
          onClick={onResolve}
        />
        <FixChoiceCard
          title="I'd like to forward / share the result"
          copy="Send the report to your insurer, builder, landlord, or property manager."
          cta="Continue"
          onClick={onForward}
        />
      </div>
    </>
  );
}

// ── Step forward: print + share affordances
function FixForward() {
  async function shareReport() {
    if (typeof navigator === "undefined" || !navigator.share) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Report link copied to clipboard.");
      } catch {/* noop */}
      return;
    }
    try {
      await navigator.share({
        title: "Sporetrust inspection report",
        text: "Inspection report from Sporetrust.",
        url: window.location.href,
      });
    } catch {/* user cancelled */}
  }
  return (
    <>
      <FixStepIntro
        eyebrow="Forward your report"
        title="Send the findings to whoever needs them."
        body="The full diagnostic — photos, readings, lab counts, scope — is captured in this report. Forward the link or print a PDF to share with your insurer, builder, landlord, or property manager."
      />
      <div className="report-demo__next-grid pr-fix-dialog__choices">
        <FixChoiceCard
          recommended
          title="Print or save as PDF"
          copy="Browser print dialog · pages break per room."
          cta="Print"
          onClick={() => typeof window !== "undefined" && window.print()}
        />
        <FixChoiceCard
          title="Copy report link"
          copy="Share via messages, email, or social."
          cta="Copy link"
          onClick={shareReport}
        />
      </div>
    </>
  );
}

// ── Step contractors-question: own vs vetted
function FixContractorsQuestion({ onOwn, onVetted, hasPartners }) {
  return (
    <>
      <FixStepIntro
        eyebrow="Trusted contractors"
        title="Would you like recommendations on trusted contractors to quote your works?"
        body="We can introduce you to vetted remediation and repair partners matched to the trades flagged in your scope. They quote — you decide."
      />
      <div className="report-demo__next-grid pr-fix-dialog__choices">
        <FixChoiceCard
          recommended={hasPartners}
          title="Yes, show me vetted contractors"
          copy={hasPartners ? "We'll forward your report; they contact you directly to quote." : "None matched to your scope in your area yet."}
          cta="Continue"
          onClick={onVetted}
          disabled={!hasPartners}
        />
        <FixChoiceCard
          title="No, I'd like to find my own contractors"
          copy="Use the report to brief whoever you choose."
          cta="Continue"
          onClick={onOwn}
        />
      </div>
    </>
  );
}

// ── Step find-own: encouragement + print
function FixFindOwn({ totals }) {
  return (
    <>
      <FixStepIntro
        eyebrow="Find your own contractors"
        title="Use the report to brief your trades."
        body={
          <>
            The diagnostic in this report is enough for most contractors to scope your works.
            Print a copy or forward the link to anyone you want to quote.
            Our indicative range — <strong>${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}</strong> —
            is what we'd expect; use it as a sanity check on what comes back.
          </>
        }
      />
      <div className="report-demo__next-grid pr-fix-dialog__choices">
        <FixChoiceCard
          recommended
          title="Print or save as PDF"
          copy="Hand to your chosen contractor."
          cta="Print"
          onClick={() => typeof window !== "undefined" && window.print()}
        />
      </div>
    </>
  );
}

// ── Step select-partners: cards with checkboxes + terms + submit
function FixSelectPartners({ partners, selected, onToggle, terms, onTerms, onSubmit }) {
  const canSubmit = selected.size > 0 && terms;
  return (
    <>
      <FixStepIntro
        eyebrow="Request quotes"
        title="Pick the contractors you'd like to quote your works."
        body="Each one is matched to the trades flagged in your scope. They'll contact you with quotes — no obligation to proceed."
      />

      <div className="pr-fix-dialog__partners">
        {partners.length === 0 ? (
          <p className="report-demo__muted">No matched partners in your area yet.</p>
        ) : (
          partners.map((p) => {
            const isSelected = selected.has(p.partner_id);
            return (
              <label
                key={p.partner_id}
                className={`report-demo__partner-card pr-fix-dialog__partner-card ${isSelected ? "is-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  className="pr-fix-dialog__partner-check"
                  checked={isSelected}
                  onChange={() => onToggle(p.partner_id)}
                />
                {p.rating != null ? (
                  <span className="report-demo__partner-rating">
                    <strong>{Number(p.rating).toFixed(1)}</strong>{" "}
                    {p.reviews_count ? <em>({p.reviews_count} reviews)</em> : null}
                  </span>
                ) : null}
                <h3>{p.name}</h3>
                {p.credentials ? <p className="report-demo__partner-creds">{p.credentials}</p> : null}
                {p.notes ? <p className="report-demo__partner-summary">{p.notes}</p> : null}
              </label>
            );
          })
        )}
      </div>

      <label className="pr-fix-dialog__terms">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => onTerms(e.target.checked)}
        />
        <span>
          I understand Sporetrust will forward my report to the selected partners.{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>Full terms</a>.
        </span>
      </label>

      <button
        type="button"
        className="report-demo__resolution-cta-btn pr-fix-dialog__submit"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        {selected.size === 0
          ? "Pick at least one contractor"
          : `Request quotes from ${selected.size} contractor${selected.size === 1 ? "" : "s"}`}
        <ArrowIcon />
      </button>
    </>
  );
}

// ── Step sent: confirmation
function FixQuoteSent({ selectedCount, onClose }) {
  return (
    <>
      <FixStepIntro
        eyebrow="Done"
        title="Your report's on the way."
        body={`We've forwarded your inspection findings to the ${selectedCount} contractor${selectedCount === 1 ? "" : "s"} you selected. They'll be in touch to scope your works and provide a quote. No obligation to proceed.`}
      />
      <div className="report-demo__next-grid pr-fix-dialog__choices">
        <FixChoiceCard
          recommended
          title="Close"
          copy="Re-read the diagnostic or share the report."
          cta="Close"
          onClick={onClose}
        />
      </div>
    </>
  );
}

// Shared step header (eyebrow + title + optional body). Sits at the top
// of every step's body content.
function FixStepIntro({ eyebrow, title, body }) {
  return (
    <header className="pr-fix-dialog__step-head">
      {eyebrow ? <p className="pr-fix-dialog__eyebrow">{eyebrow}</p> : null}
      <h2 className="pr-fix-dialog__title-h">{title}</h2>
      {body ? <p className="pr-fix-dialog__body-prose">{body}</p> : null}
    </header>
  );
}

// Share dialog — opened from the Overview's "Download or forward as PDF"
// CTA. Lets the customer pick an audience variant (homeowner / tenant /
// insurer) BEFORE entering the PDF viewer, so a tenant or insurer copy
// loads directly with no extra clicks. Mirrors the FixDialog modal
// chrome for visual consistency.
function ShareReportDialog({ slug, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const variants = [
    {
      id: "homeowner",
      title: "For your records",
      copy: "Yours to keep, revisit later, or take to any trade. Includes the indicative scope and a way to request quotes from our matched contractors.",
      cta: "Open homeowner version",
    },
    {
      id: "tenant",
      title: "For your landlord",
      copy: "Same evidence, addressed to your landlord, property manager, or letting agent so they can act on it. Hand it over and request a response.",
      cta: "Open landlord version",
    },
    {
      id: "insurance",
      title: "For your insurer",
      copy: "Built for a claim. Leads with our methodology, accreditations, and sample chain-of-custody so the adjuster has what they need to substantiate the loss.",
      cta: "Open insurer version",
    },
  ];

  return (
    <div
      className="pr-fix-dialog pr-share-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Share report as PDF"
    >
      <button
        type="button"
        className="pr-fix-dialog__backdrop"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="pr-fix-dialog__card" role="document">
        <header className="pr-fix-dialog__head">
          <span />
          <span className="pr-fix-dialog__title">Share report as PDF</span>
          <button
            type="button"
            className="pr-fix-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="pr-fix-dialog__body">
          <header className="pr-fix-dialog__step-head">
            <h2 className="pr-fix-dialog__title-h">Who is this report for?</h2>
            <p className="pr-fix-dialog__body-prose">
              All three versions carry the same evidence. The cover and next steps
              are tailored to whoever you&apos;re handing it to.
            </p>
          </header>
          <div className="report-demo__next-grid pr-fix-dialog__choices">
            {variants.map((v) => (
              <Link
                key={v.id}
                href={`/r2/${slug}/print?template=${v.id}`}
                className="report-demo__next-card pr-share-dialog__card"
              >
                <h3>{v.title}</h3>
                <p>{v.copy}</p>
                <span className="report-demo__next-card-cta">
                  {v.cta}
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// One choice card — uses the demo's .report-demo__next-card structure.
// Drops the numeric eyebrow (01/02 etc) and inlines the "Recommended"
// chip next to the title so the choice reads as a single line.
function FixChoiceCard({ recommended, title, copy, cta, onClick, disabled }) {
  return (
    <article className={`report-demo__next-card${recommended ? " is-recommended" : ""}`}>
      <h3 className="pr-fix-choice__title">
        <span>{title}</span>
        {recommended ? (
          <span className="report-demo__next-card-badge">Recommended</span>
        ) : null}
      </h3>
      <p>{copy}</p>
      <button
        type="button"
        className="report-demo__next-card-cta"
        onClick={onClick}
        disabled={disabled}
      >
        {cta}
        <ArrowIcon />
      </button>
    </article>
  );
}


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

export function normaliseToOne(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  if (typeof v === "object") return v;
  return null;
}

export function publicUrl(bucket, storagePath) {
  if (!PUBLIC_BUCKET_BASE || !storagePath) return "";
  return `${PUBLIC_BUCKET_BASE}/${bucket}/${storagePath}`;
}

export function fmtDate(iso) {
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
