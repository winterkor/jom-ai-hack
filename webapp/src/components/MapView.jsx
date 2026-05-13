import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import "./MapView.css";

const TAMPINES_CENTER = [1.354, 103.943];

function buildIcon(rack, isSelected, order = 0) {
  const status = getRackStatus(rack);
  const available = getAvailableSlots(rack);
  const code = rack.id.split("-").pop() || "";
  const displayCode = code.length > 2 ? code.slice(-2) : code;
  const delay = `${Math.min(order, 30) * 35}ms`;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [56, 64],
    iconAnchor: [28, 64],
    html: `
      <div class="rack-marker ${isSelected ? "rack-marker--sel" : ""}" data-status="${status}" style="animation-delay: ${delay}">
        <div class="rack-marker__stripe"></div>
        <div class="rack-marker__code">${displayCode}</div>
        <div class="rack-marker__chip">${available}</div>
        <div class="rack-marker__tail"></div>
      </div>
    `,
  });
}

function buildClusterIcon(cluster) {
  const children = cluster.getAllChildMarkers();
  let totalAvail = 0;
  const statusCounts = { available: 0, filling: 0, full: 0 };

  for (const m of children) {
    const rack = m.options.rackData;
    if (!rack) continue;
    totalAvail += getAvailableSlots(rack);
    statusCounts[getRackStatus(rack)] += 1;
  }

  // Dominant cluster status: whichever status has the most racks
  const dominant = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];

  return L.divIcon({
    className: "rack-cluster-wrap",
    iconSize: [62, 62],
    iconAnchor: [31, 31],
    html: `
      <div class="rack-cluster" data-status="${dominant}">
        <div class="rack-cluster__stripe"></div>
        <div class="rack-cluster__count">${children.length}</div>
        <div class="rack-cluster__free">${totalAvail} FREE</div>
      </div>
    `,
  });
}

// Inner component: builds the markercluster group manually so we can style clusters
// to match the wayfinding aesthetic.
function RackLayer({ racks, selectedRack, onSelectRack }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 55,
      disableClusteringAtZoom: 18,
      iconCreateFunction: buildClusterIcon,
    });

    racks.forEach((rack, i) => {
      const marker = L.marker([rack.lat, rack.lng], {
        icon: buildIcon(rack, selectedRack?.id === rack.id, i),
        rackData: rack,
      });
      marker.on("click", () => onSelectRack(rack));
      group.addLayer(marker);
    });

    map.addLayer(group);
    clusterRef.current = group;

    return () => {
      map.removeLayer(group);
      clusterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [racks, selectedRack?.id]);

  return null;
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; CartoDB &middot; LTA DataMall'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <RackLayer
          racks={racks}
          selectedRack={selectedRack}
          onSelectRack={onSelectRack}
        />
      </MapContainer>
    </div>
  );
}
