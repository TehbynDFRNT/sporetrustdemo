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

    // Multi-layered visibility check to handle every mount scenario reliably:
    //
    // 1. Sync check on mount — handles fresh page loads where scroll is at 0.
    // 2. requestAnimationFrame check — handles back/forward navigation where
    //    the browser restores scroll position AFTER React renders and the
    //    effect fires. At sync time the element may appear below the fold,
    //    but one frame later it's in view.
    // 3. IntersectionObserver — handles the user actively scrolling to it.
    //
    // "Visible" here means in-viewport OR already scrolled past — both cases
    // should be revealed on re-mount since the user has effectively seen them.

    const inOrPastViewport = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < vh;
    };

    if (inOrPastViewport()) {
      setShown(true);
      return undefined;
    }

    let raf = requestAnimationFrame(() => {
      raf = 0;
      if (inOrPastViewport()) {
        setShown(true);
      }
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(node);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const classes = ["reveal", shown ? "is-in" : "", className].filter(Boolean).join(" ");
  const style = delay ? { ...(rest.style || {}), "--reveal-delay": `${delay}ms` } : rest.style;

  return (
    <Tag ref={ref} className={classes} {...rest} style={style}>
      {children}
    </Tag>
  );
}
