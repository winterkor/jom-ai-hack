---
task: mqtt-backend-integration
status: in-progress
phase: 3-of-3 (Phase 2 scrapped)
last_updated: 2026-05-27
---

# Progress

Source of truth for design: `DESIGN.md` in this directory.

## Phase 1 — Backend-verified data ✅ DONE

Committed in `a23ce7e` — `feat: swap mock racks for real LTA geojson + route-aware nearest`.

**Files changed**
- `webapp/src/data/ltaRacks.geojson` (new, 60 KB, 325 racks, pre-filtered from niclukman's `data.geojson`)
- `webapp/src/data/rackData.js` — added `loadLtaRacks()` + `adaptLtaGeoFeature()`, kept `adaptLtaRack` as legacy fallback
- `webapp/src/data/geo.js` — added `topKNearestAvailable()`
- `webapp/src/App.jsx` — load static geojson on mount; `handleFindNearest` + `handleFindAnother` use OSRM routed distance over top-6 haversine candidates
- `webapp/src/components/ParkingConfirmCard.jsx` — code label handles both `lta-` and `TPN-` id prefixes

**Deviations from DESIGN.md**
- Pre-filtered geojson at write time (not runtime). Bbox widened to `lat 1.335–1.365 / lng 103.935–103.970` to include Upper Changi/SUTD (recording venue). `HDB_RACKS` excluded. 325 racks, not the design's "~50–150".
- Find Nearest now uses **routed cycling distance**, not straight-line. User flagged this during Phase 1 review.

## Phase 2 — Geofencing ❌ SCRAPPED (2026-05-27)

Built and reverted in the same session. Files were created (`ZoneLayer.jsx`, `pointInZone` in `geo.js`, badge in `ParkingConfirmCard`, zones wired through `App`/`MapView`) and then removed before commit.

**Why dropped**
- `zones.geojson` only has 4 hand-drawn polygons around central Tampines, but the live LTA dataset is 325 racks across the wider bbox. 321 racks would all flag "outside sanctioned parking" — false negatives that mislead the user.
- Drawing 325 polygons by hand for a hackathon is silly; LTA doesn't ship zone polygons.
- The MQTT lock event (Phase 3) is a *stronger* proof of correct parking: the ESP32 is physically bolted to one sanctioned rack, so a `locked` message ≡ bike is at a real rack.
- CV (computer vision) becomes the future enforcement layer in the pitch deck, not a demo deliverable.

**What remains**
- `webapp/src/data/zones.geojson` still on disk (untouched, may resurface later).
- No code references it anywhere.

## Phase 3 — MQTT real-time NFC (NEXT — now the demo headline)

**Decisions locked during Phase 1 review**
- HiveMQ creds → `.env.local` via `import.meta.env.VITE_*`. Never commit. Ship `.env.example` with placeholders.
- ESP32 → rack mapping = **dynamic** binding. The rack the user taps "Confirm Parked" on becomes the device rack for that session. Stored in `localStorage` as `mySession.rackId`. No static `ESP32_RACK_ID` constant.

**Files to touch**
- `webapp/package.json` — `npm i mqtt`
- `webapp/src/services/mqttClient.js` (new)
- `webapp/src/components/LockSessionCard.jsx` (new)
- `webapp/src/App.jsx` — MQTT subscribe on mount, session state, optional publish for Remote Unlock

## Open follow-ups (not blocking)

- Marker label currently shows last-2-digits of rack id (legacy from `TPN-01`..`TPN-10`). Meaningless with 325 ids. Consider showing rack `name` or just the availability chip. Address after Phase 3 if time permits.

## Dev server

Started in background during Phase 1 (`webapp && npm run dev`, bash id `b6czhyw55`). May still be running; restart if needed. Vite serves on `localhost:5173`.
