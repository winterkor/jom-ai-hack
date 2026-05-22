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

export default function OccupancyList({ racks }) {
  const ranked = useMemo(() => {
    return [...racks]
      .map((r) => ({ ...r, _pct: pct(r), _status: getRackStatus(r) }))
      .sort((a, b) => b._pct - a._pct)
      .slice(0, 25);
  }, [racks]);

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
            <li key={r.id} className="panel-row" style={{ cursor: "default" }}>
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
