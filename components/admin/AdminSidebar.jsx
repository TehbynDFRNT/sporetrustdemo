"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

  // Mobile off-canvas drawer. Desktop (≥768px) ignores this entirely via CSS —
  // the sidebar is a static sticky column there. On mobile the slim top bar's
  // hamburger toggles `drawerOpen`, sliding the same <aside> in from the left.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes (a nav tap navigated us).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Body scroll lock while the drawer is open (mobile only — harmless on
  // desktop where the drawer is never open).
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

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
    <>
      {/* Slim fixed top bar — mobile only (CSS-hidden on desktop). Carries the
          brand + a hamburger that toggles the drawer. */}
      <div className="admin-topbar">
        <Link href="/admin" className="admin-topbar__brand">Sporetrust · admin</Link>
        <button
          type="button"
          className="admin-topbar__toggle"
          aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <span aria-hidden>{drawerOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Backdrop — only mounted while the drawer is open (mobile). Tap to close. */}
      {drawerOpen ? (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={`admin-sidebar${drawerOpen ? " is-open" : ""}`}
        aria-label="Admin navigation"
      >
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
    </>
  );
}
