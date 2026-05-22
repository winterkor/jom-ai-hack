import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  SEVERITY,
  highestSeverity,
  openIncidents,
} from "../../data/mockIncidents.js";
import "./AdminMap.css";

const TAMPINES_CENTER = [1.354, 103.943];

function buildRackIcon({ severity, count, occupancyPct }) {
  const sevColor = severity ? SEVERITY[severity].color : "var(--admin-text-muted)";
  const pulse = severity === "high" ? " admin-pin--pulse" : "";
  const ringColor =
    occupancyPct >= 90
      ? "var(--sev-high)"
      : occupancyPct >= 60
      ? "var(--sev-med)"
      : "var(--sev-ok)";

  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div class="admin-pin${pulse}" style="--pin: ${sevColor}; --ring: ${ringColor};">
        <span class="admin-pin__core"></span>
        ${count > 0 ? `<span class="admin-pin__badge">${count}</span>` : ""}
      </div>
    `,
  });
}

function MarkersLayer({ racks, incidentsByRackId, onSelectIncident }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    } else {
      layerRef.current.clearLayers();
    }

    for (const rack of racks) {
      const incs = incidentsByRackId.get(rack.id) || [];
      const open = incs.filter((i) => i.status === "open");
      const sev = highestSeverity(open);
      const occupancyPct =
        rack.totalSlots > 0
          ? Math.round((rack.occupiedSlots / rack.totalSlots) * 100)
          : 0;

      const icon = buildRackIcon({
        severity: sev,
        count: open.length,
        occupancyPct,
      });

      const marker = L.marker([rack.lat, rack.lng], { icon });
      const title = `${rack.name}`;
      const sub = sev
        ? `${open.length} open · sev ${SEVERITY[sev].label}`
        : `${occupancyPct}% occupied`;
      marker.bindTooltip(`<strong>${title}</strong><br/><span>${sub}</span>`, {
        direction: "top",
        offset: [0, -10],
        className: "admin-tooltip",
      });

      if (open.length > 0) {
        marker.on("click", () => {
          // pick highest severity, then most recent
          const sorted = [...open].sort((a, b) => {
            const dw = SEVERITY[b.severity].weight - SEVERITY[a.severity].weight;
            if (dw !== 0) return dw;
            return new Date(b.detectedAt) - new Date(a.detectedAt);
          });
          onSelectIncident(sorted[0].id);
        });
      }

      marker.addTo(layerRef.current);
    }

    return () => {
      if (layerRef.current) layerRef.current.clearLayers();
    };
  }, [map, racks, incidentsByRackId, onSelectIncident]);

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

export default function AdminMap({ racks, incidents, onSelectIncident }) {
  const incidentsByRackId = useMemo(() => {
    const m = new Map();
    for (const inc of openIncidents(incidents)) {
      if (!m.has(inc.rackId)) m.set(inc.rackId, []);
      m.get(inc.rackId).push(inc);
    }
    return m;
  }, [incidents]);

  return (
    <div className="admin-map">
      <MapContainer
        center={TAMPINES_CENTER}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", background: "var(--admin-bg)" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <FitBounds racks={racks} />
        <MarkersLayer
          racks={racks}
          incidentsByRackId={incidentsByRackId}
          onSelectIncident={onSelectIncident}
        />
      </MapContainer>

      <div className="admin-map__legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--sev-high)" }} />
          High
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--sev-med)" }} />
          Medium
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--sev-low)" }} />
          Low
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "var(--admin-text-muted)" }} />
          OK
        </span>
      </div>
    </div>
  );
}
