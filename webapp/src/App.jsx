import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import Header from "./components/Header.jsx";
import SidePanel from "./components/SidePanel.jsx";
import Legend from "./components/Legend.jsx";
import SearchBar from "./components/SearchBar.jsx";
import FAB from "./components/FAB.jsx";
import { mockRacks, adaptLtaRack, getRackStatus } from "./data/rackData.js";
import { fetchTampinesRacks } from "./data/ltaClient.js";
import { findNearestAvailable } from "./data/geo.js";
import "./App.css";

const TAMPINES_CENTER = { lat: 1.354, lng: 103.943 };

export default function App() {
  const [racks, setRacks] = useState(mockRacks);
  const [dataState, setDataState] = useState("loading");
  const [selectedRack, setSelectedRack] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(false);

  // Geolocation
  const [userPos, setUserPos] = useState(null); // { lat, lng } once located
  const [locating, setLocating] = useState(false);

  // Imperative map-fly trigger: { lat, lng, zoom, key }
  const [flyTo, setFlyTo] = useState(null);

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

  // Center the map on a rack and open its detail card in PEEK state.
  // `offset: true` tells MapView to nudge the pin clear of the panel/sheet.
  const showRackDetail = (rack) => {
    setSelectedRack(rack);
    setPanelExpanded(false);
    setFlyTo({
      lat: rack.lat,
      lng: rack.lng,
      zoom: 16,
      offset: true,
      key: Date.now(),
    });
  };

  const closePanel = () => {
    setSelectedRack(null);
    setPanelExpanded(false);
  };

  // ── Find nearest available rack → detail card (no route yet) ──
  const handleFindNearest = async () => {
    let origin = userPos;
    if (!origin) {
      origin = (await locateMe()) || TAMPINES_CENTER;
    }
    const result = findNearestAvailable(origin, racks, getRackStatus);
    if (!result) return; // every rack full — handled in Ship 2b
    showRackDetail(result.rack);
  };

  // ── Search pick: rack → detail; place → nearest rack → detail ──
  const handleSearchPick = (result) => {
    if (result.kind === "rack") {
      showRackDetail(result.rack);
    } else {
      const nearest = findNearestAvailable(
        { lat: result.lat, lng: result.lng },
        racks,
        getRackStatus
      );
      if (nearest) {
        showRackDetail(nearest.rack);
      } else {
        setFlyTo({ lat: result.lat, lng: result.lng, zoom: 17, key: Date.now() });
      }
    }
  };

  // Placeholder — real cycling navigation lands in Ship 2b (ORS).
  const handleStartNavigation = () => {};

  return (
    <div className={`app grain${selectedRack ? " app--panel-open" : ""}`}>
      <Header
        racksOnline={racks.length}
        availableSlots={availableCount}
        dataState={dataState}
      />

      <SearchBar racks={racks} onSelectResult={handleSearchPick} />

      <MapView
        racks={racks}
        selectedRack={selectedRack}
        onSelectRack={showRackDetail}
        userPos={userPos}
        flyTo={flyTo}
      />

      <SidePanel
        rack={selectedRack}
        userPos={userPos}
        expanded={panelExpanded}
        onToggleExpand={() => setPanelExpanded((v) => !v)}
        onClose={closePanel}
        onStartNavigation={handleStartNavigation}
      />

      <Legend />

      <FAB
        onFindNearest={handleFindNearest}
        onLocate={handleLocate}
        busy={locating}
        hasUserPos={!!userPos}
      />
    </div>
  );
}
