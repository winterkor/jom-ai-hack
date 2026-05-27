import { useEffect, useRef, useState } from "react";
import "./LockSessionCard.css";

// Visible whenever a parked session exists. Reflects the live ESP32 NFC lock
// state pushed via MQTT. Collapsible to a status chip so it doesn't dominate
// the map; auto-collapses a few seconds after a successful lock so the user
// feels rewarded then gets their map back.

const COLLAPSE_KEY = "jom-locksession-collapsed";
const AUTO_COLLAPSE_MS = 4000;

function formatParkedFor(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `Parked ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Parked ${m}m ago`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `Parked ${h}h ${rem}m ago` : `Parked ${h}h ago`;
}

// Short stable rack-id badge derived from the rack id. LTA ids are long
// alphanumeric strings; we shorten to the last 4 chars uppercased so the
// badge is glanceable.
function rackBadge(rackId) {
  if (!rackId) return "TPN";
  const cleaned = String(rackId).replace(/[^A-Za-z0-9]/g, "");
  const tail = cleaned.slice(-4).toUpperCase();
  return `TPN-${tail || "0000"}`;
}

export default function LockSessionCard({
  session,
  lockState,
  onFindBike,
  onDirections,
  onEndSession,
}) {
  // Ticks once a second so the elapsed label stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const persistCollapsed = (next) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  // Auto-collapse 4s after we first see a "locked" state, so the user
  // gets the confirmation then the map breathes again. We only do this
  // once per session by tracking the previous lockState.
  const prevStateRef = useRef(lockState);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = lockState;
    if (prev !== "locked" && lockState === "locked") {
      const id = setTimeout(() => persistCollapsed(true), AUTO_COLLAPSE_MS);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [lockState]);

  if (!session) return null;

  const isLocked = lockState === "locked";
  const isUnlocked = lockState === "unlocked";
  const tone = isLocked ? "locked" : isUnlocked ? "unlocked" : "pending";

  const pillIcon = isLocked ? "🔒" : isUnlocked ? "🔓" : "⌛";
  const pillLabel = isLocked
    ? "Locked"
    : isUnlocked
      ? "Unlocked"
      : "Locking…";

  const heading = isUnlocked ? "Welcome back" : "Parked at";
  const elapsed = formatParkedFor(Date.now() - session.startedAt);
  const badge = rackBadge(session.rackId);

  if (collapsed) {
    return (
      <button
        type="button"
        className="locksession-chip"
        data-tone={tone}
        onClick={() => persistCollapsed(false)}
        aria-label={`${pillLabel} — expand parking session`}
      >
        <span className="locksession-chip__dot" aria-hidden="true" />
        <span className="locksession-chip__label">{pillLabel}</span>
        <span className="locksession-chip__badge">{badge}</span>
      </button>
    );
  }

  return (
    <aside
      className="locksession"
      role="region"
      aria-label="Active parking session"
      data-tone={tone}
    >
      <div className="locksession__top">
        <span className="locksession__elapsed">{elapsed}</span>
        <span className="locksession__pill" data-tone={tone}>
          <span className="locksession__pill-icon" aria-hidden="true">{pillIcon}</span>
          <span>{pillLabel}</span>
        </span>
        <button
          type="button"
          className="locksession__collapse"
          onClick={() => persistCollapsed(true)}
          aria-label="Collapse"
          title="Collapse"
        >
          ⌄
        </button>
      </div>

      <div className="locksession__main">
        <div className="locksession__heading">{heading}</div>
        <div className="locksession__rack" title={session.rackName}>
          {session.rackName}
        </div>
        <div className="locksession__badge">{badge}</div>
      </div>

      <div className="locksession__actions">
        <button
          type="button"
          className="locksession__btn locksession__btn--primary"
          onClick={() =>
            onDirections ? onDirections(session) : onFindBike?.(session.rackId)
          }
        >
          Find my bike
        </button>
      </div>

      <button
        type="button"
        className="locksession__end"
        onClick={onEndSession}
      >
        End session
      </button>
    </aside>
  );
}
