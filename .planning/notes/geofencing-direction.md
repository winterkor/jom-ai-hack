---
title: Geofencing + nav direction (rider app)
date: 2026-05-22
context: hackathon demo, 5-min slot, integration with niclukman/Lbleeee backend
---

## Decision: polygon-as-source-of-truth

All three rider scenarios (arrival, no-park warning, sensor proximity) collapse into one mechanic: **which polygon are you inside, if any.** ESP32 sensor-proximity dropped from v1 — invisible to the demo audience.

## Backend integration plan (no-asks-required path)

Teammate backend (FastAPI + PostGIS, port 8000):
- `GET /racks/nearby?lat&lng` — rack POINTS only (id, name, lat/lng, distance). No occupancy in response despite the model having it.
- `POST /parking/validate` — server `ST_Contains` polygon hit-test. Returns `{is_whitelisted, message, zone_name}`. THE geofence brain.

**Gaps:** no CORS, no `GET /zones` endpoint to expose polygon shapes, `RackResponse` doesn't surface occupancy.

**Workarounds (all frontend-side):**
1. **CORS** → Vite proxy `/api/* → localhost:8000`.
2. **No /zones** → ship `zones.geojson` in our repo as fallback; if Lbleeee adds `GET /zones` later we swap fetch source.
3. **No occupancy** → keep mock occupancy layer; backend is "what's nearby" not "what's free."

## Demo beats (5-min)

1. Open rider app → Find Nearest FAB → backend returns racks via PostGIS ST_DWithin (live integration moment).
2. Tap route to a rack → polyline draws to nearest polygon edge (not pin center).
3. Demo-mode plays simulated GPS walking the rider into the polygon.
4. On entry → sticky pill "📍 Inside Tampines Hub Bike Park", arrival bottom sheet appears.
5. Tap "Confirm Park" → `POST /parking/validate` → backend says ✓ (climax).
6. Bonus: drop park outside polygon → red toast, mispark incident fires on maintainer dashboard.

## Inside-zone detection strategy

**Pattern B chosen** (client-side turf.js for live tracking, server validates on tap):
- Continuous "inside zone X" pill: client-side `@turf/boolean-point-in-polygon` against loaded zones. Instant, offline-tolerant, no network spam.
- Authoritative check: only `/parking/validate` POST on the Confirm Park tap. Pros: dramatic beat, network only hit when it matters.

Rejected Pattern A (poll /parking/validate every 2sec): hammers API, dies on conference wifi.

## Feature lock for v1

**Must:**
- Render zones with occupancy-fill on map (visible-from-across-the-room).
- "You are here" sticky pill + pulsing polygon outline.
- Demo-mode simulated GPS controller (real geolocation unreliable in venue).
- Arrival sheet + Confirm Park → /parking/validate.
- One mispark polygon (red stripe overlay) for negative-case demo.

**Skip:**
- ESP32 BLE pairing.
- Turn-by-turn nav (straight polyline only).
- Zoom-aware polygon hide/show (nice but skippable).
- Polygon-aware pin centroid placement (polish).

## MQTT (deferred)

Hardware team leaning toward MQTT for ESP32→backend occupancy ingest. Rider app is decoupled — only reads occupancy from whatever the backend exposes. Revisit when hardware protocol locks.

## Open questions for Lbleeee

1. Is `ParkingZone` table actually seeded with polygons, or empty? `/parking/validate` returning `is_whitelisted: false` for everything until rows exist.
2. If seeded → please add `GET /zones` returning FeatureCollection (10 lines, ST_AsGeoJSON).
3. CORS middleware to unblock browser calls.

If unresponsive: we ship hand-drawn `zones.geojson` in the rider repo and skip `/parking/validate` (turf does the work).
