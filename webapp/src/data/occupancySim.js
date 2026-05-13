// Occupancy simulator
//
// LTA DataMall gives us where racks are and how many slots each has — but NOT how
// many bikes are currently parked. Until the ESP32 sensor track goes live, we fake
// it here.
//
// Goals:
//   - Deterministic per rack (same rack = same number across reloads) so the demo
//     doesn't feel random.
//   - Realistic distribution: racks near MRT / malls / hubs trend full; quieter
//     residential racks have more space. Sheltered racks slightly fuller than
//     un-sheltered (people prefer covered parking).
//   - Mild time-of-day shift so demo at 9 AM vs 9 PM feels alive.

// xmur3 — simple deterministic string hasher (returns a [0,1) PRNG seed)
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Hot-spot keywords (rack description matches → target occupancy bumps up)
const HOTSPOT_KEYWORDS = [
  { re: /\bmrt\b|station/i, bump: 0.25 },
  { re: /mall|hub|plaza/i, bump: 0.22 },
  { re: /school|polytechnic|college|institute/i, bump: 0.18 },
  { re: /market|food.?cent|hawker/i, bump: 0.15 },
  { re: /library|community|cc\b/i, bump: 0.12 },
  { re: /clinic|polyclinic|hospital/i, bump: 0.10 },
  { re: /stadium|sports|park/i, bump: 0.06 },
  { re: /blk|block|hdb/i, bump: -0.05 }, // residential, slightly emptier
];

function locationBump(description = "") {
  let bump = 0;
  for (const { re, bump: b } of HOTSPOT_KEYWORDS) {
    if (re.test(description)) bump += b;
  }
  return bump;
}

// Sheltered racks tend ~6% fuller (people pick covered parking first)
function shelterBump(shelterIndicator) {
  return shelterIndicator === "Y" ? 0.06 : 0;
}

// Time-of-day shift: AM peak 8–10, PM peak 17–19 → higher occupancy
function timeOfDayBump(now = new Date()) {
  const h = now.getHours();
  if (h >= 8 && h <= 10) return 0.08;
  if (h >= 17 && h <= 19) return 0.10;
  if (h >= 23 || h <= 5) return -0.10; // overnight, quieter
  return 0;
}

/**
 * Given an LTA rack record, return a deterministic simulated occupiedSlots count.
 * Idempotent — same input always yields the same output (modulo time-of-day band).
 */
export function simulateOccupiedSlots(rack, now = new Date()) {
  const total = rack.RackCount || 10;
  const seed = xmur3(
    `${rack.Description}|${rack.Latitude}|${rack.Longitude}`
  );

  // Base in [0.35, 0.85] — most racks lean busy, matches interview finding (">75% full")
  const base = 0.35 + seed() * 0.50;

  const target =
    base +
    locationBump(rack.Description) +
    shelterBump(rack.ShelterIndicator) +
    timeOfDayBump(now) +
    (seed() - 0.5) * 0.08; // small jitter so identical locations don't twin

  const clamped = Math.max(0, Math.min(1, target));
  return Math.round(total * clamped);
}
