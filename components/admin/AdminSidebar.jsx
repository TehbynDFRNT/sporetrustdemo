"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    label: "Data",
    items: [
      { href: "/admin/data/customers",       label: "Customers" },
      { href: "/admin/data/properties",      label: "Properties" },
      { href: "/admin/data/inspections",     label: "Inspections" },
      { href: "/admin/data/air-samples",     label: "Air samples" },
      { href: "/admin/data/scope-partners",  label: "Scope & partners" },
      { href: "/admin/data/subscriptions",   label: "Subscriptions" },
      { href: "/admin/data/reference",       label: "Reference data" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar__brand">
        <Link href="/admin">Sporetrust · admin</Link>
      </div>

      <nav>
        {NAV.map((group) => (
          <div key={group.label} className="admin-sidebar__group">
            <div className="admin-sidebar__group-label">{group.label}</div>
            <ul>
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
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__foot">
        Auth: <span className="admin-sidebar__foot-pill">unconfigured</span>
      </div>
    </aside>
  );
}
