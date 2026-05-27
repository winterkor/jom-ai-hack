import { maneuverGlyph, maneuverHint } from "./nav-icons.js";
import "./NavBanner.css";

// Sticky green top banner during active navigation. Mirrors Google Maps'
// turn instruction band — big glyph + street name + a "Then" preview of
// the upcoming maneuver below.
export default function NavBanner({ step, nextStep, distanceToStepM }) {
  if (!step) return null;
  const glyph = maneuverGlyph(step);
  const street = step.name?.trim();
  const name =
    step.type === "depart"
      ? street || "Start cycling"
      : street || maneuverHint(step);
  const distHint =
    distanceToStepM != null && step.type !== "arrive"
      ? formatMeters(distanceToStepM)
      : null;

  return (
    <div className="navbanner" role="status" aria-live="polite">
      <div className="navbanner__main">
        <div className="navbanner__glyph" aria-hidden="true">
          {glyph}
        </div>
        <div className="navbanner__text">
          {distHint && <div className="navbanner__dist">In {distHint}</div>}
          <div className="navbanner__street">{name}</div>
        </div>
      </div>

      {nextStep && nextStep.type !== "arrive" && (
        <div className="navbanner__then">
          <span className="navbanner__then-label">Then</span>
          <span className="navbanner__then-glyph" aria-hidden="true">
            {maneuverGlyph(nextStep)}
          </span>
        </div>
      )}
    </div>
  );
}

function formatMeters(m) {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
