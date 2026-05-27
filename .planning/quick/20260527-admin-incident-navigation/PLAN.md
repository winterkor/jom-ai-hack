---
slug: admin-incident-navigation
status: planned
created: 2026-05-27
---

# Quick task — Admin: navigate-to-incident + realistic photos + varied notifications

## Why
Maintainer side currently lets you SEE incidents in the list but you can't easily *go* to them, and the demo's photos are visibly duplicated which kills the "real ops" illusion. Three fixes wrapped into one batch.

## Three deliverables

### 1. Navigate to incident location
Tapping an incident in `IncidentList` (or its modal) should:
- Fly the admin map to the incident's rack
- Drop a destination-style pin
- Optionally draw a route line from a "depot" (a fixed maintainer home base, since admins don't have GPS in the prototype)

**Open question for user:**
- Use a fixed Tampines depot point (e.g. Tampines Hub coords) as the maintainer origin? Or skip the route line and just fly-to + drop pin? Routing adds OSRM calls; fly-to is zero cost. **Recommend: fly-to + pin first, route is stretch.**

### 2. Photo de-duplication (real-feeling incident photos)
- Currently incident photos look duplicated (placeholder).
- We have 5 photos in `post_processed/post_processed0-4.jpg`.
- Move them to `webapp/public/incident-photos/` so Vite serves them.
- Add a small helper `pickIncidentPhoto(incidentId)` in `webapp/src/data/mockIncidents.js` that deterministically picks a photo by hashing the incident id → index `0..4`. Same incident always shows the same photo; different incidents distribute across the 5.
- Wire into `IncidentModal` (and any list thumbnail).

**Open question for user:**
- Do you want any *areal matching* (e.g. incidents in north Tampines get photos 0–1, south gets 2–4) or is uniform hashing fine? **Recommend: uniform hash — simpler, still looks varied.**

### 3. More realistic incident notifications / copy
- Vary the text per `INCIDENT_TYPES` and severity so the list doesn't read repetitive.
- Add 2–3 realistic phrasings per type, picked deterministically by incident id.
- Example pool:
  - illegal_parking: "Bike obstructing walkway", "Parked outside marked zone", "Blocking ramp access"
  - abandoned: "Stationary >72h", "No engagement detected since [time]", "Unclaimed bike"
  - overflow: "Rack at 110% capacity", "Spillover detected on adjacent path", "5+ bikes outside designated slots"
- Render in `IncidentList` `panel-row__sub` line.

## Files

| File | Change |
|------|--------|
| `webapp/public/incident-photos/0.jpg` … `4.jpg` (new) | Copy from `post_processed/post_processed{0..4}.jpg` |
| `webapp/src/data/mockIncidents.js` | Add `pickIncidentPhoto(id)` + `pickIncidentBlurb(id, type)` helpers (deterministic hash → index) |
| `webapp/src/components/admin/IncidentList.jsx` | Replace static sub-text with `pickIncidentBlurb(...)` |
| `webapp/src/components/admin/IncidentModal.jsx` | Use `pickIncidentPhoto(...)` for the photo src |
| `webapp/src/components/admin/AdminDashboard.jsx` | On incident select, set a `flyTo` target → pass into `AdminMap` |
| `webapp/src/components/admin/AdminMap.jsx` | Accept `flyTo` prop + `selectedIncidentRack`; flyTo runs the map fly; drop a destination pin (reuse `myrack-pin--dest` red teardrop CSS we already have) |

## Verification
1. Open admin → tap any incident → map flies to that rack with a red teardrop pin
2. Different incidents show different photos (cycle through the 5)
3. Same incident always shows the same photo (deterministic, not random per refresh)
4. Incident sub-text varies, no two adjacent rows read identical
5. Tap a different incident → pin moves, photo updates

## Out of scope (separate task if wanted)
- Routing line from a depot to the incident (OSRM call) — flagged as stretch above
- Real-time photo capture from ESP32 camera (none wired)
- Resolving / closing incidents from the UI

## Resume notes
- Context burned during plan-write was at 72% — fresh session recommended for implementation
- All MQTT + rider-side polish is already shipped (see `20260527-unlock-popup-flow/SUMMARY.md`)
- Pick up with: `gsd-quick resume admin-incident-navigation`
