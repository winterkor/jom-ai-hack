import { useEffect, useMemo, useRef, useState } from "react";
import {
  INCIDENT_TYPES,
  SEVERITY,
  openIncidents,
  pickIncidentBlurb,
  timeAgo,
} from "../../data/mockIncidents.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "illegal_parking", label: "Illegal" },
  { id: "abandoned", label: "Abandoned" },
  { id: "overflow", label: "Overflow" },
];

export default function IncidentList({
  incidents,
  rackIndex,
  onSelect,
  selectedId,
}) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const searchRef = useRef(null);

  // Keyboard: "/" focuses search unless typing in another input.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/") return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const open = openIncidents(incidents);
    const byType = filter === "all" ? open : open.filter((i) => i.type === filter);
    const term = q.trim().toLowerCase();
    const byQ = !term
      ? byType
      : byType.filter((i) => {
          const r = rackIndex.get(i.rackId);
          return (
            i.rackId.toLowerCase().includes(term) ||
            (r && r.name.toLowerCase().includes(term))
          );
        });
    return byQ.sort((a, b) => {
      const sw = SEVERITY[b.severity].weight - SEVERITY[a.severity].weight;
      if (sw !== 0) return sw;
      return new Date(b.detectedAt) - new Date(a.detectedAt);
    });
  }, [incidents, rackIndex, filter, q]);

  const openCount = openIncidents(incidents).length;

  return (
    <>
      <header className="panel-head">
        <div className="panel-head__eyebrow">Open incidents</div>
        <div
          className={
            "panel-head__count" + (openCount > 0 ? " panel-head__count--alert" : "")
          }
        >
          {openCount}
        </div>

        <input
          ref={searchRef}
          className="panel-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search rack…  (press "/")'
        />

        <div className="panel-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={
                "panel-filter" + (filter === f.id ? " panel-filter--active" : "")
              }
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        openCount === 0 ? (
          <div className="panel-empty panel-empty--ok">
            <div className="panel-empty__icon" aria-hidden>✓</div>
            <div className="panel-empty__title">All clear</div>
            <div className="panel-empty__sub">
              No open incidents across {rackIndex.size} racks.
            </div>
          </div>
        ) : (
          <div className="panel-empty">
            No incidents match this filter.
            <br />
            <button
              type="button"
              className="panel-empty__reset"
              onClick={() => {
                setFilter("all");
                setQ("");
              }}
            >
              Reset filters
            </button>
          </div>
        )
      ) : (
        <ul className="panel-list">
          {filtered.map((inc) => {
            const rack = rackIndex.get(inc.rackId);
            const type = INCIDENT_TYPES[inc.type];
            const active = inc.id === selectedId;
            return (
              <li
                key={inc.id}
                className={"panel-row" + (active ? " panel-row--active" : "")}
                onClick={() => onSelect(inc.id)}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="panel-row__title">
                    {rack ? rack.name : inc.rackId}
                  </div>
                  <div className="panel-row__sub">
                    {pickIncidentBlurb(inc.id, inc.type)} · {timeAgo(inc.detectedAt)}
                  </div>
                </div>
                <span className={`severity-pill severity-pill--${inc.severity}`}>
                  {SEVERITY[inc.severity].label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
