import "./FAB.css";

// Locate-me button removed: user position is auto-fetched on app mount
// (see App.jsx) so the "you are here" dot is always visible without an
// extra tap.
export default function FAB({ onFindNearest, busy }) {
  return (
    <div className="fab">
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
