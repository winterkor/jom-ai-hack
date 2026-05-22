---
slug: zoneslayer
status: complete
completed: 2026-05-22
---

## What shipped

- `webapp/src/components/ZonesLayer.jsx` — Leaflet `L.geoJSON` layer rendered as
  a child of `MapContainer`. Loads features via `loadZones()` once on mount,
  styles by `properties.kind` + `properties.occupancyState`, and injects an
  SVG `<pattern id="noParkPattern">` into the overlay-pane defs to give the
  no-park polygon a red diagonal stripe.
- `MapView.jsx` — accepts and forwards an `onZonesLoaded(features, source)` prop;
  `<ZonesLayer />` sits between `<TileLayer>` and `<RackLayer>` so zones render
  above the basemap and below all markers.
- `App.jsx` — `zonesFeatures` state holds the loaded FeatureCollection for the
  upcoming inside-zone detection in task #4.

## Verification

User confirmed via browser screenshot: green Hub + St 81 fills, amber Mall fill
(matches `occupancyState: filling` fixture), red-striped no-park polygon at
Tampines MRT Exit A. Markers remain clickable through zone fills.

## Notes for follow-up

- Zone interiors are non-clickable on purpose (`interactive: false`) so rack
  markers under zones stay tap-able. If we later want to show "Hub Bike Park"
  details by tapping the polygon itself, flip `interactive` and add `onclick`.
- `setZonesFeatures` in App is the hand-off point for task #4 — that task will
  read `zonesFeatures` + `userPos`, run `findContainingZone`, and drive the pill.
