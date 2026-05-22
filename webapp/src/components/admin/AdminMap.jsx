import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getRackStatus, getAvailableSlots } from "../../data/rackData.js";
import "../MapView.css";
import "./AdminMap.css";

const TAMPINES_CENTER = [1.354, 103.943];

// Mirrors MapView's rack chip so the maintainer surface speaks the same
// visual language as the rider app — no click, view-only.
function buildIcon(rack) {
  const status = getRackStatus(rack);
  const available = getAvailableSlots(rack);
  const code = rack.id.split("-").pop() || "";
  const displayCode = code.length > 2 ? code.slice(-2) : code;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [56, 64],
    iconAnchor: [28, 64],
    html: `
      <div class="rack-marker" data-status="${status}" data-compact="false">
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
  const dominant = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];

  return L.divIcon({
    className: "rack-cluster-wrap",
    iconSize: [62, 62],
    iconAnchor: [31, 31],
    html: `
      <div class="rack-cluster" data-status="${dominant}" data-compact="false">
        <div class="rack-cluster__stripe"></div>
        <div class="rack-cluster__count">${children.length}</div>
        <div class="rack-cluster__free">${totalAvail} FREE</div>
      </div>
    `,
  });
}

function RackLayer({ racks }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 55,
      disableClusteringAtZoom: 18,
      iconCreateFunction: buildClusterIcon,
    });

    racks.forEach((rack) => {
      const marker = L.marker([rack.lat, rack.lng], {
        icon: buildIcon(rack),
        rackData: rack,
        interactive: false,
        keyboard: false,
      });
      group.addLayer(marker);
    });

    map.addLayer(group);
    groupRef.current = group;

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map, racks]);

  return null;
}

function FitBounds({ racks }) {
  const map = useMap();
  useEffect(() => {
    if (!map || racks.length === 0) return;
    const bounds = L.latLngBounds(racks.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, racks]);
  return null;
}

export default function AdminMap({ racks }) {
  return (
    <div className="admin-map">
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", background: "var(--admin-panel-2)" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <FitBounds racks={racks} />
        <RackLayer racks={racks} />
      </MapContainer>

      <div className="admin-map__legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--status-available)" }} />
          Available
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--status-filling)" }} />
          Filling
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--status-full)" }} />
          Full
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--status-offline)" }} />
          Offline
        </span>
      </div>
    </div>
  );
}
