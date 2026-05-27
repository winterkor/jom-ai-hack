import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getRackStatus, getAvailableSlots } from "../data/rackData.js";
import RouteLayer from "./RouteLayer.jsx";
import "./MapView.css";

const TAMPINES_CENTER = [1.354, 103.943];

// Phones start zoomed-in enough that individual rack badges are visible
// instead of being swallowed into cluster blobs (cluster radius is 55px,
// so at zoom 15 dense Tampines collapses into ~8 clusters).
const isMobileViewport =
  typeof window !== "undefined" && window.innerWidth <= 720;
const DEFAULT_ZOOM = isMobileViewport ? 16 : 15;

function buildIcon(rack, isSelected, order = 0, compact = false) {
  const status = getRackStatus(rack);
  const delay = `${Math.min(order, 30) * 35}ms`;

  // Phones get a smaller dot so dense areas stay readable.
  const size = compact ? 22 : 28;

  return L.divIcon({
    className: "rack-marker-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="rack-marker ${isSelected ? "rack-marker--sel" : ""}" data-status="${status}" data-compact="${compact}" style="animation-delay: ${delay}">
        <div class="rack-marker__dot"></div>
      </div>
    `,
  });
}

// Google Maps-style red teardrop pin used to mark the user's parked rack.
// Anchored at the bottom tip so the point lands on the rack location.
function buildMyRackIcon() {
  return L.divIcon({
    className: "myrack-pin-wrap",
    iconSize: [38, 52],
    iconAnchor: [19, 50],
    html: `
      <div class="myrack-pin">
        <div class="myrack-pin__shadow"></div>
        <div class="myrack-pin__body">
          <div class="myrack-pin__hole"></div>
        </div>
      </div>
    `,
  });
}

function buildClusterIcon(cluster, compact = false) {
  const children = cluster.getAllChildMarkers();
  const statusCounts = { available: 0, filling: 0, full: 0 };

  for (const m of children) {
    const rack = m.options.rackData;
    if (!rack) continue;
    statusCounts[getRackStatus(rack)] += 1;
  }
  const dominant = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Cluster size scales gently with rack count so dense areas read as denser.
  const base = compact ? 36 : 44;
  const bump = Math.min(children.length, 12) * (compact ? 0.8 : 1.1);
  const s = Math.round(base + bump);

  return L.divIcon({
    className: "rack-cluster-wrap",
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    html: `
      <div class="rack-cluster" data-status="${dominant}" data-compact="${compact}">
        <div class="rack-cluster__count">${children.length}</div>
      </div>
    `,
  });
}

function buildUserIcon(active = false, heading = 0) {
  if (active) {
    return L.divIcon({
      className: "user-marker-wrap",
      iconSize: [86, 86],
      iconAnchor: [43, 43],
      html: `
        <div class="user-marker user-marker--nav">
          <div class="user-marker__compass"></div>
          <div class="user-marker__arrow" style="transform: rotate(${heading}deg)"></div>
        </div>
      `,
    });
  }

  return L.divIcon({
    className: "user-marker-wrap",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    html: `<div class="user-marker"><div class="user-marker__pulse"></div><div class="user-marker__dot"></div></div>`,
  });
}

function buildDestIcon(rack) {
  const code = rack.id.split("-").pop() || "";
  // Last 2 chars of the id reads as a short station-style code (e.g. "79").
  const displayCode = code.length > 2 ? code.slice(-2) : code;
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

// "You parked here" pin — rendered outside the cluster group so it's never
// swallowed by clustering and always sits above other markers.
function MyRackMarker({ rack, onSelect }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!rack) return;
    const marker = L.marker([rack.lat, rack.lng], {
      icon: buildMyRackIcon(),
      zIndexOffset: 2500, // above DestinationMarker (2000)
      keyboard: false,
    });
    if (onSelect) marker.on("click", () => onSelect(rack));
    marker.addTo(map);
    ref.current = marker;
    return () => {
      map.removeLayer(marker);
      ref.current = null;
    };
  }, [rack?.id, rack?.lat, rack?.lng, map, onSelect]);

  return null;
}

// Render the user "you are here" marker
function UserMarker({ userPos, active, heading }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!userPos) return;
    const marker = L.marker([userPos.lat, userPos.lng], {
      icon: buildUserIcon(active, heading),
      zIndexOffset: 1500,
      interactive: false,
    });
    marker.addTo(map);
    ref.current = marker;
    return () => {
      map.removeLayer(marker);
      ref.current = null;
    };
  }, [userPos?.lat, userPos?.lng, active, heading, map]);

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

function bearingFromRoute(coords) {
  if (!coords || coords.length < 2) return 0;
  const [a, b] = coords;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export default function MapView({
  racks,
  selectedRack,
  onSelectRack,
  userPos,
  flyTo,
  routeCoords,
  navState = "idle",
  myRackId = null,
}) {
  const isActiveNav = navState === "active";
  const heading = bearingFromRoute(routeCoords);

  return (
    <div
      className="mapview"
      data-focus={selectedRack ? "true" : "false"}
      data-nav-state={navState}
    >
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={DEFAULT_ZOOM}
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

        <UserMarker userPos={userPos} active={isActiveNav} heading={heading} />

        {/* Suppress the destination pin when it points at the rack the user
            has already parked at — otherwise both red teardrops stack at the
            same coordinates after "Confirm parked". */}
        <DestinationMarker
          rack={selectedRack && selectedRack.id !== myRackId ? selectedRack : null}
        />

        {myRackId &&
          (() => {
            const myRack = racks.find((r) => r.id === myRackId);
            return myRack ? <MyRackMarker rack={myRack} onSelect={onSelectRack} /> : null;
          })()}

        <RouteLayer coords={routeCoords} />

        <FlyTo target={flyTo} />
      </MapContainer>
    </div>
  );
}
