---
slug: admin-incident-navigation
status: complete
created: 2026-05-27
completed: 2026-05-27
commit: b66b609
---

# Summary — Admin navigate-to-incident + realistic photos + varied blurbs

## What shipped

1. **Navigate to incident** — IncidentModal now has a blue `Navigate` button
   (between Dismiss and Mark resolved). Clicking it closes the modal, switches
   the admin tab to Map, calls `map.flyTo` to the rack at zoom 17, and drops a
   red teardrop destination pin (reuses `.myrack-pin--dest` from the rider map).
   A `✕ Clear pin` button (top-right of map) removes the pin and returns the
   map to fit-bounds.
2. **Per-rack photos** — `pickIncidentPhoto(rackId)` deterministically hashes
   the rack id (FNV-1a) to one of 5 CV photos served from `/cv/post_processed{0..4}.jpg`.
   Same rack ⇒ same scene. Abandoned-bike incidents keep their existing
   Day1/Day2 reference comparison since that visual is meaningful.
3. **Varied incident blurbs** — `pickIncidentBlurb(incidentId, type)` picks
   from a per-type phrasing pool (5 illegal_parking, 4 abandoned, 4 overflow).
   IncidentList row sub-text uses the blurb + `timeAgo()`.
4. **Bonus fix** — Incident seeding now also pushes `lta-XXX` rack ids
   alongside `TPN-XX`/`TPN-XXX`, so the live LTA-geojson rack source resolves
   incident → rack names properly. Without this, the rack name fell back to
   the raw id (e.g. "TPN-011") and Navigate stayed hidden.

## Files changed

| File | Change |
|------|--------|
| `webapp/src/data/mockIncidents.js` | + `pickIncidentPhoto`, `pickIncidentBlurb`, hashStr; seed `lta-XXX` ids |
| `webapp/src/components/admin/IncidentList.jsx` | row sub uses `pickIncidentBlurb` |
| `webapp/src/components/admin/IncidentModal.jsx` | + `onNavigate` prop, Navigate button, photo via `pickIncidentPhoto` |
| `webapp/src/components/admin/IncidentModal.css` | + `.imodal__btn--nav` (blue) |
| `webapp/src/components/admin/AdminDashboard.jsx` | + `flyTarget` state, `handleNavigate` |
| `webapp/src/components/admin/AdminMap.jsx` | + `FlyToTarget`, `buildDestIcon`, `FitBounds` suppression |
| `webapp/src/components/admin/AdminMap.css` | + `.admin-map__clear` button |

## Verification (browser)

- Loaded `/#/admin`, 61 incidents render (up from 48 — confirms `lta-` seeding)
- Clicked first navigable incident → modal opens with rack name resolved and
  CV photo visible
- Clicked `Navigate` → tab switches to Map, fly animation runs, red teardrop
  pin lands on rack, `Clear pin` button appears top-right
- Clicked `Clear pin` → pin removed, button disappears
- No console / page errors

## Design choices (per user)

- Fly-to + pin only — no OSRM route line from a depot (stretch, punted)
- Hash by `rack_id` (not incident id) so the same rack always shows the same
  scene across multiple incidents
- Blurb is hashed by `incident.id` so each incident keeps its own phrasing
- Abandoned incidents keep `ABANDONED_CMP` (Day 1 vs Day 2 reference) — the
  comparison visual carries more meaning than a single CV snapshot

## Out of scope / next

- Routing line from a depot (OSRM call) — stretch
- Resolving/closing incidents from inline UI (modal has Mark resolved already)
- Real-time photo from ESP32 camera — none wired
