---
slug: admin-light-theme
status: complete
completed: 2026-05-22
---

# Admin Light-Theme Alignment Summary

Brought the maintainer dashboard tonally into the same visual family as the rider app. Hybrid model: shared color + type DNA, admin keeps its grid, 1px borders, soft radii, and density.

## Landed

- **Tokens (tokens.css)** — `--admin-*` palette swapped from dark operator-console to a light, user-aligned set:
  - `--admin-bg` cooler paper, `--admin-panel` white, `--admin-panel-2` cream
  - `--admin-line` warm gray border (≈ paper-deep)
  - `--admin-text` reuses `--ink`; `--admin-text-dim` reuses `--ink-mute`
  - `--admin-accent` navy `#1F2A44` (replaces operator-blue), `--admin-accent-2` muted purple
- **Fonts** — every `"Inter", …` declaration across admin CSS replaced with the user font stack: body → `var(--font-body)` (Public Sans), heads / eyebrows → `var(--font-display)` (Bricolage Grotesque), big numerals → `var(--font-numeric)` (Big Shoulders Display).
- **Hardcoded darks** — `#0a0d12`, `#11151c`, white-on-accent text, `rgba(255,255,255,…)` hover overlays, and `rgba(8,10,14,0.72)` modal scrim all swapped to token-based light equivalents.
- **AdminMap** — Carto `dark_all` tiles → `light_all`. Tooltip card, legend overlay, attribution control, and zoom buttons recolored to light tokens.
- **AdminMap visual reuse** — rewrote `AdminMap.jsx` to render the same rich rack-chip + cluster markers as the rider's `MapView`, view-only (no click). Status legend now matches user vocabulary (Available / Filling / Full / Offline).

## Files touched

- `webapp/src/styles/tokens.css`
- `webapp/src/components/admin/AdminDashboard.css`
- `webapp/src/components/admin/AdminNav.css`
- `webapp/src/components/admin/IncidentModal.css`
- `webapp/src/components/admin/LiveFeed.css`
- `webapp/src/components/admin/AdminMap.css`
- `webapp/src/components/admin/AdminMap.jsx` (rewrite + tile swap)
- `webapp/src/components/admin/AdminDashboard.jsx` (drop incident-click wiring on map)

## Verified

- `npm run build` passed.
- Visual check in dev (light gradient nav, white cards, navy accents, light Carto basemap with user-style rack chips, status legend) confirmed.

## Notes

- Out of scope (Phase 2): mobile responsiveness, admin phone-summary view, cross-mode state sync, fixed-width fixes on user side.
- Out of scope: incident click-through on the map (left panel still drives selection via `IncidentList`).
