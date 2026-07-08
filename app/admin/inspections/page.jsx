"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import "./[inspection_id]/inspection-workspace.css";
import "./inspections-index.css";

// Workflow-oriented inspections index. Groups visits by pipeline state so
// the tech / qualified-reviewer sees what needs attention next, not a
// 500-row data dump. The raw data table still lives under Data → Inspections
// for audit / bulk inspection.
//
// Pipeline buckets (in priority order):
//   1. Active           — started_at set, completed_at null
//   2. Upcoming         — status=scheduled, scheduled_at ≥ now
//   3. Awaiting sign-off — completed_at set, signed_off_at null, report draft
//   4. Recent           — published / signed (last 10, completed_at desc)
//   5. Cancelled / no-show — surfaced last (collapsed-feeling spacing)
export default function InspectionsIndexPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-table", "inspections"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inspections", { cache: "no-store" });
      if (!res.ok) throw new Error(`Inspections → ${res.status}`);
      return res.json();
    },
  });

  const rows = data?.rows ?? [];

  const active = rows
    .filter((r) => r.started_at && !r.completed_at)
    .sort(byIso("started_at", "asc"));

  // All status=scheduled, regardless of whether scheduled_at is past or
  // future. A past scheduled date means overdue work the tech still owes —
  // hiding it just because the date has passed defeats the workflow view.
  const upcoming = rows
    .filter((r) => r.status === "scheduled")
    .sort(byIso("scheduled_at", "asc"));

  const awaitingSignoff = rows
    .filter((r) => r.completed_at && !r.signed_off_at && r.report_status === "draft")
    .sort(byIso("completed_at", "asc"));

  const recent = rows
    .filter((r) => r.signed_off_at || r.report_status === "published")
    .sort(byIso("completed_at", "desc"))
    .slice(0, 10);

  const dropped = rows.filter((r) => r.status === "cancelled" || r.status === "no_show");

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Inspections</h1>
          <p>Workflow view — grouped by pipeline state. Raw table lives in Data → Inspections.</p>
        </div>
      </div>

      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="ins-error">{String(error?.message || error)}</p> : null}

      <div className="insp-board">
        <PipelineColumn
          title="Active"
          hint="Timer is running — tap to jump back in."
          rows={active}
          emptyHint="Nothing active right now."
          tone="active"
        />
        <PipelineColumn
          title="Upcoming"
          hint="Scheduled, not yet started."
          rows={upcoming}
          emptyHint="No upcoming inspections."
        />
        <PipelineColumn
          title="Awaiting sign-off"
          hint="Field work complete, draft report — needs a qualified-tech review."
          rows={awaitingSignoff}
          emptyHint="Sign-off queue is clear."
          tone="signoff"
        />
        <PipelineColumn
          title="Recent"
          hint="Last 10 completed and signed."
          rows={recent}
          emptyHint="No completed inspections yet."
          muted
        />
        {dropped.length > 0 ? (
          <PipelineColumn
            title="Cancelled / no-show"
            hint="Dropped visits, surfaced last."
            rows={dropped}
            emptyHint=""
            muted
          />
        ) : null}
      </div>
    </>
  );
}

function PipelineColumn({ title, hint, rows, emptyHint, tone, muted }) {
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
          emptyHint ? <li className="ins-empty ins-empty--compact">{emptyHint}</li> : null
        ) : (
          rows.map((r) => (
            <li key={r.inspection_id}>
              <InspectionCard r={r} tone={tone} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function InspectionCard({ r, tone }) {
  const elapsed = r.started_at && !r.completed_at
    ? elapsedSeconds(r.started_at, null)
    : null;
  const when = r.completed_at || r.scheduled_at;
  return (
    <Link
      href={`/admin/inspections/${r.inspection_id}`}
      className={`insp-card ${tone ? `insp-card--${tone}` : ""}`}
    >
      <div className="insp-card__name">
        <span>{r.customers?.name || "Unknown customer"}</span>
        {elapsed != null ? <span className="insp-elapsed">{formatDuration(elapsed)}</span> : null}
      </div>
      <div className="insp-card__badges">
        <span className="insp-type-badge">{r.inspection_type}</span>
        <span className={`ins-badge ins-badge--${r.status}`}>{r.status}</span>
        {r.report_status && r.report_status !== "draft"
          ? <span className={`ins-badge ins-badge--report-${r.report_status}`}>{r.report_status}</span>
          : null}
      </div>
      <p className="insp-card__meta">
        {fmtWhen(when)}
        <br />
        {r.properties?.address_line || "—"}
        {r.properties?.postcode ? ` · ${r.properties.postcode}` : ""}
        {" · "}
        <span className="ins-muted">{r.technician?.name || "unassigned"}</span>
      </p>
    </Link>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

function byIso(field, dir) {
  const mul = dir === "asc" ? 1 : -1;
  return (a, b) => {
    const av = a[field] ? new Date(a[field]).getTime() : 0;
    const bv = b[field] ? new Date(b[field]).getTime() : 0;
    return (av - bv) * mul;
  };
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
