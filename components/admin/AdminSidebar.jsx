"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Two groups:
//   - Workspace: workflow-oriented jump-off points. CRM and Inspections are
//     each a single page with in-page tabs (Inspections = Pipeline / Today /
//     Sign-off), so the sidebar stays to the top-level surfaces. Default open.
//   - Data: reference / inspection-records tables. Default collapsed —
//     they're for visibility and audit, not where you build inspections.
//
// Groups auto-expand on mount if the current pathname matches one of their
// items, so deep-linking into Data doesn't dump you into a closed list.
const NAV = [
  {
    label: "Workspace",
    defaultOpen: true,
    items: [
      { href: "/admin/crm",           label: "CRM" },
      { href: "/admin/inspections",   label: "Inspections" },
    ],
  },
  {
    label: "Data",
    defaultOpen: false,
    items: [
      { href: "/admin/data/leads",                label: "Leads" },
      { href: "/admin/data/crm-cards",            label: "CRM cards" },
      { href: "/admin/data/touchpoints",          label: "Touchpoints" },
      { href: "/admin/data/customers",            label: "Customers" },
      { href: "/admin/data/properties",           label: "Properties" },
      { href: "/admin/data/inspections",          label: "Inspections" },
      { href: "/admin/data/air-samples",          label: "Air samples" },
      { href: "/admin/data/technicians",          label: "Technicians" },
      { href: "/admin/data/equipment-types",      label: "Equipment types" },
      { href: "/admin/data/technician-equipment", label: "Technician kit" },
      { href: "/admin/data/scope-partners",       label: "Scope & partners" },
      { href: "/admin/data/subscriptions",        label: "Subscriptions" },
      { href: "/admin/data/reference",            label: "Reference data" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "";

  // Lazy-init: open if defaultOpen, or if the current route lives in this
  // group. Lazy init runs once on mount; later toggles drive state directly.
  const [openGroups, setOpenGroups] = useState(() => {
    const map = {};
    for (const g of NAV) {
      const hasActive = g.items.some((i) => pathname.startsWith(i.href));
      map[g.label] = hasActive || Boolean(g.defaultOpen);
    }
    return map;
  });

  function toggle(label) {
    setOpenGroups((o) => ({ ...o, [label]: !o[label] }));
  }

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar__brand">
        <Link href="/admin">Sporetrust · admin</Link>
      </div>

      <nav>
        {NAV.map((group) => {
          const isOpen = openGroups[group.label];
          return (
            <div key={group.label} className="admin-sidebar__group">
              <button
                type="button"
                className={`admin-sidebar__group-label ${isOpen ? "is-open" : ""}`}
                onClick={() => toggle(group.label)}
                aria-expanded={isOpen}
                aria-controls={`group-${group.label}`}
              >
                <span>{group.label}</span>
                <span className="admin-sidebar__chevron" aria-hidden>▾</span>
              </button>
              {isOpen ? (
                <ul id={`group-${group.label}`}>
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`admin-sidebar__link${isActive ? " is-active" : ""}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar__foot">
        Auth: <span className="admin-sidebar__foot-pill">unconfigured</span>
      </div>
    </aside>
  );
}
