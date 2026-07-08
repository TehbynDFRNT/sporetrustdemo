"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PipelineView from "./PipelineView";
import TodayView, { brisbaneDayBounds } from "./TodayView";
import SignoffView from "./SignoffView";
import "./[inspection_id]/inspection-workspace.css";
import "./inspections-index.css";

// One Inspections page, one continuous workflow, three tabs:
//   Pipeline — status-driven kanban across the whole book of work.
//   Today    — the technician's run-sheet for today (Brisbane), tech-filtered.
//   Sign-off — draft reports awaiting a qualified-tech review.
// The active tab is driven by ?view= so tabs are linkable and the legacy
// /admin/today + /admin/queue/signoff routes can redirect straight in.
//
// Both the inspections list and the technician list are fetched ONCE here and
// passed down as props, so all three views (plus the tab badges) share a
// single request each. useSearchParams() requires a Suspense boundary under
// the App Router.
export default function InspectionsPage() {
  return (
    <Suspense fallback={<p className="ins-empty">Loading…</p>}>
      <InspectionsPageInner />
    </Suspense>
  );
}

const VIEWS = new Set(["today", "signoff"]);

function InspectionsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("view");
  const view = VIEWS.has(raw) ? raw : "pipeline";

  function setView(next) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "pipeline") params.delete("view");
    else params.set("view", next);
    const qs = params.toString();
    router.replace(qs ? `/admin/inspections?${qs}` : "/admin/inspections");
  }

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

  const rows = inspectionsQuery.data?.rows ?? [];
  const technicians = techniciansQuery.data?.rows ?? [];

  // Tab badges, computed from the shared inspections query.
  // Today = today's non-cancelled inspections (Brisbane bounds, all techs).
  const { startMs, endMs } = brisbaneDayBounds();
  const todayCount = rows.filter((r) => {
    if (!r.scheduled_at) return false;
    const t = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(t) || t < startMs || t >= endMs) return false;
    return r.status !== "cancelled" && r.status !== "no_show";
  }).length;
  // Sign-off = draft reports with completed field work not yet signed off.
  const signoffCount = rows.filter(
    (r) => r.report_status === "draft" && r.completed_at && !r.signed_off_at,
  ).length;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Inspections</h1>
          <p>Pipeline, today's run-sheet, and the sign-off queue — one workflow.</p>
        </div>
        <div className="insp-viewswitch" role="tablist" aria-label="Inspections view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "pipeline"}
            className={`insp-viewswitch__btn${view === "pipeline" ? " is-active" : ""}`}
            onClick={() => setView("pipeline")}
          >
            Pipeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "today"}
            className={`insp-viewswitch__btn${view === "today" ? " is-active" : ""}`}
            onClick={() => setView("today")}
          >
            Today
            {todayCount > 0 ? <span className="insp-viewswitch__badge">{todayCount}</span> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "signoff"}
            className={`insp-viewswitch__btn${view === "signoff" ? " is-active" : ""}`}
            onClick={() => setView("signoff")}
          >
            Sign-off
            {signoffCount > 0 ? <span className="insp-viewswitch__badge">{signoffCount}</span> : null}
          </button>
        </div>
      </div>

      {view === "today" ? (
        <TodayView
          rows={rows}
          technicians={technicians}
          isLoading={inspectionsQuery.isLoading}
          isError={inspectionsQuery.isError}
          error={inspectionsQuery.error}
        />
      ) : view === "signoff" ? (
        <SignoffView
          rows={rows}
          technicians={technicians}
          isLoading={inspectionsQuery.isLoading}
          isError={inspectionsQuery.isError}
          error={inspectionsQuery.error}
        />
      ) : (
        <PipelineView
          rows={rows}
          isLoading={inspectionsQuery.isLoading}
          isError={inspectionsQuery.isError}
          error={inspectionsQuery.error}
        />
      )}
    </>
  );
}
