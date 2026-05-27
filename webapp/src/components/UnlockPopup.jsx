import { useEffect } from "react";
import "./UnlockPopup.css";

// Auto-shown bottom sheet that appears the moment the ESP32 publishes an
// "unlocked" state while a session is active. Gives the user one obvious
// way out — End session — without forcing it (Keep parked handles accidents).
//
// Rendering is controlled by the parent: open=true mounts, open=false hides.
// We intentionally don't include a backdrop click-to-dismiss so the user
// makes a deliberate choice between the two outcomes.

export default function UnlockPopup({ open, rackName, onEndSession, onKeep }) {
  // Escape key dismisses to "Keep parked" — non-destructive default.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onKeep?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onKeep]);

  if (!open) return null;

  return (
    <div className="unlockpop" role="dialog" aria-modal="true" aria-label="Bike unlocked">
      <div className="unlockpop__sheet">
        <div className="unlockpop__icon" aria-hidden="true">🔓</div>
        <div className="unlockpop__title">Welcome back</div>
        <div className="unlockpop__body">
          Your bike at <strong>{rackName}</strong> just unlocked.
          End the session to free the rack?
        </div>
        <div className="unlockpop__actions">
          <button
            type="button"
            className="unlockpop__btn unlockpop__btn--primary"
            onClick={onEndSession}
            autoFocus
          >
            End session
          </button>
          <button
            type="button"
            className="unlockpop__btn unlockpop__btn--ghost"
            onClick={onKeep}
          >
            Keep parked
          </button>
        </div>
      </div>
    </div>
  );
}
