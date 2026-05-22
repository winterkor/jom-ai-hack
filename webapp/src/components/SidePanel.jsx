import { useEffect, useState } from "react";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import { haversineKm, formatDistance } from "../data/geo.js";
import "./SidePanel.css";

const STATUS_LABEL = {
  available: "AVAILABLE",
  filling: "FILLING UP",
  full: "FULL",
  offline: "OFFLINE",
};

export default function SidePanel({
  rack,
  userPos,
  expanded,
  onToggleExpand,
  onClose,
  onStartNavigation,
}) {
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

  const distanceKm = userPos
    ? haversineKm(userPos, { lat: renderedRack.lat, lng: renderedRack.lng })
    : null;

  return (
    <aside
      className={`panel ${rack ? "panel--open" : "panel--closed"}`}
      data-status={status}
      data-expanded={expanded ? "true" : "false"}
      key={renderedRack.id}
    >
      <button
        type="button"
        className="panel__handle"
        onClick={onToggleExpand}
        aria-label={expanded ? "Collapse details" : "Expand details"}
        aria-expanded={expanded}
      >
        <span className="panel__grip" />
      </button>

      <button className="panel__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="panel__band" data-status={status}>
        <span className="panel__band-dot" />
        {STATUS_LABEL[status]}
      </div>

      {/* ── PEEK (always visible) ── */}
      <button
        type="button"
        className="panel__peek"
        onClick={onToggleExpand}
        aria-label="Toggle rack details"
      >
        <div className="panel__id">RACK · {renderedRack.id}</div>
        <h2 className="panel__name">{renderedRack.name}</h2>
        <div className="panel__meta">
          {distanceKm != null && (
            <span className="panel__dist">
              {formatDistance(distanceKm)} away
            </span>
          )}
          <span className="panel__free" data-status={status}>
            {available} / {renderedRack.totalSlots} FREE
          </span>
        </div>
      </button>

      <button
        type="button"
        className="panel__nav"
        onClick={onStartNavigation}
        title={
          userPos
            ? "Draw a cycling route from your location"
            : "We'll grab your location first"
        }
      >
        <span className="panel__nav-arrow" aria-hidden="true">▸</span>
        <span className="panel__nav-main">START NAVIGATION</span>
        <span className="panel__nav-tag">
          {userPos ? "TAP TO ROUTE" : "WILL LOCATE FIRST"}
        </span>
      </button>

      {/* ── EXPANDED (revealed on tap) ── */}
      <div className="panel__expand">
        <div className="panel__hero">
          <div className="panel__numeral">{idx}</div>
          <div className="panel__addr">
            <span className="panel__addr-label">LOCATION</span>
            <span className="panel__addr-text">{renderedRack.address}</span>
          </div>
        </div>

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
          <Cell
            label="AVAILABLE"
            value={available}
            highlight={status !== "full"}
          />
        </div>

        <div className="panel__foot">
          <div className="panel__coords">
            {renderedRack.lat.toFixed(4)}°N · {renderedRack.lng.toFixed(4)}°E
          </div>
          <div className="panel__source">
            {renderedRack.source === "lta"
              ? "LTA · SIM OCCUPANCY"
              : "MOCK DATA"}
          </div>
        </div>
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
