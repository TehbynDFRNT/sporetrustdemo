"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_DELAY = 3000;
const CYCLE_DURATION = 7000;
const CROSSFADE_DURATION = 900;
const NEXT_REVEAL_DELAY = 350;

const scenes = [
  {
    visible: "/images/bedroom-visible.jpg",
    thermal: "/images/bedroom-thermal.jpg",
    visibleAlt: "Bedroom wall in visible light with no obvious mould showing",
    thermalAlt:
      "Thermal image of the same bedroom revealing cold damp areas consistent with moisture and mould risk",
  },
  {
    visible: "/images/bathroom-visible.jpg",
    thermal: "/images/bathroom-thermal.jpg",
    visibleAlt: "Bathroom wall in visible light before the thermal comparison changes",
    thermalAlt:
      "Thermal image of the bathroom revealing damp areas consistent with hidden moisture and mould risk",
  },
  {
    visible: "/images/closet-visible.jpg",
    thermal: "/images/closet-thermal.jpg",
    visibleAlt: "Closet wall in visible light before the thermal comparison changes",
    thermalAlt:
      "Thermal image of the closet revealing damp areas consistent with hidden moisture and mould risk",
  },
];

export default function ThermalReveal() {
  const figureRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [isActive, setIsActive] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [outgoingScene, setOutgoingScene] = useState(null);
  const scene = scenes[sceneIndex];

  useEffect(() => {
    scenes.forEach((item) => {
      [item.visible, item.thermal].forEach((src) => {
        const image = new Image();
        image.src = src;
      });
    });
  }, []);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsActive(true);
      setIsRevealing(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsActive(true);
        observer.disconnect();
      },
      {
        threshold: 0.45,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(figure);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive || scenes.length < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let cancelled = false;
    const timers = [];

    const wait = (duration) =>
      new Promise((resolve) => {
        const timer = window.setTimeout(resolve, duration);
        timers.push(timer);
      });

    async function runSequence() {
      await wait(INITIAL_DELAY);

      while (!cancelled) {
        setIsRevealing(true);
        await wait(CYCLE_DURATION);
        if (cancelled) break;

        setOutgoingScene(scenes[currentIndexRef.current]);
        setIsRevealing(false);
        setSceneIndex((current) => {
          const next = (current + 1) % scenes.length;
          currentIndexRef.current = next;
          return next;
        });

        await wait(CROSSFADE_DURATION);
        if (cancelled) break;

        setOutgoingScene(null);
        await wait(NEXT_REVEAL_DELAY);
      }
    }

    runSequence();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isActive]);

  return (
    <figure
      ref={figureRef}
      className={`thermal-reveal${isActive ? " is-active" : ""}${isRevealing ? " is-revealing" : ""}${outgoingScene ? " is-crossfading" : ""}`}
      aria-label="Bedroom wall transitioning from visible light to thermal capture"
    >
      <div className="thermal-scene current" key={scene.visible}>
        <img
          className="thermal-reveal-img visible"
          src={scene.visible}
          alt={scene.visibleAlt}
        />
        <img
          className="thermal-reveal-img thermal"
          src={scene.thermal}
          alt={scene.thermalAlt}
        />
      </div>
      {outgoingScene ? (
        <div className="thermal-scene outgoing" aria-hidden="true">
          <img
            className="thermal-reveal-img visible"
            src={outgoingScene.visible}
            alt=""
          />
          <img
            className="thermal-reveal-img thermal"
            src={outgoingScene.thermal}
            alt=""
          />
        </div>
      ) : null}
      <figcaption>
        <span className="visible-label">Visible light</span>
        <span className="thermal-label">Thermal capture</span>
      </figcaption>
    </figure>
  );
}
