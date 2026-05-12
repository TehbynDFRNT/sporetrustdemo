"use client";

import { useEffect, useRef, useState } from "react";

export default function Timeline({ items = [] }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return undefined;

    const nodes = Array.from(root.querySelectorAll("[data-timeline-step]"));
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute("data-timeline-step"));
          if (Number.isFinite(idx)) setActiveIndex(idx);
        });
      },
      { threshold: 0.55, rootMargin: "-25% 0px -25% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items.length]);

  if (!items.length) return null;

  const progress = items.length > 1 ? activeIndex / (items.length - 1) : 1;

  return (
    <div className="timeline" ref={trackRef}>
      <div className="timeline__spine" aria-hidden="true">
        <div
          className="timeline__spine-fill"
          style={{ transform: `scaleY(${Math.max(0.04, progress)})` }}
        />
      </div>

      <ol className="timeline__list" role="list">
        {items.map((item, index) => {
          const isActive = index <= activeIndex;
          return (
            <li
              key={item.title}
              data-timeline-step={index}
              className={`timeline__step${isActive ? " is-active" : ""}`}
            >
              <div className="timeline__marker" aria-hidden="true">
                <span className="timeline__marker-dot" />
                <span className="timeline__marker-ring" />
              </div>

              <article className="timeline__card">
                <header className="timeline__card-head">
                  <span className="timeline__index">Step {String(index + 1).padStart(2, "0")}</span>
                  {item.meta ? <span className="timeline__meta">{item.meta}</span> : null}
                </header>
                <h3 className="timeline__title">{item.title}</h3>
                <p className="timeline__copy">{item.copy}</p>
                {item.signals?.length ? (
                  <ul className="timeline__signals" role="list">
                    {item.signals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
