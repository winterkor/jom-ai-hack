---
status: needs-verification
created: 2026-05-27
---

# Handoff — admin incident navigation v2 (rider-style nav)

## What's on disk (NOT yet committed, NOT yet browser-verified)

1. **`webapp/src/data/mockIncidents.js`** — rewritten. Now exactly 5 incidents at `lta-001`..`lta-005`, each with its own `imageUrl` + `note`. Removed `pickIncidentPhoto` / `pickIncidentBlurb` / hash helpers and the BASE/LTA_ONLY/multi-id seeding.
2. **`webapp/src/components/admin/IncidentList.jsx`** — row sub uses `inc.note` directly (no more blurb helper).
3. **`webapp/src/components/admin/IncidentModal.jsx`** — uses `incident.imageUrl` directly (no more `pickIncidentPhoto`). Navigate button stays.
4. **`webapp/src/components/admin/AdminDashboard.jsx`** — REWRITTEN. Adds rider-style nav state machine (`navState`/`navRoute`/`navRack`), `DEPOT = Tampines Hub`, `resolveOrigin()` uses geolocation w/ depot fallback, `handleNavigate` fetches OSRM route → preview, `handleStartActive` → active, `handleExitNav` → idle. Mounts `NavPreviewCard`, `NavBanner`, `NavExitBar` (imported from `../NavPreviewCard.jsx` etc). When `isNavving`, hides `AdminNav` / hero / panes (except center map) / LiveFeed / tabbar. Modal stays mounted.
5. **`webapp/src/components/admin/AdminMap.jsx`** — REWRITTEN. Dropped `FlyToTarget` / `buildDestIcon` / dest pin / Clear button. Now accepts `routeCoords`, renders `<RouteLayer coords={routeCoords} />` and `<FitRoute coords={routeCoords} />` when set. `FitBounds` suppressed during routing. Legend hidden during routing.
6. **`webapp/src/components/admin/AdminMap.css`** — removed `.admin-map__clear` rules.

## Verification needed (fresh session)

```bash
# 1. Confirm dev server up
lsof -i :5173 -sTCP:LISTEN

# 2. Visit http://localhost:5173/#/admin and check:
#    - Exactly 5 incident rows in the left list
#    - Each has a distinct note + distinct photo when opened
#    - Clicking Navigate in the modal:
#       a) closes modal
#       b) switches to map tab
#       c) hides AdminNav/hero/tabbar/LiveFeed
#       d) shows a route polyline from depot/GPS to the rack
#       e) shows NavPreviewCard at the bottom with min/arrive
#    - Tapping Start on NavPreviewCard:
#       a) shows NavBanner at top with turn instruction
#       b) shows NavExitBar at bottom (with ARRIVE + EXIT)
#       c) hides NavPreviewCard
#    - Tapping Exit returns to idle (all admin chrome restored)
#    - No lock/park/unlock UI ever appears
```

## Likely follow-ups after verify

- If `getCyclingRoute` is slow/flaky, the fallback straight line is built in.
- If geolocation prompt is annoying for the demo, hard-code `DEPOT` (skip the geolocation branch). Search `resolveOrigin` in `AdminDashboard.jsx`.
- May need a small CSS tweak so the bottom `NavPreviewCard` doesn't get covered by leftover admin chrome — the `admin--nav` data attribute is on the root and can be CSS-targeted if needed.
- `NavPreviewCard` copy currently says "Available rack found" / "Bike there" — those strings live inside the rider component. If the maintainer copy should differ ("Incident located" / "Ride to incident") this needs either a prop or a fork. Punt unless user complains.

## Commit when verified

```
feat: admin incident-nav v2 — rider-style routed nav, 5 fixed incidents

- Trim seeded incidents to exactly 5 at distinct lta-XXX racks; each
  carries its own imageUrl + note (drops hash helpers).
- AdminDashboard mirrors rider nav state machine (idle/preview/active)
  with OSRM cycling route, geolocation→Tampines-Hub depot fallback.
- Reuses NavPreviewCard / NavBanner / NavExitBar / RouteLayer from rider.
- No park / lock / unlock UI in admin nav.
- Removes fly-to + dest-pin + Clear-pin flow (replaced by routed nav).
```

## Resume command
`gsd-quick resume admin-incident-navigation`

(Plan + addendum: `PLAN.md`, `PLAN-ADDENDUM.md` in this directory.)
