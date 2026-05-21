import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { reportUrl, resolveTemplate } from "../templates";
import "./render.css";

// Internal HTML route consumed by Puppeteer. NOT a viewer — this renders
// the inspection report as a paper-first single-column A4 portrait
// document with one room per page, no interactive chrome, no scroll
// containers. The PDF generation endpoint at /r2/[slug]/print/pdf
// navigates here in headless Chrome and runs `page.pdf()` to produce the
// final binary. End users never see this directly.

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const t = resolveTemplate(typeof sp.template === "string" ? sp.template : null);
  // The browser-native PDF viewer surfaces this as the document title in
  // its toolbar, and Puppeteer's `page.pdf()` writes it to the PDF's
  // metadata. Make it audience-specific so a saved file is easy to tell
  // apart from the homeowner / tenant / insurance variants.
  return {
    title: `Sporetrust report (${t.label}) — ${slug.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

const PUBLIC_BUCKET_BASE =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
    : "";

const SEVERITY_LABEL = {
  none: "Clear", normal: "Normal", low: "Low",
  moderate: "Moderate", high: "High", severe: "Severe",
  minor: "Minor", major: "Major",
};

const SOURCE_CATEGORY_LABEL = {
  roof: "Roof", walls: "Walls", wet_area: "Wet area",
  plumbing: "Plumbing", hvac: "HVAC", ventilation: "Ventilation",
  drainage: "Drainage", subfloor: "Subfloor", appliance: "Appliance",
  condensation: "Condensation", unknown: "Unknown",
};

function tierClass(tier) {
  const k = String(tier || "").toLowerCase();
  if (k === "normal" || k === "minor" || k === "low" || k === "none") return "pill--ok";
  if (k === "moderate") return "pill--warn";
  if (k === "severe" || k === "high" || k === "major") return "pill--bad";
  return "";
}

function publicUrl(bucket, path) {
  if (!PUBLIC_BUCKET_BASE || !path) return "";
  return `${PUBLIC_BUCKET_BASE}/${bucket}/${path}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// Picks the most-concerning moisture reading for the room-summary card:
// rank by severity tier first, then by raw reading value within tier.
function pickWorstReading(readings) {
  if (!readings || readings.length === 0) return null;
  const rank = (lvl) => {
    const k = String(lvl || "").toLowerCase();
    if (k === "severe" || k === "high" || k === "major") return 3;
    if (k === "moderate") return 2;
    if (k === "low" || k === "minor") return 1;
    return 0;
  };
  return readings.slice().sort((a, b) => {
    const dr = rank(b.level) - rank(a.level);
    if (dr !== 0) return dr;
    return (Number(b.reading_value) || 0) - (Number(a.reading_value) || 0);
  })[0];
}

// Plain-language interpretation of a moisture reading's tier. Keeps the
// PDF audience-agnostic — no AS section numbers, no claims-language.
function interpretMoistureLevel(level) {
  const k = String(level || "").toLowerCase();
  if (k === "severe" || k === "high" || k === "major") {
    return "Active wetting indicated. The source is still present and must be interrupted before drying or remediation.";
  }
  if (k === "moderate") {
    return "Above the dry standard for this substrate. Drying is required; investigate whether the source is ongoing.";
  }
  if (k === "low" || k === "minor") {
    return "Slightly elevated. Monitor under the same ambient conditions to confirm a downward trend.";
  }
  return "Within the dry standard expected for this substrate.";
}

// Human-readable label + interpretation for an air-sample classification
// group. Groups come from fungal_classifications.classification_group.
const CLASSIFICATION_GROUP = {
  predominantly_outdoor: {
    label: "Outdoor baseline",
    note: "Outdoor species expected at low background levels indoors. Elevated indoor counts are unusual but possible after open windows or recent ventilation.",
  },
  predominantly_indoor_water_related: {
    label: "Indoor water-damage indicators",
    note: "Indoor presence indicates active or recent wetting events. The source must be identified and interrupted; remediation should follow source control.",
  },
  indoor_outdoor: {
    label: "Common amplifiers",
    note: "Allergenic species commonly amplified indoors when an active substrate (damp material) is present. Elevated indoor levels vs the outdoor baseline drive most respiratory symptoms.",
  },
};

function classificationGroup(group) {
  return CLASSIFICATION_GROUP[group] || { label: group || "Other", note: "" };
}

function normaliseToOne(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  if (typeof v === "object") return v;
  return null;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function PrintRenderPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const t = resolveTemplate(typeof sp.template === "string" ? sp.template : null);

  const supabase = createServerSupabaseClient();
  if (!supabase) notFound();

  const select = `
    inspection_id, scheduled_at, started_at, completed_at,
    signed_off_at, report_slug, report_status, report_severity,
    report_title, report_summary, report_published_at, inspection_type, on_site_notes,
    customers(name),
    properties(address_line, postcode, state),
    technician:technicians!inspections_technician_id_fkey(name, role, qualifications),
    signoff:technicians!inspections_signed_off_by_technician_id_fkey(name, role, qualifications),
    sample_locations(
      sample_location_id, name, is_outdoor_control, mould_pressure_tier, thermal_delta_c,
      display_order, sampled_at, notes,
      image_captures(image_capture_id, capture_kind, storage_path, caption, pair_group),
      moisture_readings(
        moisture_reading_id, surface_label, reading_value, reading_unit, level,
        marker_x_pct, marker_y_pct, image_capture_id, depth_mm, instrument_model,
        measured_at, evidence_image_capture_id,
        evidence_capture:image_captures!evidence_image_capture_id(storage_path, caption, captured_at)
      ),
      location_findings(finding_id, observation, display_order),
      location_sources(source_id, rank, source_category, description, display_order),
      air_samples(
        air_sample_id, lab_sample_id, sampled_at, lab_partner,
        total_spores_per_m3, slide_trace_4x_outside_path,
        slide_trace_4x_inside_path, slide_30x_zoomed_path,
        dominant_fungal_classification_id, intake_evidence_image_capture_id,
        intake_evidence:image_captures!intake_evidence_image_capture_id(storage_path, caption, captured_at),
        fungal_classifications(name, classification_group),
        air_sample_fungal_counts(
          air_sample_fungal_count_id, spores_per_m3, level,
          fungal_classifications(name, classification_group, health_notes, habitat)
        )
      )
    ),
    scope_items(scope_item_id, scope_tier, cost_min, cost_max, detail, display_order,
                trade_categories(trade_category_id, name, group_label))
  `.replace(/\s+/g, " ");

  const { data: inspection, error } = await supabase
    .from("inspections")
    .select(select)
    .eq("report_slug", slug)
    .eq("report_status", "published")
    .maybeSingle();

  if (error || !inspection) notFound();

  const allLocations = (inspection.sample_locations || []).slice();
  const outdoor = allLocations.find((l) => l.is_outdoor_control) || null;
  const outdoorAir = normaliseToOne(outdoor?.air_samples);
  const outdoorTotal = outdoorAir?.total_spores_per_m3 ?? null;
  const locations = allLocations
    .filter((l) => !l.is_outdoor_control)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const scope = (inspection.scope_items || [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const totals = scope.reduce(
    (acc, s) => ({
      min: acc.min + (Number(s.cost_min) || 0),
      max: acc.max + (Number(s.cost_max) || 0),
    }),
    { min: 0, max: 0 },
  );

  const property = inspection.properties || {};
  const technician = inspection.technician || {};
  const signoff = inspection.signoff || {};

  return (
    <>
      {/* Hide site chrome (header/footer) on this render route so Puppeteer
          only captures the document. The render route is only ever opened
          by the PDF generator, never by an end user. */}
      <style dangerouslySetInnerHTML={{ __html: `
        body > header, body > footer,
        body .mega-nav, body .lander-header, body .lander-footer, body .footer,
        body .utility-banner, body .sticky-cta { display: none !important; }
        html, body { background: #fff !important; margin: 0 !important; }
      `}} />

      <div className="pdoc">
        {/* ─── Cover page ─────────────────────────────────────────────── */}
        <section className="pdoc-page pdoc-cover">
          <header className="pdoc-cover__brand">
            <div className="pdoc-cover__brand-mark">Sporetrust</div>
            <div className="pdoc-cover__recipient">{t.recipient}</div>
          </header>

          <div className="pdoc-cover__title-block">
            <p className="pdoc-eyebrow">Inspection report</p>
            {inspection.report_severity ? (
              <span className={`pdoc-pill ${tierClass(inspection.report_severity)}`}>
                {SEVERITY_LABEL[inspection.report_severity] || inspection.report_severity}
              </span>
            ) : null}
            <h1 className="pdoc-cover__title">
              {inspection.report_title || "Inspection report"}
            </h1>
            {inspection.report_summary ? (
              <p className="pdoc-cover__summary">{inspection.report_summary}</p>
            ) : null}
          </div>

          <dl className="pdoc-cover__meta">
            <div>
              <dt>Property</dt>
              <dd>
                {property.address_line || "—"}
                {(property.postcode || property.state) ? <br /> : null}
                {property.postcode ? `${property.postcode}` : ""}
                {property.state ? ` ${property.state}` : ""}
              </dd>
            </div>
            <div>
              <dt>Inspection date</dt>
              <dd>{fmtDateLong(inspection.completed_at || inspection.scheduled_at)}</dd>
            </div>
            <div>
              <dt>Field technician</dt>
              <dd>
                {technician.name || "—"}
                {technician.qualifications ? <><br /><span className="pdoc-cover__meta-sub">{technician.qualifications}</span></> : null}
              </dd>
            </div>
            <div>
              <dt>Signed off by</dt>
              <dd>
                {signoff.name || "—"}
                {signoff.qualifications ? <><br /><span className="pdoc-cover__meta-sub">{signoff.qualifications}</span></> : null}
                {inspection.signed_off_at ? <><br /><span className="pdoc-cover__meta-sub">{fmtDate(inspection.signed_off_at)}</span></> : null}
              </dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{inspection.customers?.name || "—"}</dd>
            </div>
            <div>
              <dt>Report reference</dt>
              <dd className="pdoc-mono">{slug}</dd>
            </div>
          </dl>

          <div className="pdoc-cover__intro">
            {t.coverIntro.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </section>

        {/* ─── One page per room ──────────────────────────────────────── */}
        {locations.map((loc, idx) => {
          const captures = loc.image_captures || [];
          const visible = captures.find((c) => c.capture_kind === "visible" && c.pair_group === 1);
          const thermal = captures.find((c) => c.capture_kind === "thermal" && c.pair_group === 1);
          const readings = (loc.moisture_readings || []).slice().sort((a, b) => a.moisture_reading_id - b.moisture_reading_id);
          const findings = (loc.location_findings || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          const sources = (loc.location_sources || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          const air = normaliseToOne(loc.air_samples);
          const indoorTotal = air?.total_spores_per_m3 ?? null;
          const ratio = (indoorTotal != null && outdoorTotal != null && outdoorTotal > 0)
            ? (indoorTotal / outdoorTotal) : null;
          const counts = (air?.air_sample_fungal_counts || [])
            .slice()
            .sort((a, b) => {
              const rank = (lvl) => (lvl === "severe" ? 3 : lvl === "moderate" ? 2 : lvl === "normal" ? 1 : 0);
              const dr = rank(b.level) - rank(a.level);
              if (dr !== 0) return dr;
              return (b.spores_per_m3 ?? 0) - (a.spores_per_m3 ?? 0);
            });

          return (
            <section key={loc.sample_location_id} className="pdoc-page pdoc-room">
              <header className="pdoc-room__head">
                <p className="pdoc-eyebrow">Room {idx + 1} of {locations.length}</p>
                <div className="pdoc-room__title-row">
                  <h2 className="pdoc-room__title">{loc.name}</h2>
                  {loc.mould_pressure_tier ? (
                    <span className={`pdoc-pill ${tierClass(loc.mould_pressure_tier)}`}>
                      {SEVERITY_LABEL[loc.mould_pressure_tier] || loc.mould_pressure_tier}
                    </span>
                  ) : null}
                </div>
                {loc.thermal_delta_c != null ? (
                  <p className="pdoc-room__meta">
                    Thermal delta {loc.thermal_delta_c > 0 ? "+" : ""}{loc.thermal_delta_c} °C ·
                    {readings[0]?.instrument_model ? ` ${readings[0].instrument_model}` : ""}
                    {readings[0]?.depth_mm ? ` · ${readings[0].depth_mm} mm depth` : ""}
                  </p>
                ) : null}
              </header>

              {/* ─── Room summary card ──────────────────────────────────
                  At-a-glance: the worst moisture reading, the indoor vs
                  outdoor air ratio, and the technician's narrative
                  findings + likely sources. Sits at the top of the room
                  so the customer reads the conclusion before the
                  supporting evidence below. */}
              {(() => {
                const worst = pickWorstReading(readings);
                const hasAirRatio = ratio != null;
                const hasFindings = findings.length > 0 || sources.length > 0;
                if (!worst && !hasAirRatio && !hasFindings) return null;
                return (
                  <article className="pdoc-summary">
                    {(worst || hasAirRatio) ? (
                      <div className="pdoc-summary__stats">
                        {worst ? (
                          <div className="pdoc-summary__stat">
                            <p className="pdoc-summary__stat-eyebrow">Highest moisture reading</p>
                            <p className="pdoc-summary__stat-value pdoc-mono">
                              {worst.reading_value != null ? Number(worst.reading_value).toFixed(1) : "—"}
                              {worst.reading_unit ? <em> {worst.reading_unit}</em> : null}
                            </p>
                            <p className="pdoc-summary__stat-meta">
                              {worst.surface_label || "(unlabelled surface)"}
                              {worst.depth_mm ? ` · ${worst.depth_mm} mm` : ""}
                            </p>
                            {worst.level ? (
                              <span className={`pdoc-pill ${tierClass(worst.level)}`}>
                                {SEVERITY_LABEL[worst.level] || worst.level}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {hasAirRatio ? (
                          <div className="pdoc-summary__stat">
                            <p className="pdoc-summary__stat-eyebrow">Air vs outdoor baseline</p>
                            <p className="pdoc-summary__stat-value pdoc-mono">
                              {ratio.toFixed(1)}<em>×</em>
                            </p>
                            <p className="pdoc-summary__stat-meta">
                              {indoorTotal.toLocaleString()} vs {outdoorTotal.toLocaleString()} cts/m³
                            </p>
                            <span className={`pdoc-pill ${ratio >= 5 ? "pill--bad" : ratio >= 2 ? "pill--warn" : "pill--ok"}`}>
                              {ratio >= 5 ? "Elevated" : ratio >= 2 ? "Above baseline" : "At baseline"}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {hasFindings ? (
                      <div className="pdoc-summary__findings">
                        {findings.length > 0 ? (
                          <div className="pdoc-findings__observation">
                            <p className="pdoc-findings__eyebrow">Findings</p>
                            {findings.map((f) => (
                              <p key={f.finding_id} className="pdoc-findings__obs">{f.observation}</p>
                            ))}
                          </div>
                        ) : null}
                        {sources.length > 0 ? (
                          <div className="pdoc-findings__sources">
                            <p className="pdoc-findings__eyebrow">Likely sources</p>
                            <div className="pdoc-findings__source-grid">
                              {sources.map((s) => (
                                <div
                                  key={s.source_id}
                                  className={`pdoc-findings__source pdoc-findings__source--${(s.rank || "other").toLowerCase()}`}
                                >
                                  <header className="pdoc-findings__source-head">
                                    <span className="pdoc-findings__source-rank">{capitalize(s.rank)}</span>
                                    <strong>{SOURCE_CATEGORY_LABEL[s.source_category] || s.source_category}</strong>
                                  </header>
                                  <p className="pdoc-findings__source-body">{s.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })()}

              {/* Visible + thermal images side-by-side (full content width).
                  Each image carries an overlay of numbered marker dots —
                  one per moisture reading with marker_x/y_pct set — so
                  the customer can map each pin back to the matching
                  evidence card below. */}
              {(visible || thermal) ? (() => {
                const positioned = readings.filter(
                  (r) => r.marker_x_pct != null && r.marker_y_pct != null,
                );
                const markers = positioned.length > 0 ? (
                  <div className="pdoc-image__markers" aria-hidden>
                    {positioned.map((r, mi) => (
                      <span
                        key={r.moisture_reading_id}
                        className="pdoc-image__marker"
                        style={{ left: `${r.marker_x_pct}%`, top: `${r.marker_y_pct}%` }}
                      >
                        {mi + 1}
                      </span>
                    ))}
                  </div>
                ) : null;
                return (
                  <div className="pdoc-images">
                    {visible ? (
                      <figure className="pdoc-image">
                        <div className="pdoc-image__frame">
                          <img src={publicUrl("inspection-images", visible.storage_path)} alt={`Visible — ${loc.name}`} />
                          {markers}
                        </div>
                        <figcaption>Visible</figcaption>
                      </figure>
                    ) : null}
                    {thermal ? (
                      <figure className="pdoc-image">
                        <div className="pdoc-image__frame">
                          <img src={publicUrl("inspection-images", thermal.storage_path)} alt={`Thermal — ${loc.name}`} />
                          {markers}
                        </div>
                        <figcaption>Thermal</figcaption>
                      </figure>
                    ) : null}
                  </div>
                );
              })() : null}

              {/* Per-reading moisture evidence — one card per sample with
                  intake image, instrument, depth, timestamp, and a
                  plain-language interpretation of the reading. */}
              {readings.length > 0 ? (
                <div className="pdoc-block">
                  <h3 className="pdoc-block__title">Moisture samples ({readings.length})</h3>
                  <div className="pdoc-evidence-stack">
                    {readings.map((r, i) => {
                      const idxLabel = String(i + 1).padStart(2, "0");
                      const evidence = r.evidence_capture;
                      const instrument = r.instrument_model || "moisture meter";
                      const technicianName = technician.name || "the field technician";
                      return (
                        <article key={r.moisture_reading_id} className="pdoc-evidence">
                          <div className="pdoc-evidence__body">
                            <header className="pdoc-evidence__head">
                              <span className="pdoc-evidence__index">{idxLabel}</span>
                              <div className="pdoc-evidence__title-wrap">
                                <strong className="pdoc-evidence__title">
                                  {r.surface_label || "(unlabelled surface)"}
                                </strong>
                                <span className="pdoc-evidence__value pdoc-mono">
                                  {r.reading_value != null ? Number(r.reading_value).toFixed(1) : "—"}
                                  {r.reading_unit ? <em> {r.reading_unit}</em> : null}
                                </span>
                              </div>
                              <span className={`pdoc-pill ${tierClass(r.level)}`}>
                                {SEVERITY_LABEL[r.level] || r.level || "—"}
                              </span>
                            </header>

                            <dl className="pdoc-evidence__detail">
                              <div>
                                <dt>Instrument</dt>
                                <dd>{instrument}</dd>
                              </div>
                              <div>
                                <dt>Depth</dt>
                                <dd>{r.depth_mm != null ? `${r.depth_mm} mm` : "—"}</dd>
                              </div>
                              <div>
                                <dt>Measured</dt>
                                <dd>{fmtDateTime(r.measured_at)}</dd>
                              </div>
                            </dl>

                            <p className="pdoc-evidence__interp">
                              <span className="pdoc-evidence__interp-eyebrow">Interpretation</span>{" "}
                              {interpretMoistureLevel(r.level)}
                            </p>
                          </div>

                          {evidence?.storage_path ? (
                            <figure className="pdoc-evidence__image">
                              <img
                                src={publicUrl("inspection-images", evidence.storage_path)}
                                alt={`Intake evidence — moisture sample ${idxLabel}`}
                              />
                              <figcaption>
                                Intake evidence of sample {idxLabel}, conducted by{" "}
                                <strong>{technicianName}</strong> with <strong>{instrument}</strong>
                                {r.depth_mm ? ` at ${r.depth_mm} mm depth` : ""}.
                              </figcaption>
                            </figure>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Air sample */}
              <div className="pdoc-block">
                <h3 className="pdoc-block__title">Air sample</h3>
                {air ? (
                  <>
                    {(air.slide_trace_4x_inside_path || air.slide_trace_4x_outside_path || air.slide_30x_zoomed_path) ? (
                      <div className="pdoc-images pdoc-images--slides">
                        {(air.slide_trace_4x_inside_path || air.slide_trace_4x_outside_path) ? (
                          <figure className="pdoc-image pdoc-image--slide">
                            <img src={publicUrl("air-slides", air.slide_trace_4x_inside_path || air.slide_trace_4x_outside_path)} alt="4× trace slide" />
                            <figcaption>4× trace</figcaption>
                          </figure>
                        ) : null}
                        {air.slide_30x_zoomed_path ? (
                          <figure className="pdoc-image pdoc-image--slide">
                            <img src={publicUrl("air-slides", air.slide_30x_zoomed_path)} alt="30× zoomed slide" />
                            <figcaption>30× zoomed</figcaption>
                          </figure>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="pdoc-air-compare">
                      <div className="pdoc-air-compare__body">
                        <div className="pdoc-air-compare__row">
                          <span className="pdoc-air-compare__label">Outdoor baseline</span>
                          <span className="pdoc-air-compare__value pdoc-mono">
                            {outdoorTotal != null ? outdoorTotal.toLocaleString() : "—"}
                            <em> cts/m³</em>
                          </span>
                        </div>
                        <div className="pdoc-air-compare__row">
                          <span className="pdoc-air-compare__label">{loc.name}</span>
                          <span className={`pdoc-air-compare__value pdoc-mono ${ratio != null && ratio >= 5 ? "is-alarm" : ""}`}>
                            {indoorTotal != null ? indoorTotal.toLocaleString() : "—"}
                            <em> cts/m³</em>
                          </span>
                        </div>
                        {ratio != null ? (
                          <p className="pdoc-air-compare__note">
                            <strong>{ratio.toFixed(1)}×</strong> the outdoor baseline.
                          </p>
                        ) : null}
                      </div>
                      {air.intake_evidence?.storage_path ? (
                        <figure className="pdoc-air-compare__image">
                          <img
                            src={publicUrl("inspection-images", air.intake_evidence.storage_path)}
                            alt={`Air sample intake — ${loc.name}`}
                          />
                          <figcaption>
                            Intake evidence of air sample, conducted by{" "}
                            <strong>{technician.name || "the field technician"}</strong>
                            {air.lab_sample_id ? ` · ${air.lab_sample_id}` : ""}.
                          </figcaption>
                        </figure>
                      ) : null}
                    </div>

                    {counts.length > 0 ? (
                      <>
                        {/* Classification rollup — totals + interpretation
                            per group so the long species list below has
                            context. Drives the customer's eye to the
                            water-damage-indicator and amplifier groups. */}
                        {(() => {
                          const byGroup = new Map();
                          for (const c of counts) {
                            const g = c.fungal_classifications?.classification_group || "other";
                            const prev = byGroup.get(g) || { total: 0, species: 0 };
                            byGroup.set(g, {
                              total: prev.total + (Number(c.spores_per_m3) || 0),
                              species: prev.species + 1,
                            });
                          }
                          // Order: water-damage indicators first (most relevant),
                          // then amplifiers, then outdoor baseline, then anything else.
                          const order = [
                            "predominantly_indoor_water_related",
                            "indoor_outdoor",
                            "predominantly_outdoor",
                          ];
                          const rows = order
                            .filter((g) => byGroup.has(g))
                            .concat([...byGroup.keys()].filter((g) => !order.includes(g)))
                            .map((g) => ({ id: g, ...byGroup.get(g), ...classificationGroup(g) }));
                          if (rows.length === 0) return null;
                          return (
                            <div className="pdoc-rollup">
                              <h4 className="pdoc-rollup__title">By classification group</h4>
                              <ul className="pdoc-rollup__list">
                                {rows.map((r) => (
                                  <li key={r.id} className={`pdoc-rollup__row pdoc-rollup__row--${r.id.replace(/_/g, "-")}`}>
                                    <div className="pdoc-rollup__row-head">
                                      <strong>{r.label}</strong>
                                      <span className="pdoc-rollup__totals pdoc-mono">
                                        {r.total.toLocaleString()}<em> cts/m³</em>
                                        <span className="pdoc-rollup__species"> · {r.species} {r.species === 1 ? "species" : "species"}</span>
                                      </span>
                                    </div>
                                    {r.note ? <p className="pdoc-rollup__note">{r.note}</p> : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}

                        <table className="pdoc-table pdoc-table--compact">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Species</th>
                              <th>Group</th>
                              <th className="pdoc-num">cts/m³</th>
                              <th>Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {counts.map((c, i) => {
                              const grp = classificationGroup(c.fungal_classifications?.classification_group);
                              return (
                                <tr key={c.air_sample_fungal_count_id}>
                                  <td className="pdoc-table__idx">{String(i + 1).padStart(2, "0")}</td>
                                  <td>{c.fungal_classifications?.name || `Species #${i + 1}`}</td>
                                  <td className="pdoc-table__group">{grp.label}</td>
                                  <td className="pdoc-num pdoc-mono">
                                    {(c.spores_per_m3 ?? 0).toLocaleString()}
                                  </td>
                                  <td>
                                    {c.level ? (
                                      <span className={`pdoc-pill ${tierClass(c.level)}`}>{SEVERITY_LABEL[c.level] || c.level}</span>
                                    ) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </>
                    ) : null}

                    {(air.lab_partner || air.lab_sample_id) ? (
                      <p className="pdoc-foot-note">
                        Lab provenance: {[air.lab_partner, air.lab_sample_id].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="pdoc-prose pdoc-muted">No air sample recorded for this location.</p>
                )}
              </div>
            </section>
          );
        })}

        {/* ─── Your Fix Plan — full-page CTA ───────────────────────────────
            The conversion page. Audience-specific eyebrow, headline,
            and body framing. A real clickable anchor button (Puppeteer
            preserves <a href> as a PDF link annotation) takes the
            reader to the live interactive report. Scope detail follows
            as supporting evidence beneath the action. */}
        <section className="pdoc-page pdoc-fix">
          <p className="pdoc-fix__eyebrow">{t.cta.eyebrow}</p>
          <h2 className="pdoc-fix__headline">{t.cta.headline}</h2>
          <p className="pdoc-fix__body">{t.cta.body}</p>

          <a
            className="pdoc-fix__button"
            href={reportUrl(slug)}
            aria-label={`${t.cta.buttonLabel} — opens live report`}
          >
            <span className="pdoc-fix__button-label">{t.cta.buttonLabel}</span>
            <span className="pdoc-fix__button-arrow" aria-hidden>→</span>
          </a>

          <p className="pdoc-fix__url-line">
            <span className="pdoc-fix__url-eyebrow">{t.cta.urlEyebrow}</span>{" "}
            <a className="pdoc-fix__url" href={reportUrl(slug)}>{reportUrl(slug).replace(/^https?:\/\//, "")}</a>
          </p>

          {scope.length > 0 ? (
            <>
              <div className="pdoc-fix__stats">
                <div>
                  <p className="pdoc-fix__stat-eyebrow">Indicative scope</p>
                  <p className="pdoc-fix__stat-value pdoc-mono">
                    ${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="pdoc-fix__stat-eyebrow">Trades flagged</p>
                  <p className="pdoc-fix__stat-value">{scope.length}</p>
                </div>
                <div>
                  <p className="pdoc-fix__stat-eyebrow">Severity</p>
                  <p className="pdoc-fix__stat-value">
                    {SEVERITY_LABEL[inspection.report_severity] || inspection.report_severity || "—"}
                  </p>
                </div>
              </div>

              <table className="pdoc-table pdoc-table--scope">
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>Detail</th>
                    <th>Tier</th>
                    <th className="pdoc-num">Cost range</th>
                  </tr>
                </thead>
                <tbody>
                  {scope.map((s) => (
                    <tr key={s.scope_item_id}>
                      <td>
                        <strong>{s.trade_categories?.name || "—"}</strong>
                        {s.trade_categories?.group_label ? (
                          <span className="pdoc-table__sub"> · {s.trade_categories.group_label}</span>
                        ) : null}
                      </td>
                      <td>{s.detail || "—"}</td>
                      <td>
                        <span className={`pdoc-pill ${tierClass(s.scope_tier)}`}>
                          {SEVERITY_LABEL[s.scope_tier] || s.scope_tier}
                        </span>
                      </td>
                      <td className="pdoc-num pdoc-mono">
                        ${Number(s.cost_min || 0).toLocaleString()} – ${Number(s.cost_max || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3}>Estimated total</th>
                    <th className="pdoc-num pdoc-mono">
                      ${totals.min.toLocaleString()} – ${totals.max.toLocaleString()}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </>
          ) : null}
        </section>

        {/* ─── Disclaimer (final block) ───────────────────────────────────
            Sits at the bottom of the document as a one-off note rather
            than repeating on every page. Carries qualifications, the
            technician + sign-off claim, the methodology disclaimer, and
            the report reference. */}
        <section className="pdoc-page pdoc-disclaimer">
          <header className="pdoc-disclaimer__head">
            <p className="pdoc-eyebrow">Report disclaimer &amp; sign-off</p>
            <h2 className="pdoc-disclaimer__title">Sporetrust · Independent mould &amp; moisture diagnostics</h2>
          </header>

          <p className="pdoc-disclaimer__body">
            This report documents conditions observed at the time of inspection by an
            independent technician using AS 4849.1 (Indoor Air Quality — Investigation
            Procedures) methodology. Findings reflect accessible surfaces and represent
            the technician&apos;s professional opinion at the time of inspection. Concealed
            conditions may differ and are not warranted; this report does not constitute
            a building, structural, or pest report. The remediation scope and cost
            ranges are indicative — final pricing is set by the appointed contractor
            at quote. This report should be read in conjunction with the technician&apos;s
            notes and any supplementary lab certificates referenced within.
          </p>

          <dl className="pdoc-disclaimer__signoff">
            {technician.name ? (
              <div>
                <dt>Inspected by</dt>
                <dd>
                  <strong>{technician.name}</strong>
                  {technician.qualifications ? <> · {technician.qualifications}</> : null}
                </dd>
              </div>
            ) : null}
            {signoff.name ? (
              <div>
                <dt>Reviewed and signed off by</dt>
                <dd>
                  <strong>{signoff.name}</strong>
                  {signoff.qualifications ? <> · {signoff.qualifications}</> : null}
                  {inspection.signed_off_at ? <> · {fmtDate(inspection.signed_off_at)}</> : null}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Report reference</dt>
              <dd className="pdoc-mono">{slug}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
