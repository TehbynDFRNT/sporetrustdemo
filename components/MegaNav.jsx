"use client";

import { useEffect, useRef, useState } from "react";
import ArrowIcon from "./icons/ArrowIcon";
import Brand from "./Brand";
import SentinelMark from "./SentinelMark";

const HOVER_OPEN_DELAY = 100;
const HOVER_CLOSE_DELAY = 220;

const NAV_ITEMS = [
  { key: "how-it-works", label: "How it works", href: "/how-it-works" },
  { key: "diagnostics", label: "Diagnostics", panel: true },
  { key: "sentinel", label: "Sentinel", panel: true },
  { key: "about", label: "About", panel: true },
];

function PanelLink({ href, label, desc, kicker, variant }) {
  const className = `mega-link${variant ? ` mega-link--${variant}` : ""}`;
  return (
    <a className={className} href={href}>
      {kicker ? <span className="mega-link__kicker">{kicker}</span> : null}
      <span className="mega-link__label">
        {label}
        <ArrowIcon />
      </span>
      {desc ? <span className="mega-link__desc">{desc}</span> : null}
    </a>
  );
}

const DIAGNOSTIC_CARDS = [
  {
    href: "/visible-mould",
    image: "/images/sign-water-staining.png",
    imageAlt: "Water staining and visible mould on a wall surface",
    title: "I have mould already",
    desc: "Document cause, damage and scope. Visible contamination still needs diagnosis.",
  },
  {
    href: "/suspected-mould",
    image: "/images/thermal-before-after.jpg",
    imageAlt: "Thermal capture revealing hidden moisture behind a visibly clean wall",
    title: "I suspect mould",
    desc: "Look behind the surface — thermal, moisture, odour and air sampling.",
  },
  {
    href: "/mould-prevention",
    image: "/images/metal-ball-moisture-detector.jpg",
    imageAlt: "Moisture detector used for proactive mould prevention",
    title: "Mould prevention",
    desc: "Reduce future risk through humidity control, ventilation and earlier detection.",
  },
];

function DiagnosticsPanel() {
  return (
    <div className="mega-panel mega-panel--diagnostics">
      {DIAGNOSTIC_CARDS.map((card) => (
        <a key={card.href} className="mega-panel__card" href={card.href}>
          <figure className="mega-panel__card-media">
            <img src={card.image} alt={card.imageAlt} loading="lazy" />
          </figure>
          <div className="mega-panel__card-content">
            <span className="mega-panel__card-title">
              {card.title}
              <ArrowIcon />
            </span>
            <span className="mega-panel__card-desc">{card.desc}</span>
          </div>
        </a>
      ))}

      <div className="mega-panel__col mega-panel__col--callout">
        <a className="mega-link mega-link--callout" href="#">
          <span className="mega-link__label">Do I have mould?</span>
          <span className="mega-link__desc">
            Take the test — a quick self-assessment to point you to the right diagnostic.
          </span>
          <span className="mega-link__btn">
            Take the Test <ArrowIcon />
          </span>
        </a>
      </div>
    </div>
  );
}

const SENTINEL_INCLUSIONS = [
  {
    title: "Annual on-site inspection",
    copy: "Full thermal, moisture and humidity sweep, every year.",
  },
  {
    title: "Year-on-year report tracking",
    copy: "See changes over time. Share with insurers, builders, landlords.",
  },
  {
    title: "Member rates on add-ons",
    copy: "Discounted re-inspections, lab sampling and clearance checks.",
  },
];

function SentinelPanel() {
  return (
    <div className="mega-panel mega-panel--sentinel">
      <ul className="mega-panel__inclusions-grid" role="list">
        {SENTINEL_INCLUSIONS.map((item, index) => (
          <li className="mega-panel__inclusion-tile" key={item.title}>
            <span className="mega-panel__inclusion-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{item.title}</strong>
            <span>{item.copy}</span>
          </li>
        ))}
      </ul>

      <div className="mega-panel__feature">
        <div className="mega-panel__feature-head">
          <SentinelMark size={56} className="mega-panel__feature-mark" />
          <div className="mega-panel__feature-titles">
            <span className="mega-panel__feature-supertext">Year-round prevention</span>
            <h3 className="mega-panel__feature-title">Sporetrust Sentinel</h3>
          </div>
        </div>

        <p className="mega-panel__feature-tagline">
          Industry-first annual mould prevention. One inspection a year, a fresh report, and the team you trust on speed dial.
        </p>

        <div className="mega-panel__feature-foot">
          <div className="mega-panel__feature-price">
            <span className="mega-panel__price-figure">$13.95</span>
            <span className="mega-panel__price-meta">per week</span>
          </div>
          <a className="mega-panel__feature-cta" href="/sporetrust-sentinel">
            Learn more <ArrowIcon />
          </a>
        </div>
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="mega-panel mega-panel--about">
      <div className="mega-panel__col">
        <span className="mega-panel__col-title">Sporetrust</span>
        <PanelLink
          href="/why-sporetrust"
          label="Why Sporetrust"
          desc="Independent by design. We don't sell the fix — the report is the product."
        />
        <ul className="mega-panel__accreditation" aria-label="Accreditation">
          <li><img src="/logos/iicrc-dark.png" alt="IICRC certified" /></li>
          <li><img src="/logos/nata-dark.png" alt="NATA accredited" /></li>
        </ul>
      </div>

      <div className="mega-panel__col">
        <span className="mega-panel__col-title">Partners</span>
        <PanelLink
          href="/partners/contractors"
          label="Repair contractors"
          desc="Builders, plastering, flooring, ventilation — for putting the home back together."
        />
        <PanelLink
          href="/partners/remediation"
          label="Remediation providers"
          desc="Specialist decontamination teams who work from your report."
        />
      </div>
    </div>
  );
}

const PANELS = {
  diagnostics: DiagnosticsPanel,
  sentinel: SentinelPanel,
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
