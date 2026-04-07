import { Link } from 'react-router-dom';

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f0a500' : '#ddd' }}>★</span>
      ))}
    </span>
  );
}

export default function HospitalCard({ hospital, onCompareToggle, isSelected }) {
  return (
    <div className="card hospital-card" style={{ position: 'relative' }}>
      {/* Color accent bar */}
      <div style={{ height: 5, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))' }} />

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{hospital.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              📍 {hospital.location}, {hospital.city}
            </p>
          </div>
          <span className="badge badge-green" style={{ flexShrink: 0 }}>
            {hospital.rating} ★
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <Stars rating={hospital.rating} />
          {hospital.emergency_available && (
            <span className="badge badge-red">🚨 Emergency</span>
          )}
          {hospital.distance_km && (
            <span className="badge badge-blue">📏 {hospital.distance_km} km</span>
          )}
        </div>

        {hospital.min_cost && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Services from <strong style={{ color: 'var(--primary)' }}>₹{Number(hospital.min_cost).toLocaleString()}</strong>
          </p>
        )}

        {hospital.available_doctors !== undefined && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            👨‍⚕️ <strong>{hospital.available_doctors}</strong> doctors available
          </p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/hospitals/${hospital.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            View Details
          </Link>
          {onCompareToggle && (
            <button
              className={`btn btn-sm ${isSelected ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => onCompareToggle(hospital)}
            >
              {isSelected ? '✓ Added' : '+ Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}