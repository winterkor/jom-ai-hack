---
slug: admin-phone-tabs
created: 2026-05-22
status: in-progress
---

# Admin Phone Bottom-Tab Layout (Phase 3)

Continuation of `20260522-mobile-responsive`. Phase 2 fixed the scroll/sheet bugs; Phase 3 changes the phone information architecture to a one-surface-at-a-time bottom-tab layout.

## Goal

At ≤720px the admin should feel like a focused phone app:
- Hero stat strip up top: `N alerts • M racks • P% used`
- Three bottom tabs: **Incidents / Map / Racks**
- Only one of the three panels visible at a time
- LiveFeed hidden on phone (operator's attention stays on the active tab)

Desktop and tablet (>720px) layouts untouched.

## Scope

1. **AdminDashboard.jsx** — add `activeTab` state (default `incidents`). Compute `usedPct` from `racks`. Render hero strip + tab bar (visible only via CSS at ≤720px). On phone, only render the panel that matches `activeTab`; on desktop, render all three side-by-side as today (single render tree, classed for CSS to handle).
2. **AdminDashboard.css** — desktop hides hero/tabs. Phone shows them; tab bar is fixed at the bottom (above safe-area). Hide `.admin__bottom` (LiveFeed) on phone. Active panel takes full viewport between hero and tab bar.
3. Reuse existing **IncidentList / AdminMap / OccupancyList** — no component changes.

## Out of scope

- Restyling tab icons / glyph set (keep simple text labels for hackathon speed)
- New stats beyond the three already implied
- Moving LiveFeed inside Incidents tab (just hide on phone)

## Verification

- `npm run build` passes
- Visual check at 360 / 390 / 720 / desktop:
  - Phone: hero on top, one panel mid, tab bar at bottom, tab switching works, no horizontal scroll
  - 721px+: original 3-column grid + bottom LiveFeed intact
- Resolve an incident; counter updates in hero strip
