import "./Legend.css";

const ROWS = [
  { status: "available", label: "AVAILABLE", desc: "under 60% full" },
  { status: "filling", label: "FILLING UP", desc: "60–90% full" },
  { status: "full", label: "FULL", desc: "over 90% full" },
];

export default function Legend() {
  return (
    <div className="legend">
      <div className="legend__head">
        <div className="legend__title">STATUS KEY</div>
        <div className="legend__sub">RACK AVAILABILITY</div>
      </div>
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
