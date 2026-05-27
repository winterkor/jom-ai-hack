import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav.jsx";
import IncidentList from "./IncidentList.jsx";
import OccupancyList from "./OccupancyList.jsx";
import AdminMap from "./AdminMap.jsx";
import LiveFeed from "./LiveFeed.jsx";
import IncidentModal from "./IncidentModal.jsx";
import NavPreviewCard from "../NavPreviewCard.jsx";
import NavBanner from "../NavBanner.jsx";
import NavExitBar from "../NavExitBar.jsx";
import { mockIncidents } from "../../data/mockIncidents.js";
import { getCyclingRoute } from "../../services/routing.js";
import "./AdminDashboard.css";

const TABS = [
  { id: "incidents", label: "Incidents" },
  { id: "map", label: "Map" },
  { id: "racks", label: "Racks" },
];

// Tampines Hub — used as the maintainer's depot origin when geolocation is
// unavailable or denied. Keeps the route demo working without any prompts.
const DEPOT = { lat: 1.3540, lng: 103.9438 };

export default function AdminDashboard({ racks, dataState, onExit, onHome }) {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("incidents");

  // Same nav state machine as the rider — 'idle' | 'preview' | 'active'.
  // navRoute carries the OSRM response so the banner/exit bar can read it.
  const [navState, setNavState] = useState("idle");
  const [navRoute, setNavRoute] = useState(null);
  const [navRack, setNavRack] = useState(null);

  // Maintainer's "you are here" pin on the map. Same geolocation→depot logic
  // as resolveOrigin, but resolved once on mount so the marker stays visible
  // outside of nav mode too.
  const [adminLocation, setAdminLocation] = useState(DEPOT);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.getCurrentPosition(
      (pos) => setAdminLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
    return () => {
      if (id) navigator.geolocation.clearWatch?.(id);
    };
  }, []);

  const rackIndex = useMemo(() => {
    const m = new Map();
    for (const r of racks) m.set(r.id, r);
    return m;
  }, [racks]);

  const selected = useMemo(
    () => incidents.find((i) => i.id === selectedId) || null,
    [incidents, selectedId]
  );

  const resolveIncident = (id) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "resolved" } : i))
    );
    setSelectedId(null);
  };

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const openCount = incidents.filter((i) => i.status === "open").length;

  const usedPct = useMemo(() => {
    const total = racks.reduce((s, r) => s + r.totalSlots, 0);
    const used = racks.reduce((s, r) => s + r.occupiedSlots, 0);
    return total ? Math.round((used / total) * 100) : 0;
  }, [racks]);

  const handleSelectIncident = (id) => setSelectedId(id);

  // Resolve maintainer origin — try geolocation, fall back to the depot.
  const resolveOrigin = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(DEPOT);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(DEPOT),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    });

  const handleNavigate = async (rackArg) => {
    // Accept either a rack object (from OccupancyList) or fall back to the
    // currently-selected incident's rack (from IncidentModal).
    const rack =
      rackArg && rackArg.id
        ? rackArg
        : selected
        ? rackIndex.get(selected.rackId)
        : null;
    if (!rack) return;
    setSelectedId(null);
    setActiveTab("map");
    setNavRack(rack);
    const origin = await resolveOrigin();
    const osrm = await getCyclingRoute(origin, { lat: rack.lat, lng: rack.lng });
    const fallback = {
      coords: [[origin.lat, origin.lng], [rack.lat, rack.lng]],
      distanceM: 1000,
      durationS: 360,
      steps: [
        { instruction: "Head to incident", modifier: "straight", type: "depart", distance: 0, location: [origin.lat, origin.lng], name: "" },
        { instruction: "Arrive at incident", modifier: "straight", type: "arrive", distance: 0, location: [rack.lat, rack.lng], name: "" },
      ],
    };
    setNavRoute(osrm || fallback);
    setNavState("preview");
  };

  const handleStartActive = () => {
    if (!navRoute) return;
    setNavState("active");
  };

  const handleExitNav = () => {
    setNavState("idle");
    setNavRoute(null);
    setNavRack(null);
  };

  const isPreview = navState === "preview";
  const isActive = navState === "active";

  const firstStep = navRoute?.steps?.[0];
  const nextStep = navRoute?.steps?.[1];

  return (
    <div
      className="admin grain"
      data-active-tab={activeTab}
      data-nav-state={navState}
    >
      <AdminNav
        openCount={openCount}
        dataState={dataState}
        onExit={onExit}
        onHome={onHome}
      />

      <div className="admin__hero" aria-hidden={false}>
        <div className="admin__hero-stat">
          <span
            className={`admin__hero-num${
              openCount > 0 ? " admin__hero-num--alert" : ""
            }`}
          >
            {openCount}
          </span>
          <span className="admin__hero-label">
            {openCount === 1 ? "alert" : "alerts"}
          </span>
        </div>
        <span className="admin__hero-sep" aria-hidden>•</span>
        <div className="admin__hero-stat">
          <span className="admin__hero-num">{racks.length}</span>
          <span className="admin__hero-label">racks</span>
        </div>
        <span className="admin__hero-sep" aria-hidden>•</span>
        <div className="admin__hero-stat">
          <span className="admin__hero-num">{usedPct}%</span>
          <span className="admin__hero-label">used</span>
        </div>
      </div>

      <div className="admin__grid">
        <aside
          className={`admin__left admin__pane${
            activeTab === "incidents" ? " is-active" : ""
          }`}
        >
          <IncidentList
            incidents={incidents}
            rackIndex={rackIndex}
            onSelect={handleSelectIncident}
            selectedId={selectedId}
          />
        </aside>

        <main
          className={`admin__center admin__pane${
            activeTab === "map" ? " is-active" : ""
          }`}
        >
          <AdminMap
            racks={racks}
            routeCoords={navRoute?.coords || null}
            adminLocation={adminLocation}
          />
          {isActive && <NavBanner step={firstStep} nextStep={nextStep} />}
          {isPreview && (
            <NavPreviewCard
              route={navRoute}
              rack={navRack}
              onStart={handleStartActive}
              onCancel={handleExitNav}
            />
          )}
          {isActive && (
            <NavExitBar
              route={navRoute}
              onExit={handleExitNav}
              onArrive={handleExitNav}
            />
          )}
        </main>

        <aside
          className={`admin__right admin__pane${
            activeTab === "racks" ? " is-active" : ""
          }`}
        >
          <OccupancyList racks={racks} onNavigate={handleNavigate} />
        </aside>
      </div>

      <footer className="admin__bottom">
        <LiveFeed
          incidents={incidents}
          rackIndex={rackIndex}
          onSelect={setSelectedId}
        />
      </footer>

      <nav className="admin__tabbar" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`admin__tab${active ? " is-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="admin__tab-label">{t.label}</span>
                {t.id === "incidents" && openCount > 0 && (
                  <span className="admin__tab-badge">{openCount}</span>
                )}
              </button>
            );
          })}
      </nav>

      {selected && (
        <IncidentModal
          incident={selected}
          rack={rackIndex.get(selected.rackId) || null}
          onClose={() => setSelectedId(null)}
          onResolve={() => resolveIncident(selected.id)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
