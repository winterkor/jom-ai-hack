---
slug: nav-ui-gmaps
created: 2026-05-22
updated: 2026-05-22
description: Google-Maps-style navigation UI on top of existing OSRM polyline — preview card, turn banner, exit bar
relates_to: .planning/quick/260522-navigation/SUMMARY.md (extends OSRM polyline wiring)
follow_up: peek-card UX swap (deferred), satellite tile toggle (deferred), route alternatives (deferred)
---

## Goal

Make the rider app's navigation **look like Google Maps** for the hackathon
demo. Existing `getCyclingRoute()` already returns the OSRM polyline plus a
`steps[]` array with maneuver instructions — we just dress that data up.

Three UI pieces, gated by a `navState` machine in App.jsx:

```
navState:  idle ──► preview ──► active ──► idle
```

- `idle`: normal map + SidePanel (current behavior)
- `preview`: route polyline drawn, **NavPreviewCard** replaces SidePanel
  bottom, shows "Bicycle · {duration} · Arrive {HH:MM} · {distance}" + big
  green **Start** button.
- `active`: **NavBanner** sticky top (green, turn glyph + street name + Then-hint),
  **NavExitBar** sticky bottom (compact ETA/distance/arrival + red **Exit**).

For the demo we display the FIRST step only — no live geolocation
advancement. The visual mimic is what matters; step-advance is post-hackathon.

## Files

- **NEW** `webapp/src/components/NavPreviewCard.jsx` + `.css`
  - Props: `route` (the full OSRM response), `onStart`, `onCancel`.
  - Layout: cream card pinned to bottom (same band as current SidePanel
    peek). Left: big duration numeral. Right: distance + arrival time +
    "Mostly bike paths" hint (static line — we don't actually compute it).
  - Bottom row: **START** button (green, full-width) and a small ✕ cancel.

- **NEW** `webapp/src/components/NavBanner.jsx` + `.css`
  - Props: `step` (current maneuver from `route.steps[0]`), `nextStep` (route.steps[1]).
  - Layout: green pill spanning top of screen below header (z-index above
    SearchBar — actually hides SearchBar while active). Left: big
    directional glyph derived from `step.modifier`. Right: street name from
    `step.name` (falls back to "Continue"). Below: "Then {nextGlyph}" hint
    in faded green.

- **NEW** `webapp/src/components/NavExitBar.jsx` + `.css`
  - Props: `route`, `onExit`.
  - Layout: cream card pinned bottom. Left: "{duration} min" + "{distance} ·
    {arrivalTime}". Right: red round **Exit** button.

- **NEW** `webapp/src/components/nav-icons.js` (small util)
  - Maps OSRM `modifier` strings (`left`, `slight right`, `straight`,
    `uturn`, `arrive`, `depart`, etc.) to Unicode glyphs (▲, ↱, ↰, ⟲, ●, ▶).
  - Single source for glyphs so banner + preview can reuse.

- **MOD** `webapp/src/App.jsx`
  - Replace `routeCoords` state with `navRoute` (the full OSRM response) and
    `navState` ('idle' | 'preview' | 'active').
  - `handleStartNavigation` now sets `navState='preview'` and stores the
    route (instead of jumping to active immediately).
  - `handleStartActive` flips to `'active'`, fits bounds.
  - `handleExitNav` clears everything → `'idle'`.
  - Conditional renders: NavBanner shown when `navState==='active'`,
    SidePanel hidden when `navState!=='idle'`, NavPreviewCard shown when
    `'preview'`, NavExitBar shown when `'active'`, SearchBar/Legend/FAB
    hidden when `navState!=='idle'` (Google Maps hides chrome in nav).
  - Pass `routeCoords = navRoute?.coords` to MapView (compat with existing
    RouteLayer prop).

- **MOD** `webapp/src/components/SidePanel.jsx`
  - START NAVIGATION button label flips to "PREVIEW ROUTE" + sub-tag
    "TAP TO PREVIEW" / "WILL LOCATE FIRST". Behavior unchanged (still calls
    `onStartNavigation`).

- **MOD** `webapp/src/data/geo.js` (only if missing) — confirm
  `formatDistance` already handles km vs m; we'll reuse it.

## Visual language

- Nav green: `var(--status-available)` `#0E8A4F` (already in tokens — matches
  Google Maps' deep nav green almost exactly).
- Card surface: `var(--card)` `#FBF7EC` (cream — matches existing SidePanel).
- Numerals: `var(--font-numeric)` (Big Shoulders Display — already used).
- Glyphs: Unicode arrows (no extra icon font needed).

## Out of scope (deferred)

- Live step-advancement via geolocation.
- Route alternatives (Fastest / Fewer turns).
- Satellite tile toggle.
- Rotating user arrow.
- Voice prompts.

## Verification

1. `npm run build` from `webapp/` succeeds, no warnings beyond existing.
2. Browser walkthrough: tap a rack → SidePanel shows "PREVIEW ROUTE" button
   (or "WILL LOCATE FIRST" hint pre-location).
3. Tap PREVIEW ROUTE → polyline draws + bottom switches to NavPreviewCard
   (SidePanel hidden, SearchBar/FAB still visible). Card shows duration,
   distance, arrival, START button.
4. Tap ✕ on preview → returns to idle (route clears, SidePanel back).
5. Tap START on preview → top SearchBar hidden, green NavBanner replaces
   it with "↑ Continue on {street}" + "Then {glyph}". Bottom switches to
   NavExitBar. FAB/Legend hidden.
6. Tap Exit on bar → everything clears, returns to idle.
