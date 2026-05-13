import { useState } from "react";
import MapView from "./components/MapView.jsx";
import Header from "./components/Header.jsx";
import SidePanel from "./components/SidePanel.jsx";
import Legend from "./components/Legend.jsx";
import { rackData } from "./data/rackData.js";
import "./App.css";

export default function App() {
  const [selectedRack, setSelectedRack] = useState(null);

  const totals = rackData.reduce(
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
      <Header racksOnline={rackData.length} availableSlots={availableCount} />

      <MapView
        racks={rackData}
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
