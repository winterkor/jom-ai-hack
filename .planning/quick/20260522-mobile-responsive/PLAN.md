---
slug: mobile-responsive
created: 2026-05-22
status: in-progress
---

# Mobile Responsiveness (User + Admin)

Goal: clean phone layout for both rider and admin at 360px+ (covers iPhone 13 Pro at 390 and small Androids). No new components — adjust existing CSS.

## Scope

### User side (rider)
1. **Header** — drop `min-width: 480px`; clamp to viewport on phones.
2. **SidePanel** — fixed `380px` width breaks <412px viewports. Use `min(380px, calc(100vw - 24px))` and verify the panel still slides off screen smoothly.
3. **SearchBar** — confirm it never overflows at 360px (already has mobile rule, just verify).
4. **FAB** — confirm it doesn't collide with the bottom sheet on 360px.

### Admin side
5. **AdminDashboard grid <720px** — collapse 3-col grid to stacked sections (left → center → right vertically). Center map gets a fixed height (≈ 280px) so it doesn't dominate. Bottom LiveFeed gets a shorter strip.
6. **AdminNav** — already has 720px rules; tighten further for 360px (smaller tabs, hide alert label keep dot+count only).
7. **IncidentModal** — convert to full-height bottom sheet at <720px (already grid-collapses; add full-height sheet treatment).

### Cross-mode sync (no code change)
Already works — `racks` state owned by `App.jsx` is passed to `AdminDashboard`. Parking confirm updates flow into admin. Just verify in browser.

## Out of scope
- Bottom tab bar redesign for admin
- Hero stat block redesign
- New phone-summary admin component

## Verification
- `npm run build`
- Visual at 360px / 390px / 768px / desktop
