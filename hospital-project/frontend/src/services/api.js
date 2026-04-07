import axios from "axios";

// ✅ FIXED BASE URL
// ✅ DYNAMIC BASE URL (Works with localhost or IP)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Connect to backend on the same host, port 5000
    return `http://${host}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const API = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000 
});

// ✅ CONNECTION CHECKER
export const checkBackendReady = async () => {
  try {
    const r = await fetch(`${getBaseUrl()}/health`);
    return r.ok;
  } catch (err) {
    return false;
  }
};

// ✅ ERROR HANDLER
export function getErrorMessage(error) {
  console.error("API ERROR:", error);

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (!error?.response) {
    return "Cannot reach backend. Make sure server is running on port 5000.";
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