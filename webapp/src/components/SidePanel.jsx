import { useEffect, useRef, useState } from "react";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import "./SidePanel.css";

const STATUS_LABEL = {
  available: "AVAILABLE",
  filling: "FILLING UP",
  full: "FULL",
};

export default function SidePanel({ rack, onClose }) {
  const [renderedRack, setRenderedRack] = useState(rack);
  // Mobile bottom-sheet state — ignored by CSS above 720px.
  const [sheet, setSheet] = useState("peek"); // "peek" | "full"
  const [dragY, setDragY] = useState(null); // active-drag px offset, else null
  const dragRef = useRef({ active: false, startY: 0, moved: 0 });

  useEffect(() => {
    if (rack) {
      setRenderedRack(rack);
      setSheet("peek"); // every freshly opened rack starts peeking
    }
  }, [rack]);

  const onHandleDown = (e) => {
    dragRef.current = { active: true, startY: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onHandleMove = (e) => {
    if (!dragRef.current.active) return;
    let dy = e.clientY - dragRef.current.startY;
    dy = Math.max(dy, -200); // cap the upward over-pull
    if (sheet === "full") dy = Math.max(dy, 0); // can't pull above full
    dragRef.current.moved = dy;
    setDragY(dy);
  };

  const endDrag = () => {
    const dy = dragRef.current.moved;
    dragRef.current.active = false;
    setDragY(null);
    const TAP = 6;
    const SNAP = 56;
    const DISMISS = 96;
    if (Math.abs(dy) < TAP) {
      setSheet((s) => (s === "peek" ? "full" : "peek"));
      return;
    }
    if (dy > DISMISS) {
      onClose();
      return;
    }
    if (dy < -SNAP && sheet === "peek") setSheet("full");
    else if (dy > SNAP && sheet === "full") setSheet("peek");
  };

  if (!renderedRack) return null;

  const status = getRackStatus(renderedRack);
  const available = getAvailableSlots(renderedRack);
  const occupancyPct = Math.round(
    (renderedRack.occupiedSlots / renderedRack.totalSlots) * 100
  );
  const idx = renderedRack.id.split("-")[1] || "—";

  return (
    <aside
      className={`panel ${rack ? "panel--open" : "panel--closed"} ${
        dragY != null ? "panel--dragging" : ""
      }`}
      data-status={status}
      data-sheet={sheet}
      key={renderedRack.id}
      style={dragY != null ? { transform: `translateY(${dragY}px)` } : undefined}
    >
      <div
        className="panel__handle"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="button"
        tabIndex={0}
        aria-label="Drag to expand or dismiss"
      >
        <span className="panel__grip" />
      </div>

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
