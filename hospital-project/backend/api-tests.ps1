#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Hospital Hospital Service Comparison & Recommendation System - API Test Suite
.DESCRIPTION
    Complete test suite for all API endpoints with proper API key authentication
.EXAMPLE
    .\api-tests.ps1
    .\api-tests.ps1 -BaseURL "http://localhost:5000"
#>

param(
    [string]$BaseURL = "http://localhost:5000",
    [string]$ApiKey = "test-key-123456"
)

$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $ApiKey
}

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Section { Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow; Write-Host $args -ForegroundColor Yellow; Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow }

Write-Section "🏥 Hospital Service Comparison API - Test Suite"
Write-Info "Base URL: $BaseURL"
Write-Info "API Key: $ApiKey`n"

# Test counter
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body,
        [int]$ExpectedStatus = 200
    )

    Write-Info "Testing: $Name"
    
    try {
        $uri = "$BaseURL$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
            ContentType = "application/json"
        }

        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }

        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json

        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "   ✅ PASS (Status: $statusCode)"
            if ($content.success -eq $true -or $content.status -eq 'API is running') {
                $message = if ($content.message) { $content.message } elseif ($content.status) { $content.status } else { 'Success' }
                Write-Success "   ✅ Response: $message"
            }
            $script:testsPassed++
            return $content
        } else {
            Write-Error-Custom "   ❌ FAIL (Expected: $ExpectedStatus, Got: $statusCode)"
            $script:testsFailed++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Error-Custom "   ❌ FAIL (Status: $statusCode)"
        Write-Error-Custom "   Error: $($_.Exception.Message)"
        $script:testsFailed++
    }
}

# ============================================================
# TEST 1: Health Check
# ============================================================
Write-Section "TEST 1: Health Check (No Auth Required)"
Test-Endpoint -Name "Health Check" -Method "GET" -Endpoint "/api/health" -ExpectedStatus 200

# ============================================================
# TEST 2: Search & Filter Hospitals
# ============================================================
Write-Section "TEST 2: Search & Filter Hospitals"
Test-Endpoint -Name "Get all hospitals" -Method "GET" -Endpoint "/api/hospitals" -ExpectedStatus 200

Test-Endpoint -Name "Filter by city (Bangalore)" -Method "GET" -Endpoint "/api/hospitals?city=Bangalore" -ExpectedStatus 200

Test-Endpoint -Name "Filter by rating (4.5+)" -Method "GET" -Endpoint "/api/hospitals?min_rating=4.5" -ExpectedStatus 200

Test-Endpoint -Name "Filter by max cost" -Method "GET" -Endpoint "/api/hospitals?max_cost=10000" -ExpectedStatus 200

Test-Endpoint -Name "Filter by treatment" -Method "GET" -Endpoint "/api/hospitals?treatment=Cardiology" -ExpectedStatus 200

Test-Endpoint -Name "Combined filters (city + rating)" -Method "GET" -Endpoint "/api/hospitals?city=Delhi&min_rating=4.5" -ExpectedStatus 200

Test-Endpoint -Name "Filter emergency hospitals" -Method "GET" -Endpoint "/api/hospitals?emergency=true" -ExpectedStatus 200

# ============================================================
# TEST 3: Hospital Details
# ============================================================
Write-Section "TEST 3: Hospital Details"
Test-Endpoint -Name "Get hospital #1 details" -Method "GET" -Endpoint "/api/hospitals/1" -ExpectedStatus 200

Test-Endpoint -Name "Get hospital #5 details" -Method "GET" -Endpoint "/api/hospitals/5" -ExpectedStatus 200

Test-Endpoint -Name "Get non-existent hospital" -Method "GET" -Endpoint "/api/hospitals/999" -ExpectedStatus 404

# ============================================================
# TEST 4: Compare Hospitals
# ============================================================
Write-Section "TEST 4: Compare Hospitals"
Test-Endpoint -Name "Compare 2 hospitals" -Method "POST" -Endpoint "/api/compare" `
    -Body @{ids = @(1, 2)} -ExpectedStatus 200

Test-Endpoint -Name "Compare 3 hospitals" -Method "POST" -Endpoint "/api/compare" `
    -Body @{ids = @(1, 2, 3)} -ExpectedStatus 200

Test-Endpoint -Name "Compare with invalid IDs" -Method "POST" -Endpoint "/api/compare" `
    -Body @{ids = @(1)} -ExpectedStatus 400

# ============================================================
# TEST 5: Find Nearest Hospitals
# ============================================================
Write-Section "TEST 5: Find Nearest Hospitals"
Test-Endpoint -Name "Nearest by coordinates (Bangalore)" -Method "POST" -Endpoint "/api/nearest" `
    -Body @{latitude = 12.9716; longitude = 77.5946; radius = 50} -ExpectedStatus 200

Test-Endpoint -Name "Nearest by place name" -Method "POST" -Endpoint "/api/nearest" `
    -Body @{place = "Mumbai"; radius = 60} -ExpectedStatus 200

Test-Endpoint -Name "Nearest with custom radius" -Method "POST" -Endpoint "/api/nearest" `
    -Body @{latitude = 28.5244; longitude = 77.1855; radius = 30} -ExpectedStatus 200

# ============================================================
# TEST 6: Get Recommendations
# ============================================================
Write-Section "TEST 6: Get Personalized Recommendations"
Test-Endpoint -Name "Recommend by treatment" -Method "POST" -Endpoint "/api/recommendations" `
    -Body @{treatment = "Cardiology"; city = "Bangalore"} -ExpectedStatus 200

Test-Endpoint -Name "Recommend by budget" -Method "POST" -Endpoint "/api/recommendations" `
    -Body @{budget = 50000; city = "Delhi"} -ExpectedStatus 200

Test-Endpoint -Name "Recommend by location" -Method "POST" -Endpoint "/api/recommendations" `
    -Body @{latitude = 19.0760; longitude = 72.8777; city = "Mumbai"} -ExpectedStatus 200

Test-Endpoint -Name "Recommend by all criteria" -Method "POST" -Endpoint "/api/recommendations" `
    -Body @{treatment = "Orthopedics"; budget = 200000; latitude = 12.9716; longitude = 77.5946} -ExpectedStatus 200

# ============================================================
# TEST 7: Add Reviews
# ============================================================
Write-Section "TEST 7: Add Hospital Reviews"
Test-Endpoint -Name "Add review to hospital #1" -Method "POST" -Endpoint "/api/hospitals/1/reviews" `
    -Body @{patient_name = "John Doe"; rating = 5; comment = "Excellent care!"} -ExpectedStatus 200

Test-Endpoint -Name "Add another review" -Method "POST" -Endpoint "/api/hospitals/2/reviews" `
    -Body @{patient_name = "Jane Smith"; rating = 4; comment = "Good service"} -ExpectedStatus 200

Test-Endpoint -Name "Review with invalid rating" -Method "POST" -Endpoint "/api/hospitals/1/reviews" `
    -Body @{patient_name = "Bad Test"; rating = 10} -ExpectedStatus 400

Test-Endpoint -Name "Review missing fields" -Method "POST" -Endpoint "/api/hospitals/1/reviews" `
    -Body @{rating = 5} -ExpectedStatus 400

# ============================================================
# TEST 8: Authentication
# ============================================================
Write-Section "TEST 8: API Key Authentication"
Write-Info "Testing: Missing API key"
try {
    $uri = "$BaseURL/api/hospitals"
    $response = Invoke-WebRequest -Uri $uri -Method GET -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Success "   ✅ PASS (Correctly rejected without API key)"
        $script:testsPassed++
    } else {
        Write-Error-Custom "   ❌ FAIL (Unexpected status: $statusCode)"
        $script:testsFailed++
    }
}

Write-Info "Testing: Invalid API key"
try {
    $badHeaders = @{
        "Content-Type" = "application/json"
        "X-API-Key" = "invalid-key-12345"
    }
    $response = Invoke-WebRequest -Uri "$BaseURL/api/hospitals" -Method GET -Headers $badHeaders -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Success "   ✅ PASS (Correctly rejected invalid API key)"
        $script:testsPassed++
    }
}

# ============================================================
# TEST SUMMARY
# ============================================================
Write-Section "📊 TEST SUMMARY"
$totalTests = $testsPassed + $testsFailed
$passPercentage = [math]::Round(($testsPassed / $totalTests) * 100, 1)

Write-Success "Total Tests: $totalTests"
Write-Success "Passed: $testsPassed ✅"
if ($testsFailed -gt 0) {
    Write-Error-Custom "Failed: $testsFailed ❌"
} else {
    Write-Success "Failed: 0 ❌"
}
Write-Success "Pass Rate: $passPercentage%`n"

if ($testsFailed -eq 0) {
    Write-Success "🎉 All tests passed! System is ready for use.`n"
    exit 0
} else {
    Write-Error-Custom "⚠️  Some tests failed. Please review the logs above.`n"
    exit 1
}
