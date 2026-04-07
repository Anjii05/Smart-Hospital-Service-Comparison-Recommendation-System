import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHospitals, compareHospitals } from '../services/api';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const [allHospitals, setAllHospitals] = useState([]);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getHospitals().then(res => setAllHospitals(res.data.data)).catch(() => {});
    const ids = searchParams.get('ids');
    if (ids) {
      const parsed = ids.split(',').map(Number);
      setSelected(parsed);
    }
  }, []);

  useEffect(() => {
    if (selected.length >= 2) handleCompare();
  }, []);

  const handleCompare = async () => {
    if (selected.length < 2) { setError('Please select at least 2 hospitals'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await compareHospitals(selected);
      setResults(res.data.data);
    } catch {
      setError('Failed to compare. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const params = ['rating', 'city', 'distance_km', 'emergency_available'];
  const paramLabels = { rating: '⭐ Rating', city: '📍 City', distance_km: '📏 Distance', emergency_available: '🚨 Emergency' };

  return (
    <div>
      <div className="page-header">
        <h1>Compare Hospitals</h1>
        <p>Select 2–3 hospitals and compare them side by side</p>
      </div>

      <div className="container section">
        {/* Selection */}
        <h2 className="section-title">Select Hospitals (max 3)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {allHospitals.map(h => (
            <button key={h.id}
              className={`btn ${selected.includes(h.id) ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggleSelect(h.id)}>
              {selected.includes(h.id) ? '✓ ' : ''}{h.name}
            </button>
          ))}
        </div>

        <button className="btn btn-accent" onClick={handleCompare} disabled={selected.length < 2 || loading}>
          {loading ? 'Comparing...' : `⚖️ Compare ${selected.length} Hospitals`}
        </button>

        {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}

        {/* Comparison Table */}
        {results.length > 0 && (
          <div style={{ marginTop: 40, overflowX: 'auto' }}>
            <h2 className="section-title">Comparison Results</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <thead>
                <tr style={{ background: 'var(--primary)', color: 'white' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Parameter</th>
                  {results.map(h => (
                    <th key={h.id} style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>{h.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p, i) => (
                  <tr key={p} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>{paramLabels[p]}</td>
                    {results.map(h => (
                      <td key={h.id} style={{ padding: '12px 18px', textAlign: 'center' }}>
                        {p === 'emergency_available' ? (h[p] ? '✅ Yes' : '❌ No') :
                         p === 'distance_km' ? `${h[p]} km` : h[p]}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Services */}
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>💊 Services</td>
                  {results.map(h => (
                    <td key={h.id} style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.85rem' }}>
                      {h.services?.map(s => (
                        <div key={s.id} style={{ marginBottom: 4 }}>
                          {s.service_name}: <strong>₹{Number(s.cost).toLocaleString()}</strong>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Facilities */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>🏢 Facilities</td>
                  {results.map(h => (
                    <td key={h.id} style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.85rem' }}>
                      {h.facilities?.map(f => f.facility_name).join(', ')}
                    </td>
                  ))}
                </tr>

                {/* Doctors */}
                <tr>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)' }}>👨‍⚕️ Doctors</td>
                  {results.map(h => (
                    <td key={h.id} style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span className="badge badge-green">{h.doctor_stats?.available} available</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 6 }}>/ {h.doctor_stats?.total} total</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}