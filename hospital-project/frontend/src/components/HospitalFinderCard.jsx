import { Link } from 'react-router-dom';
import {
  formatCurrency,
  formatRating,
  getDirectionsUrl,
  getHospitalHighlights,
  getHospitalTags,
  getPrimaryTreatment
} from '../utils/hospitalUi';

function RatingStars({ rating }) {
  const rounded = Math.max(1, Math.round(Number(rating) || 0));

  return (
    <div className="rating-stars" aria-label={`Rated ${formatRating(rating)} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < rounded ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

export default function HospitalFinderCard({
  hospital,
  onCompareToggle,
  isSelected = false,
  showCompare = true
}) {
  const highlights = getHospitalHighlights(hospital);
  const tags = getHospitalTags(hospital);
  const directionsUrl = getDirectionsUrl(hospital);

  return (
    <article id={`hospital-card-${hospital.id}`} className="hospital-card">
      <div className="hospital-card-accent" />

      <div className="hospital-card-body">
        <div className="hospital-card-head">
          <div>
            <div className="badge-row">
              {highlights.map((highlight) => (
                <span key={highlight.label} className={`mini-badge ${highlight.tone}`}>
                  {highlight.label}
                </span>
              ))}
            </div>

            <h3>{hospital.name}</h3>
            <p className="hospital-subline">
              {hospital.city} · {getPrimaryTreatment(hospital)}
            </p>
          </div>

          <div className="rating-chip">
            <strong>{formatRating(hospital.rating)}</strong>
            <RatingStars rating={hospital.rating} />
          </div>
        </div>

        <p className="hospital-copy">
          {hospital.description && hospital.description !== 'Automatically generated via OpenStreetMap data point.'
            ? hospital.description
            : `${hospital.city} hospital offering a range of medical treatments and services.`}
        </p>

        <div className="metric-grid compact">
          <div className="metric-tile">
            <span>Starting from</span>
            <strong>{formatCurrency(hospital.min_treatment_cost || hospital.cost)}</strong>
          </div>
          <div className="metric-tile">
            <span>Doctors free</span>
            <strong>{hospital.available_doctors}/{hospital.total_doctors}</strong>
          </div>
        </div>

        <div className="tag-row">
          {tags.map((tag) => (
            <span key={tag} className="soft-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="hospital-card-foot">
        <Link to={`/hospitals/${hospital.id}`} className="card-button primary">
          Details
        </Link>

        {directionsUrl ? (
          <a href={directionsUrl} className="card-button secondary" target="_blank" rel="noreferrer">
            Directions
          </a>
        ) : (
          <span className="card-button secondary disabled">No Location</span>
        )}

        {showCompare && (
          <button
            type="button"
            className={`card-button compare ${isSelected ? 'selected' : ''}`}
            onClick={() => onCompareToggle?.(hospital)}
          >
            {isSelected ? 'Added' : 'Compare'}
          </button>
        )}
      </div>
    </article>
  );
}

