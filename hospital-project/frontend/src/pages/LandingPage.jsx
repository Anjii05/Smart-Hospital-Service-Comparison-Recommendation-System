import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HospitalSearchBar from '../components/HospitalSearchBar';
import HospitalFinderCard from '../components/HospitalFinderCard';
import HospitalResultsMap from '../components/HospitalResultsMap';
import { FEATURED_CITIES, FEATURED_HOSPITALS, buildSearchQuery } from '../utils/hospitalUi';
import { getNearestHospitals, getErrorMessage, checkBackendReady } from '../services/api';

const stats = [
  { value: '50+', label: 'Cities Covered' },
  { value: '25km', label: 'Default Radius' },
  { value: '3-way', label: 'Side-by-Side Compare' },
  { value: 'Maps', label: 'Interactive Map' },
  { value: 'Reviews', label: 'Patient Reviews' }
];

const features = [
  {
    icon: '🗺️',
    title: 'Map-based exploration',
    description: 'Browse hospitals on an interactive map, then jump straight into details and directions.'
  },
  {
    icon: '⚖️',
    title: 'Side-by-side compare',
    description: 'Shortlist up to three hospitals and compare treatment pricing, facilities, doctors, and reviews.'
  },
  {
    icon: '🎯',
    title: 'Smart recommendations',
    description: 'Get balanced, cost-first, or rating-first hospital recommendations tailored to your needs.'
  },
  {
    icon: '📍',
    title: 'Nearest hospital search',
    description: 'Search by city, current location, or manual coordinates to find hospitals near you.'
  },
  {
    icon: '📝',
    title: 'Detailed hospital profiles',
    description: 'Each hospital has a full profile with treatments, doctors, facilities, and patient review submission.'
  },
  {
    icon: '🏥',
    title: 'Live hospital data',
    description: 'Hospital data is sourced from OpenStreetMap and enriched with medical service details for each city.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    city: '',
    treatment: '',
    cost: ''
  });

  // Connection State
  const [isConnected, setIsConnected] = useState(true);

  // Location Search State
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locResults, setLocResults] = useState([]);
  const [locCenter, setLocCenter] = useState(null);

  useEffect(() => {
    checkBackendReady().then(setIsConnected);
  }, []);

  const submitSearch = () => {
    navigate(`/hospitals${buildSearchQuery({ ...form, sort: 'rating_desc' })}`);
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location access is not supported in this browser.');
      return;
    }

    setLocLoading(true);
    setLocError('');
    setLocResults([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = String(position.coords.latitude);
          const lng = String(position.coords.longitude);
          
          const response = await getNearestHospitals({ lat, lng, radius: '50' });
          const hospitals = response.data?.data || [];
          
          setLocResults(hospitals);
          setLocCenter(response.data?.center || { latitude: parseFloat(lat), longitude: parseFloat(lng), label: 'Your Location' });
          
          if (hospitals.length === 0) {
            setLocError('No hospitals found within 50km of your location.');
          }

          // Scroll to results
          setTimeout(() => {
            const el = document.getElementById('nearest-results');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);

        } catch (err) {
          setLocError(getErrorMessage(err));
        } finally {
          setLocLoading(false);
        }
      },
      (geoError) => {
        if (geoError.code === 1) { // PERMISSION_DENIED
          console.log("📍 Browser blocked GPS. Attempting IP-based fallback...");
          setLocError("Working... Using network location (fallback)");
          
          // IP-Based Fallback using free ipapi.co
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(async (ipData) => {
              if (ipData.latitude && ipData.longitude) {
                const lat = String(ipData.latitude);
                const lng = String(ipData.longitude);
                
                const response = await getNearestHospitals({ lat, lng, radius: '50' });
                const hospitals = response.data?.data || [];
                
                setLocResults(hospitals);
                setLocCenter(response.data?.center || { latitude: ipData.latitude, longitude: ipData.longitude, label: ipData.city || 'Your Area' });
                setLocError('');
                
                setTimeout(() => {
                  const el = document.getElementById('nearest-results');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                setLocError("Could not determine network location. Please search by city.");
              }
            })
            .catch(() => {
              setLocError("Permission Denied. For safety features, please use 'http://localhost:3000' or search by city.");
            })
            .finally(() => {
              setLocLoading(false);
            });
        } else {
          setLocError(geoError.message || 'Could not access location.');
          setLocLoading(false);
        }
      }
    );
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-backdrop" />
        <div className="hero-overlay" />
        <div className="hero-grid" />

        <div className="shell-container hero-content">
          <div className="hero-pill">
            <span className="pulse-dot" />
            Real Hospitals · Live Data
          </div>

          <h1>
            Find the Right Hospital <em>Near You</em>
          </h1>

          <p className="hero-copy">
            Search hospitals by city, treatment, and budget. Compare your shortlist, find the nearest facility,
            and get smart recommendations — all in one place.
          </p>

          <HospitalSearchBar
            form={form}
            onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
            onSubmit={submitSearch}
            loading={false}
            submitLabel="Find Hospitals"
          />

          <div className="hero-cta-row">
            <Link to="/recommend" className="hero-link primary">
              Get Recommendations
            </Link>
            <button 
              type="button" 
              className="hero-link secondary" 
              onClick={useLocation}
              disabled={locLoading}
            >
              {locLoading ? '⌛ Detecting...' : '📍 Use My Location'}
            </button>
          </div>

          {locError && <div className="notice-banner danger" style={{ marginTop: '1.5rem' }}>{locError}</div>}
          {!isConnected && (
            <div className="notice-banner warning" style={{ marginTop: '1rem' }}>
              ⚠️ Backend not detected. Please make sure the server is running on port 5000.
            </div>
          )}
        </div>
      </section>

      <section className="stats-strip">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-tile">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <div className="shell-container">
        {/* Nearest Results Section (If location search active) */}
        {locResults.length > 0 && (
          <section id="nearest-results" className="section-shell" style={{ animation: 'slide-down 0.5s ease' }}>
            <div className="section-heading center">
              <span className="section-tag success">Safe Zones Found</span>
              <h2>Hospitals Near You</h2>
              <p>Found <strong>{locResults.length}</strong> facilities within 50km of {locCenter?.label || 'your location'}.</p>
            </div>

            {/* Interactive Map View */}
            {locCenter && (
              <div className="map-reveal" style={{ marginBottom: '2rem' }}>
                <HospitalResultsMap 
                  hospitals={locResults} 
                  center={locCenter}
                  height="450px" 
                />
              </div>
            )}

            <div className="hospital-grid">
              {locResults.map((hospital) => (
                <HospitalFinderCard
                  key={hospital.id}
                  hospital={hospital}
                  onCompareToggle={() => {}} // Disabled on home simple list
                  isSelected={false}
                />
              ))}
            </div>

            <div className="center" style={{ marginTop: '2rem' }}>
              <button 
                type="button" 
                className="hero-link secondary"
                onClick={() => {
                  setLocResults([]);
                  setLocCenter(null);
                }}
              >
                Clear Location Results
              </button>
            </div>
          </section>
        )}

        <section className="section-shell">
          <div className="section-heading center">
            <span className="section-tag">Quick Search</span>
            <h2>Popular Cities</h2>
            <p>Browse hospitals in major Indian cities with real-world data from OpenStreetMap.</p>
          </div>

          <div className="city-grid">
            {FEATURED_CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                className="city-card"
                onClick={() => navigate(`/hospitals${buildSearchQuery({ city: city.name, sort: 'rating_desc' })}`)}
              >
                <span className="city-emoji">{city.emoji}</span>
                <strong>{city.name}</strong>
                <small>{city.state}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="section-heading center">
            <span className="section-tag">Featured Hospitals</span>
            <h2>Famous Hospitals You Can Explore Right Away</h2>
            <p>These hospitals are preloaded with real city, location, and service data so the app feels useful on first load.</p>
          </div>

          <div className="hospital-grid">
            {FEATURED_HOSPITALS.map((hospital) => (
              <HospitalFinderCard
                key={hospital.id}
                hospital={hospital}
                onCompareToggle={() => {}}
                isSelected={false}
                showCompare={false}
              />
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="section-heading center">
            <span className="section-tag">Features</span>
            <h2>Everything You Need to Choose the Right Hospital</h2>
            <p>From search and compare to nearest hospital and ratings — we've got you covered.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="cta-panel">
            <div>
              <span className="section-tag">Next Step</span>
              <h2>Start with browsing or jump straight to the smartest match.</h2>
              <p>
                Search hospitals first if you want control, or use recommendation and nearest flows if you
                want the app to guide the shortlist for you.
              </p>
            </div>

            <div className="cta-actions">
              <Link to="/hospitals" className="hero-link primary">
                Browse Hospitals
              </Link>
              <Link to="/map" className="hero-link secondary">
                Open Map View
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
