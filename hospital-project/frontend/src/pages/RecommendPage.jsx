import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getRecommendations } from '../services/api';
import { TREATMENT_OPTIONS, formatCurrency } from '../utils/hospitalUi';

export default function RecommendPage() {
  const [form, setForm] = useState({
    treatment: '',
    budget: '',
    city: '',
    priority: 'balanced'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(true);

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
    <div className="page-shell">
      <div className="shell-container">
        <section className="section-shell page-intro">
          <div>
            <span className="section-tag">Recommend</span>
            <h1>Find Your Best-Match Hospital</h1>
            <p>Tell us your treatment need, budget, and preferred city — we'll rank the best-fit hospitals for you.</p>
          </div>
        </section>

        <section className="section-shell recommend-layout">
          <form className="recommend-form" onSubmit={submitForm}>
            <div className="form-section">
              <label>Treatment Needed</label>
              <input
                value={form.treatment}
                onChange={(event) => setForm((current) => ({ ...current, treatment: event.target.value }))}
                placeholder="Cardiology Consultation, MRI Scan..."
              />
            </div>

            <div className="quick-chip-row">
              {TREATMENT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`quick-chip ${form.treatment === option ? 'active' : ''}`}
                  onClick={() => setForm((current) => ({
                    ...current,
                    treatment: current.treatment === option ? '' : option
                  }))}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="form-section">
              <label>Maximum Budget</label>
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
                placeholder="50000"
              />
            </div>

            <div className="form-section">
              <label>Preferred City</label>
              <input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Bangalore, Delhi..."
              />
            </div>

            <div className="form-section">
              <label>Decision Priority</label>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                <option value="balanced">Balanced</option>
                <option value="rating">Highest Rating</option>
                <option value="cost">Most Affordable</option>
              </select>
            </div>

            <button type="submit" className="search-submit wide" disabled={loading}>
              {loading ? 'Ranking Hospitals...' : 'Get Recommendations'}
            </button>
          </form>

          <div className="recommend-results">
            {!submitted ? (
              <div className="empty-panel">
                <strong>Ready when you are</strong>
                <p>Submit the form and the recommendation cards will appear here.</p>
              </div>
            ) : loading ? (
              <div className="loading-panel">
                <div className="spinner" />
                <p>Scoring hospitals...</p>
              </div>
            ) : error ? (
              <div className="notice-banner danger">{error}</div>
            ) : results.length === 0 ? (
              <div className="empty-panel">
                <strong>No recommendation results</strong>
                <p>Try broadening your filters or removing the city constraint.</p>
              </div>
            ) : (
              results.map((hospital, index) => (
                <article key={hospital.id} className="recommend-card">
                  <div className="recommend-rank">{index + 1}</div>

                  <div className="recommend-body">
                    <div className="badge-row">
                      {hospital.top_recommended && <span className="mini-badge gold">Top Match</span>}
                      <span className="mini-badge blue">{hospital.city}</span>
                    </div>

                    <h3>{hospital.name}</h3>
                    <p>{hospital.description && hospital.description !== 'Automatically generated via OpenStreetMap data point.'
                      ? hospital.description
                      : `${hospital.city} hospital offering medical services and specialized treatments.`}</p>

                    <div className="tag-row">
                      <span className="soft-tag">Rating {hospital.rating}</span>
                      <span className="soft-tag">From {formatCurrency(hospital.min_treatment_cost || hospital.cost)}</span>
                      <span className="soft-tag">{hospital.available_doctors}/{hospital.total_doctors} doctors free</span>
                    </div>
                  </div>

                  <div className="recommend-score">
                    <strong>{hospital.recommendation_score}</strong>
                    <span>score</span>
                    <Link to={`/hospitals/${hospital.id}`} className="mini-action">
                      Open
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

