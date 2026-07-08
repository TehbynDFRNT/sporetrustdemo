import { NextResponse } from "next/server";

/* Interim admin gate (Next 16 proxy convention) — HTTP Basic auth over /admin pages and /api/admin
   routes, password from ADMIN_PASSWORD (any username). The browser caches
   the credential after one prompt and attaches it to same-origin fetches,
   so the SPA + its API calls work untouched.

   Deliberately NOT covered (each has its own verification):
   /api/webhooks/* (Twilio/Postmark signatures), /api/cron/* (CRON_SECRET),
   /api/voice/outgoing (Twilio signature), /api/lead, /api/cal/*.

   Clerk remains the real fix (see app/admin/layout.jsx TODO). */

export function proxy(request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // Unset = locked, not open. Fail closed so a missing env var on a new
    // deploy never exposes the admin.
    return unauthorized("Admin locked: ADMIN_PASSWORD not configured");
  }

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (supplied === password) return NextResponse.next();
    } catch {
      /* malformed header → 401 */
    }
  }
  return unauthorized("Authentication required");
}

function unauthorized(message) {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Sporetrust admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
