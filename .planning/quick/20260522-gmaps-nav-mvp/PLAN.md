---
slug: gmaps-nav-mvp
created: 2026-05-22
status: in-progress
---

# Google Maps-Style Navigation MVP

Goal: make the rider navigation flow feel like a convincing Google Maps-style hackathon MVP without building full live navigation.

## Scope

1. Upgrade route preview into a richer bicycle bottom sheet:
   - bicycle mode heading
   - ETA, arrival, distance, path-quality hint
   - Start button and route option chips
2. Upgrade active navigation:
   - stronger top maneuver banner
   - large user navigation arrow / map-centered active feel
   - bottom ETA + exit sheet
3. Keep implementation demo-safe:
   - no real rerouting
   - no live step matching
   - no actual route alternatives

## Verification

- `npm run build`
- Browser check at desktop and mobile-ish width if build succeeds
