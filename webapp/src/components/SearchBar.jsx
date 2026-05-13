import { useEffect, useRef, useState } from "react";
import { searchOneMap } from "../data/oneMapClient.js";
import { searchRacks } from "../data/rackSearch.js";
import "./SearchBar.css";

const DEBOUNCE_MS = 280;

export default function SearchBar({ racks, onSelectResult }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Debounced unified search: rack matches (instant) + OneMap (async)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const localHits = searchRacks(query, racks, { limit: 4 });
    setResults(localHits);
    setOpen(true);
    setLoading(true);

    const handle = setTimeout(async () => {
      const placeHits = await searchOneMap(query, { limit: 4 });
      // Interleave: rack matches first, then places
      setResults([...localHits, ...placeHits].slice(0, 8));
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query, racks]);

  // Close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIdx >= 0 ? activeIdx : 0];
      if (pick) handlePick(pick);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handlePick = (r) => {
    onSelectResult(r);
    setQuery(r.name);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  return (
    <div className="search" ref={wrapRef}>
      <div className="search__row">
        <div className="search__icon" aria-hidden="true">
          ⌕
        </div>
        <input
          ref={inputRef}
          className="search__input"
          type="text"
          placeholder="Search Tampines · racks, blocks, places"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className="search__clear"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <ul className="search__list" role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              className={`search__item ${i === activeIdx ? "search__item--active" : ""}`}
              data-kind={r.kind}
              onMouseDown={(e) => {
                e.preventDefault();
                handlePick(r);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              role="option"
              aria-selected={i === activeIdx}
            >
              <span className="search__kind">{r.kind === "rack" ? "RACK" : "PLACE"}</span>
              <div className="search__txt">
                <div className="search__name">{r.name}</div>
                {r.address && r.address !== r.name && (
                  <div className="search__addr">{r.address}</div>
                )}
              </div>
            </li>
          ))}
          {loading && (
            <li className="search__loading">SEARCHING…</li>
          )}
        </ul>
      )}
    </div>
  );
}
