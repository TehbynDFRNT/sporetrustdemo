"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { buildMetaUserData, getMetaBrowserIdentifiers, getMetaJourneyCache } from "../lib/meta-funnel";
import * as pixel from "../lib/meta-pixel";

/* Fires a PageView on every route change and mirrors it to CAPI. The base
   snippet in layout fired the FIRST PageView (shared id on window); this mounts
   once and mirrors that initial one, then fires + mirrors fresh PageViews on
   each subsequent navigation. Ported from MFPProposalViewer. */

export default function MetaPixel() {
  const pathname = usePathname();
  const hasHandledInitialPageView = useRef(false);

  useEffect(() => {
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

    if (hasHandledInitialPageView.current) {
      const eventId = pixel.generateEventId("page_view");
      pixel.pageview({ eventId });
      void pixel.mirrorServerEvent({ eventName: "PageView", eventId, user });
      return;
    }

    hasHandledInitialPageView.current = true;
    const initialPageViewEventId = pixel.getInitialPageViewEventId();

    if (initialPageViewEventId) {
      void pixel.mirrorServerEvent({ eventName: "PageView", eventId: initialPageViewEventId, user });
      return;
    }

    const fallbackEventId = pixel.generateEventId("page_view");
    pixel.pageview({ eventId: fallbackEventId });
    void pixel.mirrorServerEvent({ eventName: "PageView", eventId: fallbackEventId, user });
  }, [pathname]);

  // Contact: deduplicated Meta Contact on tel:/mailto: clicks, once per
  // session per channel (so repeated taps don't double-count).
  useEffect(() => {
    function onClick(e) {
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
