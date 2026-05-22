---
slug: admin-phone-tabs
status: complete
completed: 2026-05-22
---

# Admin Phone Bottom-Tab Layout (Phase 3) Summary

Phase 3 of the admin UI mobile work. Continues Phase 2 (`20260522-mobile-responsive`), which left a flat scrolling stack on phone. Phase 3 swaps that for a Google-Maps-style bottom-tab IA so the operator focuses on one surface at a time.

## Landed

- **Hero stat strip** above the panes on phone: `N alerts • M racks • P% used`. Alert number turns red when `openCount > 0`. Recomputes from `racks` + `incidents` state, so resolving an incident updates the strip live.
- **Bottom tab bar** (Incidents / Map / Racks) fixed at the bottom of the viewport, respecting `safe-area-inset-bottom`. Incidents tab carries a red count badge when there are open alerts.
- **One pane at a time** on phone — `.admin__pane.is-active` is the only visible child of `.admin__grid`; each pane gets its own scroll container, so panel-head `position: sticky` works again.
- **LiveFeed hidden on phone** (`.admin__bottom { display: none }` ≤720px). The footer was redundant once tabs took over.
- **Desktop / tablet untouched** — hero and tabbar are `display: none` outside the phone breakpoint; the original 3-column grid + LiveFeed footer renders exactly as before.

## Files touched

- `webapp/src/components/admin/AdminDashboard.jsx` — tab state, hero stat row, tab bar, `.admin__pane is-active` classes, derived `usedPct`.
- `webapp/src/components/admin/AdminDashboard.css` — phone-only hero + tab bar styles, replaced the flat-scroll phone media query with a tabbed layout (4-row grid: nav/hero/active-pane/tabbar), `<420px` tweak for narrow phones.

## Verified

- `npm run build` ✓ (122ms, no warnings).
- AdminDashboard renders desktop layout unchanged (hero + tabbar `display: none`).
- Phone breakpoint switches to single-pane view; map pane has full-height container (Leaflet renders against `.admin__center.admin__pane.is-active`).

## Out of scope (intentionally)

- Iconography for tabs — text-only labels for hackathon speed.
- Moving LiveFeed *inside* the Incidents tab — operator can still see open incidents in IncidentList; LiveFeed simply hidden.
- New stats — strip uses already-computed values, no new data plumbing.
