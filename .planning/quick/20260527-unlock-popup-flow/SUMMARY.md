---
slug: unlock-popup-flow
status: complete
completed: 2026-05-27
---

# Summary — Auto-unlock popup

## What shipped
- `webapp/src/components/UnlockPopup.jsx` (new) — controlled bottom sheet with End session / Keep parked actions, Escape key → Keep parked.
- `webapp/src/components/UnlockPopup.css` (new) — orange-accent sheet matching the LockSessionCard unlocked tone, mobile bottom sheet → desktop centered card.
- `webapp/src/App.jsx` — added `unlockPromptOpen` state + `prevLockRef`. New effect watches `lockState` for `locked → unlocked` transition while `mySession` exists, opens popup. `handleEndSession` now also clears popup and resets prev-lock ref so a future cycle works. `handleKeepParked` added. `<UnlockPopup>` mounted at root.

## Verification steps for user
1. Park a bike → chip/card appears.
2. ESP32 lock → chip turns green "Locked".
3. ESP32 unlock → bottom-sheet popup auto-appears: "Welcome back — Your bike at X just unlocked. End the session to free the rack?"
4. Tap **End session** → card+chip gone, FAB returns, ready to find a new rack.
5. Re-park, unlock, tap **Keep parked** → popup closes, orange chip remains, session intact.

## Notes
- Popup z-index 770 > LockSessionCard 760 so it always wins.
- No backdrop click-to-dismiss — deliberate choice so the user picks End vs Keep.
- Escape key dismisses to Keep (non-destructive default).
