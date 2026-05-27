import "./Legend.css";

const ITEMS = [
  { status: "available", label: "Available" },
  { status: "filling", label: "Filling" },
  { status: "full", label: "Full" },
  { status: "offline", label: "Offline" },
];

export default function Legend() {
  return (
    <div className="legend">
      {ITEMS.map((it) => (
        <span key={it.status} className="legend__item">
          <span className="legend__dot" data-status={it.status} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
