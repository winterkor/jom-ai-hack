import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import Header from "./components/Header.jsx";
import SidePanel from "./components/SidePanel.jsx";
import Legend from "./components/Legend.jsx";
import SearchBar from "./components/SearchBar.jsx";
import FAB from "./components/FAB.jsx";
import RouteInfo from "./components/RouteInfo.jsx";
import { mockRacks, adaptLtaRack, getRackStatus } from "./data/rackData.js";
import { fetchTampinesRacks } from "./data/ltaClient.js";
import { findNearestAvailable, haversineKm } from "./data/geo.js";
import "./App.css";

const TAMPINES_CENTER = { lat: 1.354, lng: 103.943 };

export default function App() {
  const [racks, setRacks] = useState(mockRacks);
  const [dataState, setDataState] = useState("loading");
  const [selectedRack, setSelectedRack] = useState(null);

  // Navigation state
  const [userPos, setUserPos] = useState(null);          // { lat, lng } once located
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState(null);              // { origin, target, targetRack, distanceKm, isStraightLine }
  const [flyTo, setFlyTo] = useState(null);              // { lat, lng, zoom, bounds? } imperative trigger

  // Load LTA data on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ltaRacks = await fetchTampinesRacks();
        if (cancelled) return;
        const adapted = ltaRacks.map((r, i) => adaptLtaRack(r, i));
        setRacks(adapted);
        setDataState("live");
      } catch (err) {
        console.warn("LTA fetch failed, using mocks:", err.message);
        if (!cancelled) setDataState("mock");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = racks.reduce(
    (acc, r) => {
      acc.total += r.totalSlots;
      acc.occupied += r.occupiedSlots;
      return acc;
    },
    { total: 0, occupied: 0 }
  );
  const availableCount = totals.total - totals.occupied;

  // ── Geolocation ──────────────────────────────────────
  const locateMe = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(p);
          resolve(p);
        },
        (err) => {
          setLocating(false);
          console.warn("geolocation:", err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });

  const handleLocate = async () => {
    const p = await locateMe();
    if (p) setFlyTo({ ...p, zoom: 16, key: Date.now() });
  };

  // ── Find nearest available rack ──────────────────────
  const handleFindNearest = async () => {
    let origin = userPos;
    if (!origin) {
      origin = (await locateMe()) || TAMPINES_CENTER;
    }
    const result = findNearestAvailable(origin, racks, getRackStatus);
    if (!result) return; // every rack full — unlikely but possible

    const distanceKm = haversineKm(origin, {
      lat: result.rack.lat,
      lng: result.rack.lng,
    });

    setSelectedRack(result.rack);
    setRoute({
      origin,
      target: { lat: result.rack.lat, lng: result.rack.lng },
      targetRack: result.rack,
      distanceKm,
      isStraightLine: true, // ORS routing comes in Ship 2b
    });
    // Fly to fit both points
    setFlyTo({
      bounds: [
        [origin.lat, origin.lng],
        [result.rack.lat, result.rack.lng],
      ],
      key: Date.now(),
    });
  };

  // ── Search bar pick handler ──────────────────────────
  const handleSearchPick = (result) => {
    if (result.kind === "rack") {
      setSelectedRack(result.rack);
      setRoute(null);
      setFlyTo({ lat: result.lat, lng: result.lng, zoom: 17, key: Date.now() });
    } else {
      // Place pick: find nearest available rack to that place, route from there
      const nearest = findNearestAvailable(
        { lat: result.lat, lng: result.lng },
        racks,
        getRackStatus
      );
      if (nearest) {
        setSelectedRack(nearest.rack);
        setRoute({
          origin: { lat: result.lat, lng: result.lng },
          target: { lat: nearest.rack.lat, lng: nearest.rack.lng },
          targetRack: nearest.rack,
          distanceKm: nearest.distanceKm,
          isStraightLine: true,
        });
        setFlyTo({
          bounds: [
            [result.lat, result.lng],
            [nearest.rack.lat, nearest.rack.lng],
          ],
          key: Date.now(),
        });
      } else {
        setFlyTo({ lat: result.lat, lng: result.lng, zoom: 17, key: Date.now() });
      }
    }
  };

  const handleCancelRoute = () => {
    setRoute(null);
  };

  return (
    <div className="app grain">
      <Header
        racksOnline={racks.length}
        availableSlots={availableCount}
        dataState={dataState}
      />

      <SearchBar racks={racks} onSelectResult={handleSearchPick} />

      <MapView
        racks={racks}
        selectedRack={selectedRack}
        onSelectRack={setSelectedRack}
        userPos={userPos}
        route={route}
        flyTo={flyTo}
      />

      <SidePanel rack={selectedRack} onClose={() => setSelectedRack(null)} />

      <Legend />

      <RouteInfo route={route} onCancel={handleCancelRoute} />

      <FAB
        onFindNearest={handleFindNearest}
        onLocate={handleLocate}
        busy={locating}
        hasUserPos={!!userPos}
      />
    </div>
  );
}
