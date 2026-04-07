import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HospitalSearchBar from '../components/HospitalSearchBar';
import HospitalFinderCard from '../components/HospitalFinderCard';
import HospitalResultsMap from '../components/HospitalResultsMap';
import { getErrorMessage, searchHospitals } from '../services/api';
import { buildSearchParamsObject } from '../utils/hospitalUi';

export default function MapPage({ compareList, onCompareToggle }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({ city: '', treatment: '', cost: '' });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);

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

        if (!cancelled) {
          setHospitals(response.data?.data || []);
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

  const submitSearch = () => {
    setSearchParams(buildSearchParamsObject({
      city: form.city,
      treatment: form.treatment,
      cost: form.cost,
      sort: urlFilters.sort,
      emergency: urlFilters.emergency
    }));
  };

  return (
    <div className="page-shell">
      <div className="shell-container">
        <section className="section-shell page-intro">
          <div>
            <span className="section-tag">Map View</span>
            <h1>Interactive Hospital Map</h1>
            <p>Plot your current search on the map, then scan a short card list underneath for quick decisions.</p>
          </div>
        </section>

        <HospitalSearchBar
          form={form}
          onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onSubmit={submitSearch}
          loading={loading}
          submitLabel="Load Map"
          showEmergency
          emergency={urlFilters.emergency}
          onEmergencyToggle={() => setSearchParams(buildSearchParamsObject({
            ...urlFilters,
            city: form.city,
            treatment: form.treatment,
            cost: form.cost,
            emergency: !urlFilters.emergency
          }))}
        />

        <section className="section-shell">
          {loading ? (
            <div className="loading-panel">
              <div className="spinner" />
              <p>Preparing your hospital map...</p>
            </div>
          ) : error ? (
            <div className="notice-banner danger">{error}</div>
          ) : hospitals.length === 0 ? (
            <div className="empty-panel">
              <strong>No map points available</strong>
              <p>Search a city or treatment to load hospitals with coordinates.</p>
            </div>
          ) : (
            <>
              <HospitalResultsMap
                hospitals={hospitals}
                activeId={activeId}
                onMarkerClick={setActiveId}
                height="68vh"
              />

              <div className="section-heading" style={{ marginTop: '1.5rem' }}>
                <h2>Hospital Shortlist</h2>
                <p>{hospitals.length} mapped results</p>
              </div>

              <div className="hospital-grid compact-grid">
                {hospitals.slice(0, 6).map((hospital) => (
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

