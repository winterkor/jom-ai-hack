import "./NavExitBar.css";

// Compact bottom bar during active nav — total ETA/distance/arrival on the
// left, big red Exit button on the right (matching Google Maps' nav chrome).
export default function NavExitBar({ route, onExit }) {
  if (!route) return null;
  const minutes = Math.max(1, Math.round(route.durationS / 60));
  const distLabel = formatMeters(route.distanceM);
  const arrival = formatArrival(route.durationS);

  return (
    <div className="navexit" role="region" aria-label="Navigation status">
      <div className="navexit__info">
        <div className="navexit__numeral">
          {minutes}
          <span className="navexit__unit">min</span>
        </div>
        <div className="navexit__meta">
          <div className="navexit__line">{distLabel} · ETA {arrival}</div>
          <div className="navexit__sub">CYCLING · LIVE</div>
        </div>
      </div>

      <button
        type="button"
        className="navexit__btn"
        onClick={onExit}
        aria-label="Exit navigation"
      >
        EXIT
      </button>
    </div>
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
