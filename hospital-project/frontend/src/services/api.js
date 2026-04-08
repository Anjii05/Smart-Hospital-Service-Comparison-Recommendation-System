import axios from "axios";

const API_PORT = 5000;

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

function uniqueUrls(urls) {
  return [...new Set(urls.map(normalizeBaseUrl).filter(Boolean))];
}

const getBaseUrls = () => {
  const urls = [];

  if (process.env.REACT_APP_API_BASE_URL) {
    urls.push(process.env.REACT_APP_API_BASE_URL);
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    urls.push(`http://${window.location.hostname}:${API_PORT}/api`);
  }

  urls.push(`http://localhost:${API_PORT}/api`);
  urls.push(`http://127.0.0.1:${API_PORT}/api`);

  return uniqueUrls(urls);
};

const API_BASE_URLS = getBaseUrls();
const getBaseUrl = () => API_BASE_URLS[0];

const API = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000 
});

// ✅ CONNECTION CHECKER
export const checkBackendReady = async () => {
  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      // Keep trying the fallback URLs.
    }
  }

  return false;
};

// ✅ ERROR HANDLER
export function getErrorMessage(error) {
  console.error("API ERROR:", error);

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (!error?.response) {
    return `Cannot reach backend. Tried ${API_BASE_URLS.join(' or ')}. Make sure the server is running on port 5000.`;
  }

  return error?.message || "Something went wrong.";
}

// ✅ GET ALL HOSPITALS
export const getHospitals = (params = {}) =>
  API.get("/hospitals", { params });

// ✅ SEARCH HOSPITALS
export const searchHospitals = (params = {}) =>
  API.get("/hospitals", { params });

// ✅ SINGLE HOSPITAL
export const getHospitalById = (id) =>
  API.get(`/hospitals/${id}`);

// ✅ COMPARE HOSPITALS
export const compareHospitals = (ids) =>
  API.post("/hospitals/compare", { ids });

// ✅ RECOMMENDATION
export const getRecommendations = (payload) =>
  API.post("/hospitals/recommendations", payload);

// ✅ ADD REVIEW
export const addReview = (id, payload) =>
  API.post(`/hospitals/${id}/reviews`, payload);

// ✅ CHATBOT
export const sendChatMessage = (payload) =>
  API.post(`/chat`, payload);

// ✅ NEAREST HOSPITALS
export const getNearestHospitals = ({ city, lat, lng, radius, emergency }) => {
  const params = { radius };

  if (city) params.city = city;
  if (lat && lng) {
    params.lat = lat;
    params.lng = lng;
  }
  if (emergency !== undefined) {
    params.emergency = emergency;
  }

  return API.get("/hospitals/nearest", { params });
};
