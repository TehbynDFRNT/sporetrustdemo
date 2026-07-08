"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Today's run-sheet — a dispatcher's swimlane Gantt of the day. One lane per
// active technician (visible free capacity even with zero jobs), plus an
// "Unassigned" lane whenever any of today's jobs lack a technician. The X axis
// is the working day in Brisbane hours; each inspection is a block positioned
// by its scheduled time and duration. A live "now" line tracks the current
// Brisbane time. The technician <select> narrows which lanes are shown.
//
// Data (inspections + technicians) is fetched once at the Inspections page
// level and passed in as props. The technician filter + its localStorage
// persistence live here.

const TECH_STORAGE_KEY = "st_admin_tech";
const BRISBANE_OFFSET_MS = 10 * 3_600_000; // UTC+10 year-round, no DST

// Default visible working day (Brisbane hours). Extended to fit if any job
// falls outside.
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19;

// Sub-row geometry inside a lane (px). Blocks that overlap in time stack onto
// additional sub-rows, growing the lane taller.
const SUBROW_H = 46;
const BLOCK_H = 38;
const TRACK_PAD = 6;

// Drag mechanics.
const DRAG_THRESHOLD_PX = 6; // movement below this is a click, not a drag
const TOUCH_HOLD_MS = 300; // long-press before a touch drag engages
const SNAP_MIN = 15; // reschedule snaps to this many minutes

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
  // Live clock for the now-line, established after mount so SSR/hydration
  // agree (same guard pattern as the localStorage read).
  const [nowMs, setNowMs] = useState(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(TECH_STORAGE_KEY);
    if (saved) setTech(saved);
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  function pickTech(value) {
    setTech(value);
    window.localStorage.setItem(TECH_STORAGE_KEY, value);
  }

  // ── Drag-to-dispatch ─────────────────────────────────────────────────────
  // Pointer-driven (not HTML5 dnd — the time axis needs pixel maths). One
  // block drags at a time. The mutable, per-gesture bookkeeping lives in a ref
  // (no re-render on pointerdown / threshold checks); `drag` state exists only
  // once a drag has actually engaged, to render the ghost + chip + lane
  // highlight. `clickSuppress` swallows the Link navigation that would fire
  // after a drag's pointerup.
  const queryClient = useQueryClient();
  const dragRef = useRef(null);
  const holdTimerRef = useRef(null);
  const clickSuppressRef = useRef(false);
  const [drag, setDrag] = useState(null);
  const [dragError, setDragError] = useState(null);

  const activeTechnicians = (technicians ?? []).filter((t) => t.active !== false);

  const { startMs, endMs } = brisbaneDayBounds();

  // Every non-cancelled/no_show inspection scheduled today (Brisbane), all
  // technicians. Lanes + bounds are computed from this full set; the <select>
  // only narrows which lanes render.
  const allToday = (rows ?? []).filter((r) => {
    if (!r.scheduled_at) return false;
    const t = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(t) || t < startMs || t >= endMs) return false;
    return r.status !== "cancelled" && r.status !== "no_show";
  });

  const dateLabel = new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Minutes since Brisbane midnight for a timestamp.
  const minsFromMidnight = (iso) => (new Date(iso).getTime() - startMs) / 60_000;

  // ── Visible hour bounds ────────────────────────────────────────────────
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;
  for (const r of allToday) {
    const startH = minsFromMidnight(r.scheduled_at) / 60;
    const endH = startH + (r.duration_minutes || 90) / 60;
    if (startH < minHour) minHour = Math.floor(startH);
    if (endH > maxHour) maxHour = Math.ceil(endH);
  }
  minHour = Math.max(0, minHour);
  maxHour = Math.min(24, maxHour);
  const span = Math.max(1, maxHour - minHour); // hours in view

  const pctLeft = (startH) => ((startH - minHour) / span) * 100;
  const pctWidth = (hours) => (hours / span) * 100;

  // ── Lanes ──────────────────────────────────────────────────────────────
  const hasUnassigned = allToday.some((r) => !r.technician_id);

  // Technicians referenced by today's jobs but not in the active list still
  // deserve a lane so their jobs aren't silently dropped.
  const techById = new Map((technicians ?? []).map((t) => [String(t.technician_id), t]));
  const laneOrder = activeTechnicians.map((t) => String(t.technician_id));
  for (const r of allToday) {
    if (r.technician_id && !laneOrder.includes(String(r.technician_id))) {
      laneOrder.push(String(r.technician_id));
    }
  }

  function buildLane(key, name) {
    const jobs = allToday
      .filter((r) =>
        key === "unassigned" ? !r.technician_id : String(r.technician_id) === key,
      )
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    // Greedy sub-row packing: place each job in the first sub-row whose last
    // block has already ended; otherwise open a new sub-row.
    const subEnds = []; // end-minute of the last block in each sub-row
    const placed = jobs.map((r) => {
      const start = minsFromMidnight(r.scheduled_at);
      const end = start + (r.duration_minutes || 90);
      let sr = subEnds.findIndex((e) => e <= start);
      if (sr === -1) {
        sr = subEnds.length;
        subEnds.push(end);
      } else {
        subEnds[sr] = end;
      }
      return { r, start, end, subRow: sr };
    });
    return { key, name, jobs: placed, subRows: Math.max(1, subEnds.length) };
  }

  let lanes = laneOrder.map((key) =>
    buildLane(key, techById.get(key)?.name || "Unknown tech"),
  );
  if (hasUnassigned) lanes.push(buildLane("unassigned", "Unassigned"));

  // Filter narrowing.
  if (tech === "unassigned") lanes = lanes.filter((l) => l.key === "unassigned");
  else if (tech !== "all") lanes = lanes.filter((l) => l.key === tech);

  // ── Now line ───────────────────────────────────────────────────────────
  const nowHour = nowMs != null ? (nowMs - startMs) / 3_600_000 : null;
  const nowVisible = nowHour != null && nowHour >= minHour && nowHour < maxHour;

  // Hour ticks (integer hours from minHour..maxHour inclusive).
  const ticks = [];
  for (let h = minHour; h <= maxHour; h += 1) {
    ticks.push({
      h,
      left: pctLeft(h),
      label: new Date(startMs + h * 3_600_000).toLocaleTimeString("en-AU", {
        timeZone: "Australia/Brisbane",
        hour: "numeric",
        hour12: true,
      }),
    });
  }

  const laneHeaderW = 168;
  const minTrackW = span * 64; // ~64px per hour so hours stay readable on phones
  const gridMinWidth = laneHeaderW + minTrackW;

  // ── Drag maths + handlers ────────────────────────────────────────────────
  // A block is draggable only when its inspection is still a plan (scheduled).
  // In-progress / completed jobs are facts and keep pure Link behaviour.
  const isDraggable = (r) => r.status === "scheduled";

  const laneName = (key) =>
    key === "unassigned" ? "Unassigned" : techById.get(key)?.name || "Unknown tech";

  // Minutes-from-Brisbane-midnight → "10:15 am".
  const fmtMins = (mins) =>
    new Date(startMs + mins * 60_000).toLocaleTimeString("en-AU", {
      timeZone: "Australia/Brisbane",
      hour: "numeric",
      minute: "2-digit",
    });

  // Snap to 15-min, then clamp so the block sits fully inside the visible span
  // (start not before the left edge, end not past the right edge).
  const snapClampMins = (mins, duration) => {
    let m = Math.round(mins / SNAP_MIN) * SNAP_MIN;
    const lo = minHour * 60;
    const hi = maxHour * 60 - duration;
    if (m < lo) m = lo;
    if (m > hi) m = hi;
    return m;
  };

  function endDrag() {
    const d = dragRef.current;
    if (d?.el) {
      try {
        d.el.releasePointerCapture(d.pointerId);
      } catch {}
    }
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    dragRef.current = null;
    document.body.style.userSelect = "";
    setDrag(null);
  }

  function handlePointerDown(e, r) {
    if (!isDraggable(r)) return; // let the Link navigate normally
    if (e.button != null && e.button !== 0) return; // primary button / touch only
    const blockEl = e.currentTarget;
    const grid = blockEl.closest(".insp-gantt__grid");
    const trackEl = blockEl.parentElement;
    if (!grid || !trackEl) return;
    // Measure once — refs don't move mid-drag. Track width maps px↔time; lane
    // rects map pointer clientY↔target lane.
    const trackWidth = trackEl.clientWidth;
    const laneRects = Array.from(grid.querySelectorAll(".insp-gantt__track")).map(
      (el) => {
        const rc = el.getBoundingClientRect();
        return { key: el.dataset.laneKey, top: rc.top, bottom: rc.bottom };
      },
    );
    const isTouch = e.pointerType === "touch";
    const originStartMins = minsFromMidnight(r.scheduled_at);
    const originLaneKey = r.technician_id ? String(r.technician_id) : "unassigned";
    dragRef.current = {
      id: r.inspection_id,
      el: blockEl,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originStartMins,
      originTechId: r.technician_id ?? null,
      originLaneKey,
      duration: r.duration_minutes || 90,
      trackWidth,
      laneRects,
      isTouch,
      holdOk: !isTouch, // desktop can drag immediately; touch waits for hold
      moved: false,
      newStartMins: originStartMins,
      targetLaneKey: originLaneKey,
    };
    try {
      blockEl.setPointerCapture(e.pointerId);
    } catch {}
    if (isTouch) {
      holdTimerRef.current = window.setTimeout(() => {
        if (dragRef.current) dragRef.current.holdOk = true;
      }, TOUCH_HOLD_MS);
    }
  }

  function handlePointerMove(e) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const dist = Math.hypot(dx, dy);
    if (!d.moved) {
      if (d.isTouch && !d.holdOk) {
        // Moving before the hold elapses = the user is scrolling the pane.
        if (dist > DRAG_THRESHOLD_PX) endDrag();
        return;
      }
      if (dist <= DRAG_THRESHOLD_PX) return;
      d.moved = true;
      document.body.style.userSelect = "none";
    }
    e.preventDefault();
    // Time: pointer deltaX → fraction of the visible span → minutes.
    const deltaHours = (dx / d.trackWidth) * span;
    const newStartMins = snapClampMins(d.originStartMins + deltaHours * 60, d.duration);
    d.newStartMins = newStartMins;
    // Lane: which row's box contains clientY (nearest if past the ends).
    let target = d.laneRects.find((l) => e.clientY >= l.top && e.clientY <= l.bottom);
    if (!target && d.laneRects.length) {
      target = d.laneRects.reduce((best, l) => {
        const dc = Math.abs((l.top + l.bottom) / 2 - e.clientY);
        return !best || dc < best.dc ? { l, dc } : best;
      }, null)?.l;
    }
    d.targetLaneKey = target ? target.key : d.originLaneKey;
    // Snap X to the resolved time so the ghost steps in 15-min increments;
    // Y follows the finger freely.
    const snappedDx =
      ((newStartMins - d.originStartMins) / 60 / span) * d.trackWidth;
    setDrag({
      id: d.id,
      dx: snappedDx,
      dy,
      clientX: e.clientX,
      clientY: e.clientY,
      newStartMins,
      duration: d.duration,
      targetLaneKey: d.targetLaneKey,
    });
  }

  function handlePointerUp(e) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.moved) {
      clickSuppressRef.current = true; // swallow the Link click that follows
      commitDrop(d);
    }
    endDrag();
  }

  function handlePointerCancel(e) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    endDrag();
  }

  function handleBlockClick(e) {
    if (clickSuppressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      clickSuppressRef.current = false;
    }
  }

  function commitDrop(d) {
    const changed = {};
    if (d.newStartMins !== d.originStartMins) {
      changed.scheduled_at = new Date(startMs + d.newStartMins * 60_000).toISOString();
    }
    const targetTechId = d.targetLaneKey === "unassigned" ? null : Number(d.targetLaneKey);
    if (targetTechId !== d.originTechId) changed.technician_id = targetTechId;
    if (Object.keys(changed).length === 0) return; // no net change
    patchInspection(d.id, changed);
  }

  async function patchInspection(id, changed) {
    const key = ["admin-table", "inspections"];
    const prev = queryClient.getQueryData(key);
    setDragError(null);
    // Optimistic: rewrite the cached row so lanes re-pack immediately.
    queryClient.setQueryData(key, (old) => {
      if (!old?.rows) return old;
      const techRow =
        changed.technician_id != null
          ? (technicians ?? []).find((t) => t.technician_id === changed.technician_id)
          : null;
      return {
        ...old,
        rows: old.rows.map((row) => {
          if (row.inspection_id !== id) return row;
          const next = { ...row, ...changed };
          if ("technician_id" in changed) {
            next.technician =
              changed.technician_id == null
                ? null
                : { name: techRow?.name ?? row.technician?.name ?? "", role: techRow?.role };
          }
          return next;
        }),
      };
    });
    try {
      const res = await fetch(`/api/admin/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `PATCH → ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: key });
    } catch (err) {
      queryClient.setQueryData(key, prev); // roll back
      setDragError(`Couldn't move that job: ${err.message}. Reverted.`);
    }
  }

  return (
    <>
      <div className="insp-toolbar">
        <p className="insp-toolbar__note">
          {dateLabel} · Brisbane. One lane per technician; blocks sit at their booked time.
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

      {dragError ? (
        <p className="insp-gantt__error" role="status">
          {dragError}
        </p>
      ) : null}

      {isLoading ? <p className="ins-empty">Loading…</p> : null}
      {isError ? <p className="ins-error">{String(error?.message || error)}</p> : null}

      {!isLoading && !isError ? (
        allToday.length === 0 ? (
          <p className="ins-empty">Nothing booked today. Enjoy the quiet.</p>
        ) : lanes.length === 0 ? (
          <p className="ins-empty ins-empty--compact">No lane matches this filter.</p>
        ) : (
          <div className="insp-gantt">
            <div className="insp-gantt__scroll">
              <div
                className={`insp-gantt__grid${drag ? " is-dragging" : ""}`}
                style={{
                  minWidth: gridMinWidth,
                  gridTemplateColumns: `${laneHeaderW}px minmax(0, 1fr)`,
                }}
              >
                {/* Axis header */}
                <div className="insp-gantt__corner" />
                <div className="insp-gantt__axis">
                  {ticks.map((t) => (
                    <span
                      key={t.h}
                      className="insp-gantt__tick"
                      style={{ left: `${t.left}%` }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>

                {/* Lanes */}
                {lanes.map((lane) => {
                  const trackH = lane.subRows * SUBROW_H + TRACK_PAD;
                  return (
                    <div className="insp-gantt__lane" key={lane.key} style={{ display: "contents" }}>
                      <div className="insp-gantt__lanehead" style={{ minHeight: trackH }}>
                        <span className="insp-gantt__lanename">{lane.name}</span>
                        <span className="insp-gantt__lanecount">
                          {lane.jobs.length} {lane.jobs.length === 1 ? "job" : "jobs"}
                        </span>
                      </div>
                      <div
                        className={`insp-gantt__track${
                          drag && drag.targetLaneKey === lane.key ? " is-drop-target" : ""
                        }`}
                        data-lane-key={lane.key}
                        style={{ height: trackH }}
                      >
                        {ticks.map((t) => (
                          <span
                            key={t.h}
                            className="insp-gantt__gridline"
                            style={{ left: `${t.left}%` }}
                          />
                        ))}
                        {lane.jobs.map(({ r, subRow }) => (
                          <GanttBlock
                            key={r.inspection_id}
                            r={r}
                            left={pctLeft(minsFromMidnight(r.scheduled_at) / 60)}
                            width={pctWidth((r.duration_minutes || 90) / 60)}
                            top={subRow * SUBROW_H + TRACK_PAD / 2}
                            draggable={isDraggable(r)}
                            dragState={drag && drag.id === r.inspection_id ? drag : null}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerCancel}
                            onBlockClick={handleBlockClick}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Now line — one element spanning every lane row */}
                {nowVisible ? (
                  <div
                    className="insp-gantt__nowline"
                    style={{
                      gridColumn: 2,
                      gridRow: `2 / span ${lanes.length}`,
                    }}
                  >
                    <div
                      className="insp-gantt__nowbar"
                      style={{ left: `${pctLeft(nowHour)}%` }}
                    >
                      <span className="insp-gantt__nowtick">now</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      ) : null}

      {/* Floating window chip — follows the pointer during a drag. */}
      {drag ? (
        <div
          className="insp-gantt__chip"
          style={{ left: drag.clientX + 16, top: drag.clientY - 14 }}
        >
          <span className="insp-gantt__chiptime">
            {fmtMins(drag.newStartMins)} – {fmtMins(drag.newStartMins + drag.duration)}
          </span>
          <span className="insp-gantt__chiplane">{laneName(drag.targetLaneKey)}</span>
        </div>
      ) : null}
    </>
  );
}

function GanttBlock({
  r,
  left,
  width,
  top,
  draggable = false,
  dragState = null,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onBlockClick,
}) {
  const done = Boolean(r.completed_at);
  const active = Boolean(r.started_at && !r.completed_at);
  const tone = done ? "done" : active ? "active" : "scheduled";

  const customer = r.customers?.name || "Unknown customer";
  const address = r.properties?.address_line || "—";
  const techName = r.technician?.name || "unassigned";
  const time = fmtTime(r.scheduled_at);
  const title = `${customer} · ${address} · ${techName} · ${time}`;

  const dragging = Boolean(dragState);
  const cls =
    `insp-gantt__block insp-gantt__block--${tone}` +
    (draggable ? " insp-gantt__block--draggable" : "") +
    (dragging ? " insp-gantt__block--dragging" : "");

  return (
    <Link
      href={`/admin/inspections/${r.inspection_id}`}
      className={cls}
      data-inspection-id={r.inspection_id}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top,
        height: BLOCK_H,
        transform: dragging ? `translate(${dragState.dx}px, ${dragState.dy}px)` : undefined,
      }}
      title={title}
      aria-label={draggable ? `${title} — drag to reschedule or reassign` : undefined}
      // Anchors are natively draggable — the browser's link-drag ghost would
      // swallow our pointer events, so it must be switched off explicitly.
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={draggable ? (e) => onPointerDown(e, r) : undefined}
      onPointerMove={draggable ? onPointerMove : undefined}
      onPointerUp={draggable ? onPointerUp : undefined}
      onPointerCancel={draggable ? onPointerCancel : undefined}
      onClick={draggable ? onBlockClick : undefined}
    >
      <span className="insp-gantt__blocktime">{time}</span>
      <span className="insp-gantt__blockname">{customer}</span>
      {active ? <span className="insp-gantt__blockpulse" /> : null}
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
