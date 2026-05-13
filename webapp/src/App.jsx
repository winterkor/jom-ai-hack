import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import Header from "./components/Header.jsx";
import SidePanel from "./components/SidePanel.jsx";
import Legend from "./components/Legend.jsx";
import { mockRacks, adaptLtaRack } from "./data/rackData.js";
import { fetchTampinesRacks } from "./data/ltaClient.js";
import "./App.css";

export default function App() {
  const [racks, setRacks] = useState(mockRacks);
  const [dataState, setDataState] = useState("loading"); // "loading" | "live" | "mock"
  const [selectedRack, setSelectedRack] = useState(null);

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

  return (
    <div className="app grain">
      <Header
        racksOnline={racks.length}
        availableSlots={availableCount}
        dataState={dataState}
      />

      <MapView
        racks={racks}
        selectedRack={selectedRack}
        onSelectRack={setSelectedRack}
      />

      <SidePanel
        rack={selectedRack}
        onClose={() => setSelectedRack(null)}
      />

      <Legend />
    </div>
  );
}
