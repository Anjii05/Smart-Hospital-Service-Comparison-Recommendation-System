import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addReview, getErrorMessage, getHospitalById } from '../services/api';

const tabs = ['overview', 'treatments', 'doctors', 'facilities', 'reviews'];

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `₹${amount.toLocaleString()}`;
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 16px',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
        borderRadius: 999,
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}

export default function HospitalDetail() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewForm, setReviewForm] = useState({
    patient_name: '',
    rating: 5,
    comment: ''
  });
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setLoading(true);
      setError('');

      try {
        const response = await getHospitalById(id);
        if (isMounted) {
          setHospital(response.data?.data || null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleReviewSubmit = async (event) => {
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
      setReviewMessage('Review submitted successfully.');
    } catch (requestError) {
      setReviewMessage(getErrorMessage(requestError));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading hospital details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <div className="error-msg">{error}</div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Hospital not found</h3>
          <p>The selected hospital could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section
        style={{
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          color: 'white',
          padding: '42px 24px'
        }}
      >
        <div className="container">
          <Link to="/hospitals" style={{ color: 'rgba(255,255,255,0.8)', display: 'inline-block', marginBottom: 16 }}>
            Back to Hospitals
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 760 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                {hospital.top_recommended && <span className="badge badge-yellow">Top Recommended</span>}
                <span className="badge badge-blue">{hospital.city}</span>
              </div>

              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 12 }}>{hospital.name}</h1>
              <p style={{ fontSize: '1rem', opacity: 0.92, maxWidth: 700 }}>{hospital.description}</p>
            </div>

            <div
              style={{
                minWidth: 220,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius)',
                padding: 20
              }}
            >
              <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 }}>{hospital.rating}</div>
              <div style={{ marginTop: 6, opacity: 0.9 }}>Average rating</div>
              <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                <div>Estimated package: <strong>{formatCurrency(hospital.cost)}</strong></div>
                <div>Treatment fee from: <strong>{formatCurrency(hospital.min_treatment_cost)}</strong></div>
                <div>Doctors available: <strong>{hospital.available_doctors}</strong></div>
                <div>Listed treatments: <strong>{hospital.treatment_count}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container section">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 10 }}>Treatment Fees</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Lowest listed fee</p>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{formatCurrency(hospital.min_treatment_cost)}</strong>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 10 }}>Doctor Availability</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Available right now</p>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                {hospital.availability_summary.available_doctors}/{hospital.total_doctors}
              </strong>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 10 }}>Facilities</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>On-site services</p>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{hospital.facilities.length}</strong>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 10 }}>Reviews</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Patient feedback</p>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{hospital.review_summary.total_reviews}</strong>
            </div>
          </div>
        )}

        {activeTab === 'treatments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {hospital.treatments.length > 0 ? hospital.treatments.map((treatment) => (
              <div key={treatment.id} className="card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 10 }}>{treatment.name}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Treatment fee</p>
                <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{formatCurrency(treatment.cost)}</strong>
              </div>
            )) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <h3>No treatments listed</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {hospital.doctors.length > 0 ? hospital.doctors.map((doctor) => (
              <div key={doctor.id} className="card" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 6 }}>{doctor.name}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>{doctor.specialization}</p>
                <span className={`badge ${doctor.is_available ? 'badge-green' : 'badge-red'}`}>
                  {doctor.availability}
                </span>
              </div>
            )) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <h3>No doctors listed</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'facilities' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {hospital.facilities.length > 0 ? hospital.facilities.map((facility) => (
              <span
                key={facility.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: '#eef7f5',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              >
                {facility.name}
              </span>
            )) : (
              <div className="empty-state" style={{ width: '100%' }}>
                <h3>No facilities listed</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {hospital.reviews.length > 0 ? hospital.reviews.map((review) => (
                <div key={review.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <strong>{review.patient_name}</strong>
                    <span className="badge badge-yellow">{review.rating} / 5</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>{review.comment}</p>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </small>
                </div>
              )) : (
                <div className="empty-state">
                  <h3>No reviews yet</h3>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 18 }}>Leave a Review</h3>

              <form onSubmit={handleReviewSubmit} style={{ display: 'grid', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    className="form-control"
                    value={reviewForm.patient_name}
                    onChange={(event) => setReviewForm((current) => ({ ...current, patient_name: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    className="form-control"
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  />
                </div>

                {reviewMessage && (
                  <div style={{ color: reviewMessage.includes('successfully') ? 'var(--primary)' : 'var(--danger)' }}>
                    {reviewMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
