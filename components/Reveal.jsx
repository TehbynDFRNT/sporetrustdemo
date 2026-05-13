"use client";

// Pure CSS reveal — the .reveal class applies a `reveal-in` keyframe
// animation in globals.css that plays once whenever the element mounts.
// Browsers replay CSS animations on every mount automatically (initial
// load, SPA route change, browser back/forward), so there's no state to
// orchestrate and no observer to misfire.
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  threshold, // kept for API compat, unused
  rootMargin, // kept for API compat, unused
  ...rest
}) {
  const cls = ["reveal", className].filter(Boolean).join(" ");
  const style = delay
    ? { ...(rest.style || {}), "--reveal-delay": `${delay}ms` }
    : rest.style;
  return (
    <Tag className={cls} {...rest} style={style}>
      {children}
    </Tag>
  );
}
