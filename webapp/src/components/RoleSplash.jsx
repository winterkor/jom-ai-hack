import "./RoleSplash.css";

export default function RoleSplash({ onPick }) {
  return (
    <div className="splash grain">
      <div className="splash__inner">
        <div className="splash__brand">
          <span className="splash__logo">JOM AI</span>
          <span className="splash__tag">Bicycle parking, smarter — Tampines</span>
        </div>

        <h1 className="splash__title">Who&rsquo;s riding today?</h1>
        <p className="splash__sub">
          Pick a role to enter the right console. Your choice is remembered locally.
        </p>

        <div className="splash__tiles">
          <button
            type="button"
            className="splash-tile splash-tile--rider"
            onClick={() => onPick("user")}
          >
            <div className="splash-tile__icon" aria-hidden>🚲</div>
            <div className="splash-tile__name">I&rsquo;m a rider</div>
            <div className="splash-tile__desc">
              Find a rack nearby, see what&rsquo;s free, get there fast.
            </div>
            <div className="splash-tile__cta">Open user app →</div>
          </button>

          <button
            type="button"
            className="splash-tile splash-tile--maintainer"
            onClick={() => onPick("admin")}
          >
            <div className="splash-tile__icon" aria-hidden>🛠️</div>
            <div className="splash-tile__name">I&rsquo;m a maintainer</div>
            <div className="splash-tile__desc">
              Triage CCTV alerts, check rack occupancy, mark incidents resolved.
            </div>
            <div className="splash-tile__cta">Open ops console →</div>
          </button>
        </div>

        <div className="splash__foot">
          Built for the Tampines Hackathon · LTA DataMall · CCTV vision ·
          ESP32 + MQTT
        </div>
      </div>
    </div>
  );
}
