import { useEffect } from "react";
import {
  INCIDENT_TYPES,
  SEVERITY,
  timeAgo,
} from "../../data/mockIncidents.js";
import "./IncidentModal.css";

function formatStamp(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-SG", {
    weekday: "short", day: "numeric", month: "short",
  });
  const time = d.toLocaleTimeString("en-SG", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return `${date} · ${time} SGT`;
}

export default function IncidentModal({ incident, rack, onClose, onResolve }) {
  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!incident) return null;
  const type = INCIDENT_TYPES[incident.type];
  const sev = SEVERITY[incident.severity];
  const hasReference = Boolean(incident.referenceUrl);

  return (
    <div className="imodal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="imodal__card" onClick={(e) => e.stopPropagation()}>
        <header className="imodal__head">
          <div className="imodal__heading">
            <span
              className={`severity-pill severity-pill--${incident.severity}`}
            >
              {sev.label} severity
            </span>
            <h2 className="imodal__title">
              {type.label} — {rack ? rack.name : incident.rackId}
            </h2>
            <div className="imodal__sub">
              {incident.id} · detected {formatStamp(incident.detectedAt)} ·{" "}
              {timeAgo(incident.detectedAt)}
            </div>
          </div>
          <button
            type="button"
            className="imodal__close"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ×
          </button>
        </header>

        <div className="imodal__body">
          <div className={`imodal__images${hasReference ? " imodal__images--cmp" : ""}`}>
            {hasReference && (
              <figure className="imodal__figure">
                <img src={incident.referenceUrl} alt="Reference (Day 1)" />
                <figcaption>Reference · Day 1</figcaption>
              </figure>
            )}
            <figure className="imodal__figure">
              <img src={incident.imageUrl} alt="CCTV detection" />
              <figcaption>
                {hasReference ? "Detection · Day 2" : "CCTV detection"}
              </figcaption>
            </figure>
          </div>

          <aside className="imodal__meta">
            <Row label="Rack">
              {rack ? (
                <>
                  <strong>{rack.name}</strong>
                  <span className="imodal__rackid">{rack.id}</span>
                  {rack.address && <span>{rack.address}</span>}
                </>
              ) : (
                incident.rackId
              )}
            </Row>
            <Row label="Type">{type.label}</Row>
            <Row label="Bikes seen">{incident.bikeCount}</Row>
            {rack && (
              <Row label="Occupancy">
                {rack.occupiedSlots}/{rack.totalSlots} ·{" "}
                {Math.round((rack.occupiedSlots / rack.totalSlots) * 100)}%
              </Row>
            )}
            <Row label="Note">
              <span className="imodal__note">{incident.note}</span>
            </Row>
            <Row label="Source">CV backend (CCTV)</Row>
          </aside>
        </div>

        <footer className="imodal__foot">
          <span className="imodal__hint">Press Esc to close</span>
          <div className="imodal__actions">
            <button
              type="button"
              className="imodal__btn imodal__btn--ghost"
              onClick={onClose}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="imodal__btn imodal__btn--primary"
              onClick={onResolve}
            >
              ✓ Mark resolved
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="imodal__row">
      <div className="imodal__label">{label}</div>
      <div className="imodal__value">{children}</div>
    </div>
  );
}
