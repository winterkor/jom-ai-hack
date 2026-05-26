import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import Header from "./components/Header.jsx";
import SidePanel from "./components/SidePanel.jsx";
import Legend from "./components/Legend.jsx";
import SearchBar from "./components/SearchBar.jsx";
import FAB from "./components/FAB.jsx";
import NavPreviewCard from "./components/NavPreviewCard.jsx";
import NavBanner from "./components/NavBanner.jsx";
import NavExitBar from "./components/NavExitBar.jsx";
import ParkingConfirmCard from "./components/ParkingConfirmCard.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import RoleSplash from "./components/RoleSplash.jsx";
import { mockRacks, adaptLtaRack, loadLtaRacks, getRackStatus } from "./data/rackData.js";
import { fetchTampinesRacks } from "./data/ltaClient.js";
import { findNearestAvailable, topKNearestAvailable } from "./data/geo.js";
import { getCyclingRoute } from "./services/routing.js";
import "./App.css";

const ROLE_KEY = "jom-role";

// Resolve initial mode: ?reset=1 → splash; hash → mode; stored role → mode; else splash.
function initialMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("reset")) {
    localStorage.removeItem(ROLE_KEY);
    // strip the query so subsequent reloads behave normally
    window.history.replaceState(null, "", window.location.pathname);
    return "splash";
  }
  const h = window.location.hash;
  if (h === "#/admin") return "admin";
  if (h === "#/user") return "user";
  const saved = localStorage.getItem(ROLE_KEY);
  if (saved === "admin" || saved === "user") return saved;
  return "splash";
}

const TAMPINES_CENTER = { lat: 1.354, lng: 103.943 };
const DEMO_START = { lat: 1.3528, lng: 103.9447 };

export default function App() {
  const [racks, setRacks] = useState(mockRacks);
  const [dataState, setDataState] = useState("loading");
  const [selectedRack, setSelectedRack] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [mode, setMode] = useState(initialMode);

  // Keep hash in sync with mode so deep-links work; ignore splash mode.
  useEffect(() => {
    const target = mode === "admin" ? "#/admin" : mode === "user" ? "#/user" : "";
    if (window.location.hash !== target) {
      // replaceState avoids spamming history when role flips
      window.history.replaceState(null, "", target || window.location.pathname);
    }
  }, [mode]);

  // Honour external hash changes (deep links).
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === "#/admin") setMode("admin");
      else if (h === "#/user") setMode("user");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // The ONLY path that persists a role choice. Used from the splash tiles.
  const pickRole = (role) => {
    localStorage.setItem(ROLE_KEY, role);
    setMode(role);
  };

  // Returns to splash AND clears the stored choice (logo click).
  const goSplash = () => {
    localStorage.removeItem(ROLE_KEY);
    setMode("splash");
  };

  // Transient switch — does not change the stored role.
  // (Used by AdminNav's "← User app" so peeking at the rider view doesn't
  //  overwrite a maintainer's saved choice.)
  const goUser = () => {
    setMode("user");
  };

  // Geolocation
  const [userPos, setUserPos] = useState(null); // { lat, lng } once located
  const [locating, setLocating] = useState(false);

  // Imperative map-fly trigger: { lat, lng, zoom, key }
  const [flyTo, setFlyTo] = useState(null);

  // Navigation state machine — 'idle' (no route), 'preview' (route fetched,
  // showing preview card), 'active' (Start tapped, turn banner + exit bar).
  // navRoute holds the full OSRM response so child UI can read steps[]/etc.
  const [navState, setNavState] = useState("idle");
  const [navRoute, setNavRoute] = useState(null);

  // Load bundled LTA geojson on mount; fall back to the LTA DataMall live
  // fetch (which itself falls back to mocks) if the static load somehow fails.
  useEffect(() => {
    let cancelled = false;
    try {
      const geoRacks = loadLtaRacks();
      if (geoRacks.length > 0) {
        setRacks(geoRacks);
        setDataState("live");
        return undefined;
      }
    } catch (err) {
      console.warn("LTA geojson load failed:", err.message);
    }

    (async () => {
      try {
        const ltaRacks = await fetchTampinesRacks();
        if (cancelled) return;
        const adapted = ltaRacks.map((r, i) => adaptLtaRack(r, i));
        setRacks(adapted);
        setDataState("live");
      } catch (err) {
        console.warn("LTA DataMall fallback failed, using mocks:", err.message);
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
    setNavState("idle");
    setNavRoute(null);
  };

  // ── Find nearest available rack → detail card (no route yet) ──
  // Picks the rack with the shortest *cycling-route* distance, not the
  // shortest straight-line distance. We narrow to the top-K closest as the
  // crow flies (cheap), then route each via OSRM and pick the true winner.
  const handleFindNearest = async () => {
    let origin = userPos;
    if (!origin) {
      origin = (await locateMe()) || TAMPINES_CENTER;
    }
    const candidates = topKNearestAvailable(origin, racks, getRackStatus, 6);
    if (candidates.length === 0) return;

    const routed = await Promise.all(
      candidates.map(async ({ rack, distanceKm }) => {
        const route = await getCyclingRoute(origin, { lat: rack.lat, lng: rack.lng });
        return { rack, route, fallbackKm: distanceKm };
      }),
    );
    const withRoutes = routed.filter((r) => r.route);
    const winner = withRoutes.length > 0
      ? withRoutes.sort((a, b) => a.route.distanceM - b.route.distanceM)[0]
      // All route lookups failed → fall back to straight-line winner.
      : routed.sort((a, b) => a.fallbackKm - b.fallbackKm)[0];
    if (!winner) return;
    showRackDetail(winner.rack);
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

  // PREVIEW step — fetch the OSRM route, drop into preview state. The
  // preview card replaces the side panel; tap Start to enter active nav.
  // Straight-line fallback if OSRM is unreachable so the demo never voids.
  const handleStartNavigation = async () => {
    if (!selectedRack) return;
    let from = userPos;
    if (!from) {
      from = (await locateMe()) || DEMO_START;
      setUserPos(from);
    }
    const to = { lat: selectedRack.lat, lng: selectedRack.lng };
    const osrm = await getCyclingRoute(from, to);
    const fallback = {
      coords: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      distanceM: Math.round(
        // crude haversine in metres for the fallback label
        Math.hypot(
          (to.lat - from.lat) * 111000,
          (to.lng - from.lng) * 111000 * Math.cos((from.lat * Math.PI) / 180),
        ),
      ),
      durationS: 600,
      steps: [
        { instruction: "Head to destination", modifier: "straight", type: "depart", distance: 0, location: [from.lat, from.lng], name: "" },
        { instruction: "Arrive at destination", modifier: "straight", type: "arrive", distance: 0, location: [to.lat, to.lng], name: "" },
      ],
    };
    const route = osrm || fallback;
    setNavRoute(route);
    setNavState("preview");
    setFlyTo({ bounds: route.coords, key: Date.now() });
  };

  // ACTIVE — user pressed Start on the preview card. Frame the route tight.
  const handleStartActive = () => {
    if (!navRoute) return;
    setNavState("active");
    setFlyTo({ bounds: navRoute.coords, key: Date.now() });
  };

  // EXIT — clear the route, drop back to idle. Keeps the selected rack so
  // the user can re-preview if they want.
  const handleExitNav = () => {
    setNavState("idle");
    setNavRoute(null);
  };

  const handleArrive = () => {
    if (!selectedRack) return;
    setNavState("arrived");
    setFlyTo({
      lat: selectedRack.lat,
      lng: selectedRack.lng,
      zoom: 18,
      offset: true,
      key: Date.now(),
    });
  };

  const handleConfirmParked = () => {
    if (!selectedRack) return;
    setRacks((prev) =>
      prev.map((r) =>
        r.id === selectedRack.id
          ? {
              ...r,
              occupiedSlots: Math.min(r.totalSlots, r.occupiedSlots + 1),
            }
          : r,
      ),
    );
    setNavState("parked");
  };

  const handleFindAnother = async () => {
    const origin = userPos || (selectedRack
      ? { lat: selectedRack.lat, lng: selectedRack.lng }
      : TAMPINES_CENTER);
    const excludeId = selectedRack?.id;
    const pool = racks.filter((r) => r.id !== excludeId);
    const candidates = topKNearestAvailable(origin, pool, getRackStatus, 6);
    setNavState("idle");
    setNavRoute(null);
    if (candidates.length === 0) return;

    const routed = await Promise.all(
      candidates.map(async ({ rack, distanceKm }) => {
        const route = await getCyclingRoute(origin, { lat: rack.lat, lng: rack.lng });
        return { rack, route, fallbackKm: distanceKm };
      }),
    );
    const withRoutes = routed.filter((r) => r.route);
    const winner = withRoutes.length > 0
      ? withRoutes.sort((a, b) => a.route.distanceM - b.route.distanceM)[0]
      : routed.sort((a, b) => a.fallbackKm - b.fallbackKm)[0];
    if (winner) showRackDetail(winner.rack);
  };

  const handleParkedDone = () => {
    setNavState("idle");
    setNavRoute(null);
    setSelectedRack(null);
    setPanelExpanded(false);
  };

  if (mode === "splash") {
    return <RoleSplash onPick={pickRole} />;
  }

  if (mode === "admin") {
    return (
      <AdminDashboard
        racks={racks}
        dataState={dataState}
        onExit={goUser}
        onHome={goSplash}
      />
    );
  }

  const isPreview = navState === "preview";
  const isActive = navState === "active";
  const isArrived = navState === "arrived" || navState === "parked";
  const isNavving = isPreview || isActive || isArrived;

  const firstStep = navRoute?.steps?.[0];
  const nextStep = navRoute?.steps?.[1];

  return (
    <div
      className={`app grain${selectedRack ? " app--panel-open" : ""}${
        isNavving ? " app--nav" : ""
      }`}
      data-nav-state={navState}
    >
      {!isNavving && (
        <Header
          racksOnline={racks.length}
          availableSlots={availableCount}
          dataState={dataState}
          onHome={goSplash}
        />
      )}

      {/* Route preview/active mode becomes a focused mini navigation screen. */}
      {!isNavving && <SearchBar racks={racks} onSelectResult={handleSearchPick} />}

      {isActive && (
        <NavBanner step={firstStep} nextStep={nextStep} />
      )}

      <MapView
        racks={racks}
        selectedRack={selectedRack}
        onSelectRack={showRackDetail}
        userPos={userPos}
        flyTo={flyTo}
        routeCoords={navRoute?.coords || null}
        navState={navState}
      />

      {/* SidePanel only when not in nav flow — preview/active have their
          own bottom UI that replaces it. */}
      {!isNavving && (
        <SidePanel
          rack={selectedRack}
          userPos={userPos}
          expanded={panelExpanded}
          onToggleExpand={() => setPanelExpanded((v) => !v)}
          onClose={closePanel}
          onStartNavigation={handleStartNavigation}
        />
      )}

      {isPreview && (
        <NavPreviewCard
          route={navRoute}
          rack={selectedRack}
          onStart={handleStartActive}
          onCancel={handleExitNav}
        />
      )}

      {isActive && (
        <NavExitBar
          route={navRoute}
          onExit={handleExitNav}
          onArrive={handleArrive}
        />
      )}

      {isArrived && (
        <ParkingConfirmCard
          state={navState === "parked" ? "parked" : "arrived"}
          rack={selectedRack}
          onConfirm={handleConfirmParked}
          onFindAnother={handleFindAnother}
          onDone={handleParkedDone}
        />
      )}

      {/* Legend + FAB only in idle — nav UI claims the chrome. */}
      {!isNavving && <Legend />}

      {!isNavving && (
        <FAB
          onFindNearest={handleFindNearest}
          onLocate={handleLocate}
          busy={locating}
          hasUserPos={!!userPos}
        />
      )}
    </div>
  );
}
