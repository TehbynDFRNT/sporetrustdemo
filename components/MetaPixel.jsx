"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { buildMetaUserData, getMetaBrowserIdentifiers, getMetaJourneyCache } from "../lib/meta-funnel";
import * as pixel from "../lib/meta-pixel";

/* Fires PageView on every (non-suppressed) route, plus a deduplicated
   ViewContent on the curated "pages we care about", plus Contact on
   tel:/mailto clicks. Ported from MFPProposalViewer; SporeTrust-specific
   page curation. */

// Pages that fire ViewContent (intent step up from a raw PageView) → label.
const VIEW_CONTENT_PAGES = {
  "/renting-mould-assessment": "Renting mould assessment",
  "/sporetrust-sentinel": "Sporetrust Sentinel (subscription)",
  "/suspected-mould": "Suspected mould",
  "/visible-mould": "Visible mould",
  "/mould-prevention": "Mould prevention",
  "/how-it-works": "How it works",
  "/quiz": "Mould self-check quiz",
};

// No pixel at all on internal admin + customer report pages.
const isPixelSuppressed = (p) =>
  p.indexOf("/admin") === 0 || p.indexOf("/r/") === 0 || p.indexOf("/r2/") === 0;

export default function MetaPixel() {
  const pathname = usePathname();
  const hasHandledInitialPageView = useRef(false);

  useEffect(() => {
    if (isPixelSuppressed(pathname)) return; // admin / report pages: no tracking

    pixel.flushPendingPixelEvents();
    const browserIds =
      typeof window !== "undefined"
        ? getMetaBrowserIdentifiers(new URLSearchParams(window.location.search))
        : getMetaBrowserIdentifiers();
    const journey = getMetaJourneyCache();
    const user = buildMetaUserData({
      identity: journey?.identity,
      browserIds,
      externalId: journey?.identity?.externalId || journey?.sessionId,
    });

    // --- PageView (every non-suppressed page) ---
    if (!hasHandledInitialPageView.current) {
      hasHandledInitialPageView.current = true;
      const initialId = pixel.getInitialPageViewEventId();
      if (initialId) {
        void pixel.mirrorServerEvent({ eventName: "PageView", eventId: initialId, user });
      } else {
        const eid = pixel.generateEventId("page_view");
        pixel.pageview({ eventId: eid });
        void pixel.mirrorServerEvent({ eventName: "PageView", eventId: eid, user });
      }
    } else {
      const eid = pixel.generateEventId("page_view");
      pixel.pageview({ eventId: eid });
      void pixel.mirrorServerEvent({ eventName: "PageView", eventId: eid, user });
    }

    // --- ViewContent (curated intent pages only) ---
    const contentName = VIEW_CONTENT_PAGES[pathname];
    if (contentName) {
      // Per-fire unique id (like PageView) so browser+CAPI dedup to one event
      // per view, but every visitor/view is still counted. A static per-page id
      // would make Meta collapse all visitors' ViewContents into one (48h dedup).
      const eventId = pixel.generateEventId("view_content");
      pixel.viewContent({ contentName, contentCategory: "mould_inspection", eventId });
      void pixel.mirrorServerEvent({
        eventName: "ViewContent",
        eventId,
        user,
        customData: { content_name: contentName, content_category: "mould_inspection" },
      });
    }
  }, [pathname]);

  // Contact: deduplicated Meta Contact on tel:/mailto clicks (once per session
  // per channel). Skipped on suppressed pages.
  useEffect(() => {
    function onClick(e) {
      if (isPixelSuppressed(window.location.pathname)) return;
      const anchor = e.target?.closest?.('a[href^="tel:"], a[href^="mailto:"]');
      if (!anchor) return;
      const channel = anchor.getAttribute("href").startsWith("tel:") ? "phone" : "email";
      const journey = getMetaJourneyCache();
      const eventId = `contact_${channel}_${journey?.sessionId || "anon"}`;
      const browserIds = getMetaBrowserIdentifiers(new URLSearchParams(window.location.search));
      pixel.contact({
        contentName: `Contact via ${channel}`,
        customData: { contact_channel: channel },
        eventId,
        once: true,
      });
      void pixel.mirrorServerEvent({
        eventName: "Contact",
        eventId,
        user: buildMetaUserData({
          identity: journey?.identity,
          browserIds,
          externalId: journey?.identity?.externalId || journey?.sessionId,
        }),
        customData: { contact_channel: channel },
      });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
