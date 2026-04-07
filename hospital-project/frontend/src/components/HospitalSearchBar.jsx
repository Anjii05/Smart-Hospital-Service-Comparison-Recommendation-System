import { useMemo, useState } from 'react';
import { FEATURED_CITIES } from '../utils/hospitalUi';

export default function HospitalSearchBar({
  form,
  onFieldChange,
  onSubmit,
  loading,
  submitLabel = 'Find Hospitals',
  showTreatment = true,
  showBudget = true
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const query = form.city?.trim().toLowerCase() || '';

    if (query.length < 2) {
      return [];
    }

    return FEATURED_CITIES
      .filter((city) => city.name.toLowerCase().startsWith(query))
      .slice(0, 6);
  }, [form.city]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const pickCity = (cityName) => {
    onFieldChange('city', cityName);
    setFocused(false);
  };

  return (
    <form className="search-panel" onSubmit={handleSubmit}>
      <div className="search-fields">
        <div className="search-field search-field-wide">
          <label className="search-label">City / Area</label>
          <div className="search-suggestions">
            <input
              className="search-input"
              type="text"
              value={form.city}
              placeholder="Bangalore, Mumbai, Delhi..."
              onChange={(event) => onFieldChange('city', event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            />

            {focused && suggestions.length > 0 && (
              <div className="suggestions-list">
                {suggestions.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    className="suggestion-item"
                    onMouseDown={() => pickCity(city.name)}
                  >
                    <span>{city.emoji}</span>
                    <span>{city.name}</span>
                    <small>{city.state}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showTreatment && (
          <div className="search-field">
            <label className="search-label">Treatment</label>
            <input
              className="search-input"
              type="text"
              value={form.treatment}
              placeholder="Cardiology, MRI Scan..."
              onChange={(event) => onFieldChange('treatment', event.target.value)}
            />
          </div>
        )}

        {showBudget && (
          <div className="search-field">
            <label className="search-label">Max Budget</label>
            <input
              className="search-input"
              type="number"
              min="0"
              value={form.cost}
              placeholder="50000"
              onChange={(event) => onFieldChange('cost', event.target.value)}
            />
          </div>
        )}

        <div className="search-actions">

          <button className="search-submit" type="submit" disabled={loading}>
            {loading ? 'Searching...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

