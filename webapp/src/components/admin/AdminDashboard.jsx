import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav.jsx";
import IncidentList from "./IncidentList.jsx";
import OccupancyList from "./OccupancyList.jsx";
import AdminMap from "./AdminMap.jsx";
import LiveFeed from "./LiveFeed.jsx";
import IncidentModal from "./IncidentModal.jsx";
import { mockIncidents } from "../../data/mockIncidents.js";
import "./AdminDashboard.css";

const TABS = [
  { id: "incidents", label: "Incidents" },
  { id: "map", label: "Map" },
  { id: "racks", label: "Racks" },
];

export default function AdminDashboard({ racks, dataState, onExit, onHome }) {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("incidents");
  // Rack the admin asked to navigate to (from an incident). Drives map fly-to
  // + a destination teardrop pin. Bumping `nonce` re-triggers fly even if the
  // same rack is selected twice.
  const [flyTarget, setFlyTarget] = useState(null);

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

  // When an incident is tapped from the LiveFeed-less phone, focus stays in
  // the Incidents tab — selecting from another tab still opens the modal.
  const handleSelectIncident = (id) => {
    setSelectedId(id);
  };

  const handleNavigate = () => {
    if (!selected) return;
    const rack = rackIndex.get(selected.rackId);
    if (!rack) return;
    setFlyTarget({ rack, nonce: Date.now() });
    setActiveTab("map");
    setSelectedId(null);
  };

  return (
    <div className="admin grain" data-active-tab={activeTab}>
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
        <span className="admin__hero-sep" aria-hidden>
          •
        </span>
        <div className="admin__hero-stat">
          <span className="admin__hero-num">{racks.length}</span>
          <span className="admin__hero-label">racks</span>
        </div>
        <span className="admin__hero-sep" aria-hidden>
          •
        </span>
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
            flyTarget={flyTarget}
            onClearFlyTarget={() => setFlyTarget(null)}
          />
        </main>

        <aside
          className={`admin__right admin__pane${
            activeTab === "racks" ? " is-active" : ""
          }`}
        >
          <OccupancyList racks={racks} />
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
