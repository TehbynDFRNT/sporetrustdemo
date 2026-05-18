"use client";

import { useQuery } from "@tanstack/react-query";

// Generic, type-file-driven table. Page components just import a type
// config (from lib/admin/types/<entity>.js) and render <DataTable config={...} />.
//
// A type config looks like:
//   {
//     slug: 'customers',
//     label: 'Customers',
//     endpoint: '/api/admin/customers',
//     rowKey: 'customer_id',
//     description: '...',
//     columns: [
//       { key, label, mono?, muted?, width?, align?, cell?: 'badge' | 'datetime' | 'currency' | 'percent' | 'jsonish' }
//     ]
//   }
//
// The cell renderer is selected via the column's `cell` field; default is plain text.

function fmtDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(value) {
  if (value == null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function fmtPercent(value) {
  if (value == null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n}%`;
}

function fmtJsonish(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function resolveValue(row, column) {
  // Column can opt into FK resolution via lookup: [embedTable, field].
  // Supabase returns the embedded row as row[embedTable].
  if (column.lookup) {
    const [table, field] = column.lookup;
    const nested = row?.[table];
    if (nested && typeof nested === "object" && nested[field] != null) {
      return nested[field];
    }
    // Fall through to the raw FK value when the embed didn't return a row.
  }
  return row?.[column.key];
}

function renderCell(value, column) {
  if (value === null || value === undefined || value === "") {
    return <span className="admin-table__null">—</span>;
  }
  switch (column.cell) {
    case "badge":
      return <span className={`admin-badge admin-badge--${String(value).toLowerCase()}`}>{value}</span>;
    case "datetime":
      return fmtDateTime(value);
    case "currency":
      return fmtCurrency(value);
    case "percent":
      return fmtPercent(value);
    case "jsonish":
      return fmtJsonish(value);
    case "bool":
      return value === true || value === "true" ? "Yes" : "No";
    default:
      return String(value);
  }
}

// Compose a row key from one or more columns. config.rowKey can be a string
// (the common single-PK case) or an array (composite keys, e.g. partner_skills).
function getRowKey(row, rowKey, index) {
  if (Array.isArray(rowKey)) {
    return rowKey.map((k) => row?.[k] ?? "").join("|") || String(index);
  }
  const v = row?.[rowKey];
  return v == null ? String(index) : v;
}

export default function DataTable({ config }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-table", config.slug],
    queryFn: async () => {
      const res = await fetch(config.endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`${config.endpoint} → ${res.status}`);
      return res.json();
    },
  });

  const rows = data?.rows ?? [];

  return (
    <section className="admin-table-block">
      <header className="admin-table-block__head">
        <div>
          <h2>{config.label}</h2>
          {config.description ? <p>{config.description}</p> : null}
        </div>
        <div className="admin-table-block__meta">
          <span className="admin-table-block__count">
            {isLoading ? "…" : `${rows.length} row${rows.length === 1 ? "" : "s"}`}
          </span>
          <code className="admin-table-block__endpoint">{config.endpoint}</code>
        </div>
      </header>

      {isError ? (
        <div className="admin-table-block__error">Error: {String(error?.message || error)}</div>
      ) : null}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={col.align === "right" ? "is-right" : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={config.columns.length} className="admin-table__loading">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="admin-table__empty">
                  No rows.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={getRowKey(row, config.rowKey, index)}>
                  {config.columns.map((col) => {
                    const classes = [];
                    // When a lookup resolves, treat the column as plain text
                    // (the resolved name shouldn't be mono'd like an ID).
                    const usingLookup = !!col.lookup && row?.[col.lookup[0]];
                    if (col.mono && !usingLookup) classes.push("admin-cell--mono");
                    if (col.muted) classes.push("admin-cell--muted");
                    if (col.align === "right") classes.push("is-right");
                    return (
                      <td key={col.key} className={classes.join(" ") || undefined}>
                        {renderCell(resolveValue(row, col), col)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
