import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getRecommendations } from '../services/api';

const treatmentOptions = ['MRI Scan', 'Heart Surgery', 'X-Ray', 'Cancer Treatment', 'General Checkup'];

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `₹${amount.toLocaleString()}`;
}

export default function Recommend() {
  const [form, setForm] = useState({
    treatment: '',
    max_budget: '',
    location: '',
    priority: 'balanced'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await getRecommendations(form);
      setResults(response.data?.data || []);
    } catch (requestError) {
      setResults([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Smart Recommendations</h1>
        <p>Rank hospitals by treatment need, budget, city, and your preferred decision priority.</p>
      </div>

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <form className="card" style={{ padding: 24, display: 'grid', gap: 16 }} onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Treatment Needed</label>
              <select
                className="form-control"
                value={form.treatment}
                onChange={(event) => setForm((current) => ({ ...current, treatment: event.target.value }))}
              >
                <option value="">Any treatment</option>
                {treatmentOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Budget</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.max_budget}
                onChange={(event) => setForm((current) => ({ ...current, max_budget: event.target.value }))}
                placeholder="e.g. 50000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred City</label>
              <input
                className="form-control"
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="e.g. Bangalore"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                <option value="balanced">Balanced</option>
                <option value="rating">Highest rated</option>
                <option value="cost">Most affordable</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ranking hospitals...' : 'Get Recommendations'}
            </button>
          </form>

          <div>
            {!searched ? (
              <div className="empty-state card" style={{ padding: 32 }}>
                <h3>Personalized shortlist</h3>
                <p>Submit your preferences and we will rank the best matching hospitals.</p>
              </div>
            ) : loading ? (
              <div className="loading">
                <div className="spinner" />
                <span>Building recommendations...</span>
              </div>
            ) : error ? (
              <div className="error-msg">{error}</div>
            ) : results.length === 0 ? (
              <div className="empty-state card" style={{ padding: 32 }}>
                <h3>No recommendations found</h3>
                <p>Try broadening your city, budget, or treatment filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {results.map((hospital, index) => (
                  <article key={hospital.id} className="card" style={{ padding: 22, display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span className="badge badge-yellow">Rank #{index + 1}</span>
                          {hospital.top_recommended && <span className="badge badge-green">Top Recommended</span>}
                        </div>
                        <h3 style={{ marginBottom: 6 }}>{hospital.name}</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{hospital.city}</p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {hospital.recommendation_score}
                        </div>
                        <small style={{ color: 'var(--text-muted)' }}>recommendation score</small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">Rating {hospital.rating}</span>
                      <span className="badge badge-green">From {formatCurrency(hospital.min_treatment_cost)}</span>
                      <span className="badge badge-yellow">{hospital.available_doctors}/{hospital.total_doctors} doctors free</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)' }}>{hospital.description}</p>

                    <div>
                      <Link to={`/hospitals/${hospital.id}`} className="btn btn-primary">
                        View Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
