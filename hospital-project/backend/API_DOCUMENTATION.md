# Hospital API Documentation

## Overview
RESTful API for Hospital Search & Recommendations with API Key Authentication

**Base URL:** `http://localhost:5000/api`  
**Authentication:** API Key via `X-API-Key` header  
**Response Format:** JSON

---

## Available API Keys (for Development)

| Key | App Name | Purpose |
|-----|----------|---------|
| `hospital-api-key-prod-2024` | Hospital App Frontend | Production Frontend |
| `hospital-api-key-dev-2024` | Mobile App | Mobile Development |
| `hospital-api-key-mobile-2024` | Admin Dashboard | Admin Panel |

---

## Endpoints

### 1. Get All Hospitals (with Filters)
```
GET /hospitals
```

**Headers:**
```
X-API-Key: hospital-api-key-prod-2024
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `city` | string | Filter by city | `city=Bangalore` |
| `min_rating` | float | Minimum rating (4.0-5.0) | `min_rating=4.5` |
| `max_cost` | number | Maximum service cost | `max_cost=2000` |
| `treatment` | string | Service/treatment name | `treatment=Cardiology` |
| `emergency` | boolean | Emergency available | `emergency=true` |

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/hospitals?city=Bangalore&min_rating=4.5" \
  -H "X-API-Key: hospital-api-key-prod-2024"
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Apollo Hospitals",
      "city": "Bangalore",
      "latitude": "12.93520000",
      "longitude": "77.62450000",
      "rating": "4.8",
      "phone": "+91-80-26304050",
      "min_cost": "1200.00",
      "available_doctors": 2,
      "emergency_available": 1
    }
  ]
}
```

---

### 2. Get Hospital Details
```
GET /hospitals/:id
```

**Headers:**
```
X-API-Key: hospital-api-key-prod-2024
```

**Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Apollo Hospitals",
    "city": "Bangalore",
    "latitude": "12.93520000",
    "longitude": "77.62450000",
    "rating": "4.8",
    "doctors": [
      {
        "id": 1,
        "name": "Dr. Raj Patel",
        "specialization": "Cardiology",
        "available": true
      }
    ],
    "services": [
      {
        "id": 1,
        "service_name": "Cardiac Surgery",
        "category": "Surgery",
        "cost": "2000.00"
      }
    ],
    "facilities": [...],
    "reviews": [...]
  }
}
```

---

### 3. Find Nearest Hospitals (NEW!)
```
POST /hospitals/nearest
```

**Headers:**
```
X-API-Key: hospital-api-key-prod-2024
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius": 10
}
```

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `latitude` | float | User's latitude | Yes |
| `longitude` | float | User's longitude | Yes |
| `radius` | number | Search radius in km | No (default: 50) |

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/hospitals/nearest" \
  -H "X-API-Key: hospital-api-key-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946,
    "radius": 10
  }'
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Found 3 hospitals within 10km",
  "user_location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "filters": {
    "radius_km": 10
  },
  "data": [
    {
      "id": 2,
      "name": "Manipal Hospital",
      "city": "Bangalore",
      "latitude": "13.00110000",
      "longitude": "77.58210000",
      "rating": "4.6",
      "distance_km": 3.549,
      "phone": "+91-80-25024444",
      "min_cost": "1500.00",
      "available_doctors": 2
    },
    {
      "id": 3,
      "name": "Fortis Hospital",
      "city": "Bangalore",
      "latitude": "13.00460000",
      "longitude": "77.59160000",
      "rating": "4.5",
      "distance_km": 3.684,
      "phone": "+91-80-66214444",
      "min_cost": "1000.00",
      "available_doctors": 2
    }
  ]
}
```

**Distance Calculation:**
Uses Haversine formula for accurate geographic distances:
```
distance = 2 * R * asin(sqrt(sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)))
where R = 6371 km (Earth radius)
```

---

### 4. Add Hospital Review
```
POST /hospitals/:id/reviews
```

**Headers:**
```
X-API-Key: hospital-api-key-prod-2024
Content-Type: application/json
```

**Request Body:**
```json
{
  "patient_name": "John Doe",
  "rating": 4.5,
  "comment": "Excellent service and clean facilities"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Review added successfully"
}
```

---

## Error Responses

### Missing API Key (401)
```json
{
  "success": false,
  "message": "API Key required. Please provide X-API-Key header."
}
```

### Invalid API Key (401)
```json
{
  "success": false,
  "message": "Invalid or inactive API key"
}
```

### Missing Required Parameters (400)
```json
{
  "success": false,
  "message": "latitude and longitude are required"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Cities Available

| City | Hospitals | State |
|------|-----------|-------|
| Bangalore | 6 | Karnataka |
| Delhi | 4 | Delhi |
| Mumbai | 4 | Maharashtra |
| Hyderabad | 3 | Telangana |
| Pune | 3 | Maharashtra |

**Total: 20 hospitals across 5 cities**

---

## Frontend Integration Example

### React Service File (`api.js`)
```javascript
import axios from 'axios';

const API_KEY = 'hospital-api-key-prod-2024';
const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

export const hospitalAPI = {
  // Get all hospitals with filters
  getHospitals: (filters = {}) => 
    api.get('/hospitals', { params: filters }),
  
  // Get hospital details
  getHospitalDetails: (id) => 
    api.get(`/hospitals/${id}`),
  
  // Find nearest hospitals by coordinates
  getNearestHospitals: (latitude, longitude, radius = 50) =>
    api.post('/hospitals/nearest', { latitude, longitude, radius }),
  
  // Add a review
  addReview: (hospitalId, reviewData) =>
    api.post(`/hospitals/${hospitalId}/reviews`, reviewData)
};
```

---

## Rate Limits
Currently unlimited for development. Production deployment may include:
- 100 requests/minute per API key
- 10,000 requests/day per API key

---

## Support
For issues or feature requests, contact: backend@hospitalapp.local

