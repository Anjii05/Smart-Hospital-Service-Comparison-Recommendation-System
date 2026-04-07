import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import HospitalResultsMap from '../components/HospitalResultsMap';
import { addReview, getErrorMessage, getHospitalById } from '../services/api';
import { formatCurrency, formatRating, getDirectionsUrl } from '../utils/hospitalUi';

const tabs = ['overview', 'treatments', 'doctors', 'facilities', 'reviews'];

export default function HospitalDetailPage({ compareList, onCompareToggle }) {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showMap, setShowMap] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    patient_name: '',
    rating: 5,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHospital() {
      setLoading(true);
      setError('');

      try {
        const response = await getHospitalById(id);
        if (!cancelled) {
          setHospital(response.data?.data || null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHospital();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const directionsUrl = useMemo(() => getDirectionsUrl(hospital), [hospital]);
  const inCompare = compareList.some((item) => item.id === hospital?.id);

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const response = await addReview(id, reviewForm);
      setHospital(response.data?.data || hospital);
      setReviewForm({
        patient_name: '',
        rating: 5,
        comment: ''
      });
      setReviewMessage('Review added successfully.');
    } catch (requestError) {
      setReviewMessage(getErrorMessage(requestError));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="shell-container">
          <div className="loading-panel">
            <div className="spinner" />
            <p>Loading hospital profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="shell-container">
          <div className="notice-banner danger">{error}</div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="page-shell">
        <div className="shell-container">
          <div className="empty-panel">
            <strong>Hospital not found</strong>
            <p>The requested hospital profile could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="shell-container">
        <section className="detail-hero">
          <div className="detail-copy">
            <Link to="/hospitals" className="back-link">
              ← Back to Hospitals
            </Link>

            <div className="badge-row">
              {hospital.top_recommended && <span className="mini-badge gold">Top Recommended</span>}
              <span className="mini-badge blue">{hospital.city}</span>
              <span className="mini-badge green">{hospital.available_doctors}/{hospital.total_doctors} doctors free</span>
            </div>

            <h1>{hospital.name}</h1>
            <p>{hospital.description && hospital.description !== 'Automatically generated via OpenStreetMap data point.'
              ? hospital.description
              : `${hospital.city} hospital providing healthcare services including treatments, specialist doctors, and modern facilities.`}</p>

            <div className="detail-actions">
              {directionsUrl && (
                <button
                  type="button"
                  className="hero-link primary"
                  onClick={() => {
                    setShowMap(true);
                    window.open(directionsUrl, '_blank', 'noreferrer');
                  }}
                >
                  📍 Get Directions
                </button>
              )}

              {showMap && (
                <button
                  type="button"
                  className="hero-link secondary"
                  onClick={() => setShowMap(false)}
                >
                  Hide Map
                </button>
              )}

              <button
                type="button"
                className={`hero-link secondary ${inCompare ? 'selected' : ''}`}
                onClick={() => onCompareToggle(hospital)}
              >
                {inCompare ? 'Added to Compare' : 'Add to Compare'}
              </button>
            </div>
          </div>

          <div className="detail-stats">
            <div className="metric-tile">
              <span>Rating</span>
              <strong>{formatRating(hospital.rating)}</strong>
            </div>
            <div className="metric-tile">
              <span>Starting Cost</span>
              <strong>{formatCurrency(hospital.min_treatment_cost || hospital.cost)}</strong>
            </div>
            <div className="metric-tile">
              <span>Reviews</span>
              <strong>{hospital.review_summary?.total_reviews ?? 0}</strong>
            </div>
            <div className="metric-tile">
              <span>Treatments</span>
              <strong>{hospital.treatments?.length ?? hospital.treatment_count}</strong>
            </div>
          </div>
        </section>

        {showMap && hospital.latitude && hospital.longitude && (
          <section className="section-shell map-reveal">
            <div className="map-header-row">
              <h3>📍 Location &amp; Directions</h3>
              {directionsUrl && (
                <a href={directionsUrl} className="mini-action" target="_blank" rel="noreferrer">
                  Open in Google Maps ↗
                </a>
              )}
            </div>
            <HospitalResultsMap hospitals={[hospital]} height="360px" />
          </section>
        )}

        <section className="section-shell">
          <div className="chip-row">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-chip ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="detail-grid">
              <div className="surface-card">
                <h3>Address</h3>
                <p>{hospital.address || 'No address available.'}</p>
              </div>
              <div className="surface-card">
                <h3>Contact</h3>
                <p>{hospital.phone || 'No phone listed.'}</p>
              </div>
              <div className="surface-card">
                <h3>Facility Preview</h3>
                <div className="tag-row">
                  {(hospital.facility_preview || hospital.facilities?.map((facility) => facility.name) || []).slice(0, 6).map((facility) => (
                    <span key={facility} className="soft-tag">{facility}</span>
                  ))}
                </div>
              </div>
              <div className="surface-card">
                <h3>Availability</h3>
                <p>
                  {hospital.availability_summary?.available_doctors ?? hospital.available_doctors} available,
                  {' '}
                  {hospital.availability_summary?.busy_doctors ?? Math.max((hospital.total_doctors || 0) - (hospital.available_doctors || 0), 0)} busy
                  {(hospital.total_doctors === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> (estimated)</span>}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="detail-grid">
              {hospital.treatments?.map((treatment) => (
                <div key={treatment.id} className="surface-card">
                  <h3>{treatment.name}</h3>
                  <p>{formatCurrency(treatment.cost)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="detail-grid">
              {hospital.doctors?.map((doctor) => (
                <div key={doctor.id} className="surface-card">
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialization}</p>
                  <span className={`mini-badge ${doctor.is_available ? 'green' : 'slate'}`}>
                    {doctor.availability}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="surface-card">
              <div className="tag-row">
                {hospital.facilities?.map((facility) => (
                  <span key={facility.id} className="soft-tag">
                    {facility.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-layout">
              <div className="review-list">
                {hospital.reviews?.length ? hospital.reviews.map((review) => (
                  <article key={review.id} className="surface-card">
                    <div className="review-head">
                      <strong>{review.patient_name}</strong>
                      <span className="mini-badge gold">{review.rating}/5</span>
                    </div>
                    <p>{review.comment || 'No comment provided.'}</p>
                  </article>
                )) : (
                  <div className="empty-panel">
                    <strong>No reviews yet</strong>
                    <p>Be the first patient to add feedback.</p>
                  </div>
                )}
              </div>

              <form className="surface-card review-form" onSubmit={submitReview}>
                <h3>Leave a Review</h3>

                <label>Your Name</label>
                <input
                  value={reviewForm.patient_name}
                  onChange={(event) => setReviewForm((current) => ({ ...current, patient_name: event.target.value }))}
                />

                <label>Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>

                <label>Comment</label>
                <textarea
                  rows="5"
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                />

                {reviewMessage && (
                  <div className={`notice-banner ${reviewMessage.includes('success') ? 'success' : 'danger'}`}>
                    {reviewMessage}
                  </div>
                )}

                <button type="submit" className="search-submit wide" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
