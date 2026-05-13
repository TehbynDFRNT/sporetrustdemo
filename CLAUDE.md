# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing + booking site for **Sporetrust** (independent mould & moisture diagnostics, Brisbane / SEQ). Single-page Next.js app. The user-facing brand is "Sporetrust"; the repo/package and some asset filenames still use the older "sporetrace" name — keep that distinction when editing copy vs. asset paths.

## Commands

```bash
npm run dev      # next dev — local dev server
npm run build    # next build
npm run start    # next start (production)
```

No linter, no test runner, no typechecker are wired up. There is nothing to run for "tests".

## Stack

- **Next.js 16** (App Router) + **React 19** + plain JavaScript (`.jsx` / `.js`, no TypeScript).
- Server runtime for API routes pinned to `nodejs` (see `export const runtime = "nodejs"`).
- Styling is hand-written CSS in `app/globals.css` (~2800 lines) — no Tailwind, no CSS modules, no styled-components. Tokens are CSS variables at the top of that file.
- Fonts loaded via `next/font/google` (Geist, JetBrains Mono, Montserrat) in `app/layout.jsx`.

## Architecture

### Single-page composition
`app/page.jsx` is the entire marketing page — a long server component that defines all section data (audience panels, contamination signs, methods, pricing tiers, FAQs, etc.) as local consts and renders them inline. New sections/copy generally mean editing data arrays in this one file rather than splitting into components. The copy-source-of-truth map is `copywriting-map.md`.

### Booking flow (Cal.com integration)
The booking funnel spans several pieces that talk to each other via **custom DOM events**, not props:

1. `HeroAvailabilityForm` (or any `<a href="#book">` / `[data-booking-trigger]`) dispatches `sporetrust:open-booking` with the suburb location.
2. `BookingTakeover` (mounted once in `page.jsx`) listens for that event + intercepts all `#book` clicks, opens a modal containing `BookingForm`.
3. `BookingForm` is a 4-step wizard (Suburb → Day → Time → Details). It calls:
   - `GET /api/cal/slots?days=21` → `app/api/cal/slots/route.js` → Cal.com `/slots` (api version `2024-09-04`)
   - `POST /api/cal/bookings` → `app/api/cal/bookings/route.js` → Cal.com `/bookings` (api version `2026-02-25`)
4. Selected suburb is persisted in `sessionStorage` under key `sporetrust_location` so it survives the modal reopen.

Shared Cal helpers (auth, fetch wrapper, constants) live in `lib/cal.js`. Time zone is hardcoded to `Australia/Brisbane`; appointment length to 90 minutes.

### Suburb autocomplete
`components/PostcodeAutocomplete.jsx` lazy-loads the Google Maps JS SDK via `components/googlePlaces.js` (singleton promise, script injected on first focus). Restricted to AU regions. It emits a normalised `{ label, postcode, placeId, lat, lng }` object via `onLocation`.

### Mould-growth visual effect
`public/mould-contamination.js` is a **vanilla, dependency-free canvas overlay** that auto-attaches to any element with `data-mould="true"` and reads `data-mould-*` attributes to configure mode/source/intensity/growth/etc. It's loaded once via `<Script src="/mould-contamination.js?v=37" strategy="afterInteractive" />` at the bottom of `page.jsx`. The helper `mouldAttrs({...})` in `page.jsx` is what produces those data attributes.

> ⚠️ A second copy of `mould-contamination.js` exists at the repo root. **The served version is `public/mould-contamination.js`** (Next.js serves `public/*` at `/`). The root copy is not referenced anywhere — treat the public one as the source of truth and ignore (or keep in sync if intentionally editing) the root copy.

### Static HTML artifacts (not part of the app)
Several top-level `.html` files (`preview.html`, `board-*.html`, `sporetrust-financials-clean.html`) and the root `styles.css` are standalone prototypes/board decks, not served by the Next.js app. The only HTML in `public/` that the live page links to is `/financial-napkin-math.html`.

## Environment variables

Required for the booking flow to work against live Cal.com:
- `CAL_API_KEY` — server-side Cal.com API key
- `CAL_EVENT_TYPE_ID` — numeric Cal.com event type ID

Optional:
- `CAL_TEST_SLOTS=1` or `CAL_TEST_MODE=1` — return synthetic slot data and short-circuit booking POSTs without hitting Cal.com (useful when iterating UI without burning real bookings). Test mode is automatic fallback if Cal returns zero live slots.

Client-side:
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps JS API key used by Places Autocomplete. Without it, the suburb input still works as a plain text field (postcode extracted via regex), but no autocomplete suggestions.

`.env*` files are gitignored (no `.env.example` checked in).

## Conventions

- React components are `.jsx`. Client components must start with `"use client";`. Server components are the default.
- Section data (cards, lists, FAQs) lives as local `const` arrays inside `page.jsx`. Edits to marketing copy = edits to that file. Cross-check `copywriting-map.md` if you're adjusting tone/structure.
- Brand styling: tokens are CSS variables in `app/globals.css` under `:root`. See "Section background convention" below for the load-bearing colour rules.
- Australian English in copy ("mould", not "mold"; suburbs not zipcodes).

## Section background convention (load-bearing)

Three tiers, applied consistently across the site. The background colour communicates the section's intent before any copy is read — pick the tier that matches the section's purpose, don't reach for a one-off colour.

- **Cream (`--bone` / `--paper`)** = problem awareness, education, framing.
  Surfaces: `.problem-bg`, `.stat-section`, `.signs-section`, `.diy-section`, `.sources-section`, `.comparison-section`, default `.faq`.

- **White (`--white`)** = solution education, service communication, methodology.
  Surfaces: `.solution`, `.route-page-banner`, `.faq--white` modifier.

- **Dark ink (`--ink`)** = direct CTA, product surfaces, "intent to proceed" moments where the goal is action.
  Surfaces: hero (`.hero` / `.hero--cinematic`), `.sentinel-card` (and its image variant `.sentinel-card--has-image`), `.trust-bar`, mega-nav callouts (`.mega-link--callout`), the dark zone inside DIY cards (`.method--text .m-reveals`).

When adding a new section, reuse one of the existing classes (or add a modifier on it) rather than introducing a new background. The mould-effect canvas attaches to `.problem-bg` cream sections by intent — keep it that way.
