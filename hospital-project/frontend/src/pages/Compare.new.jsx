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
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow)'
              }}
            >
              <thead>
                <tr style={{ background: 'var(--primary)', color: 'white' }}>
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
                <tr style={{ background: '#f8fbfa' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Rating</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>{hospital.rating}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Estimated package</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>{formatCurrency(hospital.cost)}</td>
                  ))}
                </tr>
                <tr style={{ background: '#f8fbfa' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Treatment fee from</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>{formatCurrency(hospital.min_treatment_cost)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>Doctors</td>
                  {results.map((hospital) => (
                    <td key={hospital.id} style={{ padding: '14px 18px' }}>
                      {hospital.available_doctors}/{hospital.total_doctors} available
                    </td>
                  ))}
                </tr>
                <tr style={{ background: '#f8fbfa' }}>
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
