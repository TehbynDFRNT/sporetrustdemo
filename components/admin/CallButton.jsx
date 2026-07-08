"use client";

import { useEffect, useRef, useState } from "react";

// Click-to-call that actually does something on a desktop: a bare tel: link
// is a silent no-op on a Mac with no telephony handler, so clicking also
// copies the number and says so. On a phone the tel: href dials as normal.
export default function CallButton({ phone, className = "crm-btn crm-btn--call", children }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!phone) return null;
  const cleaned = String(phone).replace(/\s+/g, "");

  function onClick() {
    // writeText rejects (not throws) when unavailable/unfocused — swallow
    // async too; the tel: href still fires either way.
    Promise.resolve()
      .then(() => navigator.clipboard?.writeText(cleaned))
      .catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2500);
  }

  return (
    <a className={className} href={`tel:${cleaned}`} onClick={onClick}>
      {copied ? "Number copied ✓" : children ?? `Call ${phone}`}
    </a>
  );
}
