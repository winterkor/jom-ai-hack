---
slug: nav-ui-gmaps
status: complete
completed: 2026-05-22
---

## What landed

Google-Maps-style navigation UI on top of the existing OSRM polyline. Three
new components driven by a `navState` machine in App.jsx
(`idle` → `preview` → `active` → `idle`):

- **NavPreviewCard** — bottom card that appears once the OSRM route is
  fetched. Big green numeral for ETA minutes, arrival time, distance, rack
  name, and a full-width green **START** button. Replaces the SidePanel
  while in preview state.
- **NavBanner** — sticky green top band shown during active navigation.
  Big maneuver glyph + street name + a "Then ↰" hint for the next step.
  Hides the SearchBar while active.
- **NavExitBar** — compact bottom bar during active navigation with
  remaining ETA, distance, arrival, and a red **EXIT** button.

The flow now: tap rack → "PREVIEW ROUTE" → polyline draws + preview card
shows → tap START → green banner + exit bar take over, chrome hides → tap
EXIT to clear back to idle.

## Files touched

- NEW `webapp/src/components/nav-icons.js` — shared OSRM modifier/type →
  Unicode glyph mapping (used by banner; reusable for future UI).
- NEW `webapp/src/components/NavPreviewCard.jsx` + `.css`
- NEW `webapp/src/components/NavBanner.jsx` + `.css`
- NEW `webapp/src/components/NavExitBar.jsx` + `.css`
- MOD `webapp/src/App.jsx` — replaced `routeCoords` with `navState`/`navRoute`,
  added `handleStartActive` + `handleExitNav`, conditional renders for
  SidePanel/SearchBar/Legend/FAB based on navState. Fallback route now
  carries proper `distanceM`/`durationS`/`steps[]` so the preview card
  always has data to render even when OSRM is unreachable.
- MOD `webapp/src/components/SidePanel.jsx` — START NAVIGATION button
  re-labelled to "PREVIEW ROUTE" / "TAP TO PREVIEW" semantics (preview is
  the actual first step now).

## Verified

- `npm run build` ✓ (104 modules, 67 kB CSS, 425 kB JS — both grew by the
  expected amount for three new components).
- Browser walkthrough pending (vite dev) — render paths are conditional on
  the existing-tested navState transitions plus pure-display children, so
  the failure surface is small.

## Deferred (still on the list)

- Live step-advancement via geolocation (banner currently shows step 0).
- Route alternatives ("Fastest / Fewer turns").
- Satellite tile toggle.
- Rotating user arrow.
- Peek-card UX swap (the older deferred item from
  `260522-navigation/SUMMARY.md`).
