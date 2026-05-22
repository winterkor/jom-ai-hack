// Scripted GPS waypoints for the 5-min demo. Coordinates picked so each route
// starts ~80 m west of the target polygon and ends squarely inside it. Step
// count chosen to play in ~8 s at the default 550 ms cadence in DemoControl —
// fast enough to keep the audience watching, slow enough to read the pill.
//
// Hub polygon (zone-hub):           lng 103.94443→103.94497  lat 1.35242→1.35278
// MRT no-park (zone-mrt-exit-a):    lng 103.94502→103.94538  lat 1.35297→1.35324

function lerpRoute(startLng, endLng, lat, steps) {
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    out.push({ lat, lng: startLng + (endLng - startLng) * t });
  }
  return out;
}

export const walkToHub = lerpRoute(103.94370, 103.94470, 1.35260, 14);

export const walkToMrtMispark = lerpRoute(103.94420, 103.94520, 1.35310, 14);

export const ROUTES = {
  hub: { label: "Walk to Hub", waypoints: walkToHub },
  mrt: { label: "Walk to MRT", waypoints: walkToMrtMispark },
};
