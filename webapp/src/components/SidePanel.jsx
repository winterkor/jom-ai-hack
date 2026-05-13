import { useEffect, useState } from "react";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import "./SidePanel.css";

const STATUS_LABEL = {
  available: "AVAILABLE",
  filling: "FILLING UP",
  full: "FULL",
};

export default function SidePanel({ rack, onClose }) {
  const [renderedRack, setRenderedRack] = useState(rack);

  useEffect(() => {
    if (rack) setRenderedRack(rack);
  }, [rack]);

  if (!renderedRack) return null;

  const status = getRackStatus(renderedRack);
  const available = getAvailableSlots(renderedRack);
  const occupancyPct = Math.round(
    (renderedRack.occupiedSlots / renderedRack.totalSlots) * 100
  );
  const idx = renderedRack.id.split("-")[1] || "—";

  return (
    <aside
      className={`panel ${rack ? "panel--open" : "panel--closed"}`}
      data-status={status}
      key={renderedRack.id}
    >
      <button className="panel__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="panel__band" data-status={status}>
        <span className="panel__band-dot" />
        {STATUS_LABEL[status]}
      </div>

      <div className="panel__hero">
        <div className="panel__numeral">{idx}</div>
        <div className="panel__heroside">
          <div className="panel__id">RACK · {renderedRack.id}</div>
          <h2 className="panel__name">{renderedRack.name}</h2>
        </div>
      </div>

      <div className="panel__addr">
        <span className="panel__addr-label">LOCATION</span>
        <span className="panel__addr-text">{renderedRack.address}</span>
      </div>

      {/* MRT train-load indicator styled capacity bar */}
      <div className="panel__capacity">
        <div className="panel__capacity-head">
          <span className="panel__capacity-label">CAPACITY</span>
          <span className="panel__capacity-pct">{occupancyPct}%</span>
        </div>
        <CapacityCarriages
          total={renderedRack.totalSlots}
          occupied={renderedRack.occupiedSlots}
          status={status}
        />
      </div>

      <div className="panel__grid">
        <Cell label="TOTAL" value={renderedRack.totalSlots} />
        <Cell label="OCCUPIED" value={renderedRack.occupiedSlots} />
        <Cell label="AVAILABLE" value={available} highlight={status !== "full"} />
      </div>

      <div className="panel__foot">
        <div className="panel__coords">
          {renderedRack.lat.toFixed(4)}°N · {renderedRack.lng.toFixed(4)}°E
        </div>
        <div className="panel__source">DATA · MOCK / LTA-READY</div>
      </div>
    </aside>
  );
}

function Cell({ label, value, highlight }) {
  return (
    <div className={`cell ${highlight ? "cell--hi" : ""}`}>
      <div className="cell__label">{label}</div>
      <div className="cell__value">{value}</div>
    </div>
  );
}

function CapacityCarriages({ total, occupied, status }) {
  // Render 14 segments — same look as SMRT's 6-carriage load indicator but denser
  const SEGMENTS = 14;
  const filledSegs = Math.round((occupied / total) * SEGMENTS);

  return (
    <div className="carriages">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={`carriage ${i < filledSegs ? "carriage--on" : ""}`}
          data-status={status}
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}
