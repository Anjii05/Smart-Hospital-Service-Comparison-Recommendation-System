import React, { useEffect, useState } from "react";
import { getHospitals } from "./services/api";

function App() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    const res = await getHospitals();

    if (res.success) {
      setHospitals(res.data);
    } else {
      alert("Cannot reach backend ❌");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🏥 Hospital Finder</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        hospitals.map((h) => (
          <div
            key={h.id}
            style={{
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{h.name}</h3>
            <p>City: {h.city}</p>
            <p>Rating: ⭐ {h.rating}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;