"use client";

import { useEffect, useMemo, useState } from "react";

import Brand from "../../../components/Brand";

// Pre-publish view for /r2/[slug]. The customer lands here from their
// Cal.com confirmation flow and stays here until the inspection report
// is signed off and published.
//
// Sub-views by inspection.status:
//   scheduled   → BookedView    (countdown · address · reschedule · cancel)
//   in_progress → InProgressView (technician on-site message)
//   completed   → LabPendingView (lab + sign-off pending message)
//   cancelled   → CancelledView  (rebooking CTA)
//
// All actions (reschedule, cancel) hit /api/inspections/[slug]/{action}
// which calls Cal.com and optimistically updates the DB. The
// BOOKING_RESCHEDULED / BOOKING_CANCELLED webhook reconciles afterwards
// — both paths converge.

function fmtDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function diffParts(target) {
  if (!target) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isPast: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes, isPast: false };
}

export default function LifecycleView({ inspection }) {
  const status = inspection.status;

  if (status === "cancelled") {
    return <CancelledView inspection={inspection} />;
  }
  if (status === "in_progress") {
    return <InProgressView inspection={inspection} />;
  }
  if (status === "completed") {
    return <LabPendingView inspection={inspection} />;
  }
  return <BookedView inspection={inspection} />;
}

function Chrome({ children }) {
  return (
    <div className="report-demo" role="document" aria-label="Sporetrust inspection">
      <header className="report-demo__chrome pr-chrome--overview">
        <div className="report-demo__chrome-left">
          <div className="report-demo__chrome-brand"><Brand /></div>
        </div>
      </header>
      <main className="report-demo__pane pr-overview-pane">{children}</main>
    </div>
  );
}

function StatusPill({ label, tone = "neutral" }) {
  return (
    <span className={`report-demo__pill pr-lifecycle__pill pr-lifecycle__pill--${tone}`}>
      {label}
    </span>
  );
}

// ─── Booked ──────────────────────────────────────────────────────────
function BookedView({ inspection }) {
  const scheduledAt = inspection.scheduled_at ? new Date(inspection.scheduled_at) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const countdown = useMemo(() => diffParts(scheduledAt), [scheduledAt, now]);

  return (
    <Chrome>
      <div className="pr-lifecycle">
        <header className="pr-lifecycle__hero">
          <StatusPill label="Booked" tone="ok" />
          <h1 className="pr-lifecycle__title">
            Your inspection is locked in.
          </h1>
          <p className="pr-lifecycle__lede">
            We&apos;ll be at {inspection.properties?.address_line || "your property"} on{" "}
            <strong>{fmtDateLong(inspection.scheduled_at)}</strong> at{" "}
            <strong>{fmtTime(inspection.scheduled_at)}</strong>.
          </p>
        </header>

        {countdown && !countdown.isPast ? (
          <dl className="pr-lifecycle__countdown">
            <div>
              <dt>Days</dt>
              <dd>{countdown.days}</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{countdown.hours}</dd>
            </div>
            <div>
              <dt>Minutes</dt>
              <dd>{countdown.minutes}</dd>
            </div>
          </dl>
        ) : null}

        <dl className="pr-lifecycle__meta">
          <div>
            <dt>Address</dt>
            <dd>
              {inspection.properties?.address_line || "—"}
              {inspection.properties?.postcode ? ` · ${inspection.properties.postcode}` : ""}
            </dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{inspection.duration_minutes || 90} minutes on-site</dd>
          </div>
          <div>
            <dt>Inspector</dt>
            <dd>
              {inspection.technician?.name || "Confirmed closer to the date"}
              {inspection.technician?.qualifications
                ? ` · ${inspection.technician.qualifications}`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Inspection type</dt>
            <dd>{inspection.inspection_type === "lab_backed" ? "Lab-backed" : "Standard"}</dd>
          </div>
        </dl>

        <section className="pr-lifecycle__prep">
          <h2>Before we arrive</h2>
          <ul>
            <li>Clear access to wet areas, under-floor vents, and the roof cavity hatch if you have one.</li>
            <li>Leave the house at normal humidity — no heavy cleaning or airing-out on inspection day.</li>
            <li>Have any prior reports, claim correspondence, or builder notes ready to hand over.</li>
          </ul>
        </section>

        <BookingActions inspection={inspection} />
      </div>
    </Chrome>
  );
}

function BookingActions({ inspection }) {
  const [busy, setBusy] = useState(null); // 'reschedule' | 'cancel' | null
  const [error, setError] = useState(null);

  async function onCancel() {
    if (busy) return;
    const confirmed = window.confirm(
      "Cancel this inspection? You can re-book later from sporetrust.com.au.",
    );
    if (!confirmed) return;
    setBusy("cancel");
    setError(null);
    try {
      const res = await fetch(`/api/inspections/${inspection.report_slug}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled via customer portal" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Cancel failed (${res.status})`);
      window.location.reload();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="pr-lifecycle__actions">
      <h2>Need to change it?</h2>
      <div className="pr-lifecycle__action-row">
        <a
          href="#book"
          className="pr-lifecycle__action pr-lifecycle__action--primary"
          aria-label="Pick a new time"
        >
          <span>
            <strong>Reschedule</strong>
            <em>Pick a new time</em>
          </span>
        </a>
        <button
          type="button"
          className="pr-lifecycle__action pr-lifecycle__action--ghost"
          onClick={onCancel}
          disabled={Boolean(busy)}
        >
          <span>
            <strong>{busy === "cancel" ? "Cancelling…" : "Cancel inspection"}</strong>
            <em>No fee — re-book anytime</em>
          </span>
        </button>
      </div>
      {error ? <p className="pr-lifecycle__error">{error}</p> : null}
    </section>
  );
}

// ─── In progress ─────────────────────────────────────────────────────
function InProgressView({ inspection }) {
  return (
    <Chrome>
      <div className="pr-lifecycle">
        <header className="pr-lifecycle__hero">
          <StatusPill label="In progress" tone="warn" />
          <h1 className="pr-lifecycle__title">Your inspector is on-site.</h1>
          <p className="pr-lifecycle__lede">
            {inspection.technician?.name || "The technician"} is walking through your property
            now. Expect your report within 48 hours of the inspection wrapping up.
          </p>
        </header>
      </div>
    </Chrome>
  );
}

// ─── Lab pending ─────────────────────────────────────────────────────
function LabPendingView({ inspection }) {
  return (
    <Chrome>
      <div className="pr-lifecycle">
        <header className="pr-lifecycle__hero">
          <StatusPill label="Report in review" tone="warn" />
          <h1 className="pr-lifecycle__title">Inspection complete — report being signed off.</h1>
          <p className="pr-lifecycle__lede">
            The on-site work and any lab work for your inspection finished on{" "}
            <strong>{fmtDateLong(inspection.completed_at)}</strong>. Our senior reviewer is
            signing off the findings now. You&apos;ll get an email when the report is live here.
          </p>
        </header>
      </div>
    </Chrome>
  );
}

// ─── Cancelled ───────────────────────────────────────────────────────
function CancelledView({ inspection }) {
  return (
    <Chrome>
      <div className="pr-lifecycle">
        <header className="pr-lifecycle__hero">
          <StatusPill label="Cancelled" tone="bad" />
          <h1 className="pr-lifecycle__title">This inspection was cancelled.</h1>
          <p className="pr-lifecycle__lede">
            Cancelled on {fmtDateLong(inspection.updated_at || inspection.scheduled_at)}.
            Re-book anytime — your address and contact details are already on file, so the
            next booking is faster.
          </p>
        </header>
        <section className="pr-lifecycle__actions">
          <div className="pr-lifecycle__action-row">
            <a href="/#book" className="pr-lifecycle__action pr-lifecycle__action--primary">
              <span>
                <strong>Book another inspection</strong>
                <em>Pick a new date and time</em>
              </span>
            </a>
          </div>
        </section>
      </div>
    </Chrome>
  );
}
