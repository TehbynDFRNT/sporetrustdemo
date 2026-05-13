"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  as: Tag = "div",
  delay = 0,
  threshold = 0.18,
  rootMargin = "0px 0px -8% 0px",
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return undefined;
    }

    // Reveal on mount. We previously used IntersectionObserver to trigger
    // reveals as the user scrolled to each element, but it failed unpredictably
    // on client-side back/forward navigation — the observer wouldn't reliably
    // fire for elements whose visibility changed during scroll restoration,
    // leaving sections stuck at opacity:0 until a hard reload. Mounting-as-
    // reveal is reliable across every navigation mode; the CSS transition
    // (opacity 0 → 1) still animates because the class flips on the next frame.
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const classes = ["reveal", shown ? "is-in" : "", className].filter(Boolean).join(" ");
  const style = delay ? { ...(rest.style || {}), "--reveal-delay": `${delay}ms` } : rest.style;

  return (
    <Tag ref={ref} className={classes} {...rest} style={style}>
      {children}
    </Tag>
  );
}
