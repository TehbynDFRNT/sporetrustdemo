"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import "../inspections/[inspection_id]/inspection-workspace.css";
import "../inspections/inspections-index.css";

// Today's run-sheet — the technician's view of the day. Shows every
// inspection scheduled today (Brisbane), filterable by technician, with the
// in-progress visit pinned first so a tech mid-job lands straight back on
// their current one. Rows jump into the inspection workspace.

const TECH_STORAGE_KEY = "st_admin_tech";
const BRISBANE_OFFSET_MS = 10 * 3_600_000; // UTC+10 year-round, no DST

// [startMs, endMs) of "today" in Brisbane regardless of browser timezone.
function brisbaneDayBounds(now = new Date()) {
  const local = new Date(now.getTime() + BRISBANE_OFFSET_MS);
  const startMs =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
    BRISBANE_OFFSET_MS;
  return { startMs, endMs: startMs + 86_400_000 };
}

export default function TodayRunSheetPage() {
  const inspectionsQuery = useQuery({
    queryKey: ["admin-table", "inspections"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inspections", { cache: "no-store" });
      if (!res.ok) throw new Error(`Inspections → ${res.status}`);
      return res.json();
    },
  });
  const techniciansQuery = useQuery({
    queryKey: ["admin-table", "technicians"],
    queryFn: async () => {
      const res = await fetch("/api/admin/technicians", { cache: "no-store" });
      if (!res.ok) throw new Error(`Technicians → ${res.status}`);
      return res.json();
    },
  });

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

  const technicians = (techniciansQuery.data?.rows ?? []).filter((t) => t.active !== false);

  const { startMs, endMs } = brisbaneDayBounds();
  const today = (inspectionsQuery.data?.rows ?? []).filter((r) => {
    if (!r.scheduled_at) return false;
    const t = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(t) || t < startMs || t >= endMs) return false;
    if (r.status === "cancelled" || r.status === "no_show") return false;
    if (tech === "all") return true;
    if (tech === "unassigned") return !r.technician_id;
    return String(r.technician_id) === tech;
  });

  const inProgress = (r) => Boolean(r.started_at && !r.completed_at);
  const rows = [...today].sort((a, b) => {
    if (inProgress(a) !== inProgress(b)) return inProgress(a) ? -1 : 1;
    return new Date(a.scheduled_at) - new Date(b.scheduled_at);
  });

  const dateLabel = new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Today's run-sheet</h1>
          <p>{dateLabel} · Brisbane. In-progress visit pinned first, then by booking time.</p>
        </div>
        <label className="ins-muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          Technician
          <select value={tech} onChange={(e) => pickTech(e.target.value)}>
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.technician_id} value={String(t.technician_id)}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {inspectionsQuery.isLoading ? <p className="ins-empty">Loading…</p> : null}
      {inspectionsQuery.isError ? (
        <p className="ins-error">{String(inspectionsQuery.error?.message || inspectionsQuery.error)}</p>
      ) : null}

      {!inspectionsQuery.isLoading && !inspectionsQuery.isError ? (
        <section className="ins-section ins-section--tight insp-bucket">
          <div className="ins-section__head">
            <div className="insp-bucket__head">
              <h2 className="insp-bucket__title">Scheduled today</h2>
            </div>
            <span className="ins-section__count">{rows.length}</span>
          </div>
          {rows.length === 0 ? (
            <p className="ins-empty ins-empty--compact">
              Nothing on the run-sheet{tech !== "all" ? " for this technician" : ""} today.
            </p>
          ) : (
            <ul className="ins-row-list">
              {rows.map((r) => (
                <li key={r.inspection_id}>
                  <RunSheetRow r={r} active={inProgress(r)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

function RunSheetRow({ r, active }) {
  return (
    <Link href={`/admin/inspections/${r.inspection_id}`} className="ins-row ins-row--stack">
      <div className="ins-row__head">
        <span className="ins-row__name">
          {fmtTime(r.scheduled_at)}
          {" · "}
          {r.customers?.name || "Unknown customer"}
          <span className="ins-muted ins-summary__sub"> · {r.inspection_type}</span>
        </span>
        <span className="ins-row__meta">
          {active ? <span className="insp-elapsed">in progress</span> : null}
          <span className={`ins-badge ins-badge--${r.status}`}>{r.status}</span>
          <span className="ins-muted">{active ? "Resume →" : "Start →"}</span>
        </span>
        <span className="ins-row__chev">›</span>
      </div>
      <p className="ins-row__detail">
        {r.properties?.address_line || "—"}
        {r.properties?.postcode ? ` · ${r.properties.postcode}` : ""}
        {" · "}
        <span className="ins-muted">{r.technician?.name || "unassigned"}</span>
      </p>
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
