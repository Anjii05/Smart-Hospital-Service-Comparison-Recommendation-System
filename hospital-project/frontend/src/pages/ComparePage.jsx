import { useEffect, useMemo, useState } from 'react';
import { compareHospitals, getErrorMessage, getHospitals } from '../services/api';
import { formatCurrency, formatRating } from '../utils/hospitalUi';

function compareKey(list) {
  return list.map((item) => item.id).sort((left, right) => left - right).join(',');
}

export default function ComparePage({
  compareList,
  onCompareToggle,
  onClearCompare,
  onRemoveCompare
}) {
  const [catalog, setCatalog] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');

  const compareIds = useMemo(() => compareList.map((item) => item.id), [compareList]);
  const compareSignature = useMemo(() => compareKey(compareList), [compareList]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);

      try {
        const response = await getHospitals({ sort: 'rating_desc' });
        if (!cancelled) {
          setCatalog(response.data?.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadComparison() {
      if (compareIds.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await compareHospitals(compareIds);
        if (!cancelled) {
          setResults(response.data?.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setResults([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      cancelled = true;
    };
  }, [compareIds, compareSignature]);

  return (
    <div className="page-shell">
      <div className="shell-container">
        <section className="section-shell page-intro">
          <div>
            <span className="section-tag">Compare</span>
            <h1>Side-by-Side Hospital Comparison</h1>
            <p>Pick two or three hospitals, then compare prices, doctors, facilities, reviews, and treatments.</p>
          </div>
        </section>

        <section className="section-shell">
          <div className="selection-panel">
            <div className="section-heading">
              <h2>Select Hospitals to Compare</h2>
              <p>Choose two or three hospitals from the list below. The comparison table will appear automatically.</p>
            </div>

            {catalogLoading ? (
              <div className="loading-panel compact">
                <div className="spinner" />
                <p>Loading hospital list...</p>
              </div>
            ) : (
              <div className="chip-row">
                {catalog.slice(0, 18).map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    className={`filter-chip ${compareIds.includes(hospital.id) ? 'active' : ''}`}
                    onClick={() => onCompareToggle(hospital)}
                  >
                    {hospital.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {compareList.length > 0 && (
            <div className="compare-banner">
              <div>
                <strong>{compareList.length} hospitals selected</strong>
                <p>{compareList.map((item) => item.name).join(' · ')}</p>
              </div>

              <div className="compare-banner-actions">
                {compareList.map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    className="mini-action"
                    onClick={() => onRemoveCompare(hospital)}
                  >
                    Remove {hospital.name}
                  </button>
                ))}

                <button type="button" className="mini-action subtle" onClick={onClearCompare}>
                  Clear All
                </button>
              </div>
            </div>
          )}

          {error && <div className="notice-banner danger">{error}</div>}

          {compareList.length < 2 ? (
            <div className="empty-panel">
              <strong>Select at least two hospitals</strong>
              <p>The comparison table appears after you pick two or three hospitals.</p>
            </div>
          ) : loading ? (
            <div className="loading-panel">
              <div className="spinner" />
              <p>Building comparison table...</p>
            </div>
          ) : (
            <div className="table-shell">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {results.map((hospital) => (
                      <th key={hospital.id}>{hospital.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>City</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{hospital.city}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Rating</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{formatRating(hospital.rating)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Starting Cost</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{formatCurrency(hospital.min_treatment_cost || hospital.cost)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Estimated Package</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{formatCurrency(hospital.cost)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Doctors Available</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{hospital.available_doctors}/{hospital.total_doctors}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Treatments</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>
                        {hospital.treatments?.length
                          ? hospital.treatments.slice(0, 4).map((treatment) => treatment.name).join(', ')
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Facilities</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>
                        {hospital.facilities?.length
                          ? hospital.facilities.slice(0, 5).map((facility) => facility.name).join(', ')
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Review Count</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{hospital.review_summary?.total_reviews ?? hospital.review_count ?? 0}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Summary</td>
                    {results.map((hospital) => (
                      <td key={hospital.id}>{hospital.description || 'No summary available.'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
