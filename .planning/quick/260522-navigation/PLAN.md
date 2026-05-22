---
slug: navigation
created: 2026-05-22
updated: 2026-05-22
description: Cycling navigation polyline — draw an OSRM road-following route from user → selected rack, with straight-line fallback
relates_to: .planning/notes/geofencing-direction.md (demo beat 2)
follow_up: peek-card UX swap (next session)
---

## Scope (post-revert, slimmed)

After reverting zones + demo-GPS + NavBanner work, the rider app keeps a single
piece of nav: tap **START NAVIGATION** on a rack's side panel and a curvy
cycling polyline draws from the user's current location to the rack. Public
OSRM bike profile at `routing.openstreetmap.de/routed-bike` covers Singapore
with no API key. If the network call fails, we fall back to a straight line so
the demo always shows *something*.

No turn banner. No step tracking. No demo route-walker. Those are deferred —
this commit is *just* the polyline + button wiring.

## Files

- **KEEP** `webapp/src/services/routing.js`
  - `getCyclingRoute(from, to)` → `{ coords: [[lat,lng],...], distanceM, durationS, steps }`.
  - Fail-soft: returns `null` on network / no-route so the caller falls back.

- **KEEP** `webapp/src/components/RouteLayer.jsx`
  - Takes `coords: [[lat,lng],...]`. Renders halo (cream) + dark navy line.
  - Mounts a `L.layerGroup` of the two polylines into the map; cleans up on unmount.

- **MOD** `webapp/src/components/MapView.jsx`
  - Accept new `routeCoords` prop and render `<RouteLayer coords={routeCoords} />`
    above the destination marker.

- **MOD** `webapp/src/App.jsx`
  - Import `getCyclingRoute`.
  - New `routeCoords` state (null when no nav active).
  - `closePanel` clears `routeCoords`.
  - `handleStartNavigation` becomes async: ensures we have a user position
    (locating if needed), fetches OSRM, sets `routeCoords` (or straight-line
    fallback), and flies the map to fit the route bounds.
  - Passes `routeCoords` into `<MapView />`.

- **MOD** `webapp/src/components/SidePanel.jsx`
  - Remove hardcoded `disabled` from the START NAVIGATION button.
  - Swap the "ROUTING · SHIP 2B" tag for "TAP TO ROUTE" / "WILL LOCATE FIRST"
    depending on whether `userPos` is set.

## Out of scope (deferred)

- Turn-by-turn banner.
- Step tracking / live arrival detection.
- Demo route walker.
- Zone overlays / no-park polygons.
- Peek-card UX redesign (next session).

## Verification

1. `npm run build` from `webapp/` succeeds.
2. Rider mode → tap any rack → side panel shows START NAVIGATION enabled
   (or "WILL LOCATE FIRST" hint when no userPos yet).
3. Tap START NAVIGATION → cycling polyline appears following streets, map
   re-frames to the route extent.
4. Close panel → polyline clears.
