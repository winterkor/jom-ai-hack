import "./NavPreviewCard.css";

// Bottom card shown after a route is fetched but before the user taps Start.
// Mirrors Google Maps' "Bicycle · 18 min · Arrive 16:51" preview band.
export default function NavPreviewCard({ route, rack, onStart, onCancel }) {
  if (!route) return null;

  const minutes = Math.max(1, Math.round(route.durationS / 60));
  const distLabel = formatMeters(route.distanceM);
  const arrival = formatArrival(route.durationS);

  return (
    <aside className="navprev" role="region" aria-label="Route preview">
      <div className="navprev__row">
        <div className="navprev__mode">
          <span className="navprev__bike" aria-hidden="true">🚲</span>
          <span className="navprev__mode-text">BICYCLE</span>
        </div>
        <button
          type="button"
          className="navprev__cancel"
          onClick={onCancel}
          aria-label="Cancel route preview"
        >
          ✕
        </button>
      </div>

      <div className="navprev__body">
        <div className="navprev__numeral">
          {minutes}
          <span className="navprev__unit">min</span>
        </div>
        <div className="navprev__meta">
          <div className="navprev__arrive">Arrive {arrival}</div>
          <div className="navprev__dist">
            {distLabel}
            {rack?.name ? ` · ${rack.name}` : ""}
          </div>
          <div className="navprev__hint">Mostly bike paths · Mostly flat</div>
        </div>
      </div>

      <button
        type="button"
        className="navprev__start"
        onClick={onStart}
        aria-label="Start navigation"
      >
        <span className="navprev__start-arrow" aria-hidden="true">▶</span>
        <span className="navprev__start-text">START</span>
      </button>
    </aside>
  );
}

function formatMeters(m) {
  if (m == null) return "";
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatArrival(durationS) {
  const t = new Date(Date.now() + durationS * 1000);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
