---
slug: admin-incident-navigation
phase: addendum
status: planned
created: 2026-05-27
---

# Plan addendum — switch to rider-style routed nav + reduce to 5 incidents

User feedback after first ship:
1. Want **exactly 5 incidents**, each tied to a distinct rack + a distinct photo. The hash-based duplication is producing too many similar-looking cards.
2. Replace the simple "fly-to + drop pin" navigate flow with the **same nav UX the rider uses** — OSRM route preview → Start → turn-by-turn banner + exit bar. **No park / lock / unlock controls** (those are rider-only).

## What we'll do

### 1. Trim incidents to 5
- Replace BASE + LTA_ONLY seeding in `webapp/src/data/mockIncidents.js` with **5 explicit incidents** at 5 different LTA racks (e.g. `lta-001`..`lta-005`).
- Each carries its own `imageUrl` (one of `/cv/post_processed{0..4}.jpg`) — drop the hash helper.
- Spread of types/severities (3 illegal_parking, 1 overflow, 1 abandoned-with-cmp).
- Hardcoded `note` per incident — drop `pickIncidentBlurb`.

### 2. Rider-style nav in admin
Mirror the rider nav state machine inside AdminDashboard:
- `navState: 'idle' | 'preview' | 'active'`
- `navRoute` holds the OSRM response (from `services/routing.js → getCyclingRoute`)
- Maintainer origin: `navigator.geolocation` (same prompt as rider), fallback to **Tampines Hub** coords if denied
- Reuse rider components: `NavPreviewCard`, `NavBanner`, `NavExitBar`, `RouteLayer` (mount inside AdminMap)
- Tapping Navigate in the incident modal: closes modal, fetches route from origin → rack, enters preview
- Tapping Start: enters active (banner top, exit bar bottom)
- Tapping Exit or Arrive: returns to idle

### 3. Removed pieces
- Drop the `flyTarget` fly-to + dest-pin flow + `Clear pin` button — replaced by routed nav
- Drop `pickIncidentPhoto` + `pickIncidentBlurb` helpers (no longer needed with explicit seeding)

## Files

| File | Change |
|------|--------|
| `webapp/src/data/mockIncidents.js` | Rewrite seeding to 5 explicit incidents; remove hash helpers |
| `webapp/src/components/admin/IncidentList.jsx` | Row sub uses `inc.note` directly |
| `webapp/src/components/admin/IncidentModal.jsx` | Uses `inc.imageUrl` directly; Navigate button stays |
| `webapp/src/components/admin/AdminDashboard.jsx` | Add `navState`/`navRoute`, origin resolver, route fetch, nav UI mounts |
| `webapp/src/components/admin/AdminMap.jsx` | Accept `routeCoords`, render `RouteLayer`; drop `FlyToTarget`/dest-pin/Clear |
| `webapp/src/components/admin/AdminMap.css` | Drop `.admin-map__clear` rule |

## Verification
1. Admin loads with exactly 5 incidents
2. Each incident shows a different photo + note
3. Tap incident → modal → Navigate → map shows OSRM cycling route from origin to rack + NavPreviewCard at bottom
4. Tap Start → NavBanner top, NavExitBar bottom, route framed tight
5. Tap Exit → returns to admin idle
6. No park / lock / unlock UI ever appears in admin
