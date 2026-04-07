# Hospital Backend - Complete Setup & Debugging Guide

## ✅ Issues Fixed

### 1. **API Key Mismatch (CRITICAL)**
**Problem**: Database schema had incorrect API keys
- ❌ Old keys: `test-key-123456`, `test-key-789012`, `test-key-dashboard`
- ✅ New keys: `hospital-api-key-prod-2024`, `hospital-api-key-dev-2024`, `hospital-api-key-mobile-2024`

**Impact**: All API requests from frontend were returning 401 Unauthorized

**Fixed**: Updated schema-unified.sql with correct API keys

---

## 🚀 QUICK START - Initialize Backend

### Step 1: Install Dependencies
```bash
cd hospital-project/backend
npm install
```

### Step 2: Verify Environment Variables
Check `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Anjali123
DB_NAME=hospital_db
NODE_ENV=development
```

### Step 3: Initialize Database
```bash
node db-setup.js
```

**Expected Output:**
```
📊 Hospital Database Setup
✅ Connected to MySQL
📝 Running schema setup...
✅ Database created and seeded
✅ Hospitals: 20
✅ Doctors: 40+
✅ Services: 56+
✅ API Keys: 3
```

### Step 4: Start Backend Server
```bash
npm start
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
📊 Database: hospital_db (configured)
🔐 API Key Auth: ENABLED
```

---

## 🧪 Testing the Backend

### Test 1: Health Check (No Auth Required)
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "API is running",
  "database": "connected",
  "timestamp": "2024-03-31T..."
}
```

### Test 2: List All Hospitals (With Auth)
```bash
curl -H "X-API-Key: hospital-api-key-prod-2024" \
  http://localhost:5000/api/hospitals
```

**Expected Response:**
```json
{
  "success": true,
  "count": 20,
  "source": "database",
  "data": [...]
}
```

### Test 3: Search by City
```bash
curl -H "X-API-Key: hospital-api-key-prod-2024" \
  "http://localhost:5000/api/hospitals?city=Bangalore"
```

### Test 4: Get Hospital Details
```bash
curl -H "X-API-Key: hospital-api-key-prod-2024" \
  http://localhost:5000/api/hospitals/1
```

### Test 5: Find Nearest Hospitals
```bash
curl -X POST \
  -H "X-API-Key: hospital-api-key-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 12.9716, "longitude": 77.5946, "radius": 50}' \
  http://localhost:5000/api/nearest
```

### Test 6: Get Recommendations
```bash
curl -X POST \
  -H "X-API-Key: hospital-api-key-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{"city": "Bangalore", "treatment": "Cardiology", "budget": 5000}' \
  http://localhost:5000/api/recommendations
```

### Test 7: Compare Hospitals
```bash
curl -X POST \
  -H "X-API-Key: hospital-api-key-prod-2024" \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}' \
  http://localhost:5000/api/compare
```

---

## 📌 API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/health` | No | Health check (no auth) |
| GET | `/api/hospitals` | Yes | List/filter hospitals |
| GET | `/api/hospitals/:id` | Yes | Get hospital details |
| POST | `/api/compare` | Yes | Compare multiple hospitals |
| POST | `/api/nearest` | Yes | Find nearest hospitals |
| POST | `/api/recommendations` | Yes | Get recommendations |
| POST | `/api/hospitals/:id/reviews` | Yes | Add review |

### Query Parameters for GET `/api/hospitals`
- `city`: Filter by city (case-insensitive)
- `min_rating`: minimum rating (e.g., 4.0)
- `max_cost`: maximum service cost
- `treatment`: Filter by treatment/service
- `emergency`: true/false for emergency availability

---

## 🔍 Troubleshooting

### Issue: "API Key required" (401 Error)

**Solution:**
1. Verify you're sending `X-API-Key` header
2. Check database has API keys:
   ```sql
   SELECT * FROM api_keys;
   ```
3. Use correct key: `hospital-api-key-prod-2024`
4. Reinitialize database if needed:
   ```bash
   node db-setup.js
   ```

### Issue: Database Connection Failed

**Solution:**
1. Verify MySQL is running
2. Check credentials in `.env`:
   ```bash
   mysql -u root -p  # Should connect with password Anjali123
   ```
3. Verify database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```
4. If database doesn't exist, recreate it:
   ```bash
   mysql -u root -p < schema-unified.sql
   ```

### Issue: "Hospital not found" (Empty Results)

**Solution:**
1. Verify database has hospitals seeded:
   ```sql
   SELECT COUNT(*) FROM hospitals;  -- Should return 20
   ```
2. If count is 0, run setup again:
   ```bash
   node db-setup.js
   ```
3. Check city name spelling (search is case-insensitive)

### Issue: CORS Errors on Frontend

**Solution:**
- Backend already has CORS enabled in `server.js`
- Ensure frontend API base URL is correct: `http://localhost:5000/api`
- Check `.env` in frontend for `REACT_APP_API_URL`

### Issue: Port 5000 Already in Use

**Solution:**
1. Change PORT in `.env`:
   ```env
   PORT=5001
   ```
2. Or kill process on port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -i :5000
   kill -9 <PID>
   ```

---

## 🛠️ Database Schema Overview

### Tables Created:
1. **hospitals** - Hospital info, ratings, location
2. **doctors** - Doctor details per hospital
3. **services** - Treatment costs
4. **facilities** - Hospital facilities
5. **reviews** - Patient reviews
6. **api_keys** - API authentication

### Verification Queries:
```sql
-- Check hospital count
SELECT COUNT(*) as total FROM hospitals;

-- Check API keys
SELECT api_key, app_name FROM api_keys WHERE is_active = TRUE;

-- Check sample hospitals by city
SELECT id, name, city, rating FROM hospitals WHERE city = 'Bangalore';

-- Check doctors per hospital
SELECT h.name, COUNT(d.id) as doctor_count 
FROM hospitals h 
LEFT JOIN doctors d ON h.id = d.hospital_id 
GROUP BY h.id;

-- Check services and costs
SELECT h.name, COUNT(s.id) as service_count, MIN(s.cost) as min_cost, MAX(s.cost) as max_cost
FROM hospitals h
LEFT JOIN services s ON h.id = s.hospital_id
GROUP BY h.id;
```

---

## 📋 Development Workflow

### Local Development Setup
```bash
cd hospital-project/backend

# Install dependencies
npm install

# Initialize database (one-time)
node db-setup.js

# Start development server with auto-reload
npm run dev
```

### Testing with PowerShell
Use the provided `api-tests.ps1` script:
```bash
.\\api-tests.ps1
```

### Database Reset (If Needed)
```bash
# Option 1: Using db-setup.js
node db-setup.js

# Option 2: Manual reset
mysql -u root -p <hospital_db < schema-unified.sql
```

---

## ✅ Verification Checklist

- [ ] `.env` file exists with correct credentials
- [ ] MySQL is running locally
- [ ] Database `hospital_db` created and seeded
- [ ] 20 hospitals in database
- [ ] 3 API keys in database (`hospital-api-key-*`)
- [ ] Backend server starts without errors
- [ ] `/api/health` endpoint returns success
- [ ] `/api/hospitals` with auth returns hospital list
- [ ] Frontend can connect to backend

---

## 🔗 Frontend Configuration

Update `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Or use default (auto-configures to current host:5000)

---

## 📞 Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify database connection: `node db-setup.js`
3. Test health endpoint: `curl http://localhost:5000/api/health`
4. Review this guide's Troubleshooting section
5. Check MySQL error logs

---

**Last Updated:** March 31, 2024  
**Backend Status:** ✅ Ready for testing
