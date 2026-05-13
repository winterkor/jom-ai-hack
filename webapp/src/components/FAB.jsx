import "./FAB.css";

export default function FAB({ onFindNearest, onLocate, busy, hasUserPos }) {
  return (
    <div className="fab">
      <button
        className="fab__btn fab__btn--locate"
        onClick={onLocate}
        title={hasUserPos ? "Re-locate me" : "Use my location"}
        aria-label="Locate me"
      >
        <span className="fab__icon" aria-hidden="true">◎</span>
      </button>

      <button
        className="fab__btn fab__btn--primary"
        onClick={onFindNearest}
        disabled={busy}
        aria-label="Find nearest available rack"
      >
        <span className="fab__txt">
          <span className="fab__lbl">FIND NEAREST</span>
          <span className="fab__sub">AVAILABLE RACK</span>
        </span>
        <span className="fab__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
