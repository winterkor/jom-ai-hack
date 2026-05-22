// Wrapper around the teammate backend (FastAPI + PostGIS).
// All calls go through the Vite proxy at /api/* → localhost:8000.
//
// Designed to fail soft: every function returns { ok, data, error } so callers
// can fall back to mock data without try/catch noise. The hackathon demo runs
// even when the backend is down.

const BASE = "/api";

async function request(path, init) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) {
      return { ok: false, data: null, error: `HTTP ${res.status}` };
    }
    return { ok: true, data: await res.json(), error: null };
  } catch (err) {
    return { ok: false, data: null, error: err.message || String(err) };
  }
}

export async function getNearbyRacks(lat, lng, radiusM = 500, limit = 10) {
  const qs = new URLSearchParams({ lat, lng, radius_m: radiusM, limit }).toString();
  return request(`/racks/nearby?${qs}`);
}

export async function validateParking(lat, lng) {
  return request("/parking/validate", {
    method: "POST",
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  });
}

// Optional: GET /zones doesn't exist yet on the teammate backend.
// If/when Lbleeee adds it, this works without code changes. Until then,
// callers should fall back to the local zones.geojson fixture.
export async function getZones() {
  return request("/zones");
}
