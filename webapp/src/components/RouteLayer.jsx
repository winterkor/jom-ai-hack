import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Renders the active cycling route as a thick navy line on a cream halo so it
// reads against the light CartoDB basemap. `coords` is an ordered list of
// [lat, lng] pairs as returned by OSRM (already converted in routing.js).
// When OSRM fails the caller falls back to a 2-point straight-line coords
// array so the polyline still draws.

export default function RouteLayer({ coords }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    if (!coords || coords.length < 2) return undefined;

    const halo = L.polyline(coords, {
      color: "#ffffff",
      weight: 13,
      opacity: 0.96,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
      className: "route-line-halo",
    });
    const line = L.polyline(coords, {
      color: "#3f2df4",
      weight: 7,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
      className: "route-line",
    });

    const group = L.layerGroup([halo, line]).addTo(map);
    groupRef.current = group;

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map, coords]);

  return null;
}
