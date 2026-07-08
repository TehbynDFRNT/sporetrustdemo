"use client";

import { useEffect, useRef, useState } from "react";
import { useDialler } from "./voice/DiallerProvider";

/* Click-to-call, two tiers:
   - Twilio Voice configured → places the call in-browser via the dialler
     (WebRTC, mic + headset), with a small copy affordance beside it.
   - Not configured → tel: anchor that ALSO copies the number, because a
     bare tel: link is a silent no-op on a desktop with no phone handler. */

const plainLinkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  textDecoration: "underline",
  cursor: "pointer",
};

export default function CallButton({ phone, className = "crm-btn crm-btn--call", children }) {
  const dialler = useDialler();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!phone) return null;
  const cleaned = String(phone).replace(/\s+/g, "");

  function copy() {
    // writeText rejects (not throws) when unavailable/unfocused — swallow
    // async too; the action still proceeds either way.
    Promise.resolve()
      .then(() => navigator.clipboard?.writeText(cleaned))
      .catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2500);
  }

  if (dialler?.configured) {
    const busy = dialler.status !== "idle";
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          className={className || undefined}
          style={className ? undefined : plainLinkStyle}
          disabled={busy}
          onClick={() => void dialler.placeCall(cleaned)}
        >
          {busy ? "On a call…" : children ?? `Call ${phone}`}
        </button>
        <button
          type="button"
          style={plainLinkStyle}
          onClick={copy}
          title="Copy number"
          aria-label={`Copy ${phone}`}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </span>
    );
  }

  return (
    <a className={className || undefined} style={className ? undefined : plainLinkStyle} href={`tel:${cleaned}`} onClick={copy}>
      {copied ? "Number copied ✓" : children ?? `Call ${phone}`}
    </a>
  );
}
