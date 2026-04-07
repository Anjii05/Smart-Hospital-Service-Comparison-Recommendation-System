// ============================================================
//  Hospitals.jsx — Smart Hospital Finder UI
//  Design: Clean medical-grade, warm + clinical, trustworthy
//  Features: Filters, fallback banner, sorting, skeletons
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchHospitals, fetchCities, fetchTreatments } from "./hospitalService";

// ─── Inline Styles (no extra CSS file needed) ─────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #f5f7fa;
    --surface:   #ffffff;
    --border:    #e2e8f0;
    --primary:   #0f6fff;
    --primary-d: #0051cc;
    --accent:    #00b37e;
    --warn:      #f59e0b;
    --text:      #1a202c;
    --muted:     #718096;
    --shadow:    0 4px 24px rgba(0,0,0,0.07);
    --radius:    14px;
    --font-head: 'DM Serif Display', serif;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); font-family: var(--font-body); color: var(--text); }

  .hosp-root { max-width: 1200px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }

  /* ── Hero ── */
  .hosp-hero {
    background: linear-gradient(135deg, #0f6fff 0%, #00b37e 100%);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    margin-bottom: 2.5rem;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .hosp-hero::before {
    content: '';
    position: absolute;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    top: -80px; right: -60px;
  }
  .hosp-hero-title {
    font-family: var(--font-head);
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    margin-bottom: 0.5rem;
    line-height: 1.15;
  }
  .hosp-hero-sub { font-size: 1.05rem; opacity: 0.88; font-weight: 300; }

  /* ── Filter Card ── */
  .filter-card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.5rem 1.75rem;
    margin-bottom: 1.75rem;
  }
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    align-items: end;
  }
  .filter-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .filter-label {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .filter-input, .filter-select {
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 0.6rem 0.85rem;
    font-size: 0.95rem;
    font-family: var(--font-body);
    color: var(--text);
    background: #fff;
    transition: border-color 0.2s;
    width: 100%;
  }
  .filter-input:focus, .filter-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15,111,255,0.12);
  }
  .filter-hint { font-size: 0.73rem; color: var(--muted); margin-top: 0.2rem; }

  .btn-search {
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.7rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition: background 0.18s, transform 0.12s;
    width: 100%;
    height: 42px;
  }
  .btn-search:hover { background: var(--primary-d); }
  .btn-search:active { transform: scale(0.98); }
  .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-reset {
    background: transparent;
    color: var(--muted);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    font-family: var(--font-body);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    width: 100%;
    height: 42px;
  }
  .btn-reset:hover { border-color: var(--primary); color: var(--primary); }

  /* ── Fallback Banner ── */
  .fallback-banner {
    background: #fffbeb;
    border: 1.5px solid #f59e0b;
    border-radius: 10px;
    padding: 0.75rem 1.1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: #92400e;
  }
  .fallback-banner .fb-icon { font-size: 1.1rem; }

  /* ── Results Header ── */
  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .results-count {
    font-size: 0.95rem;
    color: var(--muted);
    font-weight: 500;
  }
  .results-count strong { color: var(--text); }
  .sort-select {
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 0.45rem 0.8rem;
    font-size: 0.875rem;
    font-family: var(--font-body);
    color: var(--text);
    background: #fff;
  }
  .sort-select:focus { outline: none; border-color: var(--primary); }

  /* ── Hospital Grid ── */
  .hosp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  /* ── Hospital Card ── */
  .hosp-card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    border: 1.5px solid transparent;
  }
  .hosp-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(0,0,0,0.11);
    border-color: var(--primary);
  }
  .card-img-wrap {
    height: 150px;
    overflow: hidden;
    background: linear-gradient(135deg, #e0ecff, #d0f4e8);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-img-placeholder {
    font-size: 3rem;
    opacity: 0.35;
    user-select: none;
  }
  .card-rating-badge {
    position: absolute;
    top: 10px; right: 10px;
    background: rgba(0,0,0,0.65);
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.25rem 0.55rem;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .card-body { padding: 1.1rem 1.25rem 1.25rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .card-name {
    font-family: var(--font-head);
    font-size: 1.1rem;
    line-height: 1.25;
    color: var(--text);
  }
  .card-city {
    font-size: 0.85rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .card-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.25rem; }
  .card-tag {
    background: #e8f4fd;
    color: #0f6fff;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
  }
  .card-tag.cost {
    background: #e6faf3;
    color: #00884f;
  }

  .card-footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .card-phone {
    font-size: 0.82rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .btn-details {
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    transition: background 0.18s;
    text-decoration: none;
  }
  .btn-details:hover { background: var(--primary-d); }

  /* ── Stars ── */
  .stars { color: #f59e0b; letter-spacing: -1px; }

  /* ── Skeleton Loader ── */
  @keyframes shimmer {
    from { background-position: -600px 0; }
    to   { background-position: 600px 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #e9edf3 25%, #f5f7fa 50%, #e9edf3 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }
  .skel-card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .skel-img { height: 150px; }
  .skel-body { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.65rem; }
  .skel-line { height: 14px; }
  .skel-line.wide { width: 75%; }
  .skel-line.mid  { width: 55%; }
  .skel-line.short{ width: 35%; }

  /* ── Error State ── */
  .error-box {
    background: #fff5f5;
    border: 1.5px solid #fed7d7;
    border-radius: var(--radius);
    padding: 2rem;
    text-align: center;
    color: #c53030;
  }
  .error-box h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
  .error-box p { font-size: 0.9rem; opacity: 0.8; }

  @media (max-width: 600px) {
    .hosp-hero { padding: 2rem 1.25rem; }
    .filter-grid { grid-template-columns: 1fr; }
    .hosp-grid { grid-template-columns: 1fr; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────
function StarRating({ rating }) {
  const filled = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {"★".repeat(filled)}{"☆".repeat(5 - filled)}
    </span>
  );
}

function formatCost(cost) {
  if (!cost) return "—";
  return `₹${Number(cost).toLocaleString("en-IN")}`;
}

function SkeletonCard() {
  return (
    <div className="skel-card">
      <div className="skel-img skeleton" />
      <div className="skel-body">
        <div className="skel-line wide skeleton" />
        <div className="skel-line mid skeleton" />
        <div className="skel-line short skeleton" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function Hospitals() {
  const [filters, setFilters] = useState({
    city: "",
    treatment: "",
    maxCost: "",
    sortBy: "rating_desc",
  });
  const [hospitals, setHospitals] = useState([]);
  const [fallback, setFallback] = useState(false);
  const [fallbackMsg, setFallbackMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const hasSearched = useRef(false);

  // Load initial data + dropdowns
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [result, cityList, treatmentList] = await Promise.all([
          fetchHospitals({ sortBy: "rating_desc" }),
          fetchCities(),
          fetchTreatments(),
        ]);
        setHospitals(result.data);
        setFallback(result.fallback);
        setFallbackMsg(result.message);
        setCities(cityList);
        setTreatments(treatmentList);
      } catch (err) {
        setError("Could not connect to the hospital database. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Re-fetch when sortBy changes (after initial load)
  useEffect(() => {
    if (!hasSearched.current) return;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy]);

  const handleSearch = useCallback(async () => {
    hasSearched.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHospitals(filters);
      setHospitals(result.data);
      setFallback(result.fallback);
      setFallbackMsg(result.message);
    } catch (err) {
      setError("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleReset = () => {
    const reset = { city: "", treatment: "", maxCost: "", sortBy: "rating_desc" };
    setFilters(reset);
    hasSearched.current = false;
    setLoading(true);
    setError(null);
    fetchHospitals({ sortBy: "rating_desc" }).then((result) => {
      setHospitals(result.data);
      setFallback(result.fallback);
      setFallbackMsg(result.message);
    }).catch(() => {
      setError("Could not load hospitals.");
    }).finally(() => setLoading(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="hosp-root">

        {/* ── Hero ── */}
        <div className="hosp-hero">
          <h1 className="hosp-hero-title">🏥 Find the Right Hospital</h1>
          <p className="hosp-hero-sub">
            Search by city, treatment, or budget — we always show you the best options.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="filter-card">
          <div className="filter-grid">

            {/* City */}
            <div className="filter-group">
              <label className="filter-label">City</label>
              <input
                className="filter-input"
                list="city-list"
                placeholder="e.g. Bangalore, Mumbai…"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
              <datalist id="city-list">
                {cities.map((c) => <option key={c} value={c} />)}
              </datalist>
              <span className="filter-hint">Partial names work too (e.g. "Bang")</span>
            </div>

            {/* Treatment */}
            <div className="filter-group">
              <label className="filter-label">Treatment</label>
              <input
                className="filter-input"
                list="treatment-list"
                placeholder="e.g. CT, MRI, Dialysis…"
                value={filters.treatment}
                onChange={(e) => setFilters((f) => ({ ...f, treatment: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
              <datalist id="treatment-list">
                {treatments.map((t) => <option key={t} value={t} />)}
              </datalist>
              <span className="filter-hint">CT → CT Scan auto-corrected</span>
            </div>

            {/* Budget */}
            <div className="filter-group">
              <label className="filter-label">Max Budget (₹)</label>
              <input
                className="filter-input"
                type="number"
                placeholder="Try ₹10,000 or more"
                min="0"
                value={filters.maxCost}
                onChange={(e) => setFilters((f) => ({ ...f, maxCost: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
              <span className="filter-hint">We add a ₹10,000 buffer automatically</span>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select
                className="filter-select"
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
              >
                <option value="rating_desc">⭐ Highest Rated</option>
                <option value="cost_asc">💰 Lowest Cost</option>
                <option value="cost_desc">💎 Highest Cost</option>
                <option value="name_asc">🔤 Name (A–Z)</option>
              </select>
            </div>

            {/* Search btn */}
            <div className="filter-group">
              <label className="filter-label">&nbsp;</label>
              <button className="btn-search" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching…" : "🔍 Search"}
              </button>
            </div>

            {/* Reset btn */}
            <div className="filter-group">
              <label className="filter-label">&nbsp;</label>
              <button className="btn-reset" onClick={handleReset}>↺ Reset</button>
            </div>

          </div>
        </div>

        {/* ── Fallback Banner ── */}
        {!loading && fallback && fallbackMsg && (
          <div className="fallback-banner">
            <span className="fb-icon">💡</span>
            <span>{fallbackMsg}</span>
          </div>
        )}

        {/* ── Results Header ── */}
        {!loading && !error && (
          <div className="results-header">
            <span className="results-count">
              Showing <strong>{hospitals.length}</strong> hospital{hospitals.length !== 1 ? "s" : ""}
            </span>
            <select
              className="sort-select"
              value={filters.sortBy}
              onChange={(e) => {
                hasSearched.current = true;
                setFilters((f) => ({ ...f, sortBy: e.target.value }));
              }}
            >
              <option value="rating_desc">⭐ Highest Rated</option>
              <option value="cost_asc">💰 Lowest Cost</option>
              <option value="cost_desc">💎 Highest Cost</option>
              <option value="name_asc">🔤 Name (A–Z)</option>
            </select>
          </div>
        )}

        {/* ── Error State ── */}
        {error && (
          <div className="error-box">
            <h3>⚠️ Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {/* ── Loading Skeletons ── */}
        {loading && (
          <div className="hosp-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Hospital Cards ── */}
        {!loading && !error && (
          <div className="hosp-grid">
            {hospitals.map((h) => (
              <div className="hosp-card" key={`${h.id}-${h.treatment}`}>

                {/* Image / placeholder */}
                <div className="card-img-wrap">
                  {h.imageUrl ? (
                    <img
                      className="card-img"
                      src={h.imageUrl}
                      alt={h.name}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span className="card-img-placeholder">🏥</span>
                  )}
                  <div className="card-rating-badge">
                    ★ {Number(h.rating).toFixed(1)}
                  </div>
                </div>

                {/* Body */}
                <div className="card-body">
                  <h2 className="card-name">{h.name}</h2>

                  <div className="card-city">
                    <span>📍</span>
                    <span>{h.city}{h.address ? `, ${h.address}` : ""}</span>
                  </div>

                  <StarRating rating={h.rating} />

                  <div className="card-tags">
                    {h.treatment && (
                      <span className="card-tag">{h.treatment}</span>
                    )}
                    {h.cost > 0 && (
                      <span className="card-tag cost">{formatCost(h.cost)}</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="card-footer">
                  <span className="card-phone">
                    {h.phone ? `📞 ${h.phone}` : ""}
                  </span>
                  <a
                    className="btn-details"
                    href={`/hospitals/${h.id}`}
                    rel="noopener noreferrer"
                  >
                    View Details →
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}