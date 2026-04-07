// useHospitals.js  –  React hook for hospital filtering
// Usage:  const { hospitals, loading, error, fetch } = useHospitals();

import { useState, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Treatment spell-correction on the frontend too (belt-and-suspenders)
const TREATMENT_FIX = {
  'cardic':   'Cardiology',
  'cardiac':  'Cardiology',
  'gyno':     'Gynecology',
  'ortho':    'Orthopedics',
};

function fixTreatment(val) {
  if (!val) return val;
  return TREATMENT_FIX[val.trim().toLowerCase()] || val.trim();
}

export function useHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const fetchHospitals = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    // Build clean params – omit empty / "Any" values entirely
    const params = {};

    if (filters.city?.trim())
      params.city = filters.city.trim();

    if (filters.max_cost && filters.max_cost !== '' && Number(filters.max_cost) > 0)
      params.max_cost = Number(filters.max_cost);

    if (filters.min_rating && filters.min_rating !== 'Any')
      params.min_rating = Number(filters.min_rating);

    if (filters.treatment && filters.treatment !== 'Any')
      params.treatment = fixTreatment(filters.treatment);

    // Only send emergency if user explicitly chose Yes/No
    if (filters.emergency === 'Yes') params.emergency = true;
    if (filters.emergency === 'No')  params.emergency = false;

    console.log('🔍 Fetching hospitals with params:', params);

    try {
      const { data } = await axios.get(`${BASE_URL}/hospitals`, { params });
      console.log(`✅ Got ${data.count} hospitals`);
      setHospitals(data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('❌ Hospital fetch error:', msg);
      setError(msg);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { hospitals, loading, error, fetchHospitals };
}


// =============================================================
//  HospitalFilter.jsx  –  Example filter component
// =============================================================

import { useState } from 'react';
import { useHospitals } from './useHospitals';

const TREATMENTS = ['Any','General','Cardiology','Neurology','Orthopedics',
  'Oncology','Pediatrics','Gynecology','Dermatology','ENT','Urology'];
const RATINGS    = ['Any','3','3.5','4','4.5'];
const EMERGENCY  = ['Any','Yes','No'];

export default function HospitalFilter() {
  const { hospitals, loading, error, fetchHospitals } = useHospitals();

  const [city,      setCity]      = useState('');
  const [maxCost,   setMaxCost]   = useState('');
  const [treatment, setTreatment] = useState('Any');
  const [minRating, setMinRating] = useState('Any');
  const [emergency, setEmergency] = useState('Any');

  function handleSearch() {
    fetchHospitals({
      city, max_cost: maxCost, treatment,
      min_rating: minRating, emergency,
    });
  }

  return (
    <div>
      <input  placeholder="City"        value={city}      onChange={e => setCity(e.target.value)} />
      <input  placeholder="Max cost/day" type="number"    value={maxCost}   onChange={e => setMaxCost(e.target.value)} />
      <select value={treatment} onChange={e => setTreatment(e.target.value)}>
        {TREATMENTS.map(t => <option key={t}>{t}</option>)}
      </select>
      <select value={minRating} onChange={e => setMinRating(e.target.value)}>
        {RATINGS.map(r => <option key={r}>{r}</option>)}
      </select>
      <select value={emergency} onChange={e => setEmergency(e.target.value)}>
        {EMERGENCY.map(e => <option key={e}>{e}</option>)}
      </select>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>{hospitals.length} hospitals found</p>
      {hospitals.map(h => (
        <div key={h.id}>
          <strong>{h.name}</strong> — {h.city} — ₹{h.cost_per_day}/day — ⭐{h.rating}
        </div>
      ))}
    </div>
  );
}
