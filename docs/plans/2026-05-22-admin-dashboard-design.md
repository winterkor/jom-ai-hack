# Admin Dashboard — Design & Plan

**Date:** 2026-05-22
**Scope:** Add a maintainer view to the existing Jom AI webapp for triaging CV-detected incidents at bicycle racks.

## Goal

Give the rack maintainer one screen that answers:

1. Which racks need action right now?
2. What does the CCTV see?
3. How full is each rack?

## Backend linkage (for context)

```
ESP32 + MQTT  ──►  occupancy %        ┐
CV (CCTV)     ──►  illegal / abandoned├──►  Incident store  ──►  Admin dashboard
Geo backend   ──►  rack id + location ┘
```

`rack_id` from `data.geojson` is the join key. CV is the primary signal; occupancy is secondary context.

## UI layout (COVID-dashboard inspired)

```
┌────────────────────────────────────────────────────────────────┐
│ Jom AI · Maintainer    Dashboard | Geofencing | ← User app    │
├──────────────┬──────────────────────────────┬─────────────────┤
│ INCIDENTS    │                              │ OCCUPANCY       │
│ (CV signal)  │           MAP                │ (MQTT signal)   │
│              │  pins recolored by severity  │                 │
│ rank list    │                              │ rank list       │
├──────────────┴──────────────────────────────┴─────────────────┤
│  LIVE FEED — latest CV thumbnails (click → modal)              │
└────────────────────────────────────────────────────────────────┘
```

Click any pin / row / thumbnail → modal with annotated CV image, rack metadata, **Mark resolved**.

## Data model

Static fixture for demo. CV backend stays a future swap-in.

```js
// src/data/mockIncidents.js
{
  id: 'INC-0042',
  rackId: 'TPN-01',                  // matches existing rack.id
  type: 'illegal_parking' | 'abandoned' | 'overflow',
  severity: 'high' | 'med' | 'low',
  detectedAt: ISO string,
  imageUrl: '/cv/post_processed2.jpg',
  referenceUrl: null | '/cv/Day1vsDay2/Reference.jpg',
  bikeCount: 4,
  status: 'open' | 'resolved',
  note: 'Bikes parked outside rack frame'
}
```

~15 seeded incidents pinned to real rack ids. Images served from `public/cv/`.

## Tech decisions

- **No router.** Add `mode = 'user' | 'admin'` state in `App.jsx`; conditionally render the admin tree. Simpler than `react-router-dom` for two views.
- **Dark theme** scoped to admin shell via a `.admin` CSS class — does not affect user-facing UI.
- **Keep MRT accent colors** for severity pills so visual DNA stays consistent with the user app.
- **Reuse existing `MapView` infrastructure** where possible — admin map is a sibling component with different pin styling, not a fork.

## Build order

1. CV image assets + incident fixture
2. Mode toggle in `App.jsx` + `AdminDashboard` shell
3. Top nav
4. Left panel — incidents ranked list
5. Right panel — occupancy ranked list
6. Map with severity-colored pins
7. Bottom live feed strip
8. Incident detail modal
9. Browser verify + polish

## Out of scope

- Geofencing tab (friend handling)
- Real CV backend integration
- MQTT integration
- Multi-user / auth
