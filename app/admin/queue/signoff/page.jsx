"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import "../../inspections/[inspection_id]/inspection-workspace.css";
import "../../inspections/inspections-index.css";

// Sign-off queue — draft reports whose field work is complete, waiting on a
// qualified technician's review. Oldest first so nothing rots at the back.
// Rows open the inspection workspace for the actual review; the inline
// "Sign off" stamps signed_off_by_technician_id + signed_off_at once the
// reviewer is satisfied.

const SIGNER_ROLES = new Set(["qualified", "admin"]);

export default function SignoffQueuePage() {
  const queryClient = useQueryClient();

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

  const signers = (techniciansQuery.data?.rows ?? []).filter(
    (t) => t.active !== false && SIGNER_ROLES.has(t.role)
  );

  const [signerId, setSignerId] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState(null); // { id, message }

  const rows = (inspectionsQuery.data?.rows ?? [])
    .filter((r) => r.report_status === "draft" && r.completed_at && !r.signed_off_at)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  async function signOff(inspectionId) {
    if (!signerId) {
      setRowError({ id: inspectionId, message: "Pick who's signing off first." });
      return;
    }
    setBusyId(inspectionId);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed_off_by_technician_id: Number(signerId),
          signed_off_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Sign-off → ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-table", "inspections"] });
    } catch (err) {
      setRowError({ id: inspectionId, message: String(err.message || err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Sign-off queue</h1>
          <p>Completed field work with a draft report — review, then sign off. Oldest first.</p>
        </div>
        <label className="ins-muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          Sign off as
          <select value={signerId} onChange={(e) => setSignerId(e.target.value)}>
            <option value="">Choose…</option>
            {signers.map((t) => (
              <option key={t.technician_id} value={String(t.technician_id)}>
                {t.name} ({t.role})
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
              <h2 className="insp-bucket__title insp-bucket__title--signoff">Awaiting sign-off</h2>
            </div>
            <span className="ins-section__count">{rows.length}</span>
          </div>
          {rows.length === 0 ? (
            <p className="ins-empty ins-empty--compact">Sign-off queue is clear.</p>
          ) : (
            <ul className="ins-row-list">
              {rows.map((r) => (
                <li key={r.inspection_id}>
                  <div className="ins-row ins-row--stack ins-row--static">
                    <div className="ins-row__head">
                      <span className="ins-row__name">
                        {r.customers?.name || "Unknown customer"}
                        <span className="ins-muted ins-summary__sub"> · {r.inspection_type}</span>
                      </span>
                      <span className="ins-row__meta">
                        {r.report_severity ? (
                          <span className={`ins-badge ins-badge--sev-${r.report_severity}`}>
                            {r.report_severity}
                          </span>
                        ) : null}
                        <span className="ins-badge ins-badge--report-draft">draft</span>
                        <Link href={`/admin/inspections/${r.inspection_id}`} className="ins-section__edit">
                          Review →
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOff(r.inspection_id)}
                          disabled={busyId === r.inspection_id}
                        >
                          {busyId === r.inspection_id ? "Signing…" : "Sign off"}
                        </button>
                      </span>
                    </div>
                    <p className="ins-row__detail">
                      Completed {fmtWhen(r.completed_at)}
                      {" · "}
                      {r.properties?.address_line || "—"}
                      {r.properties?.postcode ? ` · ${r.properties.postcode}` : ""}
                      {" · "}
                      <span className="ins-muted">field tech: {r.technician?.name || "unassigned"}</span>
                    </p>
                    {rowError?.id === r.inspection_id ? (
                      <p className="ins-error" style={{ margin: 0 }}>{rowError.message}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
