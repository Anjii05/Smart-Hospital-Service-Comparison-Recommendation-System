import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HospitalCard from '../components/HospitalCard';
import { getErrorMessage, getHospitals, searchHospitals, getNearestHospitals, getRecommendations } from '../services/api';
import GlobalMap from '../components/GlobalMap';

const defaultFilters = {
  city: '',
  treatment: '',
  cost: ''
};

export default function Hospitals() {
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState('rating_desc');
  const [hospitals, setHospitals] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchSummary, setSearchSummary] = useState('Showing top hospitals ranked by rating and affordability.');

  const [exactMatch, setExactMatch] = useState(true);
  const [activeHospitalId, setActiveHospitalId] = useState(null);

  const loadHospitals = async (nextFilters = filters, nextSort = sort) => {
    setLoading(true);
    setError('');
    setExactMatch(true);

    const params = {
      sort: nextSort
    };

    if (nextFilters.city.trim()) {
      params.city = nextFilters.city.trim();
    }

    if (nextFilters.treatment.trim()) {
      params.treatment = nextFilters.treatment.trim();
    }

    if (nextFilters.cost.trim()) {
      params.cost = nextFilters.cost.trim();
    }

    try {
      let response;
      let results = [];

      const hasFilters = Boolean(params.city || params.treatment || params.cost);
      response = hasFilters
        ? await searchHospitals(params)
        : await getHospitals(params);

      results = response.data?.data || [];
      setHospitals(results);
      
      if (response.data?.exact_match === false) {
        setExactMatch(false);
        setSearchSummary('No exact match found — showing best alternatives globally based on rating and available inventory.');
      } else if (hasFilters) {
        setSearchSummary(
          results.length > 0
            ? `Found ${results.length} matching hospitals with case-insensitive city and treatment filtering.`
            : 'No hospitals matched those filters. Try a broader city, treatment, or cost range.'
        );
      } else {
        setSearchSummary('Showing top hospitals ranked by rating and affordability.');
      }
    } catch (requestError) {
      setHospitals([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals(defaultFilters, sort);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadHospitals(filters, sort);
  };

  const handleReset = async () => {
    setFilters(defaultFilters);
    setSort('rating_desc');
    await loadHospitals(defaultFilters, 'rating_desc');
  };

  const loadRecommended = async () => {
    setLoading(true);
    try {
      const payload = {
        city: filters.city.trim() || undefined,
        treatment: filters.treatment.trim() || undefined,
        budget: filters.cost || undefined,
        priority: 'balanced'
      };
      
      const response = await getRecommendations(payload);
      const results = response.data?.data || [];
      setHospitals(results);
      setSearchSummary(`Loaded ${results.length} smart recommendations sorted by combined rating and cost scores.`);
      setExactMatch(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (hospital) => {
    setCompareList((current) => {
      if (current.some((item) => item.id === hospital.id)) {
        return current.filter((item) => item.id !== hospital.id);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, hospital];
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Browse Hospitals</h1>
        <p>Search by city, treatment, and budget, then sort by rating or cost.</p>
      </div>

      <div className="container section">
        <form
          onSubmit={handleSubmit}
          className="glass-panel"
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24,
            borderRadius: 'var(--radius)'
          }}
        >
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              className="form-control"
              placeholder="e.g. davangere"
              value={filters.city}
              onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment</label>
            <input
              className="form-control"
              placeholder="e.g. MRI Scan"
              value={filters.treatment}
              onChange={(event) => setFilters((current) => ({ ...current, treatment: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Cost</label>
            <input
              className="form-control"
              type="number"
              min="0"
              placeholder="e.g. 20000"
              value={filters.cost}
              onChange={(event) => setFilters((current) => ({ ...current, cost: event.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sort</label>
            <select
              className="form-control"
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value;
                setSort(nextSort);
                loadHospitals(filters, nextSort);
              }}
            >
              <option value="rating_desc">Rating: High to Low</option>
              <option value="cost_asc">Cost: Low to High</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Search
            </button>
            <button type="button" className="btn btn-accent" style={{ flex: 1 }} onClick={loadRecommended}>
              Recommend Best
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        {compareList.length > 0 && (
          <div
            className="glass-panel"
            style={{
              borderRadius: 'var(--radius)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 24
            }}
          >
            <div>
              <strong style={{ color: 'var(--primary-dark)' }}>Comparing:</strong> {compareList.map((hospital) => hospital.name).join(' vs ')}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {compareList.length >= 2 && (
                <Link
                  to={`/compare?ids=${compareList.map((hospital) => hospital.id).join(',')}`}
                  className="btn btn-accent"
                >
                  Open Comparison
                </Link>
              )}

              <button type="button" className="btn btn-ghost" style={{ color: 'white' }} onClick={() => setCompareList([])}>
                Clear
              </button>
            </div>
          </div>
        )}

        {exactMatch === false && !loading && (
          <div style={{ padding: 16, backgroundColor: '#fff3cd', color: '#856404', borderRadius: 'var(--radius)', marginBottom: 24, borderLeft: '4px solid #ffeeba' }}>
            <strong>No exact filter match found.</strong> Showing best rating alternatives to ensure you aren't left stranded without options.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20
          }}
        >
          <p style={{ color: 'var(--text-muted)' }}>{searchSummary}</p>
          {!loading && !error && hospitals.length > 0 && (
            <strong>{hospitals.length} hospitals</strong>
          )}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading hospitals...</span>
          </div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : hospitals.length === 0 ? (
          <div className="empty-state">
            <h3>No hospitals found</h3>
            <p>Try a broader city name, a different treatment, or a higher budget.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, flexDirection: window.innerWidth < 1000 ? 'column-reverse' : 'row' }}>
            <div style={{ flex: 1 }}>
              <div className="grid-3" style={{ gridTemplateColumns: window.innerWidth < 1000 ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {hospitals.map((hospital) => (
                  <div key={hospital.id} onMouseEnter={() => setActiveHospitalId(hospital.id)} onMouseLeave={() => setActiveHospitalId(null)}>
                    <HospitalCard
                      hospital={hospital}
                      onCompareToggle={toggleCompare}
                      isSelected={compareList.some((item) => item.id === hospital.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ width: window.innerWidth < 1000 ? '100%' : '400px', flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
               <GlobalMap 
                  hospitals={hospitals} 
                  activeId={activeHospitalId} 
                  onMarkerClick={(id) => {
                    setActiveHospitalId(id);
                    document.getElementById(`hospital-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }} 
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
