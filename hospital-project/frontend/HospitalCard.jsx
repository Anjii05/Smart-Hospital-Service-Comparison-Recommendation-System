import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalCard.css';

const StarRating = ({ rating }) => {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(<span key={i} className="star filled">★</span>);
    else if (i === full && half) stars.push(<span key={i} className="star half">★</span>);
    else stars.push(<span key={i} className="star empty">★</span>);
  }
  return <div className="stars">{stars}</div>;
};

const HospitalCard = ({ hospital, onCompare, isCompared }) => {
  const navigate = useNavigate();

  const formatCost = (cost) => {
    if (!cost || cost === 0) return 'Contact for price';
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L+`;
    return `₹${(cost / 1000).toFixed(0)}K+`;
  };

  return (
    <div className={`hospital-card ${isCompared ? 'compared' : ''}`}>
      <div className="card-image-wrap">
        <img
          src={hospital.image_url || `https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400`}
          alt={hospital.name}
          className="card-image"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400'; }}
        />
        {hospital.is_verified && (
          <div className="verified-badge tooltip-wrap">
            ✓ Verified
            <span className="tooltip-text">Verified by MedCompare team</span>
          </div>
        )}
        {hospital.emergency_available && (
          <div className="emergency-badge">🚑 24/7 ER</div>
        )}
      </div>

      <div className="card-body">
        <div className="card-header-row">
          <h3 className="card-title">{hospital.name}</h3>
        </div>
        <div className="card-location">
          <span className="loc-icon">📍</span>
          <span>{hospital.city}, {hospital.state}</span>
        </div>

        <p className="card-desc">{hospital.short_description}</p>

        <div className="card-stats">
          <div className="stat-item">
            <StarRating rating={parseFloat(hospital.rating)} />
            <div className="stat-detail">
              <span className="stat-value">{hospital.rating}</span>
              <span className="stat-label">({hospital.total_reviews?.toLocaleString()} reviews)</span>
            </div>
          </div>
          <div className="stat-item cost-stat">
            <span className="cost-label">Starting from</span>
            <span className="cost-value">{formatCost(hospital.starting_cost)}</span>
          </div>
        </div>

        {hospital.bed_count > 0 && (
          <div className="card-meta">
            <span className="meta-item">🛏 {hospital.bed_count} Beds</span>
            {hospital.established_year && (
              <span className="meta-item">🏛 Est. {hospital.established_year}</span>
            )}
          </div>
        )}

        <div className="card-actions">
          <button
            className="btn btn-primary btn-sm flex-1"
            onClick={() => navigate(`/hospitals/${hospital.id}`)}
          >
            View Details →
          </button>
          <button
            className={`btn btn-sm compare-btn ${isCompared ? 'btn-accent' : 'btn-outline'}`}
            onClick={() => onCompare && onCompare(hospital)}
            title={isCompared ? 'Remove from compare' : 'Add to compare'}
          >
            {isCompared ? '✓ Added' : '⇄ Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;