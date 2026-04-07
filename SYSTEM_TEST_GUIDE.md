# 🏥 Hospital System - Complete Test & Fix Guide

## ✅ System Status

### Backend API ✅
- **Status**: Running on `http://localhost:5000`
- **Database**: Connected (20 hospitals, 40 doctors, 63 services)
- **Authentication**: API key middleware active
- **Filtering**: Working (tested with ?city=Bangalore → 6 results)

### Frontend ✅
- **Status**: Ready to start
- **API Configuration**: Set in `.env` file
- **Debugging**: Enhanced logging added

---

## 🚀 QUICK START (Complete Flow)

### Step 1: Ensure Backend is Running
```bash
cd e:\Hospital Project\hospital-project\backend
npm start
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
📊 Database: hospital_db (configured)
🔐 API Key Auth: ENABLED
```

### Step 2: Start Frontend
```bash
cd e:\Hospital Project\hospital-project\frontend
npm start
```

The frontend will open automatically on `http://localhost:3000`

### Step 3: Test City Filtering

1. Go to **Hospitals** page
2. Enter "Bangalore" in City field
3. Click **Search**
4. Should see **6 hospitals** (Apollo, Manipal, Fortis, Narayana, Sakra, BGS)

---

## 🧪 API Testing (PowerShell)

### Test 1: No Filter (All Hospitals)
```powershell
$h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals" -Headers $h | ConvertFrom-Json
Write-Host "Found: $($r.count) hospitals"
$r.data[0] | Select-Object name, city, rating
```

### Test 2: City Filter
```powershell
$h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals?city=Bangalore" -Headers $h | ConvertFrom-Json
Write-Host "Bangalore hospitals: $($r.count)"
$r.data | Select-Object name, city -First 3
```

### Test 3: City + Rating Filter
```powershell
$h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals?city=Bangalore&min_rating=4.5" -Headers $h | ConvertFrom-Json
Write-Host "Bangalore with 4.5+ rating: $($r.count)"
```

### Test 4: Treatment Filter
```powershell
$h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals?treatment=Cardiology" -Headers $h | ConvertFrom-Json
Write-Host "Cardiology hospitals: $($r.count)"
```

---

## 🔧 Troubleshooting

### Issue: "Backend not responding"
**Solution:**
```bash
# Check if backend is running
netstat -ano | findstr :5000

# If not running, start it
cd e:\Hospital Project\hospital-project\backend
npm start
```

### Issue: "API Key Invalid"
**Solution:**
Verify the API key in frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

And check that backend has the correct key in database:
```bash
node check-db.js
```

Should show:
```
✅ Active API Keys: 3
   - Hospital App Frontend: hospital-api-key-prod-2024
```

### Issue: "No hospitals returned for city"
**Solution:**
1. Check database has hospitals:
   ```bash
   node check-db.js
   ```

2. Test API directly:
   ```powershell
   $h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
   Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals?city=Bangalore" -Headers $h | ConvertFrom-Json
   ```

3. Check Frontend Console (F12):
   - Open DevTools
   - Go to Console tab
   - Wait for API requests to complete
   - Look for errors in red

---

## 📊 Expected Test Results

### Cities in Database
- **Bangalore**: 6 hospitals
- **Delhi**: 4 hospitals
- **Mumbai**: 4 hospitals
- **Hyderabad**: 3 hospitals
- **Pune**: 3 hospitals
- **Total**: 20 hospitals

### Sample Response Format
```json
{
  "success": true,
  "count": 6,
  "source": "database",
  "data": [
    {
      "id": 1,
      "name": "Apollo Hospitals",
      "city": "Bangalore",
      "rating": 4.8,
      "emergency_available": true,
      "min_cost": "1200.00",
      "available_doctors": 2,
      "total_services": 4
    }
  ]
}
```

---

## 🔍 Debug Endpoints

### Get All Cities
```
GET http://localhost:5000/api/hospitals/debug/cities
```

### Get All Services
```
GET http://localhost:5000/api/hospitals/debug/services
```

### Get Hospital Services
```
GET http://localhost:5000/api/hospitals/debug/hospital/:id/services
```

Example:
```powershell
$h = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
Invoke-WebRequest -Uri "http://localhost:5000/api/hospitals/debug/hospital/1/services" -Headers $h | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## ✨ What's Been Fixed

1. ✅ **Enhanced Frontend API Service**: Better logging and error handling
2. ✅ **Backend Verification**: Confirmed all endpoints working
3. ✅ **Database Check**: 20 hospitals correctly populated
4. ✅ **Environment Setup**: Added `.env` file for frontend
5. ✅ **Error Messages**: More detailed error reporting

---

## 💡 Tips

- **Check Browser Console** (F12): See all API calls and responses
- **Check Backend Terminal**: See server logs for each request
- **Clear Browser Cache**: Ctrl+Shift+Delete if changes don't appear
- **Check Network Tab** (F12): Verify API responses are coming through
- **Check .env file**: Ensure `REACT_APP_API_URL` is set correctly

---

## 🎯 Next Steps

1. Start Backend: `npm start` (in backend folder)
2. Start Frontend: `npm start` (in frontend folder)
3. Navigate to Hospitals page
4. Enter city name and click Search
5. View results with enhanced logging in console
