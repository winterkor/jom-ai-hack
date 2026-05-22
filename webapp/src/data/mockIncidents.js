// Static incident fixture used by the maintainer dashboard.
//
// Each incident references a rack by id. We seed against the mock rack ids
// (TPN-01..TPN-10) AND the first few live LTA-derived ids (TPN-001..TPN-010)
// so the admin view has data regardless of which rack source loaded.
//
// When the real CV backend lands, swap this for a fetch.

export const INCIDENT_TYPES = {
  illegal_parking: {
    label: "Illegal parking",
    color: "#E53935", // MRT red — high attention
  },
  abandoned: {
    label: "Abandoned bike",
    color: "#FB8C00", // MRT orange
  },
  overflow: {
    label: "Rack overflow",
    color: "#FDB813", // MRT yellow
  },
};

export const SEVERITY = {
  high: { label: "High", color: "#E53935", weight: 3 },
  med: { label: "Medium", color: "#FB8C00", weight: 2 },
  low: { label: "Low", color: "#FDB813", weight: 1 },
};

const CV = "/cv/post_processed";
const REF = "/cv/day-compare/Reference.jpg";
const ABANDONED_CMP = "/cv/day-compare/Abandoned_Bikes.jpg";

// Pin incidents to BOTH mock and live LTA id schemes.
const BASE = [
  {
    rackKey: "01", type: "illegal_parking", severity: "high",
    minutesAgo: 12, image: `${CV}2.jpg`, bikeCount: 4,
    note: "Multiple bikes parked outside rack frame, blocking walkway",
  },
  {
    rackKey: "01", type: "overflow", severity: "med",
    minutesAgo: 38, image: `${CV}0.jpg`, bikeCount: 9,
    note: "Rack at 100%, bikes accumulating around perimeter",
  },
  {
    rackKey: "02", type: "abandoned", severity: "high",
    minutesAgo: 60 * 26, image: ABANDONED_CMP, reference: REF, bikeCount: 2,
    note: "Same bikes detected for 2+ consecutive days (Day 1 vs Day 2)",
  },
  {
    rackKey: "03", type: "illegal_parking", severity: "med",
    minutesAgo: 75, image: `${CV}1.jpg`, bikeCount: 2,
    note: "Bikes leaned against pillar instead of rack",
  },
  {
    rackKey: "04", type: "illegal_parking", severity: "low",
    minutesAgo: 140, image: `${CV}3.jpg`, bikeCount: 1,
    note: "Single bike chained outside designated zone",
  },
  {
    rackKey: "05", type: "abandoned", severity: "med",
    minutesAgo: 60 * 50, image: ABANDONED_CMP, reference: REF, bikeCount: 1,
    note: "Bike unmoved for 50+ hours",
  },
  {
    rackKey: "06", type: "illegal_parking", severity: "high",
    minutesAgo: 8, image: `${CV}4.jpg`, bikeCount: 3,
    note: "Cluster of bikes obstructing emergency access",
  },
  {
    rackKey: "07", type: "overflow", severity: "low",
    minutesAgo: 200, image: `${CV}0.jpg`, bikeCount: 5,
    note: "Rack near capacity",
  },
  {
    rackKey: "08", type: "illegal_parking", severity: "med",
    minutesAgo: 22, image: `${CV}2.jpg`, bikeCount: 2,
    note: "Bikes parked across pedestrian path",
  },
  {
    rackKey: "09", type: "abandoned", severity: "low",
    minutesAgo: 60 * 80, image: ABANDONED_CMP, reference: REF, bikeCount: 1,
    note: "Possible abandonment — flagged for review",
  },
];

// Some bonus incidents at LTA-only ids (won't show if running on mocks, fine)
const LTA_ONLY = [
  {
    rackId: "TPN-011", type: "illegal_parking", severity: "high",
    minutesAgo: 4, image: `${CV}4.jpg`, bikeCount: 3,
    note: "Live alert from CCTV",
  },
  {
    rackId: "TPN-015", type: "overflow", severity: "med",
    minutesAgo: 55, image: `${CV}0.jpg`, bikeCount: 7,
    note: "Sustained overflow during evening peak",
  },
  {
    rackId: "TPN-020", type: "abandoned", severity: "med",
    minutesAgo: 60 * 40, image: ABANDONED_CMP, reference: REF, bikeCount: 1,
    note: "Bike present across both daily scans",
  },
];

function buildIncidents() {
  const now = Date.now();
  const items = [];
  let n = 1;
  const push = (rackId, base) => {
    items.push({
      id: `INC-${String(n++).padStart(4, "0")}`,
      rackId,
      type: base.type,
      severity: base.severity,
      detectedAt: new Date(now - base.minutesAgo * 60_000).toISOString(),
      imageUrl: base.image,
      referenceUrl: base.reference || null,
      bikeCount: base.bikeCount,
      status: "open",
      note: base.note,
    });
  };
  for (const b of BASE) {
    push(`TPN-${b.rackKey}`, b); // mock rack id form
    push(`TPN-0${b.rackKey}`, b); // live LTA-derived rack id form (TPN-001..)
  }
  for (const b of LTA_ONLY) push(b.rackId, b);
  return items;
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
