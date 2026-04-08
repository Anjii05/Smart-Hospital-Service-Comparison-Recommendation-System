import { useState } from "react";

const TREATMENTS = [
  "Any",
  "General",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Oncology",
  "Pediatrics",
  "Gynecology",
  "Dermatology",
  "ENT",
  "Urology",
  "Gastroenterology",
  "Ophthalmology",
  "Psychiatry",
  "Pulmonology"
];
const RATINGS = ["Any", "3+", "3.5+", "4+", "4.5+"];
const EMERGENCY = ["Any", "Yes", "No"];
const API_BASE_URL = "http://localhost:5000/api";
const API_KEY = "hospital-api-key-prod-2024";

function mapTreatment(treatment) {
  if (treatment === "Any" || treatment === "General") {
    return "";
  }

  return treatment;
}

function mapHospitalFromApi(hospital) {
  return {
    id: hospital.id,
    name: hospital.name,
    address: hospital.address || hospital.city || "Address unavailable",
    phone: hospital.phone || "Phone unavailable",
    rating: Number(hospital.rating || 0),
    budget_per_day: Number(hospital.min_treatment_cost || hospital.cost || 0),
    treatments: Array.isArray(hospital.facility_preview)
      ? hospital.facility_preview.join(", ")
      : "",
    emergency: Boolean(hospital.emergency_available)
  };
}

function StarRow({ rating }) {
  const safeRating = Number.isFinite(rating) ? rating : 0;

  return (
    <span style={{ color: "#f59e0b", fontSize: 13, letterSpacing: 1 }}>
      {"*".repeat(Math.floor(safeRating))}{".".repeat(5 - Math.floor(safeRating))}
      <span style={{ color: "var(--color-text-secondary)", marginLeft: 4, fontSize: 12 }}>
        {safeRating.toFixed(1)}
      </span>
    </span>
  );
}

function Badge({ children, color = "teal" }) {
  const colors = {
    teal: { bg: "#E1F5EE", text: "#0F6E56" },
    amber: { bg: "#FAEEDA", text: "#854F0B" },
    red: { bg: "#FCEBEB", text: "#A32D2D" },
    blue: { bg: "#E6F1FB", text: "#185FA5" },
    purple: { bg: "#EEEDFE", text: "#534AB7" },
    gray: { bg: "#F1EFE8", text: "#5F5E5A" }
  };
  const c = colors[color] || colors.gray;

  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 99,
        display: "inline-block"
      }}
    >
      {children}
    </span>
  );
}

function HospitalCard({ h, index }) {
  const [open, setOpen] = useState(false);
  const treatments = (h.treatments || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        marginBottom: 12,
        animation: "fadeUp 0.3s ease both",
        animationDelay: `${index * 60}ms`
      }}
    >
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: 500,
              fontSize: 15,
              color: "var(--color-text-primary)"
            }}
          >
            {h.name}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-secondary)" }}>
            {h.address}
          </p>
          <StarRow rating={h.rating} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: 500,
              fontSize: 15,
              color: "var(--color-text-primary)"
            }}
          >
            Rs {h.budget_per_day?.toLocaleString("en-IN") || "N/A"}
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                fontWeight: 400
              }}
            >
              /min treatment
            </span>
          </p>
          <Badge color={h.emergency ? "red" : "gray"}>
            {h.emergency ? "Emergency" : "No Emergency"}
          </Badge>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {treatments.slice(0, open ? treatments.length : 5).map((item) => (
          <Badge key={item} color="blue">
            {item}
          </Badge>
        ))}
        {treatments.length > 5 && (
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              color: "var(--color-text-secondary)",
              padding: "2px 4px"
            }}
          >
            {open ? "less" : `+${treatments.length - 5} more`}
          </button>
        )}
      </div>

      {h.phone && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
          Phone: {h.phone}
        </p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ marginBottom: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: 12,
            height: 110,
            animation: "pulse 1.4s ease infinite",
            animationDelay: `${i * 150}ms`
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

export default function HospitalFinder() {
  const [city, setCity] = useState("");
  const [treatment, setTreatment] = useState("Any");
  const [rating, setRating] = useState("Any");
  const [budget, setBudget] = useState("");
  const [emergency, setEmergency] = useState("Any");

  const [hospitals, setHospitals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState("");

  async function search() {
    const normalizedCity = city.trim();

    if (!normalizedCity) {
      setError("Please enter a city name.");
      return;
    }

    setError("");
    setLoading(true);
    setHospitals(null);
    setSearched(normalizedCity);

    try {
      const params = new URLSearchParams({
        city: normalizedCity,
        sort: "rating_desc"
      });

      const treatmentQuery = mapTreatment(treatment);
      const minRating = rating === "Any" ? "" : rating.replace("+", "");
      const maxBudget = budget.trim();

      if (treatmentQuery) {
        params.set("treatment", treatmentQuery);
      }

      if (minRating) {
        params.set("min_rating", minRating);
      }

      if (maxBudget) {
        params.set("cost", maxBudget);
      }

      if (emergency === "Yes") {
        params.set("emergency", "true");
      }

      const res = await fetch(`${API_BASE_URL}/hospitals?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY
        }
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to load hospitals from the server.");
      }

      const parsed = Array.isArray(data.data) ? data.data.map(mapHospitalFromApi) : [];
      setHospitals(parsed);

      if (data.exact_match === false) {
        setError(data.message || `No hospitals found for ${normalizedCity}.`);
      }
    } catch (e) {
      setError(`Failed to fetch hospitals. ${e.message}`);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 12px",
    fontSize: 14,
    borderRadius: 8,
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)"
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.05em",
    color: "var(--color-text-secondary)",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block"
  };

  return (
    <div style={{ padding: "1rem 0", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--color-text-primary)"
          }}
        >
          Hospital Finder
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          Search hospitals from your backend database by city
        </p>
      </div>

      <div
        style={{
          background: "var(--color-background-secondary)",
          borderRadius: 12,
          padding: "1rem",
          marginBottom: 16
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 12
          }}
        >
          <div>
            <label style={labelStyle}>City *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Belagavi"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div>
            <label style={labelStyle}>Treatment</label>
            <select style={inputStyle} value={treatment} onChange={(e) => setTreatment(e.target.value)}>
              {TREATMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Min Rating</label>
            <select style={inputStyle} value={rating} onChange={(e) => setRating(e.target.value)}>
              {RATINGS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Max Budget (Rs)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="e.g. 5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Emergency</label>
            <select style={inputStyle} value={emergency} onChange={(e) => setEmergency(e.target.value)}>
              {EMERGENCY.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--color-text-danger)" }}>
            {error}
          </p>
        )}

        <button
          onClick={search}
          disabled={loading}
          style={{
            background: loading ? "var(--color-background-secondary)" : "#0F6E56",
            color: loading ? "var(--color-text-secondary)" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%"
          }}
        >
          {loading ? "Finding hospitals..." : "Search Hospitals"}
        </button>
      </div>

      {loading && <Skeleton />}

      {hospitals && !loading && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
              {hospitals.length} hospitals found in {" "}
              <strong style={{ color: "var(--color-text-primary)" }}>{searched}</strong>
            </p>
            <Badge color="teal">Backend data</Badge>
          </div>
          {hospitals.map((hospital, index) => (
            <HospitalCard key={hospital.id || index} h={hospital} index={index} />
          ))}
        </>
      )}

      {hospitals && hospitals.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
          No hospitals found for this city and filter combination.
        </p>
      )}
    </div>
  );
}
