import { Link } from 'react-router-dom';

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `₹${amount.toLocaleString()}`;
}

function RatingStars({ rating }) {
  const roundedRating = Math.round(Number(rating) || 0);

  return (
    <div style={{ color: '#f0a500', letterSpacing: 2, fontSize: '0.92rem' }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value}>{value <= roundedRating ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

export default function HospitalCard({ hospital, onCompareToggle, isSelected }) {
  const facilityPreview = hospital.facility_preview?.slice(0, 3) || [];

  return (
    <article className="card hospital-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
      <div
        style={{
          height: 8,
          background: hospital.top_recommended
            ? 'linear-gradient(90deg, #f0a500, #ffd166)'
            : 'linear-gradient(90deg, var(--primary), var(--primary-light))'
        }}
      />

      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {hospital.top_recommended && (
                <span className="badge badge-yellow">Top Recommended</span>
              )}
              <span className="badge badge-blue">{hospital.city}</span>
              {hospital.distance_km !== null && (
                <span className="badge badge-green">{hospital.distance_km} km away</span>
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>{hospital.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              {hospital.description || 'Trusted hospital with verified treatment, doctor, and facility data.'}
            </p>
          </div>

          <div
            style={{
              padding: '10px 12px',
              minWidth: 82,
              borderRadius: 14,
              background: '#f7fbfa',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>{hospital.rating}</div>
            <RatingStars rating={hospital.rating} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div
            style={{
              background: '#f8fbfa',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Estimated package</div>
            <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{formatCurrency(hospital.cost)}</strong>
          </div>

          <div
            style={{
              background: '#f8fbfa',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 14
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Treatment fee from</div>
            <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{formatCurrency(hospital.min_treatment_cost)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="badge badge-green">
            {hospital.available_doctors}/{hospital.total_doctors} doctors available
          </span>
          <span className="badge badge-blue">{hospital.treatment_count} treatments listed</span>
          <span className="badge badge-yellow">{hospital.review_count} reviews</span>
        </div>

        {facilityPreview.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {facilityPreview.map((facility) => (
              <span
                key={facility}
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: '#eef7f5',
                  color: 'var(--text-muted)'
                }}
              >
                {facility}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
          <Link
            to={`/hospitals/${hospital.id}`}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            View Details
          </Link>

          {onCompareToggle && (
            <button
              type="button"
              className={`btn ${isSelected ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => onCompareToggle(hospital)}
            >
              {isSelected ? 'Added' : 'Compare'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
