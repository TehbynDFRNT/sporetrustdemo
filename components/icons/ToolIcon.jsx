export default function ToolIcon({ type }) {
  if (type === "camera") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="17" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10.5" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="16" y="3" width="5" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  if (type === "meter") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="8" y="3" width="8" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 7H14M10 10H14M12 17V21M10 21H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 5V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 10V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
