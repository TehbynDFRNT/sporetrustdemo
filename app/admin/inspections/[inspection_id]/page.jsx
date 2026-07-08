"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./inspection-workspace.css";

// Inspection landing page — a four-state state machine. The technician
// works through these in order, bounded by Start → Complete:
//
//   1. KIT GATE         — kit_confirmed_at IS NULL.
//                          Pick from the tech's assigned equipment,
//                          confirm. No locations are visible yet.
//
//   2. PRE-START        — kit confirmed, started_at IS NULL.
//                          Kit recap + "Start Inspection" CTA. Starting
//                          stamps started_at and reveals the in-progress
//                          view.
//
//   3. IN PROGRESS      — started_at set, completed_at IS NULL.
//                          Live elapsed timer ticks. Outdoor control
//                          card surfaces (capture once per inspection).
//                          Locations list + "+ Add room" + wrap-up CTA.
//
//   4. COMPLETED        — completed_at set.
//                          Frozen view, total duration shown. No
//                          mutations from this surface — to amend a
//                          completed inspection, edit in /admin/data.
//
// Schema relies on the existing inspections.started_at and
// inspections.completed_at fields — no new columns. The wrap-up page
// hosts "Mark inspection completed", which sets completed_at and is the
// timer-stop event.

const SUPABASE_PUBLIC =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/equipment-images/`
    : "";

export default function InspectionLandingPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const inspectionId = String(params?.inspection_id ?? "");

  const queryKey = ["admin-inspection", inspectionId];
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Inspection ${inspectionId} → ${res.status}`);
      return res.json();
    },
    enabled: Boolean(inspectionId),
  });

  // Pull all technician-equipment so we can filter to this inspection's
  // assigned technician. Cheap (small table) and cached by TanStack.
  const { data: kitData } = useQuery({
    queryKey: ["admin-table", "technician-equipment"],
    queryFn: async () => {
      const res = await fetch("/api/admin/technician-equipment", { cache: "no-store" });
      if (!res.ok) throw new Error(`Kit → ${res.status}`);
      return res.json();
    },
  });

  // ── Mutations ───────────────────────────────────────────────────────

  const createLocation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/sample-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspection_id: Number(inspectionId), name: "Untitled location" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: (json) => {
      qc.invalidateQueries({ queryKey });
      const newId = json?.row?.sample_location_id;
      if (newId) router.push(`/admin/inspections/${inspectionId}/locations/${newId}`);
    },
  });

  const createOutdoor = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/sample-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: Number(inspectionId),
          name: "Outdoor control",
          is_outdoor_control: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: (json) => {
      qc.invalidateQueries({ queryKey });
      const newId = json?.row?.sample_location_id;
      if (newId) router.push(`/admin/inspections/${inspectionId}/locations/${newId}`);
    },
  });

  const toggleKit = useMutation({
    mutationFn: async ({ technician_equipment_id, on }) => {
      const res = await fetch("/api/admin/inspection-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: Number(inspectionId),
          technician_equipment_id,
          on,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Toggle → ${res.status}`);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const confirmKit = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit_confirmed_at: new Date().toISOString() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Confirm → ${res.status}`);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const startInspection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          started_at: new Date().toISOString(),
          status: "in_progress",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Start → ${res.status}`);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["admin-table", "inspections"] });
    },
  });

  // ── Loading / error guards ──────────────────────────────────────────

  if (isLoading) {
    return <div className="ins-shell"><p className="ins-empty">Loading inspection…</p></div>;
  }
  if (isError) {
    return (
      <div className="ins-shell">
        <p className="ins-error">Couldn't load inspection: {String(error?.message || error)}</p>
        <Link href="/admin/data/inspections" className="ins-btn ins-btn--ghost">← Back to inspections</Link>
      </div>
    );
  }

  const row = data?.row;
  if (!row) {
    return (
      <div className="ins-shell">
        <p className="ins-empty">Inspection not found.</p>
        <Link href="/admin/data/inspections" className="ins-btn ins-btn--ghost">← Back to inspections</Link>
      </div>
    );
  }

  // ── State resolution ───────────────────────────────────────────────

  const techId = row.technician_id;
  const techKit = (kitData?.rows ?? []).filter((k) => k.technician_id === techId && k.active);
  const inspectionKitIds = new Set(
    (row.inspection_equipment ?? []).map((k) => k.technician_equipment_id),
  );

  const allLocations = row.sample_locations || [];
  const outdoorControl = allLocations.find((l) => l.is_outdoor_control) || null;
  const roomLocations = allLocations
    .filter((l) => !l.is_outdoor_control)
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const kitConfirmed = Boolean(row.kit_confirmed_at);
  const started = Boolean(row.started_at);
  const completed = Boolean(row.completed_at);

  // ── Header (consistent across all states, just the chips change) ───

  return (
    <div className="ins-shell">
      <header className="ins-header">
        <div className="ins-header__top">
          <Link href="/admin/data/inspections" className="ins-back">← All inspections</Link>
          <div className="ins-header__badges">
            <span className={`ins-badge ins-badge--${row.status}`}>{row.status}</span>
            <span className={`ins-badge ins-badge--report-${row.report_status}`}>{row.report_status}</span>
          </div>
        </div>
        <h1 className="ins-title">{row.customers?.name || "Unknown customer"}</h1>
        <p className="ins-subtitle">
          {row.properties?.address_line}{row.properties?.postcode ? ` · ${row.properties.postcode}` : ""}
        </p>
        <div className="ins-chips">
          <span className="ins-chip">
            <span className="ins-chip__label">Scheduled</span>
            <span className="ins-chip__value">{fmtWhen(row.scheduled_at)}</span>
          </span>
          <span className="ins-chip">
            <span className="ins-chip__label">Type</span>
            <span className="ins-chip__value">{row.inspection_type}</span>
          </span>
          <span className="ins-chip">
            <span className="ins-chip__label">Tech</span>
            <span className="ins-chip__value">
              {row.technician?.name || <span className="ins-muted">unassigned</span>}
              {row.technician?.role ? <span className="ins-chip__sub"> · {row.technician.role}</span> : null}
            </span>
          </span>
          {started ? (
            <span className={`ins-chip ${completed ? "" : "ins-chip--live"}`}>
              <span className="ins-chip__label">{completed ? "Duration" : "Elapsed"}</span>
              <span className="ins-chip__value">
                <ElapsedValue startedAt={row.started_at} completedAt={row.completed_at} />
              </span>
            </span>
          ) : null}
        </div>
      </header>

      {!kitConfirmed ? (
        <KitGate
          techKit={techKit}
          inspectionKitIds={inspectionKitIds}
          onToggle={(id, on) => toggleKit.mutate({ technician_equipment_id: id, on })}
          onConfirm={() => confirmKit.mutate()}
          isConfirming={confirmKit.isPending}
          confirmError={confirmKit.error}
        />
      ) : !started ? (
        <PreStartView
          techKit={techKit}
          inspectionKitIds={inspectionKitIds}
          onToggle={(id, on) => toggleKit.mutate({ technician_equipment_id: id, on })}
          onStart={() => startInspection.mutate()}
          isStarting={startInspection.isPending}
          startError={startInspection.error}
        />
      ) : completed ? (
        <CompletedView
          inspectionId={inspectionId}
          row={row}
          techKit={techKit}
          inspectionKitIds={inspectionKitIds}
          outdoorControl={outdoorControl}
          roomLocations={roomLocations}
        />
      ) : (
        <InProgressView
          inspectionId={inspectionId}
          row={row}
          techKit={techKit}
          inspectionKitIds={inspectionKitIds}
          outdoorControl={outdoorControl}
          roomLocations={roomLocations}
          onToggleKit={(id, on) => toggleKit.mutate({ technician_equipment_id: id, on })}
          onAddRoom={() => createLocation.mutate()}
          onCaptureOutdoor={() => createOutdoor.mutate()}
          addingRoom={createLocation.isPending}
          addingOutdoor={createOutdoor.isPending}
          isCompleted={false}
        />
      )}
    </div>
  );
}

// ─── KIT GATE (state 1) ──────────────────────────────────────────────────

function KitGate({ techKit, inspectionKitIds, onToggle, onConfirm, isConfirming, confirmError }) {
  const someSelected = inspectionKitIds.size > 0;
  return (
    <section className="ins-section ins-section--card">
      <div className="ins-section__head">
        <h2>1 · Today's kit</h2>
        <span className="ins-section__count">{inspectionKitIds.size}/{techKit.length}</span>
      </div>
      <p className="ins-step-intro">
        Tap each piece of equipment you've brought today. We'll only show these in the
        per-reading chip selects, so the field SOP stays fast.
      </p>

      {techKit.length === 0 ? (
        <p className="ins-empty">
          No equipment assigned to this technician yet. Add some in
          {" "}<Link href="/admin/data/technician-equipment/new">Technician kit → Assign</Link>.
        </p>
      ) : (
        <KitGrid techKit={techKit} inspectionKitIds={inspectionKitIds} onToggle={onToggle} />
      )}

      <button
        type="button"
        className="ins-btn ins-btn--primary ins-btn--block"
        onClick={onConfirm}
        disabled={isConfirming || !someSelected}
      >
        {isConfirming
          ? "Confirming…"
          : someSelected
            ? `Confirm kit (${inspectionKitIds.size} item${inspectionKitIds.size === 1 ? "" : "s"})`
            : "Select at least one piece of kit"}
      </button>
      {/* Escape hatch — when no kit is assigned (e.g. technician unassigned)
          the gate would otherwise hard-block. Let the tech skip and start;
          kit can be reconciled later from the recap. */}
      <button
        type="button"
        className="ins-btn ins-btn--ghost ins-btn--block"
        onClick={onConfirm}
        disabled={isConfirming}
      >
        Skip kit for now
      </button>
      {confirmError ? <p className="ins-error">{String(confirmError?.message || confirmError)}</p> : null}
    </section>
  );
}

// ─── PRE-START (state 2) ─────────────────────────────────────────────────

function PreStartView({ techKit, inspectionKitIds, onToggle, onStart, isStarting, startError }) {
  const itemCount = inspectionKitIds.size;
  return (
    <>
      <section className="ins-section ins-section--card">
        <div className="ins-section__head">
          <h2>1 · Today's kit ✓</h2>
          <span className="ins-section__count">{itemCount}</span>
        </div>
        <p className="ins-step-intro">
          Kit confirmed — adjust below if you missed something. Tap "Start inspection" when you're ready
          to begin; that's when the timer starts.
        </p>
        <KitGrid
          techKit={techKit}
          inspectionKitIds={inspectionKitIds}
          onToggle={onToggle}
          compact
        />
      </section>

      <section className="ins-section ins-section--card">
        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block ins-btn--xl"
          onClick={onStart}
          disabled={isStarting}
        >
          {isStarting ? "Starting…" : "Start inspection →"}
        </button>
        <p className="ins-hint">
          Capturing the outdoor control is the first task once the timer is running. After
          that, add a card per room and finish with the wrap-up.
        </p>
        {startError ? <p className="ins-error">{String(startError?.message || startError)}</p> : null}
      </section>
    </>
  );
}

// ─── COMPLETED (state 4 — report-style summary) ──────────────────────────

function CompletedView({ inspectionId, row, techKit, inspectionKitIds, outdoorControl, roomLocations }) {
  const scope = (row.scope_items || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const allLocations = row.sample_locations || [];

  // Aggregates for the summary card. Embed gives us moisture_readings +
  // air_samples nested under each sample_location so we can roll up
  // without a second fetch.
  const totals = allLocations.reduce(
    (acc, l) => {
      const readings = Array.isArray(l.moisture_readings) ? l.moisture_readings.length : 0;
      const air = Array.isArray(l.air_samples) ? l.air_samples.length : (l.air_samples ? 1 : 0);
      acc.readings += readings;
      acc.airSamples += air;
      if (l.is_outdoor_control) acc.outdoor = true;
      return acc;
    },
    { readings: 0, airSamples: 0, outdoor: false },
  );

  const costMin = scope.reduce((s, i) => s + (Number(i.cost_min) || 0), 0);
  const costMax = scope.reduce((s, i) => s + (Number(i.cost_max) || 0), 0);
  const hasCostRange = costMin > 0 || costMax > 0;

  return (
    <>
      {/* ── Summary card ── */}
      <section className="ins-section ins-section--card">
        <div className="ins-section__head"><h2>Summary</h2></div>
        <div className="ins-summary">
        <SummaryItem label="Severity">
          {row.report_severity
            ? <span className={`ins-badge ins-badge--sev-${row.report_severity}`}>{row.report_severity}</span>
            : <span className="ins-muted">—</span>}
        </SummaryItem>
        <SummaryItem label="Duration">
          {row.started_at && row.completed_at
            ? formatDuration(elapsedSeconds(row.started_at, row.completed_at) || 0)
            : "—"}
        </SummaryItem>
        <SummaryItem label="Field tech">
          {row.technician?.name || "—"}
          {row.technician?.role ? <span className="ins-summary__sub"> · {row.technician.role}</span> : null}
        </SummaryItem>
        <SummaryItem label="Sign-off">
          {row.signoff?.name || <span className="ins-muted">unsigned</span>}
          {row.signed_off_at ? <span className="ins-summary__sub"> · {fmtWhen(row.signed_off_at)}</span> : null}
        </SummaryItem>
        <SummaryItem label="Rooms">
          {roomLocations.length}{totals.outdoor ? <span className="ins-summary__sub"> · +outdoor ctrl</span> : null}
        </SummaryItem>
        <SummaryItem label="Moisture readings">{totals.readings}</SummaryItem>
        <SummaryItem label="Air samples">{totals.airSamples}</SummaryItem>
        <SummaryItem label="Scope items">
          {scope.length}
          {hasCostRange ? <span className="ins-summary__sub"> · ${costMin.toLocaleString()}–${costMax.toLocaleString()}</span> : null}
        </SummaryItem>
        <SummaryItem label="Report status">
          <span className={`ins-badge ins-badge--report-${row.report_status}`}>{row.report_status}</span>
          {row.report_published_at ? <span className="ins-summary__sub"> · {fmtWhen(row.report_published_at)}</span> : null}
        </SummaryItem>
        <SummaryItem label="Completed">{fmtWhen(row.completed_at)}</SummaryItem>
        {row.report_summary ? (
          <div className="ins-summary__full">
            <div className="ins-summary__label">Executive summary</div>
            <p className="ins-summary__prose">{row.report_summary}</p>
          </div>
        ) : null}
        </div>
      </section>

      {/* ── Outdoor control (one-liner) ── */}
      {outdoorControl ? (
        <section className="ins-section ins-section--tight ins-section--card">
          <div className="ins-section__head"><h2>Outdoor control</h2></div>
          <Link
            href={`/admin/inspections/${inspectionId}/locations/${outdoorControl.sample_location_id}`}
            className="ins-row"
          >
            <span className="ins-row__name">{outdoorControl.name}</span>
            <span className="ins-row__meta">
              {Array.isArray(outdoorControl.air_samples) && outdoorControl.air_samples.length
                ? `${outdoorControl.air_samples.length} air sample`
                : "no air sample"}
            </span>
            <span className="ins-row__chev">›</span>
          </Link>
        </section>
      ) : null}

      {/* ── Rooms (compact rows) ── */}
      <section className="ins-section ins-section--tight ins-section--card">
        <div className="ins-section__head">
          <h2>Rooms</h2>
          <span className="ins-section__count">{roomLocations.length}</span>
        </div>
        {roomLocations.length === 0 ? (
          <p className="ins-empty">No rooms.</p>
        ) : (
          <ul className="ins-row-list">
            {roomLocations.map((loc) => {
              const readings = Array.isArray(loc.moisture_readings) ? loc.moisture_readings.length : 0;
              const air = Array.isArray(loc.air_samples) ? loc.air_samples.length : (loc.air_samples ? 1 : 0);
              return (
                <li key={loc.sample_location_id}>
                  <Link
                    href={`/admin/inspections/${inspectionId}/locations/${loc.sample_location_id}`}
                    className="ins-row"
                  >
                    <span className="ins-row__name">{loc.name}</span>
                    <span className="ins-row__meta">
                      {loc.mould_pressure_tier
                        ? <span className={`ins-badge ins-badge--sev-${loc.mould_pressure_tier}`}>{loc.mould_pressure_tier}</span>
                        : <span className="ins-muted">no tier</span>}
                      {loc.thermal_delta_c != null ? <span> · ΔT {loc.thermal_delta_c}°C</span> : null}
                      {readings ? <span> · {readings} reading{readings === 1 ? "" : "s"}</span> : null}
                      {air ? <span> · air sample</span> : null}
                    </span>
                    <span className="ins-row__chev">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Scope of works ── */}
      <section className="ins-section ins-section--tight ins-section--card">
        <div className="ins-section__head">
          <h2>Scope of works</h2>
          <Link
            href={`/admin/inspections/${inspectionId}/wrap-up`}
            className="ins-section__edit"
          >
            Edit →
          </Link>
        </div>
        {scope.length === 0 ? (
          <Link
            href={`/admin/inspections/${inspectionId}/wrap-up`}
            className="ins-empty ins-empty--linklike"
          >
            No scope items yet — tap to add.
          </Link>
        ) : (
          <ul className="ins-row-list">
            {scope.map((s) => (
              <li key={s.scope_item_id}>
                <Link
                  href={`/admin/inspections/${inspectionId}/wrap-up#scope-${s.scope_item_id}`}
                  className="ins-row ins-row--stack"
                >
                  <div className="ins-row__head">
                    <span className="ins-row__name">
                      {s.trade_categories?.name || `Trade #${s.trade_category_id}`}
                      <span className="ins-muted ins-summary__sub"> · {s.scope_tier}</span>
                    </span>
                    <span className="ins-row__meta">
                      {(s.cost_min != null || s.cost_max != null)
                        ? `$${(s.cost_min ?? 0).toLocaleString()}–$${(s.cost_max ?? 0).toLocaleString()}`
                        : <span className="ins-muted">no estimate</span>}
                    </span>
                    <span className="ins-row__chev">›</span>
                  </div>
                  {s.detail ? <p className="ins-row__detail">{s.detail}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Equipment used (footer chip strip) ── */}
      <section className="ins-section ins-section--tight ins-section--card">
        <div className="ins-section__head"><h2>Equipment used</h2></div>
        {inspectionKitIds.size === 0 ? (
          <p className="ins-empty ins-empty--compact">No kit recorded.</p>
        ) : (
          <ul className="ins-eq-strip">
            {(row.inspection_equipment ?? []).map((ie) => {
              const te = ie.technician_equipment;
              const et = te?.equipment_types;
              if (!et) return null;
              return (
                <li key={ie.technician_equipment_id} className="ins-eq-strip__item">
                  <span className="ins-eq-strip__name">{et.name}</span>
                  {te.asset_tag ? <span className="ins-eq-strip__tag">{te.asset_tag}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function SummaryItem({ label, children }) {
  return (
    <div className="ins-summary__item">
      <div className="ins-summary__label">{label}</div>
      <div className="ins-summary__value">{children}</div>
    </div>
  );
}

// ─── IN PROGRESS (state 3) ───────────────────────────────────────────────

function InProgressView({
  inspectionId,
  row,
  techKit,
  inspectionKitIds,
  outdoorControl,
  roomLocations,
  onToggleKit,
  onAddRoom,
  onCaptureOutdoor,
  addingRoom,
  addingOutdoor,
  isCompleted,
}) {
  const hasRooms = roomLocations.length > 0;
  return (
    <>
      {isCompleted ? (
        <section className="ins-section">
          <div className="ins-banner ins-banner--ok">
            ✓ Completed {fmtWhen(row.completed_at)} — total time {formatDuration(
              elapsedSeconds(row.started_at, row.completed_at) || 0,
            )}
          </div>
        </section>
      ) : null}

      {/* Outdoor control — inspection-level capture, surfaces above rooms */}
      <section className="ins-section ins-section--card">
        <div className="ins-section__head">
          <h2>1 · Outdoor control</h2>
          {outdoorControl ? <span className="ins-section__count">captured</span> : null}
        </div>
        {outdoorControl ? (
          <Link
            href={`/admin/inspections/${inspectionId}/locations/${outdoorControl.sample_location_id}`}
            className="ins-loc-card"
          >
            <div className="ins-loc-card__name">
              {outdoorControl.name}
              <span className="ins-pill">Outdoor control</span>
            </div>
            <div className="ins-loc-card__meta">
              <span className="ins-muted">Edit or re-capture</span>
            </div>
            <span className="ins-loc-card__chev">›</span>
          </Link>
        ) : (
          <>
            <p className="ins-step-intro">
              Take this before walking the rooms — wide outdoor shot + air sample. It's the baseline
              every indoor reading gets compared to.
            </p>
            <button
              type="button"
              className="ins-btn ins-btn--primary ins-btn--block"
              onClick={onCaptureOutdoor}
              disabled={addingOutdoor || isCompleted}
            >
              {addingOutdoor ? "Creating…" : "Capture outdoor control"}
            </button>
          </>
        )}
      </section>

      {/* Rooms */}
      <section className="ins-section ins-section--card">
        <div className="ins-section__head">
          <h2>2 · Rooms</h2>
          <span className="ins-section__count">{roomLocations.length}</span>
        </div>

        {hasRooms ? (
          <ul className="ins-loc-list">
            {roomLocations.map((loc) => {
              const r = readiness(loc);
              return (
                <li key={loc.sample_location_id}>
                  <Link
                    href={`/admin/inspections/${inspectionId}/locations/${loc.sample_location_id}`}
                    className="ins-loc-card"
                  >
                    <div className="ins-loc-card__name">{loc.name}</div>
                    <div className="ins-ready" aria-label="Readiness">
                      <span className={`ins-ready__chip ${r.photo ? "is-on" : "is-off"}`} title="Visible photo">📷</span>
                      <span className={`ins-ready__chip ${r.thermal ? "is-on" : "is-off"}`} title="Thermal ΔT">ΔT</span>
                      <span className={`ins-ready__chip ${r.tier ? "is-on" : "is-off"}`} title="Mould pressure tier">tier</span>
                      <span className={`ins-ready__chip ${r.note ? "is-on" : "is-off"}`} title="Finding note">note</span>
                    </div>
                    <span className="ins-loc-card__chev">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ins-empty">No rooms captured yet. Add the first one once you've done the outdoor baseline.</p>
        )}

        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block"
          onClick={onAddRoom}
          disabled={addingRoom || isCompleted}
        >
          {addingRoom ? "Creating…" : "+ Add room"}
        </button>
      </section>

      {/* Wrap-up entry */}
      {hasRooms && !isCompleted ? (
        <section className="ins-section ins-section--card">
          <Link
            href={`/admin/inspections/${inspectionId}/wrap-up`}
            className="ins-btn ins-btn--primary ins-btn--block"
          >
            Finish visit →
          </Link>
          <p className="ins-hint">Set the scope of works and tap "Mark inspection completed" to stop the timer.</p>
        </section>
      ) : null}

      {/* Kit — reference material mid-visit, not a step. Collapsed by default;
          still fully toggleable when expanded (unless completed). */}
      <details className="ins-kit-disclosure">
        <summary>
          Kit
          <span className="ins-kit-disclosure__count">
            {inspectionKitIds.size} item{inspectionKitIds.size === 1 ? "" : "s"}
          </span>
          <span className="ins-kit-disclosure__chev" aria-hidden>›</span>
        </summary>
        <div className="ins-kit-disclosure__body">
          <KitGrid
            techKit={techKit}
            inspectionKitIds={inspectionKitIds}
            onToggle={isCompleted ? () => {} : onToggleKit}
            compact
          />
        </div>
      </details>
    </>
  );
}

// ─── Elapsed / duration value (plain text, ticks live in-progress) ───────

function ElapsedValue({ startedAt, completedAt }) {
  // Tick once a second only while the inspection is live. When completed,
  // the duration is fixed so we skip the interval.
  const [, force] = useState(0);
  useEffect(() => {
    if (completedAt) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [completedAt]);

  const seconds = elapsedSeconds(startedAt, completedAt);
  if (seconds == null) return null;
  return (
    <span className="ins-meta__time">
      {formatDuration(seconds)}
    </span>
  );
}

function elapsedSeconds(startIso, endIso) {
  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 1000));
}
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Kit grid (shared across all kit views) ──────────────────────────────

function KitGrid({ techKit, inspectionKitIds, onToggle, compact }) {
  return (
    <ul className={`ins-kit-grid ${compact ? "ins-kit-grid--compact" : ""}`}>
      {techKit.map((k) => {
        const selected = inspectionKitIds.has(k.technician_equipment_id);
        const eq = k.equipment_types || {};
        const img = eq.image_storage_path ? `${SUPABASE_PUBLIC}${eq.image_storage_path}` : null;
        return (
          <li key={k.technician_equipment_id}>
            <button
              type="button"
              className={`ins-kit-card ${selected ? "is-selected" : ""}`}
              onClick={() => onToggle(k.technician_equipment_id, !selected)}
              aria-pressed={selected}
            >
              <div className="ins-kit-card__img">
                {img ? <img src={img} alt="" /> : <span className="ins-kit-card__icon">{categoryIcon(eq.category)}</span>}
              </div>
              <div className="ins-kit-card__body">
                <div className="ins-kit-card__name">{eq.name || `Equipment #${k.equipment_type_id}`}</div>
                <div className="ins-kit-card__meta">
                  {eq.category ? <span className="ins-kit-card__cat">{eq.category.replace(/_/g, " ")}</span> : null}
                  {k.asset_tag ? <span className="ins-kit-card__tag">{k.asset_tag}</span> : null}
                </div>
              </div>
              <div className="ins-kit-card__check" aria-hidden>{selected ? "✓" : ""}</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Per-room readiness — the four checks surfaced as presence chips on the
// landing cards and rolled up on the wrap-up checklist. Pure derivation off
// the inspection embed (image_captures + location_findings added there).
export function readiness(loc) {
  const captures = Array.isArray(loc.image_captures) ? loc.image_captures : [];
  const findings = Array.isArray(loc.location_findings) ? loc.location_findings : [];
  return {
    photo: captures.some((c) => c.capture_kind === "visible"),
    thermal: loc.thermal_delta_c != null,
    tier: Boolean(loc.mould_pressure_tier),
    note: findings.length >= 1,
  };
}

function categoryIcon(c) {
  switch (c) {
    case "moisture_meter":   return "💧";
    case "thermal_camera":   return "🌡️";
    case "air_sampler":      return "🌬️";
    case "particle_counter": return "•··";
    case "hygrometer":       return "%";
    default:                 return "🛠";
  }
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
