"use client";

import { useState } from "react";
import DataTable from "./DataTable";

// DataTabs takes an array of type configs and renders one DataTable at a time
// behind a tab strip. Used on pages that group tightly-related entities
// (e.g. inspections + sample_locations + image_captures + moisture_readings).
export default function DataTabs({ title, description, tabs }) {
  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug);
  const active = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  return (
    <div className="admin-tabs">
      <header className="admin-tabs__head">
        {title ? <h1>{title}</h1> : null}
        {description ? <p>{description}</p> : null}
        <nav className="admin-tabs__strip" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              type="button"
              role="tab"
              aria-selected={tab.slug === active.slug}
              className={`admin-tabs__tab${tab.slug === active.slug ? " is-active" : ""}`}
              onClick={() => setActiveSlug(tab.slug)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <DataTable config={active} />
    </div>
  );
}
