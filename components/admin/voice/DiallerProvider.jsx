"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./dialler.css";

/* Browser dialler — wraps the admin section once (layout) and exposes
   placeCall() to anything below (CallButton, queue, composer). Manages the
   Twilio Voice Device lifecycle: token fetch + refresh, registration for
   incoming calls, and one active call at a time surfaced through the
   floating CallBar.

   When /api/admin/voice/token 503s (Twilio Voice not configured) the
   provider stays dormant: configured=false, no SDK download, callers fall
   back to tel:/copy behaviour. */

const DiallerContext = createContext(null);

export function useDialler() {
  return useContext(DiallerContext);
}

export default function DiallerProvider({ children }) {
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const [configured, setConfigured] = useState(null); // null = probing
  const [status, setStatus] = useState("idle"); // idle|connecting|ringing|open|incoming
  const [call, setCall] = useState(null); // { phone, direction }
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null);

  const reset = useCallback(() => {
    callRef.current = null;
    setStatus("idle");
    setCall(null);
    setMuted(false);
    setStartedAt(null);
  }, []);

  const wireCall = useCallback(
    (c) => {
      c.on("accept", () => {
        setStatus("open");
        setStartedAt(Date.now());
      });
      c.on("disconnect", reset);
      c.on("cancel", reset);
      c.on("reject", reset);
      c.on("error", (e) => {
        setError(e?.message || "Call error");
        reset();
      });
    },
    [reset],
  );

  // Probe config + initialise the device once. Registration is eager so
  // inbound calls can ring the browser whenever the admin is open.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/voice/token");
        if (cancelled) return;
        if (!res.ok) {
          setConfigured(false);
          return;
        }
        const data = await res.json();
        const { Device } = await import("@twilio/voice-sdk");
        if (cancelled) return;

        const device = new Device(data.token, { logLevel: "error" });
        deviceRef.current = device;

        device.on("tokenWillExpire", async () => {
          try {
            const r = await fetch("/api/admin/voice/token");
            const d = await r.json();
            if (r.ok) device.updateToken(d.token);
          } catch {
            /* next expiry retriggers */
          }
        });
        device.on("error", (e) => setError(e?.message || "Voice device error"));
        device.on("incoming", (incoming) => {
          // One call at a time — a second incoming while busy is rejected
          // (Twilio falls through to CALL_FORWARD_TO / the callback message).
          if (callRef.current) {
            incoming.reject();
            return;
          }
          callRef.current = incoming;
          setCall({ phone: incoming.parameters?.From || "unknown", direction: "inbound" });
          setStatus("incoming");
          wireCall(incoming);
        });

        await device.register();
        if (!cancelled) setConfigured(true);
      } catch (e) {
        if (!cancelled) {
          setConfigured(false);
          setError(String(e?.message || e));
        }
      }
    })();
    return () => {
      cancelled = true;
      deviceRef.current?.destroy();
      deviceRef.current = null;
    };
  }, [wireCall]);

  const placeCall = useCallback(
    async (phone) => {
      const device = deviceRef.current;
      if (!device || callRef.current) return;
      setError("");
      setMuted(false);
      setCall({ phone, direction: "outbound" });
      setStatus("connecting");
      try {
        const c = await device.connect({ params: { To: phone } });
        callRef.current = c;
        c.on("ringing", () => setStatus("ringing"));
        wireCall(c);
      } catch (e) {
        setError(String(e?.message || e));
        reset();
      }
    },
    [wireCall, reset],
  );

  const hangup = useCallback(() => {
    callRef.current?.disconnect();
    reset();
  }, [reset]);

  const accept = useCallback(() => callRef.current?.accept(), []);
  const decline = useCallback(() => {
    callRef.current?.reject();
    reset();
  }, [reset]);

  const toggleMute = useCallback(() => {
    const c = callRef.current;
    if (!c) return;
    const next = !muted;
    c.mute(next);
    setMuted(next);
  }, [muted]);

  const value = {
    configured: configured === true,
    status,
    call,
    muted,
    error,
    startedAt,
    placeCall,
    hangup,
    accept,
    decline,
    toggleMute,
    clearError: () => setError(""),
  };

  return (
    <DiallerContext.Provider value={value}>
      {children}
      <CallBar />
    </DiallerContext.Provider>
  );
}

/* ── Floating call bar ─────────────────────────────────────────────────── */

function CallBar() {
  const d = useDialler();
  if (!d) return null;
  const { status, call, muted, error, startedAt } = d;
  if (status === "idle" && !error) return null;

  return (
    <div className="dialler-bar" role="status">
      {error ? (
        <>
          <span className="dialler-bar__label dialler-bar__label--error">{error}</span>
          <button type="button" className="crm-btn crm-btn--ghost" onClick={d.clearError}>
            Dismiss
          </button>
        </>
      ) : null}

      {status === "incoming" ? (
        <>
          <span className="dialler-bar__pulse" aria-hidden />
          <span className="dialler-bar__label">Incoming call · {call?.phone}</span>
          <button type="button" className="crm-btn crm-btn--call" onClick={d.accept}>
            Accept
          </button>
          <button type="button" className="crm-btn crm-btn--danger" onClick={d.decline}>
            Decline
          </button>
        </>
      ) : null}

      {status === "connecting" || status === "ringing" ? (
        <>
          <span className="dialler-bar__pulse" aria-hidden />
          <span className="dialler-bar__label">
            {status === "connecting" ? "Connecting" : "Ringing"} · {call?.phone}
          </span>
          <button type="button" className="crm-btn crm-btn--danger" onClick={d.hangup}>
            Hang up
          </button>
        </>
      ) : null}

      {status === "open" ? (
        <>
          <span className="dialler-bar__live" aria-hidden />
          <span className="dialler-bar__label">
            {call?.direction === "inbound" ? "Inbound" : "On call"} · {call?.phone} · <Timer since={startedAt} />
          </span>
          <button type="button" className="crm-btn crm-btn--ghost" onClick={d.toggleMute}>
            {muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className="crm-btn crm-btn--danger" onClick={d.hangup}>
            Hang up
          </button>
        </>
      ) : null}
    </div>
  );
}

function Timer({ since }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!since) return "00:00";
  const s = Math.floor((Date.now() - since) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
