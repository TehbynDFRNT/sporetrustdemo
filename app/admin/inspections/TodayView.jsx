"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Today's run-sheet — the technician's view of the day. Shows every
// inspection scheduled today (Brisbane), filterable by technician, with the
// in-progress visit pinned first so a tech mid-job lands straight back on
// their current one. Rows jump into the inspection workspace.
//
// Data (inspections + technicians) is fetched once at the Inspections page
// level and passed in as props. The technician filter + its localStorage
// persistence live here, rendered as a small toolbar above the columns.

const TECH_STORAGE_KEY = "st_admin_tech";
const BRISBANE_OFFSET_MS = 10 * 3_600_000; // UTC+10 year-round, no DST

// [startMs, endMs) of "today" in Brisbane regardless of browser timezone.
// Exported so the Inspections page can compute the "Today" tab badge from the
// same bounds without duplicating the offset maths.
export function brisbaneDayBounds(now = new Date()) {
  const local = new Date(now.getTime() + BRISBANE_OFFSET_MS);
  const startMs =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
    BRISBANE_OFFSET_MS;
  return { startMs, endMs: startMs + 86_400_000 };
}

export default function TodayView({ rows, technicians, isLoading, isError, error }) {
  // "all" | "unassigned" | technician_id as string. Read from localStorage
  // after mount (not in the initializer) so SSR + hydration render the same.
  const [tech, setTech] = useState("all");
  useEffect(() => {
    const saved = window.localStorage.getItem(TECH_STORAGE_KEY);
    if (saved) setTech(saved);
  }, []);
  function pickTech(value) {
    setTech(value);
    window.localStorage.setItem(TECH_STORAGE_KEY, value);
  }

  const activeTechnicians = (technicians ?? []).filter((t) => t.active !== false);

  const { startMs, endMs } = brisbaneDayBounds();
  const today = (rows ?? []).filter((r) => {
    if (!r.scheduled_at) return false;
    const t = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(t) || t < startMs || t >= endMs) return false;
    if (r.status === "cancelled" || r.status === "no_show") return false;
    if (tech === "all") return true;
    if (tech === "unassigned") return !r.technician_id;
    return String(r.technician_id) === tech;
  });

  const inProgress = (r) => Boolean(r.started_at && !r.completed_at);
  const byTime = (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at);

  // Three status-driven columns off the same "today" set.
  const inProgressRows = today.filter(inProgress).sort(byTime);
  const upNextRows = today
    .filter((r) => !r.started_at && !r.completed_at)
    .sort(byTime);
  // Done = completed_at set AND scheduled today (already bounded by `today`).
  const doneRows = today.filter((r) => r.completed_at).sort(byTime);

  const dateLabel = new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="insp-toolbar">
        <p className="insp-toolbar__note">
          {dateLabel} · Brisbane. In-progress visit pinned first, then by booking time.
        </p>
        <label className="ins-muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          Technician
          <select value={tech} onChange={(e) => pickTech(e.target.value)}>
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {activeTechnicians.map((t) => (
              <option key={t.technician_id} value={String(t.technician_id)}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="ins-error">{String(error?.message || error)}</p> : null}

      {!isLoading && !isError ? (
        <div className="insp-board">
          <RunSheetColumn
            title="In progress"
            hint="Timer running — resume where you left off."
            rows={inProgressRows}
            emptyHint={`Nothing in progress${tech !== "all" ? " for this technician" : ""}.`}
            tone="active"
            variant="active"
          />
          <RunSheetColumn
            title="Up next"
            hint="Scheduled today, not started yet."
            rows={upNextRows}
            emptyHint={`Nothing queued${tech !== "all" ? " for this technician" : ""} today.`}
            variant="upnext"
          />
          <RunSheetColumn
            title="Done today"
            hint="Field work completed today."
            rows={doneRows}
            emptyHint="Nothing completed yet today."
            variant="done"
            muted
          />
        </div>
      ) : null}
    </>
  );
}

function RunSheetColumn({ title, hint, rows, emptyHint, tone, variant, muted }) {
  return (
    <section className={`insp-col ${muted ? "insp-col--muted" : ""}`}>
      <div className="insp-col__head">
        <h2 className={tone ? `insp-col__title insp-col__title--${tone}` : "insp-col__title"}>
          {title}
        </h2>
        <span className="insp-col__count">{rows.length}</span>
      </div>
      {hint ? <p className="insp-col__hint">{hint}</p> : null}
      <ul className="insp-col__cards">
        {rows.length === 0 ? (
          <li className="ins-empty ins-empty--compact">{emptyHint}</li>
        ) : (
          rows.map((r) => (
            <li key={r.inspection_id}>
              <RunSheetCard r={r} variant={variant} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function RunSheetCard({ r, variant }) {
  const active = variant === "active";
  const done = variant === "done";
  return (
    <Link
      href={`/admin/inspections/${r.inspection_id}`}
      className={`insp-card ${active ? "insp-card--active" : ""}`}
    >
      <div className="insp-card__name">
        <span>
          {fmtTime(r.scheduled_at)}
          {" · "}
          {r.customers?.name || "Unknown customer"}
        </span>
        {active ? <span className="insp-elapsed">in progress</span> : null}
      </div>
      <div className="insp-card__badges">
        <span className="insp-type-badge">{r.inspection_type}</span>
        <span className={`ins-badge ins-badge--${r.status}`}>{r.status}</span>
      </div>
      <p className="insp-card__meta">
        {r.properties?.address_line || "—"}
        {r.properties?.postcode ? ` · ${r.properties.postcode}` : ""}
        {" · "}
        <span className="ins-muted">{r.technician?.name || "unassigned"}</span>
      </p>
      {!done ? (
        <span className="insp-card__hint">{active ? "Resume →" : "Start →"}</span>
      ) : null}
    </Link>
  );
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-AU", {
    timeZone: "Australia/Brisbane",
    hour: "numeric",
    minute: "2-digit",
  });
}
