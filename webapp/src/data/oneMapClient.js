// OneMap (data.gov.sg) destination search.
// Endpoint: https://www.onemap.gov.sg/api/common/elastic/search
// No API key required for /common/elastic/search.
// Docs: https://www.onemap.gov.sg/apidocs/apidocs/#searchAPI

const SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search";

/**
 * Search OneMap for Singapore addresses / POIs / blocks matching `query`.
 * Returns up to `limit` results in our normalised shape:
 *   { id, name, address, lat, lng, kind: "place" }
 */
export async function searchOneMap(query, { limit = 6 } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    `${SEARCH_URL}?searchVal=${encodeURIComponent(q)}` +
    `&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return results.slice(0, limit).map((r, i) => ({
      id: `om-${r.SEARCHVAL}-${i}`,
      name: r.SEARCHVAL || r.BUILDING || r.ADDRESS,
      address: r.ADDRESS,
      lat: parseFloat(r.LATITUDE),
      lng: parseFloat(r.LONGITUDE),
      kind: "place",
    }));
  } catch {
    return [];
  }
}
