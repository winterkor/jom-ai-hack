// Cycling routing via the public OSRM bike-profile endpoint at
// routing.openstreetmap.de. No API key, decent global coverage. Fail-soft —
// callers fall back to a straight polyline when this returns null.

const OSRM = "https://routing.openstreetmap.de/routed-bike/route/v1/driving";

const MODIFIER_TO_VERB = {
  left: "Turn left",
  right: "Turn right",
  "slight left": "Slight left",
  "slight right": "Slight right",
  "sharp left": "Sharp left",
  "sharp right": "Sharp right",
  straight: "Continue straight",
  uturn: "Make a U-turn",
};

export async function getCyclingRoute(from, to) {
  if (!from || !to) return null;
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const qs = "overview=full&geometries=geojson&steps=true";
  try {
    const res = await fetch(`${OSRM}/${coords}?${qs}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const r = data.routes[0];
    return {
      coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceM: Math.round(r.distance),
      durationS: Math.round(r.duration),
      steps: (r.legs?.[0]?.steps || []).map((s) => ({
        instruction: formatStep(s),
        modifier: s.maneuver?.modifier || "straight",
        type: s.maneuver?.type || "turn",
        distance: Math.round(s.distance),
        location: [s.maneuver.location[1], s.maneuver.location[0]],
        name: s.name || "",
      })),
    };
  } catch {
    return null;
  }
}

export function formatStep(step) {
  const m = step.maneuver || {};
  const name = step.name?.trim();
  if (m.type === "depart") {
    return name ? `Head out on ${name}` : "Start cycling";
  }
  if (m.type === "arrive") {
    return "Arrive at destination";
  }
  if (m.type === "roundabout" || m.type === "rotary") {
    return name ? `Take the roundabout onto ${name}` : "Take the roundabout";
  }
  const verb = MODIFIER_TO_VERB[m.modifier] || "Continue";
  return name ? `${verb} onto ${name}` : verb;
}
