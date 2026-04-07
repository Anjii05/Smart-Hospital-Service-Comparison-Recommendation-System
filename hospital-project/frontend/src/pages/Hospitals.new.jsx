import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HospitalCard from '../components/HospitalCard';
import { getErrorMessage, getHospitals, searchHospitals } from '../services/api';

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

  const loadHospitals = async (nextFilters = filters, nextSort = sort) => {
    setLoading(true);
    setError('');

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
      const hasFilters = Boolean(params.city || params.treatment || params.cost);
      const response = hasFilters
        ? await searchHospitals(params)
        : await getHospitals(params);

      const results = response.data?.data || [];
      setHospitals(results);

      if (hasFilters) {
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
          className="card"
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24
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
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        {compareList.length > 0 && (
          <div
            style={{
              background: 'var(--primary)',
              color: 'white',
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
              <strong>Comparing:</strong> {compareList.map((hospital) => hospital.name).join(' vs ')}
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
          <div className="grid-3">
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onCompareToggle={toggleCompare}
                isSelected={compareList.some((item) => item.id === hospital.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
