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
    const node = ref.current;
    if (!node) return undefined;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return undefined;
    }

    // If the element is at or above the bottom of the viewport at mount time
    // (common on back/forward nav where scroll position is restored), reveal
    // immediately. Covers in-viewport AND already-scrolled-past elements —
    // both cases the IntersectionObserver doesn't reliably catch on re-mount.
    // Only elements below the viewport wait for the observer.
    const rect = node.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportHeight) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const classes = ["reveal", shown ? "is-in" : "", className].filter(Boolean).join(" ");
  const style = delay ? { ...(rest.style || {}), "--reveal-delay": `${delay}ms` } : rest.style;

  return (
    <Tag ref={ref} className={classes} {...rest} style={style}>
      {children}
    </Tag>
  );
}
