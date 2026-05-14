"use client";

import { useEffect } from "react";

// Force a full page reload on every browser back/forward navigation.
//
// Why: Next.js App Router's client-side history handling re-renders the
// previous page from the router cache. In this app that re-render leaves
// JS-driven surfaces in a broken state — MegaNav popovers stop opening,
// document-level click listeners on the takeover components (booking,
// quiz, demo report) miss their re-attach, scroll-driven CSS classes
// don't reapply, etc. Trying to make every interactive component
// survive that path is whack-a-mole.
//
// Forcing a full reload on history nav means every page entry runs the
// same initialisation path (root layout → page mount → effects fire →
// listeners attach) regardless of how the user got there. Trade-off:
// back/forward is slower than SPA, but every interactive surface works.
//
// Covers:
//   - popstate (browser back/forward, programmatic history.back())
//   - pageshow with persisted=true (bfcache restore)
export default function ReloadOnHistoryNav() {
  useEffect(() => {
    function reload() {
      window.location.reload();
    }

    function handlePopState() {
      reload();
    }

    function handlePageShow(event) {
      if (event.persisted) reload();
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
