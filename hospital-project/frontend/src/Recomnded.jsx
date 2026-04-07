import { useState } from 'react';
import { getRecommendations } from '../services/api';
import { Link } from 'react-router-dom';

const TREATMENTS = ['Cardiac Surgery', 'MRI Scan', 'General Consultation', 'Cancer Treatment', 'CT Scan', 'Hip Replacement', 'Heart Bypass Surgery', 'Knee Replacement', 'Kidney Transplant', 'Dialysis'];

export default function Recommend() {
  const [form, setForm] = useState({ treatment: '', max_budget: '', location: '', priority: 'balanced' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await getRecommendations(form);
      setResults(res.data.data);
    } catch {
      setError('Failed to get recommendations. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = { balanced: '#0a6e5c', rating: '#f0a500', cost: '#22c55e', distance: '#3b82f6' };

  return (
    <div>
      <div className="page-header">
        <h1>Smart Recommendations</h1>
        <p>Tell us your needs and we'll find the best hospitals for you</p>
      </div>

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 40, alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            background: 'white', borderRadius: 'var(--radius)', padding: 28,
            boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 18
          }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>Your Preferences</h3>

            <div className="form-group">
              <label className="form-label">Treatment Needed</label>
              <select className="form-control" value={form.treatment}
                onChange={e => setForm({ ...form, treatment: e.target.value })}>
                <option value="">Any Treatment</option>
                {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Budget (₹)</label>
              <input className="form-control" type="number" placeholder="e.g. 100000"
                value={form.max_budget} onChange={e => setForm({ ...form, max_budget: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Location / City</label>
              <input className="form-control" placeholder="e.g. Bangalore"
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['balanced', 'rating', 'cost', 'distance'].map(p => (
                  <button key={p} type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    style={{
                      padding: '10px', border: `2px solid ${form.priority === p ? priorityColors[p] : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', background: form.priority === p ? priorityColors[p] + '15' : 'white',
                      color: form.priority === p ? priorityColors[p] : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      transition: 'all 0.2s', fontFamily: 'DM Sans'
                    }}>
                    {p === 'balanced' ? '⚖️' : p === 'rating' ? '⭐' : p === 'cost' ? '💰' : '📏'} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '🔍 Finding...' : '🤖 Get Recommendations'}
            </button>
          </form>

          {/* Results */}
          <div>
            {!searched ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏥</div>
                <h3 style={{ color: 'var(--text)' }}>Fill in your preferences</h3>
                <p>We'll rank hospitals based on your priorities</p>
              </div>
            ) : loading ? (
              <div className="loading"><div className="spinner" /><span>Finding best hospitals...</span></div>
            ) : error ? (
              <div className="error-msg">{error}</div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <h3>No hospitals match your criteria</h3>
                <p>Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                <h2 className="section-title">Top {results.length} Recommendations</h2>
                {results.map((h, i) => (
                  <div key={h.id} className="card" style={{ padding: 24, marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center' }}>
                    {/* Rank */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.2rem', color: i < 3 ? '#1a1a1a' : 'var(--text-muted)'
                    }}>
                      #{i + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{h.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {h.location}, {h.city}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-yellow">⭐ {h.rating}</span>
                        {h.distance_km && <span className="badge badge-blue">📏 {h.distance_km} km</span>}
                        {h.min_cost && <span className="badge badge-green">₹{Number(h.min_cost).toLocaleString()}+</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'DM Serif Display', color: 'var(--primary)' }}>
                        {h.recommendation_score}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>score</div>
                      <Link to={`/hospitals/${h.id}`} className="btn btn-primary btn-sm">View →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}