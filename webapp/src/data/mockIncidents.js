// Static incident fixture used by the maintainer dashboard.
//
// We seed exactly 5 incidents, each at a distinct LTA rack, each with its
// own CV photo. The list is intentionally small so the demo reads as five
// real ops alerts rather than a sea of placeholder rows.

export const INCIDENT_TYPES = {
  illegal_parking: {
    label: "Illegal parking",
    color: "var(--sev-high)",
  },
  abandoned: {
    label: "Abandoned bike",
    color: "var(--sev-med)",
  },
  overflow: {
    label: "Rack overflow",
    color: "var(--sev-low)",
  },
};

export const SEVERITY = {
  high: { label: "High", color: "var(--sev-high)", weight: 3 },
  med: { label: "Medium", color: "var(--sev-med)", weight: 2 },
  low: { label: "Low", color: "var(--sev-low)", weight: 1 },
};

const CV = "/cv/post_processed";
const REF = "/cv/day-compare/Reference.jpg";
const ABANDONED_CMP = "/cv/day-compare/Abandoned_Bikes.jpg";

// Five fixed incidents — one per CV photo + one abandoned (uses Day1/Day2
// comparison instead of a single snapshot). Each is at a distinct rack from
// the live LTA-geojson source (`lta-001`..`lta-005`).
const FIXTURE = [
  {
    rackId: "lta-001",
    type: "illegal_parking",
    severity: "high",
    minutesAgo: 8,
    imageUrl: `${CV}0.jpg`,
    bikeCount: 4,
    note: "Bikes parked outside rack frame, obstructing walkway",
  },
  {
    rackId: "lta-002",
    type: "illegal_parking",
    severity: "med",
    minutesAgo: 27,
    imageUrl: `${CV}1.jpg`,
    bikeCount: 2,
    note: "Bikes leaned against pillar instead of rack",
  },
  {
    rackId: "lta-003",
    type: "overflow",
    severity: "med",
    minutesAgo: 55,
    imageUrl: `${CV}2.jpg`,
    bikeCount: 9,
    note: "Rack at 100%, bikes accumulating around perimeter",
  },
  {
    rackId: "lta-004",
    type: "illegal_parking",
    severity: "low",
    minutesAgo: 140,
    imageUrl: `${CV}3.jpg`,
    bikeCount: 1,
    note: "Single bike chained outside designated zone",
  },
  {
    rackId: "lta-005",
    type: "abandoned",
    severity: "high",
    minutesAgo: 60 * 26,
    imageUrl: ABANDONED_CMP,
    referenceUrl: REF,
    bikeCount: 2,
    note: "Same bikes detected across two consecutive daily scans",
  },
];

function buildIncidents() {
  const now = Date.now();
  return FIXTURE.map((f, i) => ({
    id: `INC-${String(i + 1).padStart(4, "0")}`,
    rackId: f.rackId,
    type: f.type,
    severity: f.severity,
    detectedAt: new Date(now - f.minutesAgo * 60_000).toISOString(),
    imageUrl: f.imageUrl,
    referenceUrl: f.referenceUrl || null,
    bikeCount: f.bikeCount,
    status: "open",
    note: f.note,
  }));
}

export const mockIncidents = buildIncidents();

// Helpers ────────────────────────────────────────────────────────────────────

export function incidentsByRack(incidents) {
  const map = new Map();
  for (const inc of incidents) {
    if (!map.has(inc.rackId)) map.set(inc.rackId, []);
    map.get(inc.rackId).push(inc);
  }
  return map;
}

export function openIncidents(incidents) {
  return incidents.filter((i) => i.status === "open");
}

export function highestSeverity(incidents) {
  let top = null;
  for (const inc of incidents) {
    if (inc.status !== "open") continue;
    const w = SEVERITY[inc.severity].weight;
    if (!top || w > SEVERITY[top].weight) top = inc.severity;
  }
  return top; // null if all resolved / none
}

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
