import { cyclingEtaMinutes, formatDistance } from "../data/geo.js";
import "./RouteInfo.css";

export default function RouteInfo({ route, onCancel }) {
  if (!route) return null;
  const { distanceKm, isStraightLine, targetRack } = route;
  const eta = cyclingEtaMinutes(distanceKm);

  return (
    <div className="routeinfo">
      <div className="routeinfo__band">
        <span className="routeinfo__dot" />
        ROUTING · {isStraightLine ? "STRAIGHT" : "CYCLING"}
      </div>
      <div className="routeinfo__body">
        <div className="routeinfo__col">
          <div className="routeinfo__lbl">DISTANCE</div>
          <div className="routeinfo__val">{formatDistance(distanceKm)}</div>
        </div>
        <div className="routeinfo__col">
          <div className="routeinfo__lbl">ETA · BIKE</div>
          <div className="routeinfo__val">{eta} MIN</div>
        </div>
        <button
          className="routeinfo__cancel"
          onClick={onCancel}
          aria-label="Cancel route"
        >
          ✕
        </button>
      </div>
      <div className="routeinfo__target">→ {targetRack.name}</div>
    </div>
  );
}
