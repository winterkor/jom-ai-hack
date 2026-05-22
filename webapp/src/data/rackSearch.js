// Local rack search — fuzzy-ish ID + name match across the loaded rack list.

export function searchRacks(query, racks, { limit = 6 } = {}) {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const scored = [];
  for (const r of racks) {
    const id = r.id?.toLowerCase() || "";
    const name = r.name?.toLowerCase() || "";
    const addr = r.address?.toLowerCase() || "";

    let score = 0;
    if (id === q) score = 100;
    else if (id.includes(q)) score = 80;
    else if (name.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 50;
    else if (addr.includes(q)) score = 30;

    if (score > 0) {
      scored.push({
        id: `rack-${r.id}`,
        name: r.name,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        rack: r, // pass through full rack record
        kind: "rack",
        _score: score,
      });
    }
  }

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    // eslint-disable-next-line no-unused-vars -- destructure strips _score from output
    .map(({ _score, ...rest }) => rest);
}
