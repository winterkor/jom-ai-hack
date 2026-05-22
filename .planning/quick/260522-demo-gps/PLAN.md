---
slug: demo-gps
created: 2026-05-22
description: Scripted demo-mode GPS controller — drives userPos along preset routes for the 5-min demo
relates_to: .planning/notes/geofencing-direction.md (feature lock #3, demo beats 3/6)
follow_up: task #4 (pill consumes the userPos this drives)
---

## Goal

Hand the demoer a deterministic way to walk the blue "you are here" dot into
the Hub polygon (positive arrival) and into the MRT no-park polygon (negative
mispark beat). Real `navigator.geolocation` is unreliable at the venue, so we
need scripted positions that don't depend on Wi-Fi or GPS lock.

## Files

- **NEW** `webapp/src/data/demoRoutes.js`
  - Two route presets, each an array of `{ lat, lng }` waypoints (~15 steps).
  - `walkToHub` — starts ~80m west of the Hub polygon, walks east into the
    polygon interior, terminates ~at polygon centre.
  - `walkToMrtMispark` — starts ~80m west of MRT Exit A, walks east into the
    no-park polygon, terminates inside it.

- **NEW** `webapp/src/components/DemoControl.jsx` + `DemoControl.css`
  - Small fixed-position pill, bottom-left, magenta/violet accent so it
    visually reads as a "stage prop" not a user feature.
  - States: idle → playing → finished. Two buttons inside:
    `▶ Walk to Hub` / `▶ Walk to MRT` plus a `↻ Reset` icon.
  - When clicked, locks the active route, fires `setInterval` (~550 ms/step)
    that advances index and calls `onPosition({ lat, lng })`.
  - On unmount or reset, clears the interval and calls `onPosition(null)`.

- **MOD** `webapp/src/App.jsx`
  - Render `<DemoControl onPosition={setUserPos} />` only in `user` mode.
  - Real geolocation flow is unchanged — demo mode just overrides `userPos`
    directly via the same setter, so every downstream consumer (UserMarker,
    upcoming pill, arrival sheet) Just Works.
  - Sit the control behind the FAB in z-order — never overlaps the sheet.

## Out of scope

- Pausing / scrubbing mid-route (just reset and replay).
- Adjusting playback speed.
- Multi-rider simulation.

## Verification

1. `npm run dev` → rider mode.
2. Click `▶ Walk to Hub` → blue dot animates west→east into the Hub polygon
   over ~8s. Final position visibly inside the green Hub fill.
3. Click `↻ Reset` → dot disappears.
4. Click `▶ Walk to MRT` → dot ends inside the red-striped no-park polygon.
5. No console errors.
