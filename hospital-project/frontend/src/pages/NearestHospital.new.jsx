import { useState } from 'react';
import HospitalCard from '../components/HospitalCard';
import { getErrorMessage, getNearestHospitals } from '../services/api';

export default function NearestHospital() {
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searchCenter, setSearchCenter] = useState(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (params) => {
    setLoading(true);
    setError('');

    try {
      const response = await getNearestHospitals(params);
      setResults(response.data?.data || []);
      setSearchCenter(response.data?.search_center || null);
      setSearched(true);
    } catch (requestError) {
      setResults([]);
      setError(getErrorMessage(requestError));
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async (event) => {
    event.preventDefault();

    if (!city.trim()) {
      setError('Enter a city name to find nearby hospitals.');
      return;
    }

    await runSearch({
      city: city.trim(),
      radius
    });
  };

  const handleCoordinateSearch = async (event) => {
    event.preventDefault();

    if (lat === '' || lng === '') {
      setError('Enter both latitude and longitude.');
      return;
    }

    await runSearch({
      lat,
      lng,
      radius
    });
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser does not support geolocation. Use the manual latitude/longitude form below.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLat(String(position.coords.latitude));
        setLng(String(position.coords.longitude));

        await runSearch({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius
        });
      },
      (geoError) => {
        setError(geoError.message || 'Could not read your current location.');
      }
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nearest Hospitals</h1>
        <p>Search by city or by manual latitude and longitude with Haversine distance ranking.</p>
      </div>

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <form className="card" style={{ padding: 24, display: 'grid', gap: 14 }} onSubmit={handleCitySearch}>
            <h3>Search by City</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Case-insensitive city matching uses the hospital coordinates already stored in the database.
            </p>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-control"
                placeholder="e.g. Davangere"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Radius (km)</label>
              <input
                className="form-control"
                type="number"
                min="1"
                max="250"
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Find Near This City'}
            </button>
          </form>

          <form className="card" style={{ padding: 24, display: 'grid', gap: 14 }} onSubmit={handleCoordinateSearch}>
            <h3>Manual Coordinates</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Enter latitude and longitude directly to search around any exact point.
            </p>

            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                className="form-control"
                type="number"
                step="any"
                placeholder="e.g. 14.4644"
                value={lat}
                onChange={(event) => setLat(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                className="form-control"
                type="number"
                step="any"
                placeholder="e.g. 75.9210"
                value={lng}
                onChange={(event) => setLng(event.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Searching...' : 'Find by Coordinates'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleUseLocation} disabled={loading}>
                Use My Location
              </button>
            </div>
          </form>
        </div>

        {error && <div className="error-msg" style={{ marginTop: 24 }}>{error}</div>}

        {searchCenter && (
          <div
            className="card"
            style={{
              padding: 18,
              marginTop: 24,
              background: '#f8fbfa',
              border: '1px solid var(--border)'
            }}
          >
            <strong>Search center:</strong> {searchCenter.label}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Calculating nearest hospitals...</span>
          </div>
        ) : searched && results.length === 0 && !error ? (
          <div className="empty-state">
            <h3>No nearby hospitals found</h3>
            <p>Try a larger radius or another nearby city.</p>
          </div>
        ) : results.length > 0 ? (
          <div style={{ marginTop: 28 }}>
            <h2 className="section-title">
              {results.length} hospital{results.length === 1 ? '' : 's'} within the selected radius
            </h2>

            <div className="grid-3">
              {results.map((hospital) => (
                <HospitalCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
