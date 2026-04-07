// ============================================================
//  hospitalService.js — API Service Layer
//  Handles all communication between React and the backend.
//  No filtering happens here — trust the API's results.
// ============================================================

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── Treatment Normalizer (mirrors backend) ───────────────────
const TREATMENT_ALIASES = {
  ct: "CT Scan",
  "ct scan": "CT Scan",
  mri: "MRI Scan",
  "mri scan": "MRI Scan",
  xray: "X-Ray",
  "x ray": "X-Ray",
  ecg: "ECG",
  echo: "Echocardiogram",
  ultrasound: "Ultrasound",
  dialysis: "Dialysis",
  icu: "ICU",
  bypass: "Bypass Surgery",
  angioplasty: "Angioplasty",
};

export function normalizeTreatmentInput(input) {
  if (!input) return "";
  const lower = input.trim().toLowerCase();
  return TREATMENT_ALIASES[lower] || input.trim();
}

// ─── Fetch Hospitals ──────────────────────────────────────────
/**
 * Fetches hospitals based on optional filter params.
 * The API handles all filtering — this function just passes them.
 *
 * @param {object} params
 * @param {string} [params.city]
 * @param {string} [params.treatment]
 * @param {number|string} [params.maxCost]
 * @param {string} [params.sortBy] - "rating_desc" | "cost_asc" | "name_asc"
 * @returns {Promise<{ data: Hospital[], fallback: boolean, message: string }>}
 */
export async function fetchHospitals({ city, treatment, maxCost, sortBy } = {}) {
  const params = new URLSearchParams();

  if (city && city.trim()) params.append("city", city.trim());
  if (treatment && treatment.trim()) {
    params.append("treatment", normalizeTreatmentInput(treatment));
  }
  if (maxCost && !isNaN(Number(maxCost))) params.append("maxCost", maxCost);
  if (sortBy) params.append("sortBy", sortBy);

  const url = `${BASE_URL}/hospitals?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const json = await response.json();

    // Normalize field names defensively
    const normalized = (json.data || []).map((h) => ({
      id: h.id,
      name: h.name || "Unknown Hospital",
      city: h.city || "Unknown City",
      address: h.address || "",
      phone: h.phone || "",
      rating: parseFloat(h.rating) || 0,
      imageUrl: h.image_url || h.imageUrl || null,
      treatment: h.treatment || h.treatment_name || "General",
      cost: parseFloat(h.cost) || 0,
    }));

    return {
      data: normalized,
      fallback: json.fallback || false,
      message: json.message || "",
    };
  } catch (err) {
    console.error("❌ fetchHospitals error:", err.message);
    throw err;
  }
}

// ─── Fetch All Cities ─────────────────────────────────────────
export async function fetchCities() {
  try {
    const res = await fetch(`${BASE_URL}/cities`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("❌ fetchCities error:", err.message);
    return [];
  }
}

// ─── Fetch All Treatments ─────────────────────────────────────
export async function fetchTreatments() {
  try {
    const res = await fetch(`${BASE_URL}/treatments`);
    const json = await res.json();
    return (json.data || []).map((t) => t.treatment_name || t);
  } catch (err) {
    console.error("❌ fetchTreatments error:", err.message);
    return [];
  }
}