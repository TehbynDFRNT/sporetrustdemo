import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "../../../lib/meta-capi";

// CAPI mirror endpoint. The browser fires the Pixel event AND posts here with
// the same event_id; this route hashes the PII, adds the client IP + UA, and
// forwards to the Graph API. Meta dedupes browser + server by shared event_id.
// Always returns a response without throwing on Graph errors so the browser
// mirror is fire-and-forget. Ported from MFPProposalViewer.

export const runtime = "nodejs"; // node:crypto hashing in lib/meta-capi

function getClientIpAddress(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.eventName || !body.eventId) {
      return NextResponse.json({ error: "eventName and eventId are required" }, { status: 400 });
    }

    await sendMetaCapiEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl:
        body.eventSourceUrl || request.headers.get("referer") || request.nextUrl.origin,
      user: {
        ...(body.user || {}),
        clientIpAddress: getClientIpAddress(request),
        clientUserAgent: request.headers.get("user-agent") ?? undefined,
      },
      customData: body.customData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Meta CAPI] Mirror route error", error?.message || error);
    // Defensive: never make the browser mirror throw / block UX.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
