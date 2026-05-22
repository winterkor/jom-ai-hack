---
slug: mobile-responsive
status: complete
completed: 2026-05-22
---

# Mobile Responsiveness Summary

Phase 2 of the UI work. Scope deliberately trimmed mid-session: admin's phone view feels cluttered when 5 panels stack on one screen, so the *bottom-tab phone layout* was deferred to Phase 3. This phase covers the scroll fix + general phone polish.

## Landed

- **AdminDashboard ≤720px** — single outer scroll container; each panel renders at natural height. No nested touch-scroll conflicts. Map gets a fixed 280px slot (240px ≤420px). Sticky panel headers turned off on phone to avoid iOS glitches.
- **AdminDashboard tablet (721–960px)** — keeps the prior 220 / 1fr / 220 row split for landscape-tablet use.
- **IncidentModal ≤720px** — slides up from the bottom as a 92dvh sheet, rounded top corners, action buttons stretch full-width.
- **AdminNav ≤420px** — tabs/alerts/exit tightened; logo drops to 14px.
- **LiveFeed ≤720px** — cards shrink to 150×60px thumbs, tighter strip padding.
- **User side** — already had complete mobile rules (bottom-sheet panel, mobile header, FAB clear); left untouched.
- **Cross-mode state sync** — already wired structurally (App.jsx owns `racks`, passes them to AdminDashboard). Rider parking confirm flows into admin without further code.

## Files touched

- `webapp/src/components/admin/AdminDashboard.css`
- `webapp/src/components/admin/IncidentModal.css`
- `webapp/src/components/admin/AdminNav.css`
- `webapp/src/components/admin/LiveFeed.css`

## Verified

- `npm run build` passed.
- Visual check confirmed admin scrolls cleanly on phone; modal opens as bottom sheet.

## Deferred to Phase 3

- Bottom-tab phone layout for admin (Incidents / Map / Racks tabs, one surface at a time)
- Hero stat block ("3 alerts • 12 racks • 64% used") above the tabs
- Possibly hide LiveFeed on phone (or move it inside the Incidents tab)
