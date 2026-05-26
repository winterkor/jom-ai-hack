import { getAvailableSlots } from "../data/rackData.js";
import "./ParkingConfirmCard.css";

export default function ParkingConfirmCard({
  state,
  rack,
  onConfirm,
  onFindAnother,
  onDone,
}) {
  if (!rack) return null;

  const available = getAvailableSlots(rack);
  const total = rack.totalSlots;
  const code = rack.id.replace(/^(TPN-|lta-)/, "");
  const isParked = state === "parked";

  return (
    <aside
      className="parkconfirm"
      role="region"
      aria-label={isParked ? "Parking confirmed" : "Confirm parking"}
    >
      <div className="parkconfirm__handle" aria-hidden="true" />

      {isParked ? (
        <>
          <div className="parkconfirm__status">Parking confirmed</div>
          <h2 className="parkconfirm__title">Thanks for parking properly.</h2>
          <p className="parkconfirm__copy">
            Rack {code} has been updated in the Tampines bicycle network.
          </p>
          <button type="button" className="parkconfirm__primary" onClick={onDone}>
            Back to map
          </button>
        </>
      ) : (
        <>
          <div className="parkconfirm__status">Arrived at rack</div>
          <h2 className="parkconfirm__title">{rack.name}</h2>

          <div className="parkconfirm__rack">
            <div>
              <span className="parkconfirm__label">Rack</span>
              <strong>{code}</strong>
            </div>
            <div>
              <span className="parkconfirm__label">Free slots</span>
              <strong>{available} / {total}</strong>
            </div>
          </div>

          <button type="button" className="parkconfirm__primary" onClick={onConfirm}>
            Confirm parked
          </button>
          <button type="button" className="parkconfirm__secondary" onClick={onFindAnother}>
            Rack full? Find another
          </button>
        </>
      )}
    </aside>
  );
}
