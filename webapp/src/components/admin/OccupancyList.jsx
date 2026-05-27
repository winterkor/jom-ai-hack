import { useMemo } from "react";
import { getRackStatus } from "../../data/rackData.js";

function pct(rack) {
  if (!rack.totalSlots) return 0;
  return Math.round((rack.occupiedSlots / rack.totalSlots) * 100);
}

function statusPill(status) {
  // Map rack status -> severity pill class
  if (status === "full") return "severity-pill--high";
  if (status === "filling") return "severity-pill--med";
  if (status === "offline") return "severity-pill--low";
  return "severity-pill--ok";
}

function statusLabel(status) {
  if (status === "full") return "Full";
  if (status === "filling") return "Filling";
  if (status === "offline") return "Offline";
  return "Open";
}

// Pull a balanced sample so the panel doesn't show 25 identical "100% FULL"
// rows. We bucket by status, sort each bucket by occupancy desc, then
// interleave so the user sees a realistic spread at a glance.
function balancedSample(racks, limit = 25) {
  const enriched = racks.map((r) => ({
    ...r,
    _pct: pct(r),
    _status: getRackStatus(r),
  }));
  const buckets = {
    full: enriched.filter((r) => r._status === "full").sort((a, b) => b._pct - a._pct),
    filling: enriched.filter((r) => r._status === "filling").sort((a, b) => b._pct - a._pct),
    available: enriched.filter((r) => r._status === "available").sort((a, b) => b._pct - a._pct),
    offline: enriched.filter((r) => r._status === "offline"),
  };
  const order = ["full", "filling", "available", "offline"];
  const out = [];
  let i = 0;
  while (out.length < limit) {
    let added = false;
    for (const key of order) {
      const item = buckets[key][i];
      if (item) {
        out.push(item);
        added = true;
        if (out.length >= limit) break;
      }
    }
    if (!added) break;
    i += 1;
  }
  return out;
}

export default function OccupancyList({ racks, onNavigate }) {
  const ranked = useMemo(() => balancedSample(racks, 25), [racks]);

  const totalSlots = racks.reduce((s, r) => s + r.totalSlots, 0);
  const occupiedSlots = racks.reduce((s, r) => s + r.occupiedSlots, 0);
  const overallPct = totalSlots
    ? Math.round((occupiedSlots / totalSlots) * 100)
    : 0;

  return (
    <>
      <header className="panel-head">
        <div className="panel-head__eyebrow">Occupancy</div>
        <div className="panel-head__count">{overallPct}%</div>
        <div className="panel-head__sub">
          {occupiedSlots} / {totalSlots} slots across {racks.length} racks
        </div>
      </header>

      {ranked.length === 0 ? (
        <div className="panel-empty">No racks loaded.</div>
      ) : (
        <ul className="panel-list">
          {ranked.map((r) => (
            <li
              key={r.id}
              className="panel-row"
              style={{ cursor: onNavigate ? "pointer" : "default" }}
              role={onNavigate ? "button" : undefined}
              tabIndex={onNavigate ? 0 : undefined}
              onClick={() => onNavigate?.(r)}
              onKeyDown={(e) => {
                if (onNavigate && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onNavigate(r);
                }
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="panel-row__title">{r.name}</div>
                <div className="panel-row__sub">
                  {r.occupiedSlots}/{r.totalSlots} slots · {r.id}
                </div>
                <div className="occupancy-bar" aria-hidden>
                  <div
                    className="occupancy-bar__fill"
                    style={{
                      width: `${r._pct}%`,
                      background:
                        r._pct >= 90
                          ? "var(--sev-high)"
                          : r._pct >= 60
                          ? "var(--sev-med)"
                          : "var(--sev-ok)",
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="panel-row__metric">{r._pct}%</div>
                <span
                  className={`severity-pill ${statusPill(r._status)}`}
                  style={{ marginTop: 4 }}
                >
                  {statusLabel(r._status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
