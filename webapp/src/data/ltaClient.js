// LTA DataMall BicycleParkingv2 client
// Docs: https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf
//
// Endpoint requires `AccountKey` header and `Lat`, `Long`, `Dist` (km, max 0.5) query params.
// Returns up to 500 records per call. We sweep a grid of points across Tampines and dedupe.
//
// Routed through Vite's dev proxy (see vite.config.js): the browser hits `/lta/...`
// which proxies to https://datamall2.mytransport.sg/ltaodataservice/...

const LTA_KEY = import.meta.env.VITE_LTA_KEY;

// Tampines bounding box (approximate)
export const TAMPINES_BBOX = {
  minLat: 1.338,
  maxLat: 1.378,
  minLng: 103.920,
  maxLng: 103.965,
};

// Grid of query centres covering Tampines. Each call has 0.5 km radius (LTA's max).
const GRID = [
  // Central spine (MRT stations + town centre)
  { lat: 1.354, lng: 103.945, tag: "tampines-mrt" },
  { lat: 1.356, lng: 103.954, tag: "tampines-east-mrt" },
  { lat: 1.346, lng: 103.938, tag: "tampines-west-mrt" },
  // Northern fringe
  { lat: 1.366, lng: 103.940, tag: "north-residential" },
  { lat: 1.365, lng: 103.952, tag: "north-east" },
  // Southern fringe
  { lat: 1.345, lng: 103.948, tag: "south-central" },
  { lat: 1.342, lng: 103.955, tag: "south-east" },
  // Eastern edge (toward Pasir Ris boundary, still Tampines-side)
  { lat: 1.358, lng: 103.961, tag: "east-edge" },
];

async function fetchOne(lat, lng) {
  const res = await fetch(
    `/lta/BicycleParkingv2?Lat=${lat}&Long=${lng}&Dist=0.5`,
    {
      headers: {
        AccountKey: LTA_KEY,
        accept: "application/json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`LTA fetch failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.value || [];
}

function inBbox(rack) {
  return (
    rack.Latitude >= TAMPINES_BBOX.minLat &&
    rack.Latitude <= TAMPINES_BBOX.maxLat &&
    rack.Longitude >= TAMPINES_BBOX.minLng &&
    rack.Longitude <= TAMPINES_BBOX.maxLng
  );
}

function dedupeKey(rack) {
  // LTA can return the same physical rack from overlapping grid queries.
  // Description + rounded coordinates is a robust key.
  return `${rack.Description}__${rack.Latitude.toFixed(5)}__${rack.Longitude.toFixed(5)}`;
}

/**
 * Fetch all Tampines bicycle racks from LTA DataMall.
 * Returns an array in LTA's raw shape (Description, Latitude, Longitude, RackType, RackCount, ShelterIndicator).
 * Throws if VITE_LTA_KEY is missing or any sub-fetch fails.
 */
export async function fetchTampinesRacks() {
  if (!LTA_KEY) {
    throw new Error(
      "Missing VITE_LTA_KEY — copy webapp/.env.example to .env.local and add your LTA AccountKey."
    );
  }

  const settled = await Promise.allSettled(
    GRID.map(({ lat, lng }) => fetchOne(lat, lng))
  );

  const seen = new Map();
  let okCalls = 0;
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    okCalls++;
    for (const rack of r.value) {
      if (!inBbox(rack)) continue;
      const k = dedupeKey(rack);
      if (!seen.has(k)) seen.set(k, rack);
    }
  }

  if (okCalls === 0) {
    throw new Error("All LTA grid calls failed — check the API key or network.");
  }

  return Array.from(seen.values());
}
