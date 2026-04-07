import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HospitalSearchBar from '../components/HospitalSearchBar';
import HospitalFinderCard from '../components/HospitalFinderCard';
import HospitalResultsMap from '../components/HospitalResultsMap';
import { getErrorMessage, searchHospitals } from '../services/api';
import { FEATURED_CITIES, buildSearchParamsObject } from '../utils/hospitalUi';

const defaultForm = {
  city: '',
  treatment: '',
  cost: ''
};

export default function HospitalsPage({ compareList, onCompareToggle }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(defaultForm);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('Finding the best hospitals for you...');
  const [exactMatch, setExactMatch] = useState(true);
  const [activeChip, setActiveChip] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const urlFilters = useMemo(() => ({
    city: searchParams.get('city') || '',
    treatment: searchParams.get('treatment') || '',
    cost: searchParams.get('cost') || '',
    sort: searchParams.get('sort') || 'rating_desc',
    emergency: searchParams.get('emergency') === '1'
  }), [searchParams]);

  useEffect(() => {
    setForm({
      city: urlFilters.city,
      treatment: urlFilters.treatment,
      cost: urlFilters.cost
    });
  }, [urlFilters.city, urlFilters.cost, urlFilters.treatment]);

  useEffect(() => {
    let cancelled = false;

    async function loadHospitals() {
      setLoading(true);
      setError('');

      try {
        const response = await searchHospitals({
          city: urlFilters.city || undefined,
          treatment: urlFilters.treatment || undefined,
          cost: urlFilters.cost || undefined,
          sort: urlFilters.sort,
          emergency: urlFilters.emergency || undefined
        });

        if (cancelled) {
          return;
        }

        const items = response.data?.data || [];
        const foundExact = response.data?.exact_match !== false;

        setHospitals(items);
        setExactMatch(foundExact);

        if (items.length === 0) {
          setSummary('No hospitals matched your search. Try broadening your filters.');
        } else if (urlFilters.city || urlFilters.treatment || urlFilters.cost || urlFilters.emergency) {
          setSummary(`Found ${items.length} hospital${items.length !== 1 ? 's' : ''} matching your search.`);
        } else {
          setSummary('Showing top-rated hospitals, sorted by rating and affordability.');
        }
      } catch (requestError) {
        if (!cancelled) {
          setHospitals([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHospitals();

    return () => {
      cancelled = true;
    };
  }, [urlFilters.city, urlFilters.cost, urlFilters.emergency, urlFilters.sort, urlFilters.treatment]);

  const chipCounts = useMemo(() => ({
    all: hospitals.length,
    recommended: hospitals.filter((hospital) => hospital.top_recommended).length,
    available: hospitals.filter((hospital) => hospital.available_doctors > 0).length,
    affordable: hospitals.filter((hospital) => Number(hospital.min_treatment_cost || hospital.cost) <= 5000).length
  }), [hospitals]);

  const displayedHospitals = useMemo(() => {
    if (activeChip === 'recommended') {
      return hospitals.filter((hospital) => hospital.top_recommended);
    }

    if (activeChip === 'available') {
      return hospitals.filter((hospital) => hospital.available_doctors > 0);
    }

    if (activeChip === 'affordable') {
      return hospitals.filter((hospital) => Number(hospital.min_treatment_cost || hospital.cost) <= 5000);
    }

    return hospitals;
  }, [activeChip, hospitals]);

  const updateSearch = (nextOverrides = {}) => {
    setSearchParams(buildSearchParamsObject({
      city: nextOverrides.city ?? form.city,
      treatment: nextOverrides.treatment ?? form.treatment,
      cost: nextOverrides.cost ?? form.cost,
      sort: nextOverrides.sort ?? urlFilters.sort,
      emergency: nextOverrides.emergency ?? urlFilters.emergency
    }));
  };

  const handleSubmit = () => {
    setActiveChip('all');
    updateSearch();
  };

  const clearFilters = () => {
    setForm(defaultForm);
    setActiveChip('all');
    setSearchParams({ sort: 'rating_desc' });
  };

  return (
    <div className="page-shell">
      <div className="shell-container">
        <section className="section-shell page-intro">
          <div>
            <span className="section-tag">Hospitals</span>
            <h1>Find the Right Hospital for You</h1>
            <p>
              Search by city, treatment type, and budget. Compare hospitals side by side or locate them on the map.
            </p>
          </div>

          <div className="page-actions">
            <button type="button" className="ghost-button" onClick={clearFilters}>
              Reset Filters
            </button>
          </div>
        </section>

        <HospitalSearchBar
          form={form}
          onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Search Hospitals"
          showEmergency
          emergency={urlFilters.emergency}
          onEmergencyToggle={() => updateSearch({ emergency: !urlFilters.emergency })}
        />

        <div className="quick-chip-row">
          {FEATURED_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              className="quick-chip"
              onClick={() => {
                setForm((current) => ({ ...current, city: city.name }));
                setActiveChip('all');
                updateSearch({ city: city.name });
              }}
            >
              {city.emoji} {city.name}
            </button>
          ))}
        </div>

        {!exactMatch && !loading && !error && (
          <div className="notice-banner warning">
            No exact match was found, so the backend returned broader alternatives to keep the results useful.
          </div>
        )}

        <section className="section-shell">
          <div className="results-toolbar">
            <div>
              <h2>{displayedHospitals.length} Hospital{displayedHospitals.length !== 1 ? 's' : ''} Found</h2>
              <p>{summary}</p>
            </div>

            <div className="toolbar-actions">
              <button
                type="button"
                className={`ghost-button ${showMap ? 'active' : ''}`}
                onClick={() => setShowMap((prev) => !prev)}
              >
                {showMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
              </button>

              <select
                className="sort-select"
                value={urlFilters.sort}
                onChange={(event) => updateSearch({ sort: event.target.value })}
              >
                <option value="rating_desc">Sort: Highest Rating</option>
                <option value="cost_asc">Sort: Lowest Cost</option>
                <option value="name_asc">Sort: Name A–Z</option>
              </select>

              {compareList.length > 0 && (
                <Link to="/compare" className="hero-link secondary">
                  Compare ({compareList.length})
                </Link>
              )}
            </div>
          </div>

          <div className="chip-row">
            <button
              type="button"
              className={`filter-chip ${activeChip === 'all' ? 'active' : ''}`}
              onClick={() => setActiveChip('all')}
            >
              All ({chipCounts.all})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeChip === 'recommended' ? 'active' : ''}`}
              onClick={() => setActiveChip('recommended')}
            >
              Top Recommended ({chipCounts.recommended})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeChip === 'available' ? 'active' : ''}`}
              onClick={() => setActiveChip('available')}
            >
              Doctors Available ({chipCounts.available})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeChip === 'affordable' ? 'active' : ''}`}
              onClick={() => setActiveChip('affordable')}
            >
              Affordable ({chipCounts.affordable})
            </button>
          </div>

          {loading ? (
            <div className="loading-panel">
              <div className="spinner" />
              <p>Searching hospitals, please wait...</p>
            </div>
          ) : error ? (
            <div className="notice-banner danger">{error}</div>
          ) : displayedHospitals.length === 0 ? (
            <div className="empty-panel">
              <strong>No hospitals to show</strong>
              <p>Try a broader city, remove the budget cap, or switch off emergency mode.</p>
            </div>
          ) : (
            <>
              {showMap && (
                <HospitalResultsMap
                  hospitals={displayedHospitals}
                  activeId={activeId}
                  onMarkerClick={setActiveId}
                />
              )}

              <div className="hospital-grid">
                {displayedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onMouseEnter={() => setActiveId(hospital.id)}
                    onMouseLeave={() => setActiveId(null)}
                  >
                    <HospitalFinderCard
                      hospital={hospital}
                      onCompareToggle={onCompareToggle}
                      isSelected={compareList.some((item) => item.id === hospital.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
