"use client";

import { useEffect, useRef } from "react";

// Pair a modal's open state with a browser-history entry so pressing the
// browser back button closes the modal instead of navigating away from the
// page the user opened it on.
//
//   - When isOpen becomes true: push a silent history entry (no URL change,
//     just a state marker) and listen for popstate.
//   - Browser back → popstate fires → close() runs → modal closes, user
//     stays on the same page.
//   - UI close (X button, Escape, etc.) → close() runs separately → the
//     effect cleanup pops the history entry we pushed so the URL/state stays
//     in sync.
//
// Use:
//   const [open, setOpen] = useState(false);
//   useModalHistory(open, () => setOpen(false));
export function useModalHistory(isOpen, close) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    let poppedByBack = false;
    window.history.pushState({ sporetrustModalOpen: true }, "");

    function onPopState() {
      poppedByBack = true;
      closeRef.current();
    }
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (!poppedByBack) {
        // Modal closed via the UI rather than the back button — pop the
        // entry we pushed so the history stack stays consistent.
        window.history.back();
      }
    };
  }, [isOpen]);
}
