"use client";

import { useEffect, useRef, useState } from "react";
import ArrowIcon from "./icons/ArrowIcon";
import Brand from "./Brand";
import SentinelMark from "./SentinelMark";

const HOVER_OPEN_DELAY = 100;
const HOVER_CLOSE_DELAY = 220;

const NAV_ITEMS = [
  { key: "diagnostics", label: "Diagnostics", panel: true },
  { key: "sentinel", label: "Sentinel", panel: true },
  { key: "for", label: "For", panel: true },
  { key: "pricing", label: "Pricing", href: "/#pricing" },
  { key: "about", label: "About", panel: true },
];

const AUDIENCES = [
  {
    label: "Tenants",
    desc: "Evidence for repair requests, liveability disputes and tribunal records.",
    href: "#book",
  },
  {
    label: "Homeowners",
    desc: "Independent diagnosis before repair quotes or insurance claims.",
    href: "#book",
  },
  {
    label: "Property managers",
    desc: "A neutral record at handover that both sides can act on.",
    href: "#book",
  },
  {
    label: "Pre-purchase buyers",
    desc: "Know what's behind the wall before contracts are signed.",
    href: "#book",
  },
];

const FAQ_TEASER = [
  { q: "Are you a remediation company?", a: "/#faq" },
  { q: "How long is the on-site visit?", a: "/#faq" },
  { q: "When do I get the report?", a: "/#faq" },
  { q: "Do you service my area?", a: "/#faq" },
];

function PanelLink({ href, label, desc, kicker }) {
  return (
    <a className="mega-link" href={href}>
      {kicker ? <span className="mega-link__kicker">{kicker}</span> : null}
      <span className="mega-link__label">
        {label}
        <ArrowIcon />
      </span>
      {desc ? <span className="mega-link__desc">{desc}</span> : null}
    </a>
  );
}

function DiagnosticsPanel() {
  return (
    <div className="mega-panel mega-panel--diagnostics">
      <figure className="mega-panel__media">
        <img
          src="/images/thermal-before-after.jpg"
          alt="Thermal capture comparison showing damp areas hidden behind a clean wall"
          loading="lazy"
        />
        <figcaption>
          <span className="mega-link__kicker">Visible vs thermal</span>
          What you see vs what we measure.
        </figcaption>
      </figure>

      <div className="mega-panel__col">
        <span className="mega-panel__col-title">Diagnostics</span>
        <PanelLink href="/diagnosing-mould" label="Diagnosing mould" desc="Visible vs hidden vs prevention — pick the pathway that matches your situation." />
        <PanelLink href="/how-it-works" label="How it works" desc="Tenants, homeowners, managers — the same diagnostic, different evidence needs." />
        <PanelLink href="/#methodology" label="Our methodology" desc="Thermal, moisture, humidity, lab. The same protocol, every visit." />
      </div>

      <div className="mega-panel__col">
        <span className="mega-panel__col-title">The Report</span>
        <PanelLink href="/#report" label="What's inside" desc="Cause, extent, evidence, repair-cost range — all in one shareable PDF." />
        <PanelLink href="/#contamination" label="What we test for" desc="Seven signal categories — visible, hidden, weather, materials, airflow." />
      </div>
    </div>
  );
}

function SentinelPanel() {
  return (
    <div className="mega-panel mega-panel--sentinel">
      <div className="mega-panel__feature">
        <SentinelMark size={48} className="mega-panel__feature-mark" />
        <span className="mega-panel__col-title">Sporetrust Sentinel</span>
        <p className="mega-panel__feature-tagline">
          Industry-first annual mould prevention. One inspection a year, a fresh report, and the team you trust on speed dial.
        </p>
        <div className="mega-panel__feature-price">
          <span className="mega-panel__price-figure">$13.95</span>
          <span className="mega-panel__price-meta">per week</span>
        </div>
        <a className="btn mega-panel__cta" href="/sporetrust-sentinel">
          See Sentinel <ArrowIcon />
        </a>
      </div>

      <div className="mega-panel__col">
        <span className="mega-panel__col-title">What's included</span>
        <PanelLink href="/sporetrust-sentinel" label="Annual on-site inspection" desc="Full thermal, moisture and humidity sweep, every year." />
        <PanelLink href="/sporetrust-sentinel" label="Year-on-year report tracking" desc="See changes over time. Share with insurers, builders, landlords." />
        <PanelLink href="/sporetrust-sentinel" label="Member rates on add-ons" desc="Discounted re-inspections, lab sampling and clearance checks." />
        <PanelLink href="/sporetrust-sentinel" label="Priority booking" desc="Move to the front of the queue when a quick visit is needed." />
      </div>
    </div>
  );
}

function AudiencePanel() {
  return (
    <div className="mega-panel mega-panel--audience">
      {AUDIENCES.map((aud) => (
        <PanelLink key={aud.label} href={aud.href} label={aud.label} desc={aud.desc} />
      ))}
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="mega-panel mega-panel--about">
      <div className="mega-panel__col">
        <span className="mega-panel__col-title">Sporetrust</span>
        <PanelLink href="/why-sporetrust" label="Why Sporetrust" desc="Independent by design. We don't sell the fix — the report is the product." />
        <PanelLink href="/partners" label="Partners" desc="Vetted remediation and repair pathways without compromising independence." />
        <ul className="mega-panel__accreditation" aria-label="Accreditation">
          <li><img src="/logos/iicrc.svg" alt="IICRC certified" /></li>
          <li><img src="/logos/nata.png" alt="NATA accredited" /></li>
        </ul>
      </div>

      <div className="mega-panel__col">
        <span className="mega-panel__col-title">Frequently asked</span>
        {FAQ_TEASER.map((item) => (
          <a key={item.q} className="mega-link mega-link--compact" href={item.a}>
            <span className="mega-link__label">
              {item.q}
              <ArrowIcon />
            </span>
          </a>
        ))}
        <PanelLink href="/#faq" label="All questions" />
      </div>
    </div>
  );
}

const PANELS = {
  diagnostics: DiagnosticsPanel,
  sentinel: SentinelPanel,
  for: AudiencePanel,
  about: AboutPanel,
};

export default function MegaNav() {
  const [openKey, setOpenKey] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  function clearTimers() {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleOpen(key) {
    clearTimers();
    if (openKey === key) return;
    openTimerRef.current = setTimeout(() => setOpenKey(key), HOVER_OPEN_DELAY);
  }

  function scheduleClose() {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setOpenKey(null), HOVER_CLOSE_DELAY);
  }

  function handleTriggerClick(item, event) {
    if (!item.panel) return;
    event.preventDefault();
    clearTimers();
    setOpenKey((current) => (current === item.key ? null : item.key));
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        setOpenKey(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => () => clearTimers(), []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const ActivePanel = openKey ? PANELS[openKey] : null;

  return (
    <nav className={`mega-nav${openKey ? " is-panel-open" : ""}${mobileOpen ? " is-mobile-open" : ""}`}>
      <div className="mega-nav__inner">
        <Brand />

        <ul className="mega-nav__items" role="list">
          {NAV_ITEMS.map((item) => {
            const isOpen = openKey === item.key;
            const isPanel = !!item.panel;
            const TriggerTag = isPanel ? "button" : "a";
            const triggerProps = isPanel
              ? {
                  type: "button",
                  "aria-expanded": isOpen,
                  "aria-haspopup": true,
                }
              : { href: item.href };

            return (
              <li
                key={item.key}
                className={`mega-nav__item${isOpen ? " is-active" : ""}`}
                onMouseEnter={() => isPanel && scheduleOpen(item.key)}
                onMouseLeave={() => isPanel && scheduleClose()}
              >
                <TriggerTag
                  className="mega-nav__trigger"
                  onClick={(event) => handleTriggerClick(item, event)}
                  onFocus={() => isPanel && scheduleOpen(item.key)}
                  {...triggerProps}
                >
                  {item.label}
                  {isPanel ? (
                    <svg className="mega-nav__chevron" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </TriggerTag>
              </li>
            );
          })}
        </ul>

        <a className="mega-nav__cta" href="#book">
          Book inspection <ArrowIcon />
        </a>

        <button
          type="button"
          className="mega-nav__hamburger"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((m) => !m)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Desktop mega panel */}
      {ActivePanel ? (
        <div
          className="mega-nav__dropdown"
          onMouseEnter={() => clearTimers()}
          onMouseLeave={() => scheduleClose()}
        >
          <div className="wrap mega-nav__dropdown-inner">
            <ActivePanel />
          </div>
        </div>
      ) : null}

      {/* Mobile drawer */}
      <div className="mega-nav__drawer" aria-hidden={!mobileOpen}>
        <div className="mega-nav__drawer-inner">
          {NAV_ITEMS.map((item) => (
            <details key={item.key} className="mega-nav__drawer-item">
              <summary>
                {item.label}
                {item.panel ? (
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </summary>
              {item.panel && PANELS[item.key]
                ? (() => {
                    const PanelComp = PANELS[item.key];
                    return (
                      <div className="mega-nav__drawer-content">
                        <PanelComp />
                      </div>
                    );
                  })()
                : null}
            </details>
          ))}
          <a className="mega-nav__cta mega-nav__cta--mobile" href="#book" onClick={() => setMobileOpen(false)}>
            Book inspection <ArrowIcon />
          </a>
        </div>
      </div>
    </nav>
  );
}
