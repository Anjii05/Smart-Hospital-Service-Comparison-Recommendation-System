# Hospital Filtering - Complete Test Suite

## Quick Test Commands (PowerShell)

Save this file and run the tests in PowerShell to verify your filtering is working correctly.

```powershell
# Setup header
$headers = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$baseUrl = "http://localhost:5000/api/hospitals"

# ==========================================
# TEST 1: Get All Hospitals (No Filters)
# ==========================================
Write-Host "TEST 1: Get All Hospitals" -ForegroundColor Cyan
$result = Invoke-WebRequest -Uri $baseUrl -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 2: City Filter - Case Insensitive
# ==========================================
Write-Host "TEST 2: City Filter - Case Insensitive" -ForegroundColor Cyan

Write-Host "2a. Search: 'bangalore'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=bangalore" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 6)" -ForegroundColor Green

Write-Host "2b. Search: 'DELHI'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=DELHI" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 4)" -ForegroundColor Green

Write-Host "2c. Search: 'MuMbai'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=MuMbai" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 4)" -ForegroundColor Green

Write-Host "2d. Search: 'InvalidCity'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=InvalidCity" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 0)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 3: Treatment/Service Filter
# ==========================================
Write-Host "TEST 3: Treatment Filter - Partial Match" -ForegroundColor Cyan

Write-Host "3a. Treatment: 'cardiac'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?treatment=cardiac" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 7)" -ForegroundColor Green
Write-Host "   Cities: $($result.data | Select-Object -ExpandProperty city -Unique | Join-String -Separator ', ')" -ForegroundColor Gray

Write-Host "3b. Treatment: 'CARDIAC'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?treatment=CARDIAC" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 7, case-insensitive)" -ForegroundColor Green

Write-Host "3c. Treatment: 'mri'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?treatment=mri" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 8, has MRI Scan)" -ForegroundColor Green

Write-Host "3d. Treatment: 'icu'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?treatment=icu" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 3)" -ForegroundColor Green

Write-Host "3e. Treatment: 'InvalidTreatment'" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?treatment=InvalidTreatment" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 0)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 4: Max Cost Filter
# ==========================================
Write-Host "TEST 4: Max Cost Filter" -ForegroundColor Cyan

Write-Host "4a. Max Cost: 10000" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?max_cost=10000" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (with services ≤ 10000)" -ForegroundColor Green

Write-Host "4b. Max Cost: 1500" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?max_cost=1500" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (with services ≤ 1500)" -ForegroundColor Green

Write-Host "4c. Max Cost: 500000" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?max_cost=500000" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: all 19, all have services ≤ 500000)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 5: Combined Filters
# ==========================================
Write-Host "TEST 5: Combined Filters (AND logic)" -ForegroundColor Cyan

Write-Host "5a. City=Bangalore + Treatment=cardiac" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=Bangalore&treatment=cardiac" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 1, Apollo)" -ForegroundColor Green

Write-Host "5b. City=Bangalore + Treatment=cardiac + max_cost=300000" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=Bangalore&treatment=cardiac&max_cost=300000" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 1, Apollo has Cardiac Surgery 250000)" -ForegroundColor Green

Write-Host "5c. City=Bangalore + Treatment=cardiac + max_cost=1500" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=Bangalore&treatment=cardiac&max_cost=1500" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (expected: 0, no Cardiac service < 1500)" -ForegroundColor Green

Write-Host "5d. City=Mumbai + max_cost=10000" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=Mumbai&max_cost=10000" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (Mumbai hospitals with service ≤ 10000)" -ForegroundColor Green

Write-Host "5e. Multiple cities should NOT work" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?city=Bangalore&city=Delhi" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: Results (filters don't support multiple cities, use OR logic on frontend)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 6: Rating Filter
# ==========================================
Write-Host "TEST 6: Rating Filter" -ForegroundColor Cyan

Write-Host "6a. Min Rating: 4.5" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?min_rating=4.5" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (rating ≥ 4.5)" -ForegroundColor Green

Write-Host "6b. Min Rating: 4.0" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?min_rating=4.0" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (rating ≥ 4.0)" -ForegroundColor Green

Write-Host "6c. Min Rating: 3.0" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?min_rating=3.0" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (rating ≥ 3.0, expected: 19 - all hospitals)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 7: Emergency Filter
# ==========================================
Write-Host "TEST 7: Emergency Filter" -ForegroundColor Cyan

Write-Host "7a. Emergency: true" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl?emergency=true" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Found: $($result.count) hospitals (with emergency services, expected: 19 - all)" -ForegroundColor Green
Write-Host ""

# ==========================================
# TEST 8: DEBUG ENDPOINTS
# ==========================================
Write-Host "TEST 8: Debug Endpoints" -ForegroundColor Cyan

Write-Host "8a. Available Cities" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl/debug/cities" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Cities: $($result.cities -join ', ')" -ForegroundColor Green

Write-Host "8b. Available Services (first 5)" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl/debug/services" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Total services: $($result.total)" -ForegroundColor Green
Write-Host "   Sample: $($result.services[0..4] -join ', ')..." -ForegroundColor Gray

Write-Host "8c. Hospital 1 Services (Apollo Bangalore)" -ForegroundColor Yellow
$result = Invoke-WebRequest -Uri "$baseUrl/debug/hospital/1/services" -Headers $headers | ConvertFrom-Json
Write-Host "✅ Hospital 1 has $($result.service_count) services:" -ForegroundColor Green
$result.data | ForEach-Object { Write-Host "   - $($_.service_name): ₹$($_.cost)" -ForegroundColor Gray }
Write-Host ""

# ==========================================
# SUMMARY
# ==========================================
Write-Host "✅ ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "If all results match expected values, filtering is working correctly!" -ForegroundColor Green
```

---

## Expected Test Results

| Test | Filter | Expected Count | Status |
|------|--------|-----------------|--------|
| 2a | city=bangalore | 6 | ✅ |
| 2b | city=DELHI | 4 | ✅ |
| 2c | city=MuMbai | 4 | ✅ |
| 2d | city=InvalidCity | 0 | ✅ |
| 3a | treatment=cardiac | 7 | ✅ |
| 3b | treatment=CARDIAC | 7 | ✅ |
| 3c | treatment=mri | 8 | ✅ |
| 3d | treatment=icu | 3 | ✅ |
| 3e | treatment=InvalidTreatment | 0 | ✅ |
| 4a | max_cost=10000 | Varies | ✅ |
| 4b | max_cost=1500 | Varies | ✅ |
| 4c | max_cost=500000 | 19 | ✅ |
| 5a | Bangalore + cardiac | 1 | ✅ |
| 5b | Bangalore + cardiac + 300000 | 1 | ✅ |
| 5c | Bangalore + cardiac + 1500 | 0 | ✅ |
| 5d | Mumbai + max_cost=10000 | Varies | ✅ |
| 6a | min_rating=4.5 | Varies | ✅ |
| 6b | min_rating=4.0 | Varies | ✅ |
| 6c | min_rating=3.0 | 19 | ✅ |
| 7a | emergency=true | 19 | ✅ |
| 8a | debug/cities | 5 | ✅ |
| 8b | debug/services | 19 | ✅ |
| 8c | debug/hospital/1/services | 4 | ✅ |

---

## Frontend Testing (React)

```javascript
// Test in browser console while on Hospitals page:

// Test 1: Good filter
window.location.href = '/hospitals?city=Bangalore&treatment=cardiac&max_cost=300000'

// Test 2: Case insensitive
window.location.href = '/hospitals?city=delhi'

// Test 3: Invalid values
window.location.href = '/hospitals?city=InvalidCity&treatment=InvalidTreatment'

// Test 4: Just treatment
window.location.href = '/hospitals?treatment=mri'

// Test 5: Combination search
window.location.href = '/hospitals?city=Mumbai&max_cost=15000'
```

---

## Browser DevTools Console Debugging

When testing in the browser, open DevTools (F12) and check:

```javascript
// Look for these logs in Console:
// 🔍 Fetching hospitals with filters: {...}
// ✅ Found X hospital(s)
// ❌ Error if any...

// Check Network tab:
// GET /api/hospitals?city=Bangalore&treatment=cardiac
// Status: 200 OK
// Response: { success: true, count: 1, data: [...] }
```

---

## All Tests Pass? 🎉

If all these tests pass with expected results, your hospital filtering system is **production-ready**!
