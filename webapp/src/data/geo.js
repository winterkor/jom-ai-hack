// Geographic helpers — pure functions, no I/O.

const EARTH_R_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(s));
}

/** Rough cycling-time ETA at 15 km/h. Returns minutes (rounded). */
export function cyclingEtaMinutes(km) {
  const minutes = (km / 15) * 60;
  return Math.max(1, Math.round(minutes));
}

/** Format a km distance compactly. <1 km → metres, else 1 decimal of km. */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Given an origin and a list of racks, return the closest one whose status
 * is not "full". Returns null if every rack is full or the list is empty.
 */
export function findNearestAvailable(origin, racks, getStatus) {
  let best = null;
  let bestKm = Infinity;
  for (const r of racks) {
    if (getStatus(r) === "full") continue;
    const d = haversineKm(origin, { lat: r.lat, lng: r.lng });
    if (d < bestKm) {
      bestKm = d;
      best = r;
    }
  }
  return best ? { rack: best, distanceKm: bestKm } : null;
}
