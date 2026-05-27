import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import RouteLayer from "../RouteLayer.jsx";
import { getRackStatus } from "../../data/rackData.js";
import "../MapView.css";
import "./AdminMap.css";

const TAMPINES_CENTER = [1.354, 103.943];

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

// "You are here" pin for the admin. Pulsing blue dot styled in AdminMap.css.
function AdminSelfMarker({ location }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !location) return;
    const icon = L.divIcon({
      className: "admin-self-wrap",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      html: '<div class="admin-self"><div class="admin-self__pulse"></div><div class="admin-self__dot"></div></div>',
    });
    const marker = L.marker([location.lat, location.lng], {
      icon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(map);
    return () => { map.removeLayer(marker); };
  }, [map, location?.lat, location?.lng]);
  return null;
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

// Fixed view of the Tampines core. We deliberately skip "fit to all racks"
// because the live LTA dataset spans Bedok → Loyang → Changi, which produces
// a viewport with a lot of empty space outside the dense Tampines cluster.
const TAMPINES_FOCUS = { center: [1.345, 103.952], zoom: 16 };

function FixedFocus({ suppressed }) {
  const map = useMap();
  useEffect(() => {
    if (suppressed || !map) return;
    map.setView(TAMPINES_FOCUS.center, TAMPINES_FOCUS.zoom, { animate: false });
  }, [map, suppressed]);
  return null;
}

// When a route is set, frame it tight so the maintainer can see depot → rack
// in a single glance, leaving room for the preview card / nav banner chrome.
function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !coords || coords.length < 2) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
  }, [map, coords]);
  return null;
}

// Leaflet caches container dimensions on init. When admin chrome is unmounted
// for nav mode (or remounted on exit), the map container resizes but the map
// instance keeps the old size, leaving tiles half-loaded / blank. Force a
// re-measure whenever the routing flag flips.
function InvalidateOnNav({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map, active]);
  return null;
}

export default function AdminMap({ racks, routeCoords, adminLocation }) {
  const isRouting = Boolean(routeCoords && routeCoords.length >= 2);
  return (
    <div className="admin-map">
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={14}
        zoomSnap={0.5}
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
        <FixedFocus suppressed={isRouting} />
        <RackLayer racks={racks} />
        {adminLocation && <AdminSelfMarker location={adminLocation} />}
        <InvalidateOnNav active={isRouting} />
        {isRouting && <RouteLayer coords={routeCoords} />}
        {isRouting && <FitRoute coords={routeCoords} />}
      </MapContainer>

      {!isRouting && (
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
      )}
    </div>
  );
}
