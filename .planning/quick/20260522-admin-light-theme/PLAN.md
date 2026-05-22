---
slug: admin-light-theme
created: 2026-05-22
status: in-progress
---

# Admin Light-Theme Alignment

Goal: bring the admin/maintainer dashboard tonally into the same visual family as the rider app, without rebuilding admin's layout or density. Same hybrid model agreed during brainstorming: shared color + type DNA, but admin keeps its 3-column grid, 1px borders, soft radii, and operator density.

## Scope

1. **Tokens (tokens.css)** — Redefine the `--admin-*` palette as a light variant of the user tokens:
   - `--admin-bg` → warm paper tone (lighter than `--paper`, less saturated)
   - `--admin-panel` → white card
   - `--admin-panel-2` → slightly tinted neutral
   - `--admin-line` → warm gray border (≈ paper-deep)
   - `--admin-text` → `var(--ink)`
   - `--admin-text-dim/muted` → `var(--ink-mute)` and a step lighter
   - `--admin-accent` → navy/blue that reads on white (replaces operator-blue `#4A8CFF`)
   - `--admin-accent-2` → muted purple

2. **Fonts (admin CSS)** — Replace every `"Inter", system-ui, sans-serif` and `"Inter", sans-serif` with the user font stack:
   - Body / labels → `var(--font-body)` (Public Sans)
   - Headings + uppercase eyebrows → `var(--font-display)` (Bricolage Grotesque)
   - Big numerals (panel counts, hero) → `var(--font-numeric)` (Big Shoulders Display)

3. **Hardcoded dark colors** — Replace dark literals that bypass tokens:
   - `.admin__center { background: #0a0d12 }` → light map canvas
   - Admin nav gradient `#11151c → admin-bg` → light gradient
   - IncidentModal overlay `rgba(8,10,14,0.72)` → lighter ink overlay
   - `.imodal__foot { background: #11151c }`, image bg `#0a0d12` → light tones
   - `rgba(255,255,255,…)` hover backgrounds → ink-toned overlays
   - `color: #fff` on accent buttons → `var(--ink)` where contrast still works

4. **Map (AdminMap.css)** — Leaflet container bg, tooltip card, legend overlay, attribution control all swap to the new light tokens.

## Out of scope

- Layout / grid changes
- Mobile breakpoints (Phase 2)
- Phone-summary admin view (Phase 2)
- Component restructure (no JSX changes if avoidable)

## Verification

- `npm run build` passes
- Visual smoke (manual): admin nav, dashboard grid, IncidentModal, AdminMap, panel-empty states all read as light/user-aligned

## Commit

Single atomic commit: `feat: align admin theme to light user-aligned palette`
