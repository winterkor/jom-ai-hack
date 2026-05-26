// Rack data — single source of truth for rack records used by the app.
//
// Primary source is `ltaRacks.geojson` (real LTA capacity data, pre-filtered
// to the Tampines + Upper Changi bbox from niclukman's tamp-hackathon-backend
// repo). The mock array remains as the offline / load-failure fallback.

import { simulateOccupiedSlots } from "./occupancySim.js";
import ltaGeoRaw from "./ltaRacks.geojson?raw";

const ltaGeo = JSON.parse(ltaGeoRaw);

// Each rack record used by the app:
// { id, name, address, lat, lng, totalSlots, occupiedSlots,
//   rackType?, shelter?: boolean, source: "mock" | "lta" }

export const mockRacks = [
  {
    id: "TPN-01",
    name: "Tampines MRT Station",
    address: "20 Tampines Central 1, Singapore 529538",
    lat: 1.35451,
    lng: 103.94531,
    totalSlots: 60,
    occupiedSlots: 58,
    source: "mock",
  },
  {
    id: "TPN-02",
    name: "Our Tampines Hub",
    address: "1 Tampines Walk, Singapore 528523",
    lat: 1.35275,
    lng: 103.93989,
    totalSlots: 80,
    occupiedSlots: 52,
    source: "mock",
  },
  {
    id: "TPN-03",
    name: "Tampines Mall",
    address: "4 Tampines Central 5, Singapore 529510",
    lat: 1.35365,
    lng: 103.94378,
    totalSlots: 40,
    occupiedSlots: 39,
    source: "mock",
  },
  {
    id: "TPN-04",
    name: "Tampines East MRT",
    address: "10 Tampines Central 7, Singapore 529957",
    lat: 1.35633,
    lng: 103.9543,
    totalSlots: 50,
    occupiedSlots: 18,
    source: "mock",
  },
  {
    id: "TPN-05",
    name: "Tampines West MRT",
    address: "40 Tampines Avenue 3, Singapore 529706",
    lat: 1.34556,
    lng: 103.93829,
    totalSlots: 45,
    occupiedSlots: 31,
    source: "mock",
  },
  {
    id: "TPN-06",
    name: "Tampines Regional Library",
    address: "1 Tampines Walk #02-01, Singapore 528523",
    lat: 1.35333,
    lng: 103.94038,
    totalSlots: 35,
    occupiedSlots: 8,
    source: "mock",
  },
  {
    id: "TPN-07",
    name: "Tampines Round Market & Food Centre",
    address: "137 Tampines Street 11, Singapore 521137",
    lat: 1.34556,
    lng: 103.94632,
    totalSlots: 30,
    occupiedSlots: 27,
    source: "mock",
  },
  {
    id: "TPN-08",
    name: "Tampines Stadium",
    address: "11 Tampines Street 71, Singapore 529067",
    lat: 1.35831,
    lng: 103.93472,
    totalSlots: 55,
    occupiedSlots: 12,
    source: "mock",
  },
  {
    id: "TPN-09",
    name: "Tampines Polyclinic",
    address: "1 Tampines Street 41, Singapore 529203",
    lat: 1.35114,
    lng: 103.9489,
    totalSlots: 25,
    occupiedSlots: 22,
    source: "mock",
  },
  {
    id: "TPN-10",
    name: "Tampines Eco Green",
    address: "Tampines Avenue 12, Singapore 529757",
    lat: 1.36207,
    lng: 103.93824,
    totalSlots: 40,
    occupiedSlots: 5,
    source: "mock",
  },
];

/**
 * Convert a feature from niclukman's static LTA geojson into our app's rack
 * shape, with simulated occupancy applied (no real sensor source exists yet).
 */
export function adaptLtaGeoFeature(feature, index, now = new Date()) {
  const props = feature.properties || {};
  const [lng, lat] = feature.geometry.coordinates;
  const total = Math.max(1, Number(props.count) || 10);
  // Build a minimal LTA-shaped record so simulateOccupiedSlots() — keyed on
  // Description — still produces a stable pseudo-occupancy per rack.
  const occupied = simulateOccupiedSlots(
    { Description: props.description || `lta-${index}`, RackCount: total },
    now,
  );
  const idNum = String(index + 1).padStart(3, "0");
  return {
    id: `lta-${idNum}`,
    name: props.description?.trim() || "Bicycle Rack",
    address: props.description?.trim() || "Tampines, Singapore",
    lat,
    lng,
    totalSlots: total,
    occupiedSlots: occupied,
    rackType: props.type || "UNKNOWN",
    shelter: !!props.sheltered,
    source: "lta",
  };
}

/**
 * Synchronously load and adapt the bundled LTA geojson into rack records.
 * Returns an array of racks ready to drop into app state.
 */
export function loadLtaRacks(now = new Date()) {
  const features = ltaGeo?.features || [];
  return features.map((f, i) => adaptLtaGeoFeature(f, i, now));
}

/**
 * Legacy adapter for the LTA DataMall live JSON (RackCount/Latitude/etc).
 * Retained so the runtime fallback in `ltaClient.js` keeps working if the
 * static geojson load ever fails.
 */
export function adaptLtaRack(ltaRack, index, now = new Date()) {
  const total = ltaRack.RackCount || 10;
  const occupied = simulateOccupiedSlots(ltaRack, now);
  const idNum = String(index + 1).padStart(3, "0");
  return {
    id: `TPN-${idNum}`,
    name: ltaRack.Description?.trim() || "Bicycle Rack",
    address: ltaRack.Description?.trim() || "Tampines, Singapore",
    lat: ltaRack.Latitude,
    lng: ltaRack.Longitude,
    totalSlots: total,
    occupiedSlots: occupied,
    rackType: ltaRack.RackType || "UNKNOWN",
    shelter: ltaRack.ShelterIndicator === "Y",
    source: "lta",
  };
}

export function getRackStatus(rack) {
  if (rack.offline) return "offline";
  const ratio = rack.occupiedSlots / rack.totalSlots;
  if (ratio >= 0.9) return "full";
  if (ratio >= 0.6) return "filling";
  return "available";
}

export function getAvailableSlots(rack) {
  return Math.max(0, rack.totalSlots - rack.occupiedSlots);
}
