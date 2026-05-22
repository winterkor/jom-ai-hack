---
slug: demo-gps
status: complete
completed: 2026-05-22
---

## What shipped

- `webapp/src/data/demoRoutes.js` — two preset waypoint sequences (`walkToHub`,
  `walkToMrtMispark`) generated from a tiny `lerpRoute()` helper, each 15
  points designed to play in ~8s at the default cadence.
- `webapp/src/components/DemoControl.jsx` + `.css` — fixed bottom-left stage-
  prop badge with `▶ Hub` / `▶ MRT` / `↻` controls and a progress bar that
  flips green on completion. Visually distinct from rider chrome via the
  admin-accent-2 magenta so the demo audience reads it as a control surface.
- `App.jsx` — renders `<DemoControl onPosition={setUserPos} />` in rider mode.
  Reuses the existing `userPos` state path so every downstream consumer
  (UserMarker today, pill/sheet/validate later) gets the scripted positions
  for free.

## Verification

User confirmed in browser — demo control visible, both routes animate the
blue dot to the right polygon, reset clears it, no console errors.

## Deferred per user

Geofencing pill (#4) and arrival sheet (#6) pause — user wants navigation
polyline to land first so the demo has a "tap a rack → route appears" beat
before introducing the inside-zone affordance. Next quick task: navigation.
