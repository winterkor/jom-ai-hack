import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getRackStatus } from "../../data/rackData.js";
import "../MapView.css";
import "./AdminMap.css";

const TAMPINES_CENTER = [1.354, 103.943];

// Same dot language as the rider map — the operational detail lives in
// OccupancyList / IncidentList / LiveFeed, so the map only needs to answer
// "where are the red ones?" at a glance.
function buildIcon(rack) {
  const status = getRackStatus(rack);
  const size = 28;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="rack-marker" data-status="${status}" data-compact="false">
        <div class="rack-marker__dot"></div>
      </div>
    `,
  });
}

function buildClusterIcon(cluster) {
  const children = cluster.getAllChildMarkers();
  const statusCounts = { available: 0, filling: 0, full: 0 };

  for (const m of children) {
    const rack = m.options.rackData;
    if (!rack) continue;
    statusCounts[getRackStatus(rack)] += 1;
  }
  const dominant = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];

  const s = Math.round(44 + Math.min(children.length, 12) * 1.1);
  return L.divIcon({
    className: "rack-cluster-wrap",
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    html: `
      <div class="rack-cluster" data-status="${dominant}" data-compact="false">
        <div class="rack-cluster__count">${children.length}</div>
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

function FitBounds({ racks, suppressed }) {
  const map = useMap();
  useEffect(() => {
    if (suppressed) return;
    if (!map || racks.length === 0) return;
    const bounds = L.latLngBounds(racks.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, racks, suppressed]);
  return null;
}

function buildDestIcon(rack) {
  const tail = (rack.id || "").split("-").pop() || "";
  const displayCode = tail.length > 2 ? tail.slice(-2) : tail;
  return L.divIcon({
    className: "myrack-pin-wrap",
    iconSize: [44, 58],
    iconAnchor: [22, 56],
    html: `
      <div class="myrack-pin myrack-pin--dest">
        <div class="myrack-pin__shadow"></div>
        <div class="myrack-pin__body">
          <div class="myrack-pin__code">${displayCode}</div>
        </div>
      </div>
    `,
  });
}

// Fly to the target rack and drop a destination teardrop pin. The nonce on
// flyTarget makes "navigate to the same rack twice" repeat the animation.
function FlyToTarget({ flyTarget }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    // Always clear previous pin before placing the new one.
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (!flyTarget?.rack) return;
    const { rack } = flyTarget;
    map.flyTo([rack.lat, rack.lng], 17, { duration: 1.1 });
    const marker = L.marker([rack.lat, rack.lng], {
      icon: buildDestIcon(rack),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    });
    marker.addTo(map);
    markerRef.current = marker;
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map, flyTarget]);

  return null;
}

export default function AdminMap({ racks, flyTarget, onClearFlyTarget }) {
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
        <FitBounds racks={racks} suppressed={Boolean(flyTarget)} />
        <RackLayer racks={racks} />
        <FlyToTarget flyTarget={flyTarget} />
      </MapContainer>

      {flyTarget?.rack && (
        <button
          type="button"
          className="admin-map__clear"
          onClick={onClearFlyTarget}
          title="Clear destination"
        >
          ✕ Clear pin
        </button>
      )}

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
