import { useEffect, useRef, useState } from "react";

import { ROUTES } from "../data/demoRoutes.js";
import "./DemoControl.css";

const STEP_MS = 550;

export default function DemoControl({ onPosition }) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef(null);

  // Latest-callback ref so we don't reset the timer when App passes a new
  // inline setter on each render.
  const cbRef = useRef(onPosition);
  useEffect(() => {
    cbRef.current = onPosition;
  }, [onPosition]);

  useEffect(() => {
    if (!activeRoute) return undefined;

    const waypoints = ROUTES[activeRoute].waypoints;
    cbRef.current?.(waypoints[0]);
    setStepIndex(0);

    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      if (i >= waypoints.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setStepIndex(waypoints.length - 1);
        return;
      }
      cbRef.current?.(waypoints[i]);
      setStepIndex(i);
    }, STEP_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeRoute]);

  const reset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActiveRoute(null);
    setStepIndex(0);
    cbRef.current?.(null);
  };

  const total = activeRoute ? ROUTES[activeRoute].waypoints.length : 0;
  const playing = !!activeRoute && stepIndex < total - 1;
  const finished = !!activeRoute && stepIndex === total - 1;

  return (
    <div className="demo-control" data-state={playing ? "playing" : finished ? "finished" : "idle"}>
      <div className="demo-control__label">DEMO GPS</div>
      <div className="demo-control__row">
        <button
          type="button"
          className="demo-control__btn"
          onClick={() => setActiveRoute("hub")}
          disabled={playing}
        >
          ▶ Hub
        </button>
        <button
          type="button"
          className="demo-control__btn demo-control__btn--alt"
          onClick={() => setActiveRoute("mrt")}
          disabled={playing}
        >
          ▶ MRT
        </button>
        <button
          type="button"
          className="demo-control__btn demo-control__btn--ghost"
          onClick={reset}
          disabled={!activeRoute}
          aria-label="Reset demo route"
        >
          ↻
        </button>
      </div>
      {activeRoute && (
        <div className="demo-control__progress">
          <div
            className="demo-control__progress-fill"
            style={{ width: `${total ? ((stepIndex + 1) / total) * 100 : 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
