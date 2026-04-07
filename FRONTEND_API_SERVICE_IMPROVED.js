/**
 * HOSPITAL FILTERING - IMPROVED FRONTEND API SERVICE
 * File: frontend/src/services/api.js
 * 
 * ✅ Improvements:
 * - Proper parameter trimming
 * - Case handling
 * - Error handling
 * - Logging for debugging
 */

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'X-API-Key': 'hospital-api-key-prod-2024',
    'Content-Type': 'application/json'
  }
});

/**
 * Get hospitals with optional filters
 * @param {Object} params - Filter parameters
 * @param {string} params.city - City name (case-insensitive, partial match)
 * @param {string} params.min_rating - Minimum rating (3, 3.5, 4, 4.5)
 * @param {string} params.max_cost - Maximum service cost
 * @param {string} params.treatment - Treatment/service name (case-insensitive, partial match)
 * @param {string} params.emergency - "true" to filter for emergency availability
 * @returns {Promise} Hospital list
 */
export const getHospitals = (params) => {
  // Clean parameters: trim whitespace and remove empty values
  const cleanParams = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = typeof value === 'string' ? value.trim() : value;
    }
  });

  console.log('🔍 Fetching hospitals with filters:', cleanParams);

  return API.get('/hospitals', { params: cleanParams })
    .then(response => {
      console.log(`✅ Found ${response.data.count} hospital(s)`, response.data.debug);
      return response;
    })
    .catch(error => {
      console.error('❌ Error fetching hospitals:', error.response?.data || error.message);
      throw error;
    });
};

/**
 * Get single hospital details
 * @param {number} id - Hospital ID
 * @returns {Promise} Hospital data with services, doctors, facilities
 */
export const getHospitalById = (id) => {
  return API.get(`/hospitals/${id}`);
};

/**
 * Compare multiple hospitals
 * @param {array} ids - Array of hospital IDs (minimum 2)
 * @returns {Promise} Comparison data
 */
export const compareHospitals = (ids) => {
  return API.post('/hospitals/compare', { ids });
};

export const getRecommendations = (data) => {
  return API.post('/recommendations', data);
};

export const addReview = (id, review) => {
  return API.post(`/hospitals/${id}/reviews`, review);
};

/**
 * Find nearest hospitals by coordinates
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in km (default: 300)
 * @returns {Promise} List of hospitals sorted by distance
 */
export const getNearestHospitals = (latitude, longitude, radius = 300) => {
  return API.post('/hospitals/nearest', { latitude, longitude, radius });
};

// ==========================================
// DEBUG ENDPOINTS
// ==========================================

/**
 * Get all available cities for filtering
 * @returns {Promise} List of cities in database
 */
export const getAvailableCities = () => {
  return API.get('/hospitals/debug/cities')
    .then(response => {
      console.log('📍 Available cities:', response.data.cities);
      return response.data.cities;
    });
};

/**
 * Get all available services/treatments
 * @returns {Promise} List of services with price ranges
 */
export const getAvailableServices = () => {
  return API.get('/hospitals/debug/services')
    .then(response => {
      console.log('🏥 Available services:', response.data.services);
      return response.data;
    });
};

/**
 * Get specific hospital's services
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} Hospital's services with costs
 */
export const getHospitalServices = (hospitalId) => {
  return API.get(`/hospitals/debug/hospital/${hospitalId}/services`)
    .then(response => {
      console.log(`Services for Hospital ${hospitalId}:`, response.data.data);
      return response.data.data;
    });
};
