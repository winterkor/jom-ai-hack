import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { loadZones, isNoParkZone } from "../services/zones.js";

const PARK_STYLES = {
  available: { fillColor: "#10b981", color: "#047857" },
  filling: { fillColor: "#f59e0b", color: "#b45309" },
  full: { fillColor: "#ef4444", color: "#b91c1c" },
};

function styleFor(feature) {
  const props = feature.properties || {};
  if (props.kind === "park") {
    const palette = PARK_STYLES[props.occupancyState] || PARK_STYLES.available;
    return {
      ...palette,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.32,
    };
  }
  // no-park: solid red border (dashed) — fill is replaced with the
  // diagonal-stripe pattern after the path mounts in the DOM.
  return {
    color: "#b91c1c",
    weight: 3,
    dashArray: "8 6",
    opacity: 1,
    fillOpacity: 1,
    fillColor: "#fee2e2",
  };
}

// Injects the no-park diagonal-stripe SVG pattern into the overlay-pane defs.
// Idempotent — safe to call after every map mount; bails if pattern exists.
function ensureNoParkPattern(map) {
  const svg = map.getPanes().overlayPane.querySelector("svg");
  if (!svg || svg.querySelector("#noParkPattern")) return;

  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(ns, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  const pattern = document.createElementNS(ns, "pattern");
  pattern.setAttribute("id", "noParkPattern");
  pattern.setAttribute("width", "14");
  pattern.setAttribute("height", "14");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("patternTransform", "rotate(45)");

  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", "14");
  bg.setAttribute("height", "14");
  bg.setAttribute("fill", "#fee2e2");
  pattern.appendChild(bg);

  const stripe = document.createElementNS(ns, "rect");
  stripe.setAttribute("width", "6");
  stripe.setAttribute("height", "14");
  stripe.setAttribute("fill", "#dc2626");
  pattern.appendChild(stripe);

  defs.appendChild(pattern);
}

export default function ZonesLayer({ onZonesLoaded }) {
  const map = useMap();

  // Latest-callback ref so the loader effect doesn't refire when App passes
  // a new inline function on each render.
  const cbRef = useRef(onZonesLoaded);
  useEffect(() => {
    cbRef.current = onZonesLoaded;
  }, [onZonesLoaded]);

  useEffect(() => {
    let cancelled = false;
    let layer = null;

    (async () => {
      const { features, source } = await loadZones();
      if (cancelled || !features?.length) return;

      layer = L.geoJSON(
        { type: "FeatureCollection", features },
        { style: styleFor, interactive: false }
      ).addTo(map);

      ensureNoParkPattern(map);

      layer.eachLayer((sub) => {
        const feature = sub.feature;
        const el = sub.getElement?.();
        if (!el) return;
        if (feature?.properties?.zoneId) {
          el.dataset.zoneId = feature.properties.zoneId;
          el.dataset.kind = feature.properties.kind;
        }
        if (isNoParkZone(feature)) {
          el.setAttribute("fill", "url(#noParkPattern)");
        }
      });

      cbRef.current?.(features, source);
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
