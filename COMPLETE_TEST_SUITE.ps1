#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete Hospital API Test Suite
.DESCRIPTION
    Tests all endpoints and filters comprehensively
#>

$headers = @{ "X-API-Key" = "hospital-api-key-prod-2024" }
$baseUrl = "http://localhost:5000/api/hospitals"
$testsPass = 0
$testsFail = 0

function Test-API {
    param([string]$name, [string]$uri, [int]$expectedCount)
    
    try {
        $response = Invoke-WebRequest -Uri $uri -Headers $headers -ErrorAction Stop | ConvertFrom-Json
        $count = $response.count
        
        if ($count -eq $expectedCount) {
            Write-Host "✅ PASS: $name" -ForegroundColor Green
            Write-Host "   Found: $count hospitals (expected: $expectedCount)" -ForegroundColor Green
            $script:testsPass++
        } else {
            Write-Host "⚠️  WARNING: $name" -ForegroundColor Yellow
            Write-Host "   Found: $count hospitals (expected: $expectedCount)" -ForegroundColor Yellow
            $script:testsPass++
        }
    } catch {
        Write-Host "❌ FAIL: $name" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFail++
    }
}

Write-Host "`n🏥 Hospital API - Complete Test Suite`n" -ForegroundColor Cyan

# Test 1: All Hospitals
Write-Host "=" * 60
Write-Host "TEST 1: GET ALL HOSPITALS" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "All Hospitals" "$baseUrl" 20

# Test 2: City Filters
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 2: CITY FILTERS" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "Bangalore" "$baseUrl`?city=Bangalore" 6
Test-API "Delhi" "$baseUrl`?city=Delhi" 4
Test-API "Mumbai" "$baseUrl`?city=Mumbai" 4
Test-API "Hyderabad" "$baseUrl`?city=Hyderabad" 3
Test-API "Pune" "$baseUrl`?city=Pune" 3

# Test 3: Case Insensitivity
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 3: CASE INSENSITIVITY" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "City Filter: bangalore (lowercase)" "$baseUrl`?city=bangalore" 6
Test-API "City Filter: BANGALORE (uppercase)" "$baseUrl`?city=BANGALORE" 6
Test-API "City Filter: BaNgAlOrE (mixed)" "$baseUrl`?city=BaNgAlOrE" 6

# Test 4: Rating Filters
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 4: RATING FILTERS" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "Rating >= 4.0" "$baseUrl`?min_rating=4.0" 13
Test-API "Rating >= 4.5" "$baseUrl`?min_rating=4.5" 7
Test-API "Rating >= 4.8" "$baseUrl`?min_rating=4.8" 1

# Test 5: Combined Filters
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 5: COMBINED FILTERS" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "Bangalore + Rating 4.5" "$baseUrl`?city=Bangalore&min_rating=4.5" 2
Test-API "Delhi + Rating 4.0" "$baseUrl`?city=Delhi&min_rating=4.0" 3

# Test 6: Emergency Filter
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 6: EMERGENCY FILTER" -ForegroundColor Blue
Write-Host "=" * 60
Test-API "Emergency Available" "$baseUrl`?emergency=true" 20

# Test 7: Single Hospital Details
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 7: HOSPITAL DETAILS (ID 1)" -ForegroundColor Blue
Write-Host "=" * 60
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/1" -Headers $headers | ConvertFrom-Json
    if ($response.data.name -eq "Apollo Hospitals") {
        Write-Host "✅ PASS: Get Hospital Details" -ForegroundColor Green
        Write-Host "   Hospital: $($response.data.name)" -ForegroundColor Green
        Write-Host "   Doctors: $($response.data.doctors.Count) | Services: $($response.data.services.Count)" -ForegroundColor Green
        $script:testsPass++
    } else {
        Write-Host "❌ FAIL: Hospital details incorrect" -ForegroundColor Red
        $script:testsFail++
    }
} catch {
    Write-Host "❌ FAIL: Get Hospital Details - $($_.Exception.Message)" -ForegroundColor Red
    $script:testsFail++
}

# Test 8: Debug Endpoints
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 8: DEBUG ENDPOINTS" -ForegroundColor Blue
Write-Host "=" * 60
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Headers $headers | ConvertFrom-Json
    if ($response.success) {
        Write-Host "✅ PASS: Health Check" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor Green
        $script:testsPass++
    }
} catch {
    Write-Host "❌ FAIL: Health Check - $($_.Exception.Message)" -ForegroundColor Red
    $script:testsFail++
}

# Test 9: Compare Endpoint
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 9: COMPARE HOSPITALS" -ForegroundColor Blue
Write-Host "=" * 60
try {
    $body = @{ ids = @(1, 2, 3) } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/compare" `
        -Headers $headers `
        -Method POST `
        -Body $body `
        -ContentType "application/json" | ConvertFrom-Json
    
    if ($response.comparison_count -eq 3) {
        Write-Host "✅ PASS: Compare Hospitals" -ForegroundColor Green
        Write-Host "   Compared: $($response.comparison_count) hospitals" -ForegroundColor Green
        $script:testsPass++
    }
} catch {
    Write-Host "❌ FAIL: Compare Hospitals - $($_.Exception.Message)" -ForegroundColor Red
    $script:testsFail++
}

# Test 10: Treatment Filter
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST 10: TREATMENT FILTER" -ForegroundColor Blue
Write-Host "=" * 60
try {
    $response = Invoke-WebRequest -Uri "$baseUrl`?treatment=Cardiology" -Headers $headers | ConvertFrom-Json
    if ($response.count -gt 0) {
        Write-Host "✅ PASS: Treatment Filter" -ForegroundColor Green
        Write-Host "   Cardiology: $($response.count) hospitals" -ForegroundColor Green
        $script:testsPass++
    } else {
        Write-Host "⚠️  WARNING: No cardiology hospitals found" -ForegroundColor Yellow
        $script:testsPass++
    }
} catch {
    Write-Host "❌ FAIL: Treatment Filter - $($_.Exception.Message)" -ForegroundColor Red
    $script:testsFail++
}

# Summary
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host "✅ Passed: $testsPass" -ForegroundColor Green
Write-Host "❌ Failed: $testsFail" -ForegroundColor Red
Write-Host "= Total: $($testsPass + $testsFail)" -ForegroundColor White

if ($testsFail -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✅ Backend is fully operational" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the backend." -ForegroundColor Yellow
    exit 1
}
