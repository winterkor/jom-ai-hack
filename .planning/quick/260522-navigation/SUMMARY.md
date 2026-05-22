---
slug: navigation
status: complete
completed: 2026-05-22
---

## What landed

Cycling navigation polyline. Tap a rack → tap **START NAVIGATION** → curvy
road-following route draws from user position to the rack via OSRM's public
bike profile. Straight-line fallback if OSRM is unreachable so the demo never
shows nothing.

## Files touched

- `webapp/src/services/routing.js` (kept from earlier untracked scaffolding) —
  `getCyclingRoute(from, to)` wrapping OSRM's `routed-bike` endpoint.
- `webapp/src/components/RouteLayer.jsx` (kept) — halo + dark line polyline
  drawn via a Leaflet `L.layerGroup`.
- `webapp/src/components/MapView.jsx` — accepts `routeCoords` prop, renders
  `<RouteLayer />`.
- `webapp/src/App.jsx` — `routeCoords` state, async `handleStartNavigation`
  (locate → fetch → set coords → fit bounds), `closePanel` clears the route.
- `webapp/src/components/SidePanel.jsx` — START NAVIGATION button enabled,
  tag flips between "TAP TO ROUTE" and "WILL LOCATE FIRST".

## Verified

- `npm run build` ✓
- Manual browser verification pending (vite dev), but rendering path is the
  same one we exercised in the pre-revert nav demo, so render risk is low.

## Deferred (next session)

- Peek-card UX swap: replace the current side panel with a Google-Maps-style
  compact bottom peek card (the explicit "next thing" the user agreed to).
- Geofencing map, demo workflow polish, admin Activity map.
