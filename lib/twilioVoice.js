/* Twilio Voice access tokens — hand-rolled JWT (HS256), keeping the repo's
   no-server-SDK convention. The browser dialler (@twilio/voice-sdk, a client
   SDK — WebRTC can't be hand-rolled) exchanges this token to register as
   Client "operator" and place calls through the TwiML App.

   Env (all from the Twilio console):
     TWILIO_ACCOUNT_SID   — AC…
     TWILIO_API_KEY_SID   — SK… (Account → API keys & tokens → create key)
     TWILIO_API_KEY_SECRET
     TWILIO_TWIML_APP_SID — AP… (Voice → TwiML Apps; request URL =
                            ${PUBLIC_BASE_URL}/api/voice/outgoing) */

import { createHmac } from "node:crypto";

export const VOICE_IDENTITY = "operator"; // single-operator business

export function isVoiceConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_TWIML_APP_SID,
  );
}

const b64url = (input) =>
  Buffer.from(typeof input === "string" ? input : JSON.stringify(input))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// https://www.twilio.com/docs/iam/access-tokens — JWT with a voice grant.
export function createVoiceAccessToken({ ttlSeconds = 3600 } = {}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const appSid = process.env.TWILIO_TWIML_APP_SID;
  if (!accountSid || !apiKeySid || !apiKeySecret || !appSid) {
    throw new Error("Twilio Voice is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    sub: accountSid,
    iat: now,
    exp: now + ttlSeconds,
    grants: {
      identity: VOICE_IDENTITY,
      voice: {
        incoming: { allow: true },
        outgoing: { application_sid: appSid },
      },
    },
  };

  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signature = createHmac("sha256", apiKeySecret)
    .update(signingInput, "utf8")
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${signingInput}.${signature}`;
}
