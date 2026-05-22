// Zone loading + client-side inside-zone detection.
//
// loadZones() tries GET /api/zones first (Lbleeee may add this later) and
// falls back to the bundled fixture so the demo runs even when the backend
// has no /zones endpoint or an empty ParkingZone table.
//
// findContainingZone() does the live point-in-polygon test that drives the
// "you are here" pill and the arrival sheet. Server-side /parking/validate
// remains the authoritative check on the Confirm Park tap.

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

import fallbackZonesRaw from "../data/zones.geojson?raw";
import { getZones } from "./api.js";

const fallbackZones = JSON.parse(fallbackZonesRaw);

export async function loadZones() {
  const remote = await getZones();
  if (remote.ok && remote.data?.features?.length) {
    return { features: remote.data.features, source: "backend" };
  }
  return { features: fallbackZones.features, source: "fallback" };
}

export function findContainingZone(lat, lng, features) {
  if (lat == null || lng == null || !features?.length) return null;
  const pt = point([lng, lat]);
  for (const feature of features) {
    if (booleanPointInPolygon(pt, feature)) return feature;
  }
  return null;
}

export function isParkZone(feature) {
  return feature?.properties?.kind === "park";
}

export function isNoParkZone(feature) {
  return feature?.properties?.kind === "no-park";
}
