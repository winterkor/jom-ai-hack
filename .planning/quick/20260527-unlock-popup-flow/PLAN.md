---
slug: unlock-popup-flow
status: in-progress
created: 2026-05-27
---

# Quick task — Auto-unlock popup

## Problem
After ESP32 publishes `unlocked` via MQTT, the user is left with a collapsed orange `Unlocked · TPN-XXXX` chip and no clear path to end the session. The FAB stays hidden (we hide it while `mySession` exists), so the user is stuck.

## Fix
Auto-show a bottom-sheet popup on the `locked → unlocked` MQTT transition. Two actions:
- **End session** (primary) — clears localStorage session, dismisses card/chip, FAB returns.
- **Keep parked** (ghost) — closes popup, leaves session intact (covers accidental unlocks).

## Files

| File | Change |
|------|--------|
| `webapp/src/components/UnlockPopup.jsx` | NEW — controlled bottom sheet, two buttons |
| `webapp/src/components/UnlockPopup.css` | NEW — match LockSessionCard tone system (orange = unlocked) |
| `webapp/src/App.jsx` | Detect `locked → unlocked` transition while session exists → open popup; wire End session / Keep parked |

## Verification
1. Open as user, park a bike (session created).
2. Trigger ESP32 lock → chip turns green.
3. Trigger ESP32 unlock → bottom-sheet popup auto-appears with "Welcome back".
4. Tap **End session** → session clears, chip/card gone, FAB returns.
5. Re-park, unlock, tap **Keep parked** → popup closes, chip still shows unlocked, session still active.
