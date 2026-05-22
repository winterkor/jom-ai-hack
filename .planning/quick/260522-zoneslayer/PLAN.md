---
slug: zoneslayer
created: 2026-05-22
description: Render zones polygons on the rider map with occupancy fill + no-park red stripe
relates_to: .planning/notes/geofencing-direction.md (feature lock #1, demo beats 2)
follow_up: tasks #4-#7 (pill, demo GPS, arrival sheet, validate)
---

## Goal

Render the loaded zones on top of the Leaflet basemap, below all markers, with
styling that reads from across the room. Surface the loaded features back up to
`App` so future tasks (#4 inside-zone detection, #6 arrival sheet) can consume
them without re-fetching.

## Files

- **NEW** `webapp/src/components/ZonesLayer.jsx`
  - Child of `<MapContainer>`. Uses `useMap()`.
  - Calls `loadZones()` once on mount → `L.geoJSON(fc, { style, interactive:false })`.
  - `style` keys off `properties.kind` + `properties.occupancyState`:
    - park/available → green fill, dark-green stroke
    - park/filling → amber fill, dark-amber stroke
    - park/full → red fill, dark-red stroke
    - no-park → diagonal red stripe pattern + dashed red border
  - Injects an SVG `<pattern id="noParkPattern">` into the Leaflet overlay-pane
    `<defs>` and assigns `fill="url(#noParkPattern)"` to no-park paths after layer mounts.
  - `onZonesLoaded(features, source)` callback fires once when features are ready.
    Captured via ref so changing the prop doesn't re-fetch / re-mount.
  - Cleanup removes the layer on unmount.

- **MOD** `webapp/src/components/MapView.jsx`
  - Import `ZonesLayer`.
  - Add `<ZonesLayer onZonesLoaded={onZonesLoaded} />` between `<TileLayer>` and `<RackLayer>` (zones render above tiles, below markers).
  - Accept and forward `onZonesLoaded` prop.

- **MOD** `webapp/src/App.jsx`
  - Add `const [zonesFeatures, setZonesFeatures] = useState([])` state.
  - Pass `onZonesLoaded={(features) => setZonesFeatures(features)}` to `<MapView />`.
  - State is currently unused — task #4 will read it for inside-zone detection.

## Out of scope

- Click handlers on zones (interactive:false — markers stay clickable).
- Zoom-aware hide/show.
- Pulsing outline for active zone (lands in task #4 alongside the pill).
- Loading skeleton (zones appear when ready; basemap is already up).

## Verification

1. `npm run dev` in `webapp/`.
2. Open `http://localhost:5173`, pick the rider role.
3. Pan/zoom around Tampines Hub area (~1.354, 103.943, zoom 16-17).
4. Confirm 3 green/amber/green park polygons visible (Hub, Mall, St 81) and
   1 red-striped no-park polygon (MRT Exit A).
5. Confirm markers still clickable through the zone fills.
6. No console errors.
