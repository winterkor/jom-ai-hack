---
slug: admin-incident-navigation
phase: addendum-2
status: planned
created: 2026-05-27
---

# Plan addendum 2 — keep admin chrome during nav (no takeover)

After v2 ship, user feedback: don't hide the admin chrome when navigating.
Mimicking the rider's full-screen takeover removes operator context (alerts,
livefeed) that ops actually needs while routing. Keep the admin shell intact;
overlay nav UI on top.

## What changes

1. **AdminDashboard.jsx** — drop the `!isNavving` guards around `AdminNav`,
   hero, asides (`admin__left`, `admin__right`), `LiveFeed` footer, and the
   bottom tabbar. The `.admin--nav` class is no longer needed for chrome
   hiding (NavBanner positions itself).
2. **AdminDashboard.css** — remove the `.admin.admin--nav` grid overrides
   added in v2 (no longer needed since chrome stays mounted).
3. **AdminMap.jsx** — `InvalidateOnNav` still useful: even without chrome
   hide, FitBounds → FitRoute swap is a layout-affecting change; keep it.
4. **Nav UI behavior** — `NavPreviewCard`, `NavBanner`, `NavExitBar` keep
   working; they're absolute/fixed-positioned overlays so they layer over
   whichever admin pane is active.
5. **Tab auto-switch** — Navigate still flips `activeTab` to "map" so phone
   users see the map (not the incident list).

## Verification

1. Admin renders normally with 5 incidents.
2. Open incident → modal → Navigate:
   - Modal closes, tab switches to Map (visible on phone).
   - Admin chrome (nav/hero/asides/livefeed/tabbar) stays visible.
   - Route polyline renders in center map.
   - `NavPreviewCard` floats at the bottom.
3. Tap Start: NavBanner appears at top (overlay), NavExitBar at bottom,
   `NavPreviewCard` hidden. Admin chrome still visible underneath.
4. Tap Exit: returns to idle, route cleared, NavBanner/NavExitBar gone.
5. No console errors; no park/lock/unlock UI.
