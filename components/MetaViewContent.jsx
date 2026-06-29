"use client";

import { useEffect } from "react";
import { buildMetaUserData, getMetaBrowserIdentifiers, getMetaJourneyCache } from "../lib/meta-funnel";
import * as pixel from "../lib/meta-pixel";

/* Fires a deduplicated ViewContent (browser Pixel + CAPI) once on mount for a
   key content/landing page. Drop into a page with a stable contentName so the
   event id is idempotent across refreshes within the session. */

export default function MetaViewContent({ contentName, contentCategory = "mould_inspection" }) {
  useEffect(() => {
    const slug = (contentName || window.location.pathname).replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const eventId = `view_content_${slug}`;
    const browserIds = getMetaBrowserIdentifiers(new URLSearchParams(window.location.search));
    const journey = getMetaJourneyCache();
    pixel.viewContent({ contentName, contentCategory, eventId });
    void pixel.mirrorServerEvent({
      eventName: "ViewContent",
      eventId,
      user: buildMetaUserData({
        identity: journey?.identity,
        browserIds,
        externalId: journey?.identity?.externalId || journey?.sessionId,
      }),
      customData: { content_name: contentName, content_category: contentCategory },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
