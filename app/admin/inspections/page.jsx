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

      <Pipeline
        title="Active"
        subtitle="Timer is running — tap to jump back in."
        rows={active}
        emptyHint="Nothing active right now."
        tone="active"
      />
      <Pipeline
        title="Upcoming"
        subtitle="Scheduled, not yet started."
        rows={upcoming}
        emptyHint="No upcoming inspections."
      />
      <Pipeline
        title="Awaiting sign-off"
        subtitle="Field work complete, draft report — needs a qualified-tech review."
        rows={awaitingSignoff}
        emptyHint="Sign-off queue is clear."
        tone="signoff"
      />
      <Pipeline
        title="Recent"
        subtitle="Last 10 completed and signed."
        rows={recent}
        emptyHint="No completed inspections yet."
        muted
      />
      {dropped.length > 0 ? (
        <Pipeline
          title="Cancelled / no-show"
          rows={dropped}
          emptyHint=""
          muted
        />
      ) : null}
    </>
  );
}

function Pipeline({ title, subtitle, rows, emptyHint, tone, muted }) {
  return (
    <section className={`ins-section ins-section--tight insp-bucket ${muted ? "insp-bucket--muted" : ""}`}>
      <div className="ins-section__head">
        <div className="insp-bucket__head">
          <h2 className={tone ? `insp-bucket__title insp-bucket__title--${tone}` : "insp-bucket__title"}>
            {title}
          </h2>
          {subtitle ? <p className="insp-bucket__subtitle">{subtitle}</p> : null}
        </div>
        <span className="ins-section__count">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        emptyHint ? <p className="ins-empty ins-empty--compact">{emptyHint}</p> : null
      ) : (
        <ul className="ins-row-list">
          {rows.map((r) => <li key={r.inspection_id}><InspectionRow r={r} /></li>)}
        </ul>
      )}
    </section>
  );
}

function InspectionRow({ r }) {
  const elapsed = r.started_at && !r.completed_at
    ? elapsedSeconds(r.started_at, null)
    : null;
  return (
    <Link href={`/admin/inspections/${r.inspection_id}`} className="ins-row ins-row--stack">
      <div className="ins-row__head">
        <span className="ins-row__name">
          {r.customers?.name || "Unknown customer"}
          <span className="ins-muted ins-summary__sub"> · {r.inspection_type}</span>
        </span>
        <span className="ins-row__meta">
          <span className={`ins-badge ins-badge--${r.status}`}>{r.status}</span>
          {elapsed != null ? <span className="insp-elapsed">{formatDuration(elapsed)}</span> : null}
          {r.report_status && r.report_status !== "draft"
            ? <span className={`ins-badge ins-badge--report-${r.report_status}`}>{r.report_status}</span>
            : null}
        </span>
        <span className="ins-row__chev">›</span>
      </div>
      <p className="ins-row__detail">
        {fmtWhen(r.scheduled_at)}
        {" · "}
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
