# MQTT + Backend-Verified Data + Geofencing — Design

**Date:** 2026-05-26
**Deadline:** Demo 2026-05-27
**Status:** Locked, ready for execution

## Goal

Ship a demo-ready rider webapp that:
1. Uses **real LTA rack data** sourced from niclukman's `data.geojson` (no live backend).
2. Reflects **real-time NFC lock state** from a physical ESP32 prototype via HiveMQ MQTT.
3. Shows **polygon geofencing** with soft validation on parking confirmation.

## Non-Goals

- Running niclukman's FastAPI backend at demo time.
- Deploying anything (webapp stays on `localhost:5173`).
- User accounts, session persistence across reloads, real occupancy sensors.
- Generalizing past a single ESP32 device (one device = one rack mapping).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Rider Webapp (Vite)                   │
│                                                         │
│   rackData.js ── filters LTA geojson → adapts shape     │
│        ↓                                                │
│   App state: racks[], userPos, selectedRack, navState   │
│        ↓                                                │
│   MapView ── markers + zone polygons + MQTT lock badge  │
│        ↑                                                │
│   mqttClient.js ── subscribes esp32/door/state          │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       │ static import                    │ WSS port 8884
       ↓                                  ↓
   data/ltaRacks.geojson           HiveMQ Cloud
   (copied from niclukman)         (df81d…hivemq.cloud)
                                          ↑
                                          │ publishes
                                          │
                                      ESP32 prototype
```

---

## Phase 1 — Backend-Verified Data

**Files**
- `webapp/src/data/ltaRacks.geojson` (new — copied from niclukman's repo)
- `webapp/src/data/rackData.js` (modify — add LTA filter + adapter)

**Adapter mapping (niclukman → frontend rack shape)**

| Source | Target | Notes |
|---|---|---|
| `description` | `name` | Use as display name |
| `count` | `totalSlots` | **Real LTA capacity, no longer mocked** |
| `type` | `type` | Keep (e.g. `MRT_RACKS`, `HDB_RACKS`) |
| `sheltered` | `sheltered` | New field for UI badge |
| `coordinates[1]` | `lat` | GeoJSON is `[lng, lat]` |
| `coordinates[0]` | `lng` | |
| — | `id` | Generate as `lta-${index}` |
| — | `occupiedSlots` | Sim via `occupancySim.js` (no real source) |
| — | `source` | `"lta"` |

**Filtering**
- Bounding box around Tampines: `lat 1.34–1.37`, `lng 1.93–1.96`.
- Keep all `type` values; UI badges them.
- Expected count: ~50–150 racks (vs. 27,196 nationwide).

**Replaces**
- `fetchTampinesRacks()` from `ltaClient.js` is no longer needed at demo time. Keep file, gate behind a fallback if static load fails.

---

## Phase 2 — Geofencing (Visual + Soft Validation)

**Files**
- `webapp/src/data/zones.geojson` (exists, reuse — 4 polygons)
- `webapp/src/components/ZoneLayer.jsx` (new)
- `webapp/src/data/geo.js` (modify — add `isPointInAnyZone(point, zones)`)
- `webapp/src/components/ParkingConfirmCard.jsx` (modify — add validation badge)

**Behavior**

1. **Visual:** Render 4 polygons as semi-transparent overlays with color by `kind` (park / hub / mrt). Subtle dashed border. Toggleable via existing `Legend` if time permits.
2. **Validation on `handleConfirmParked`:**
   - Use `@turf/boolean-point-in-polygon` (already a dep) with user's position.
   - In zone → ✅ "Parked in sanctioned area: {zone.name}"
   - Out of zone → ⚠️ "Outside sanctioned parking — please move to nearest zone"
   - **Soft:** action still completes. Just visual feedback.

---

## Phase 3 — MQTT Real-Time NFC

**Files**
- `webapp/package.json` (add `mqtt` ~5KB minified)
- `webapp/src/services/mqttClient.js` (new)
- `webapp/src/components/LockSessionCard.jsx` (new)
- `webapp/src/App.jsx` (modify — wire MQTT + session state)

**MQTT connection**

| Param | Value |
|---|---|
| Broker URL | `wss://df81d00697594b02b2543d63c1b8131d.s1.eu.hivemq.cloud:8884/mqtt` |
| Username | `***REDACTED***` |
| Password | `***REDACTED***` (hackathon-acceptable; **do not push public**) |
| Subscribe | `esp32/door/state` (payload: `"locked"` / `"unlocked"`) |
| Publish (optional) | `esp32/door/command` (`"lock"` / `"unlock"`) |

**Device-to-rack mapping**

```js
const ESP32_RACK_ID = "lta-XX"; // pick the one nearest the demo spot (e.g. Tampines Hub)
```

**Session correlation (client-side, no user accounts)**

```js
// On Confirm Parked at selected rack:
localStorage.setItem('mySession', JSON.stringify({ rackId, startedAt: Date.now() }));

// On MQTT message:
//   - if rack matches mySession.rackId AND state changes → flip card
//   - new "locked" → 🔒 "Locked at {rackName}" + browser notification
//   - new "unlocked" → 🔓 "Unlocked — welcome back!" + clear session
```

**LockSessionCard component**
- Persistent bottom card when `mySession` exists.
- Shows: rack name, lock state, time elapsed, [Find my bike] button.
- (Optional) "Remote unlock" button → publishes to `esp32/door/command`. Demo wow + RFID failure fallback.

---

## Demo Script

1. **Splash → User mode.**
2. **Map loads** with real LTA racks (~80 markers around Tampines). Polygons faintly visible.
3. **Tap nearest rack** → side panel with capacity (real LTA count).
4. **Preview Route → Start nav.**
5. **Confirm Parked** → ✅ "Parked in sanctioned area" (geofence check passes).
6. **🔒 Session card appears** at bottom: "Parked at Tampines Hub Rack · just now".
7. **Friend taps RFID card on ESP32** → motor whirs → card flips to 🔒 "Locked" within 1s.
8. **(Wait or talk through other UI)**
9. **Friend taps RFID again** → 🔓 "Unlocked — welcome back!".
10. **(Bonus)** Tap "Remote unlock" on phone → physical lock opens. Judges' jaws drop.

## Fallbacks

| Failure | Fallback |
|---|---|
| ESP32 offline / WiFi dead | Webapp's "Remote unlock" button still publishes; if no device, MQTTX simulates state |
| HiveMQ unreachable | Session card still shows locally; lock state stuck at "just parked" |
| GPS denied | Existing demo-start fallback unchanged |
| LTA geojson load fails | Existing `mockRacks` fallback in `rackData.js` unchanged |
| Geofence check fails | Soft fail — action still completes |

---

## Tonight's Order of Operations

1. **Test MQTT round-trip with MQTTX** (15 min, proves device + broker before any code).
2. **Phase 1 — Data swap** (45 min, smallest change with biggest credibility win).
3. **Phase 2 — Geofencing** (45 min, builds on existing zones + turf).
4. **Phase 3 — MQTT integration** (1.5 hr, the headline feature).
5. **Demo dry run end-to-end** (30 min).
6. **Polish + bugs** (whatever time remains).

**Total: ~4.5 hr of focused work.**

## Asks from Friends

- **NFC friend:** plug in the ESP32. That's it.
- **niclukman:** nothing for the demo (his `data.geojson` is committed in his public repo).

## Deferred

- Real backend integration (Vercel + Railway deploy).
- niclukman's CORS fix.
- niclukman's `total_slots` / `occupied_slots` columns.
- Real occupancy data (still simulated).
- User accounts.
- Generalizing to multiple ESP32 devices.
- Server-side parking validation via `/parking/validate`.
