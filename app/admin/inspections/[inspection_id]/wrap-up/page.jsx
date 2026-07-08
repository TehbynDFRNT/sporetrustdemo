"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAutosaveRow } from "../../../../../lib/admin/useAutosaveRow";
import "../inspection-workspace.css";
import "../locations/[location_id]/wizard.css";
import "./wrap-up.css";

const TIERS = ["minor", "moderate", "major"];

// Whole-inspection wrap-up: pick the scope of works (the matching key for
// partner handoffs in a later flow) and mark the inspection completed.
// Sign-off + report publish stay separate — they're a qualified-technician
// queue, not part of the field SOP.
export default function WrapUpPage() {
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

  const { data: tradesData } = useQuery({
    queryKey: ["admin-trade-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trade-categories", { cache: "no-store" });
      if (!res.ok) throw new Error(`Trades → ${res.status}`);
      return res.json();
    },
  });
  const trades = tradesData?.rows ?? [];

  const addScope = useMutation({
    mutationFn: async () => {
      const firstTrade = trades[0];
      if (!firstTrade) throw new Error("No trade categories — seed the reference table first.");
      const res = await fetch("/api/admin/scope-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: Number(inspectionId),
          trade_category_id: firstTrade.trade_category_id,
          scope_tier: "minor",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Create → ${res.status}`);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  // Add a room from wrap-up — mirrors the landing's createLocation. The
  // chained "Finish visit →" flow lands techs here, so when the Rooms list
  // reveals a missing room they can add one without going back.
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
      if (newId) router.push(`/admin/inspections/${inspectionId}/locations/${newId}?step=1`);
    },
  });

  const complete = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Complete → ${res.status}`);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["admin-table", "inspections"] });
      router.push(`/admin/inspections/${inspectionId}`);
    },
  });

  if (isLoading) {
    return <div className="ins-shell"><p className="ins-empty">Loading inspection…</p></div>;
  }
  if (isError) {
    return (
      <div className="ins-shell">
        <p className="ins-error">Couldn't load: {String(error?.message || error)}</p>
        <Link href={`/admin/inspections/${inspectionId}`} className="ins-btn ins-btn--ghost">← Back</Link>
      </div>
    );
  }

  const inspection = data?.row;
  if (!inspection) {
    return (
      <div className="ins-shell">
        <p className="ins-empty">Not found.</p>
      </div>
    );
  }

  const scope = (inspection.scope_items || [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const locations = inspection.sample_locations || [];
  const alreadyCompleted = inspection.status === "completed";

  return (
    <>
      <ScrollToHash deps={scope.map((s) => s.scope_item_id).join(",")} />

    <div className="ins-shell">
      <header className="ins-header">
        <div className="ins-header__top">
          <Link href={`/admin/inspections/${inspectionId}`} className="ins-back">← Inspection</Link>
          <span className={`ins-badge ins-badge--${inspection.status}`}>{inspection.status}</span>
        </div>
        <h1 className="ins-title">Finish visit</h1>
        <p className="ins-subtitle">
          {inspection.customers?.name || "—"} · {inspection.properties?.address_line || "—"}
        </p>
      </header>

      <section className="ins-section ins-section--card">
        <div className="ins-section__head">
          <h2>Scope of works</h2>
          <span className="ins-section__count">{scope.length}</span>
        </div>
        <p className="wrap-hint">
          One row per trade. The distinct trades on this inspection become the partner-matching
          key for the handoff queue. Cost ranges are technician estimates — bracket honestly,
          partners refine at quote.
        </p>

        <ol className="wz-list">
          {scope.length === 0 ? (
            <li className="ins-empty">No scope items yet.</li>
          ) : (
            scope.map((s) => (
              <li key={s.scope_item_id} id={`scope-${s.scope_item_id}`}>
                <ScopeItemCard item={s} trades={trades} queryKey={queryKey} />
              </li>
            ))
          )}
        </ol>

        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block"
          onClick={() => addScope.mutate()}
          disabled={addScope.isPending || trades.length === 0}
        >
          {addScope.isPending ? "Adding…" : "+ Add scope item"}
        </button>
        {addScope.isError ? (
          <p className="ins-error">{String(addScope.error?.message || addScope.error)}</p>
        ) : null}
      </section>

      <RoomsSection
        locations={locations}
        inspectionId={inspectionId}
        onAddRoom={() => createLocation.mutate()}
        addingRoom={createLocation.isPending}
        addError={createLocation.error}
        alreadyCompleted={alreadyCompleted}
      />

      <section className="ins-section ins-section--card">
        <div className="ins-section__head">
          <h2>Complete</h2>
        </div>
        {alreadyCompleted ? (
          <p className="ins-empty">This inspection is already marked completed.</p>
        ) : (
          <button
            type="button"
            className="ins-btn ins-btn--primary ins-btn--block"
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
          >
            {complete.isPending ? "Completing…" : "Mark inspection completed"}
          </button>
        )}
        {complete.isError ? (
          <p className="ins-error">{String(complete.error?.message || complete.error)}</p>
        ) : null}
        <p className="wrap-hint">
          Marking completed sets <code>status=completed</code> and <code>completed_at=now()</code>.
          The report stays in <code>draft</code> until a qualified technician signs off.
        </p>
      </section>
    </div>
    </>
  );
}

// Scrolls to the URL hash target once the scope items have rendered into the
// DOM. Re-runs when `deps` changes so deep-links keep working through
// in-place navigations.
function ScrollToHash({ deps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    // Give React one tick to commit the list before scrolling.
    const id = window.requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [deps]);
  return null;
}

// Non-blocking readiness per room, merged with the room list so a tech can
// jump back into any room's wizard and add missing rooms from here. The four
// presence chips (📷 / ΔT / tier / note) mirror the landing cards; a dim chip
// = still missing. This NEVER blocks completion — it's a warning surface only.
function roomReadiness(loc) {
  const captures = Array.isArray(loc.image_captures) ? loc.image_captures : [];
  const findings = Array.isArray(loc.location_findings) ? loc.location_findings : [];
  return {
    photo: captures.some((c) => c.capture_kind === "visible"),
    thermal: loc.thermal_delta_c != null,
    tier: Boolean(loc.mould_pressure_tier),
    note: findings.length >= 1,
  };
}

function RoomsSection({ locations, inspectionId, onAddRoom, addingRoom, addError, alreadyCompleted }) {
  const rooms = (locations || [])
    .filter((l) => !l.is_outdoor_control)
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return (
    <section className="ins-section ins-section--card">
      <div className="ins-section__head">
        <h2>Rooms</h2>
        <span className="ins-section__count">{rooms.length}</span>
      </div>
      <p className="wrap-hint">
        Each room's chips show what it's still missing before the report gets written — nothing
        here blocks completion. Tap a room to jump back into its wizard.
      </p>

      {rooms.length === 0 ? (
        <p className="ins-empty">No rooms captured yet.</p>
      ) : (
        <ul className="ins-loc-list">
          {rooms.map((loc) => {
            const r = roomReadiness(loc);
            return (
              <li key={loc.sample_location_id}>
                <Link
                  href={`/admin/inspections/${inspectionId}/locations/${loc.sample_location_id}`}
                  className="ins-loc-card"
                >
                  <div className="ins-loc-card__name">{loc.name || "Untitled location"}</div>
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
      )}

      {!alreadyCompleted ? (
        <button
          type="button"
          className="ins-btn ins-btn--primary ins-btn--block"
          onClick={onAddRoom}
          disabled={addingRoom}
        >
          {addingRoom ? "Creating…" : "+ Add room"}
        </button>
      ) : null}
      {addError ? <p className="ins-error">{String(addError?.message || addError)}</p> : null}
    </section>
  );
}

function ScopeItemCard({ item, trades, queryKey }) {
  const qc = useQueryClient();
  const save = useAutosaveRow({
    endpoint: `/api/admin/scope-items/${item.scope_item_id}`,
    invalidate: queryKey,
  });

  const [trade, setTrade] = useState(item.trade_category_id);
  const [tier, setTier] = useState(item.scope_tier || "minor");
  const [costMin, setCostMin] = useState(item.cost_min ?? "");
  const [costMax, setCostMax] = useState(item.cost_max ?? "");
  const [detail, setDetail] = useState(item.detail || "");

  useEffect(() => {
    setTrade(item.trade_category_id);
    setTier(item.scope_tier || "minor");
    setCostMin(item.cost_min ?? "");
    setCostMax(item.cost_max ?? "");
    setDetail(item.detail || "");
  }, [item.scope_item_id]);

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/scope-items/${item.scope_item_id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Delete → ${res.status}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return (
    <article className="wz-card">
      <header className="wz-card__head">
        <span className="wz-card__title">
          {item.trade_categories?.name || `Trade #${item.trade_category_id}`}
        </span>
        <button
          type="button"
          className="wz-card__del"
          onClick={() => del.mutate()}
          disabled={del.isPending}
          aria-label="Delete scope item"
        >×</button>
      </header>
      <div className="wz-card__body">
        <div className="wz-grid">
          <label className="wz-field">
            <span className="wz-field__label">Trade</span>
            <select
              className="wz-field__input"
              value={trade}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTrade(v);
                save.flushNow("trade_category_id", v);
              }}
            >
              {trades.map((t) => (
                <option key={t.trade_category_id} value={t.trade_category_id}>
                  {t.name} {t.group_label ? `· ${t.group_label}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="wz-field">
            <span className="wz-field__label">Tier</span>
            <select
              className="wz-field__input"
              value={tier}
              onChange={(e) => { setTier(e.target.value); save.flushNow("scope_tier", e.target.value); }}
            >
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="wz-grid">
          <label className="wz-field">
            <span className="wz-field__label">Cost min ($)</span>
            <input
              type="number"
              inputMode="decimal"
              step="50"
              className="wz-field__input"
              value={costMin === null ? "" : costMin}
              onChange={(e) => {
                const v = e.target.value;
                setCostMin(v);
                save.set("cost_min", v === "" ? null : Number(v));
              }}
              onBlur={() => save.flushNow("cost_min", costMin === "" ? null : Number(costMin))}
            />
          </label>
          <label className="wz-field">
            <span className="wz-field__label">Cost max ($)</span>
            <input
              type="number"
              inputMode="decimal"
              step="50"
              className="wz-field__input"
              value={costMax === null ? "" : costMax}
              onChange={(e) => {
                const v = e.target.value;
                setCostMax(v);
                save.set("cost_max", v === "" ? null : Number(v));
              }}
              onBlur={() => save.flushNow("cost_max", costMax === "" ? null : Number(costMax))}
            />
          </label>
        </div>

        <label className="wz-field">
          <span className="wz-field__label">Detail</span>
          <textarea
            className="wz-field__input wz-field__textarea"
            rows={3}
            value={detail}
            onChange={(e) => { setDetail(e.target.value); save.set("detail", e.target.value); }}
            onBlur={() => save.flushNow("detail", detail)}
            placeholder="e.g. Replace damaged plasterboard SE corner; treat cavity timbers; reinstate ventilation."
          />
        </label>
      </div>
    </article>
  );
}
