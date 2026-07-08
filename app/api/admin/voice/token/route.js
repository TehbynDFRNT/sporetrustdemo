import { NextResponse } from "next/server";
import { createVoiceAccessToken, isVoiceConfigured, VOICE_IDENTITY } from "../../../../../lib/twilioVoice";

export const runtime = "nodejs";

// Access token for the browser dialler. The client refreshes via the SDK's
// tokenWillExpire event, so a short TTL is fine.
export async function GET() {
  if (!isVoiceConfigured()) {
    return NextResponse.json({ configured: false, error: "Twilio Voice is not configured" }, { status: 503 });
  }
  return NextResponse.json({
    configured: true,
    identity: VOICE_IDENTITY,
    token: createVoiceAccessToken({ ttlSeconds: 3600 }),
  });
}
