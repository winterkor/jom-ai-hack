import { useState } from "react";
import "./Legend.css";

const ROWS = [
  { status: "available", label: "AVAILABLE", desc: "under 60% full" },
  { status: "filling", label: "FILLING UP", desc: "60–90% full" },
  { status: "full", label: "FULL", desc: "over 90% full" },
];

export default function Legend() {
  // Collapsed by default on phones; CSS keeps it always-open on desktop.
  const [open, setOpen] = useState(false);

  return (
    <div className={`legend ${open ? "legend--open" : ""}`}>
      <button
        type="button"
        className="legend__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="legend__titles">
          <div className="legend__title">STATUS KEY</div>
          <div className="legend__sub">RACK AVAILABILITY</div>
        </div>
        <span className="legend__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <ul className="legend__rows">
        {ROWS.map((r) => (
          <li key={r.status} className="legend__row">
            <span className={`legend__chip`} data-status={r.status} />
            <div className="legend__txt">
              <div className="legend__label">{r.label}</div>
              <div className="legend__desc">{r.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
