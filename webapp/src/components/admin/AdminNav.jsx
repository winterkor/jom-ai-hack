import "./AdminNav.css";

export default function AdminNav({ openCount, dataState, onExit, onHome }) {
  return (
    <nav className="admin-nav">
      <div className="admin-nav__brand">
        <button
          type="button"
          className="admin-nav__logo"
          onClick={onHome}
          title="Back to role select"
        >
          JOM AI
        </button>
        <span className="admin-nav__divider" />
        <span className="admin-nav__mode">Maintainer</span>
      </div>

      <div className="admin-nav__tabs">
        <button type="button" className="admin-nav__tab admin-nav__tab--active">
          Dashboard
        </button>
        <button type="button" className="admin-nav__tab" disabled title="Coming soon">
          Geofencing
        </button>
      </div>

      <div className="admin-nav__right">
        <span className="admin-nav__alerts" aria-label="open incidents">
          <span className="admin-nav__dot" />
          {openCount} open
        </span>
        <span className="admin-nav__data" data-state={dataState}>
          {dataState === "live" ? "LIVE" : dataState === "mock" ? "MOCK" : "…"}
        </span>
        <button type="button" className="admin-nav__exit" onClick={onExit}>
          ← User app
        </button>
      </div>
    </nav>
  );
}
