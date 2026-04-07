import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { compareHospitals, getErrorMessage, getHospitals } from '../services/api';

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `₹${amount.toLocaleString()}`;
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const [allHospitals, setAllHospitals] = useState([]);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minCost = results.length > 0 ? Math.min(...results.map(r => r.cost || Infinity)) : Infinity;
  const maxRating = results.length > 0 ? Math.max(...results.map(r => r.rating || 0)) : 0;
  const minTreatmentCost = results.length > 0 ? Math.min(...results.map(r => r.min_treatment_cost || Infinity)) : Infinity;
  const maxDocRatio = results.length > 0 ? Math.max(...results.map(r => ((r.available_doctors || 0) / (r.total_doctors || 1)))) : 0;

  useEffect(() => {
    let isMounted = true;

    async function loadHospitals() {
      try {
        const response = await getHospitals({ sort: 'rating_desc' });
        if (isMounted) {
          setAllHospitals(response.data?.data || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      }
    }

    const ids = searchParams.get('ids');
    if (ids) {
      setSelected(
        ids
          .split(',')
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value))
      );
    }

    loadHospitals();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (selected.length >= 2) {
      handleCompare();
    }
  }, [selected]);

  const handleCompare = async () => {
    if (selected.length < 2) {
      setError('Select at least two hospitals to compare.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await compareHospitals(selected);
      setResults(response.data?.data || []);
    } catch (requestError) {
      setResults([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (hospitalId) => {
    setSelected((current) => {
      if (current.includes(hospitalId)) {
        return current.filter((value) => value !== hospitalId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, hospitalId];
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Compare Hospitals</h1>
        <p>Select two or three hospitals and compare treatment costs, doctors, and facilities.</p>
      </div>

      <div className="container section">
        <h2 className="section-title">Choose Hospitals</h2>

        {error && <div className="error-msg" style={{ marginBottom: 18 }}>{error}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {allHospitals.map((hospital) => (
            <button
              key={hospital.id}
              type="button"
              className={`btn ${selected.includes(hospital.id) ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggleSelection(hospital.id)}
            >
              {selected.includes(hospital.id) ? 'Selected: ' : ''}
              {hospital.name}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-accent" onClick={handleCompare} disabled={selected.length < 2 || loading}>
          {loading ? 'Comparing...' : `Compare ${selected.length || 0} Hospitals`}
        </button>

        {results.length > 0 && (
          <div style={{ marginTop: 32, overflowX: 'auto' }}>
            <table
              className="glass-panel"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--text)' }}>
                  <th style={{ padding: '16px 18px', textAlign: 'left' }}>Metric</th>
                  {results.map((hospital) => (
                    <th key={hospital.id} style={{ padding: '16px 18px', textAlign: 'left', minWidth: 220 }}>
                      {hospital.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>City</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>{hospital.city}</td>
                  ))}
                </tr>
                <tr style={{ background: 'rgba(255, 255, 255, 0.4)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Rating</td>
                  {results.map((hospital) => {
                    const isBest = hospital.rating === maxRating && maxRating > 0;
                    return (
                      <td key={hospital.id} style={{ padding: '14px 18px', background: isBest ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isBest ? 'var(--text)' : 'inherit', fontWeight: isBest ? 700 : 400 }}>
                        {hospital.rating} {isBest && '⭐'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Estimated package</td>
                  {results.map((hospital) => {
                    const isBest = hospital.cost === minCost && minCost < Infinity;
                    return (
                      <td key={hospital.id} style={{ padding: '14px 18px', background: isBest ? '#eefdf4' : 'transparent', color: isBest ? 'var(--accent)' : 'inherit', fontWeight: isBest ? 700 : 400 }}>
                        {formatCurrency(hospital.cost)}
                      </td>
                    );
                  })}
                </tr>
                <tr style={{ background: 'rgba(255, 255, 255, 0.4)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Treatment fee from</td>
                  {results.map((hospital) => {
                    const isBest = hospital.min_treatment_cost === minTreatmentCost && minTreatmentCost < Infinity;
                    return (
                      <td key={hospital.id} style={{ padding: '14px 18px', background: isBest ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: isBest ? 'currentColor' : 'inherit', fontWeight: isBest ? 700 : 400 }}>
                        {formatCurrency(hospital.min_treatment_cost)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Doctors</td>
                  {results.map((hospital) => {
                    const ratio = (hospital.available_doctors || 0) / (hospital.total_doctors || 1);
                    const isBest = ratio === maxDocRatio && maxDocRatio > 0;
                    return (
                      <td key={hospital.id} style={{ padding: '14px 18px', background: isBest ? '#eefdf4' : 'transparent', color: isBest ? 'var(--accent)' : 'inherit', fontWeight: isBest ? 700 : 400 }}>
                        {hospital.available_doctors}/{hospital.total_doctors} available
                      </td>
                    );
                  })}
                </tr>
                <tr style={{ background: 'rgba(255, 255, 255, 0.4)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Treatments</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>
                      {hospital.treatments.map((treatment) => `${treatment.name} (${formatCurrency(treatment.cost)})`).join(', ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Facilities</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>
                      {hospital.facilities.map((facility) => facility.name).join(', ')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
