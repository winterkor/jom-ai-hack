import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import "./MapView.css";

const TAMPINES_CENTER = [1.354, 103.943];

function buildIcon(rack, isSelected, order = 0) {
  const status = getRackStatus(rack);
  const available = getAvailableSlots(rack);
  const idx = rack.id.split("-")[1] || "";
  const delay = `${order * 70}ms`;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [56, 64],
    iconAnchor: [28, 64],
    html: `
      <div class="rack-marker ${isSelected ? "rack-marker--sel" : ""}" data-status="${status}" style="animation-delay: ${delay}">
        <div class="rack-marker__stripe"></div>
        <div class="rack-marker__code">${idx}</div>
        <div class="rack-marker__chip">${available}</div>
        <div class="rack-marker__tail"></div>
      </div>
    `,
  });
}

export default function MapView({ racks, selectedRack, onSelectRack }) {
  return (
    <div className="mapview">
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={15}
        zoomControl={true}
        scrollWheelZoom={true}
        className="mapview__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {racks.map((rack, i) => (
          <Marker
            key={rack.id}
            position={[rack.lat, rack.lng]}
            icon={buildIcon(rack, selectedRack?.id === rack.id, i)}
            eventHandlers={{
              click: () => onSelectRack(rack),
            }}
            zIndexOffset={selectedRack?.id === rack.id ? 1000 : i}
          />
        ))}
      </MapContainer>
    </div>
  );
}
