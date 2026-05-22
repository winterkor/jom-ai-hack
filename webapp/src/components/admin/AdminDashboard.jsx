import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav.jsx";
import IncidentList from "./IncidentList.jsx";
import OccupancyList from "./OccupancyList.jsx";
import AdminMap from "./AdminMap.jsx";
import LiveFeed from "./LiveFeed.jsx";
import IncidentModal from "./IncidentModal.jsx";
import { mockIncidents } from "../../data/mockIncidents.js";
import "./AdminDashboard.css";

export default function AdminDashboard({ racks, dataState, onExit, onHome }) {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [selectedId, setSelectedId] = useState(null);

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

  // Esc closes the open modal (works regardless of focus).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const openCount = incidents.filter((i) => i.status === "open").length;

  return (
    <div className="admin grain">
      <AdminNav
        openCount={openCount}
        dataState={dataState}
        onExit={onExit}
        onHome={onHome}
      />

      <div className="admin__grid">
        <aside className="admin__left">
          <IncidentList
            incidents={incidents}
            rackIndex={rackIndex}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </aside>

        <main className="admin__center">
          <AdminMap
            racks={racks}
            incidents={incidents}
            onSelectIncident={setSelectedId}
          />
        </main>

        <aside className="admin__right">
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

      {selected && (
        <IncidentModal
          incident={selected}
          rack={rackIndex.get(selected.rackId) || null}
          onClose={() => setSelectedId(null)}
          onResolve={() => resolveIncident(selected.id)}
        />
      )}
    </div>
  );
}
