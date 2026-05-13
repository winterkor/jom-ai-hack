# Jom AI @ Tampines — Bicycle Rack Network

> A user-facing map of every bicycle rack in Tampines, colour-coded by live availability. Backed by smart sensor racks (ESP32) that report live occupancy and flag abandoned bikes.

**Hackathon:** Jom AI @ Tampines
**Status:** Webapp Ship 1 complete — interactive map with rack markers, side panel, capacity indicator.

## What this project solves

Bicycle racks in Tampines are almost always >75% full, with 25–50% of parked bikes being abandoned. Cyclists park illegally because they don't know where the next available rack is. This system gives them that answer at a glance, and gives the municipality a way to identify and remove abandoned bikes.

See [`docs/proposal.md`](docs/proposal.md) for the full project rationale and interview findings.

## Repo layout

```
.
├── webapp/         React + Vite frontend (Leaflet map UI)
├── backend/        Future: API server proxying ESP32 sensors + LTA DataMall
├── firmware/       Future: ESP32 device code (occupancy sensors, LED rack indicators)
└── docs/           Proposal, design notes
```

## Running the webapp

```bash
cd webapp
cp .env.example .env.local         # paste your LTA AccountKey into .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

## Tech stack (webapp)

- **React 19** + **Vite**
- **Leaflet** + **react-leaflet** (OpenStreetMap tiles via CartoDB Positron)
- **react-leaflet-cluster** for marker clustering at low zoom (planned)
- **LTA DataMall** (free API key) for real rack locations
- Custom CSS — no Tailwind, no UI kit; **Tropical Brutalist × Wayfinding** aesthetic

## Roadmap

| # | Feature | Status |
|---|---|---|
| 1 | Map + rack markers + side panel + legend | ✅ Done |
| 2 | LTA DataMall live fetch + clustering | 🔄 In progress |
| 3 | "Find Nearest Available" + cycling route | ⏳ |
| 4 | Live occupancy simulation (ESP32-style ticking) | ⏳ |
| 5 | Geofencing overflow zones (Park Here When Full) | ⏳ |
| 6 | Abandoned bike flagging (idle >X days) | ⏳ |
| — | Computer vision (CCTV illegal parking) | backend track |
