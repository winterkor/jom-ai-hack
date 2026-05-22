import { useMemo } from "react";
import {
  INCIDENT_TYPES,
  SEVERITY,
  openIncidents,
  timeAgo,
} from "../../data/mockIncidents.js";
import "./LiveFeed.css";

export default function LiveFeed({ incidents, rackIndex, onSelect }) {
  const sorted = useMemo(() => {
    return openIncidents(incidents)
      .slice()
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
      .slice(0, 20);
  }, [incidents]);

  return (
    <div className="livefeed">
      <div className="livefeed__head">
        <span className="livefeed__eyebrow">Live CCTV feed</span>
        <span className="livefeed__count">{sorted.length} latest</span>
        <span className="livefeed__legend" aria-hidden>
          <span className="livefeed__pulse" />
          streaming
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="livefeed__empty">No incidents in the last 24h.</div>
      ) : (
        <div className="livefeed__strip">
          {sorted.map((inc) => {
            const rack = rackIndex.get(inc.rackId);
            const type = INCIDENT_TYPES[inc.type];
            return (
              <button
                key={inc.id}
                type="button"
                className="livefeed__card"
                onClick={() => onSelect(inc.id)}
                title={`${rack ? rack.name : inc.rackId} — ${type.label}`}
              >
                <div
                  className="livefeed__thumb"
                  style={{ backgroundImage: `url('${inc.imageUrl}')` }}
                >
                  <span
                    className={`severity-pill severity-pill--${inc.severity} livefeed__pill`}
                  >
                    {SEVERITY[inc.severity].label}
                  </span>
                </div>
                <div className="livefeed__meta">
                  <div className="livefeed__rack">
                    {rack ? rack.name : inc.rackId}
                  </div>
                  <div className="livefeed__type">
                    {type.label} · {timeAgo(inc.detectedAt)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
