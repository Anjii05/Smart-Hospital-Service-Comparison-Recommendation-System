import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHospitalById, addReview } from '../services/api';

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
      fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.9rem',
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
      transition: 'all 0.2s'
    }}>
      {label}
    </button>
  );
}

export default function HospitalDetail() {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('services');
  const [review, setReview] = useState({ patient_name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    getHospitalById(id)
      .then(res => setHospital(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addReview(id, review);
      setReviewMsg('✅ Review submitted!');
      setReview({ patient_name: '', rating: 5, comment: '' });
      const res = await getHospitalById(id);
      setHospital(res.data.data);
    } catch {
      setReviewMsg('❌ Failed to submit review.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
  if (!hospital) return <div className="container" style={{ padding: 40 }}><p>Hospital not found.</p></div>;

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
        color: 'white', padding: '40px 24px'
      }}>
        <div className="container">
          <Link to="/hospitals" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: 12, display: 'block' }}>
            ← Back to Hospitals
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'DM Serif Display', fontSize: '2rem', marginBottom: 8 }}>{hospital.name}</h1>
              <p style={{ opacity: 0.85 }}>📍 {hospital.location}, {hospital.city}</p>
              <p style={{ opacity: 0.75, marginTop: 6, fontSize: '0.9rem' }}>{hospital.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'DM Serif Display' }}>{hospital.rating}</div>
              <div style={{ color: '#ffd166', fontSize: '1.2rem' }}>
                {'★'.repeat(Math.round(hospital.rating))}{'☆'.repeat(5 - Math.round(hospital.rating))}
              </div>
              {hospital.emergency_available && (
                <span className="badge badge-red" style={{ marginTop: 8 }}>🚨 Emergency 24/7</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            <span>📞 {hospital.phone}</span>
            <span>✉️ {hospital.email}</span>
            {hospital.distance_km && <span>📏 {hospital.distance_km} km away</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {['services', 'doctors', 'facilities', 'reviews'].map(t => (
            <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="container section">
        {tab === 'services' && (
          <div>
            <h2 className="section-title">Services & Pricing</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {hospital.services?.map(s => (
                <div key={s.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{s.service_name}</p>
                    <span className="badge badge-blue">{s.category}</span>
                  </div>
                  <div style={{ fontFamily: 'DM Serif Display', fontSize: '1.2rem', color: 'var(--primary)' }}>
                    ₹{Number(s.cost).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'doctors' && (
          <div>
            <h2 className="section-title">Our Doctors</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {hospital.doctors?.map(d => (
                <div key={d.id} className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>👨‍⚕️</div>
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>{d.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{d.specialization}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{d.experience_years} years experience</p>
                  <span className={`badge ${d.available ? 'badge-green' : 'badge-red'}`} style={{ marginTop: 8 }}>
                    {d.available ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'facilities' && (
          <div>
            <h2 className="section-title">Facilities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {hospital.facilities?.map(f => (
                <span key={f.id} className="badge badge-green" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                  ✅ {f.facility_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            <h2 className="section-title">Patient Reviews</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
              <div>
                {hospital.reviews?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
                ) : (
                  hospital.reviews?.map(r => (
                    <div key={r.id} className="card" style={{ padding: 20, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>{r.patient_name}</strong>
                        <span style={{ color: '#f0a500' }}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{r.comment}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Leave a Review</h3>
                <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input className="form-control" required value={review.patient_name}
                      onChange={e => setReview({ ...review, patient_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select className="form-control" value={review.rating}
                      onChange={e => setReview({ ...review, rating: parseInt(e.target.value) })}>
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <textarea className="form-control" rows={3} value={review.comment}
                      onChange={e => setReview({ ...review, comment: e.target.value })}
                      style={{ resize: 'vertical' }} />
                  </div>
                  {reviewMsg && <p style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{reviewMsg}</p>}
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}