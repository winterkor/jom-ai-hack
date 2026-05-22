import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import "./MapView.css";

const TAMPINES_CENTER = [1.354, 103.943];

const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth <= 720;

function buildIcon(rack, isSelected, order = 0, compact = false) {
  const status = getRackStatus(rack);
  const available = getAvailableSlots(rack);
  const code = rack.id.split("-").pop() || "";
  const displayCode = code.length > 2 ? code.slice(-2) : code;
  const delay = `${Math.min(order, 30) * 35}ms`;

  // Phones get a smaller footprint so co-located racks don't smother the map.
  const w = compact ? 40 : 56;
  const h = compact ? 46 : 64;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    html: `
      <div class="rack-marker ${isSelected ? "rack-marker--sel" : ""}" data-status="${status}" data-compact="${compact}" style="animation-delay: ${delay}">
        <div class="rack-marker__stripe"></div>
        <div class="rack-marker__code">${displayCode}</div>
        <div class="rack-marker__chip">${available}</div>
        <div class="rack-marker__tail"></div>
      </div>
    `,
  });
}

function buildClusterIcon(cluster, compact = false) {
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

  const s = compact ? 48 : 62;
  return L.divIcon({
    className: "rack-cluster-wrap",
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    html: `
      <div class="rack-cluster" data-status="${dominant}" data-compact="${compact}">
        <div class="rack-cluster__stripe"></div>
        <div class="rack-cluster__count">${children.length}</div>
        <div class="rack-cluster__free">${totalAvail} FREE</div>
      </div>
    `,
  });
}

const userIcon = L.divIcon({
  className: "user-marker-wrap",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  html: `<div class="user-marker"><div class="user-marker__pulse"></div><div class="user-marker__dot"></div></div>`,
});

function buildDestIcon(rack) {
  const code = rack.id.split("-").pop() || "";
  const displayCode = code.length > 2 ? code.slice(-2) : code;
  return L.divIcon({
    className: "dest-marker-wrap",
    iconSize: [72, 86],
    iconAnchor: [36, 86],
    html: `
      <div class="dest-marker">
        <div class="dest-marker__pulse"></div>
        <div class="dest-marker__tab">DEST</div>
        <div class="dest-marker__badge">${displayCode}</div>
        <div class="dest-marker__stem"></div>
      </div>
    `,
  });
}

// Render the rack cluster group manually
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

// Render the user "you are here" marker
function UserMarker({ userPos }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!userPos) return;
    const marker = L.marker([userPos.lat, userPos.lng], {
      icon: userIcon,
      zIndexOffset: 1500,
      interactive: false,
    });
    marker.addTo(map);
    ref.current = marker;
    return () => {
      map.removeLayer(marker);
      ref.current = null;
    };
  }, [userPos?.lat, userPos?.lng, map]);

  return null;
}

// The selected rack's destination pin — a dedicated marker OUTSIDE the
// cluster group so it's always visible and never swallowed by a cluster.
function DestinationMarker({ rack }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!rack) return;
    const marker = L.marker([rack.lat, rack.lng], {
      icon: buildDestIcon(rack),
      zIndexOffset: 2000,
      interactive: false,
      keyboard: false,
    });
    marker.addTo(map);
    ref.current = marker;
    return () => {
      map.removeLayer(marker);
      ref.current = null;
    };
  }, [rack?.id, rack?.lat, rack?.lng, map]);

  return null;
}

// Insets used to keep the selected pin inside the visible band — i.e. clear
// of the top header+search AND the bottom peek sheet.
const TOP_INSET_MOBILE = 170; // header (~87) + search (~154 bottom) + gap
const PEEK_SHEET_H = 210; // mobile bottom sheet (peek) height in px
const DESKTOP_CARD_W = 412; // desktop left card incl. 16px margin

// Imperative fly-to controller — listens to `flyTo` prop changes.
// When `target.offset` is set, the destination is nudged so it renders in the
// visible area (above the bottom sheet on mobile / right of the card on
// desktop) instead of dead-centre where the panel would bury it.
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;

    if (target.bounds) {
      map.flyToBounds(target.bounds, { padding: [80, 80], duration: 1.0 });
      return;
    }
    if (target.lat == null || target.lng == null) return;

    const zoom = target.zoom ?? 16;

    if (!target.offset) {
      map.flyTo([target.lat, target.lng], zoom, { duration: 1.0 });
      return;
    }

    // Shift the map centre so the pin clears the panel.
    const isMobileView =
      typeof window !== "undefined" && window.innerWidth <= 720;
    const p = map.project([target.lat, target.lng], zoom);
    if (isMobileView) {
      // Centre the pin in the clear band between the top (header+search)
      // and the bottom peek sheet — never behind either.
      p.y += (PEEK_SHEET_H - TOP_INSET_MOBILE) / 2;
    } else {
      p.x -= DESKTOP_CARD_W / 2; // centre lands left → pin sits right of card
    }
    const shifted = map.unproject(p, zoom);
    map.flyTo(shifted, zoom, { duration: 1.0 });
  }, [target?.key, map, target]);
  return null;
}

export default function MapView({
  racks,
  selectedRack,
  onSelectRack,
  userPos,
  flyTo,
}) {
  return (
    <div className="mapview" data-focus={selectedRack ? "true" : "false"}>
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={true}
        className="mapview__map"
      >
        {/* Desktop only — on touch you pinch-zoom, so it's hidden ≤720px
            (see MapView.css) to avoid colliding with the FAB/header. */}
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; CartoDB &middot; LTA DataMall'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <RackLayer
          racks={racks}
          selectedRack={selectedRack}
          onSelectRack={onSelectRack}
        />

        <UserMarker userPos={userPos} />

        <DestinationMarker rack={selectedRack} />

        {/* Route polyline removed — real cycling navigation lands in Ship 2b */}

        <FlyTo target={flyTo} />
      </MapContainer>
    </div>
  );
}
