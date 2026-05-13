import "./Header.css";

export default function Header({ racksOnline, availableSlots }) {
  const now = new Date();
  const stamp = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")} SGT`;

  return (
    <header className="hdr">
      <div className="hdr__stripe" aria-hidden="true">
        <span className="hdr__stripe-block" data-c="green" />
        <span className="hdr__stripe-block" data-c="amber" />
        <span className="hdr__stripe-block" data-c="red" />
      </div>

      <div className="hdr__row">
        <div className="hdr__brand">
          <div className="hdr__mark">TPN</div>
          <div className="hdr__lines">
            <div className="hdr__title">PARK·NET</div>
            <div className="hdr__sub">
              TAMPINES BICYCLE NETWORK <span className="hdr__dot">●</span> LIVE
            </div>
          </div>
        </div>

        <div className="hdr__stats">
          <Stat label="RACKS ONLINE" value={racksOnline} />
          <Stat label="SLOTS FREE" value={availableSlots} highlight />
          <Stat label="LOCAL TIME" value={stamp} mono />
        </div>
      </div>

      <div className="hdr__hazard" aria-hidden="true" />
    </header>
  );
}

function Stat({ label, value, highlight, mono }) {
  return (
    <div className={`stat ${highlight ? "stat--hi" : ""}`}>
      <div className="stat__label">{label}</div>
      <div className={`stat__value ${mono ? "stat__value--mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
