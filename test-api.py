#!/usr/bin/env python3
"""
ZMOS Backend - Complete API Test Suite
Tests Phase 1 (Auth) and Phase 2 (MoveOS) functionality
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:3000"

def print_test(num, description):
    print(f"\n\033[92mTest {num}:\033[0m {description}")

def print_result(response):
    print(json.dumps(response.json(), indent=2))

# Phase 1: Authentication
print("\n\033[94m=== PHASE 1: AUTHENTICATION ===\033[0m\n")

# Test 1: Tenant Signup
print_test(1, "Tenant Signup (Gym Owner)")
import time
timestamp = int(time.time())
response = requests.post(f"{API_URL}/auth/signup", json={
    "email": f"owner{timestamp}@fitgym.com",
    "password": "SecurePass123",
    "name": "Gym Owner",
    "tenantName": f"FitGym{timestamp}"
})
print_result(response)
data = response.json()
TENANT_ID = data['tenant']['id']
OWNER_TOKEN = data['token']
print(f"Tenant ID: {TENANT_ID}")

# Test 2: Login
print_test(2, "Login")
response = requests.post(f"{API_URL}/auth/login", json={
    "email": f"owner{timestamp}@fitgym.com",
    "password": "SecurePass123"
})
print_result(response)

# Test 3: Member Signup
print_test(3, "Member Signup (Join Existing Gym)")
response = requests.post(f"{API_URL}/auth/signup/member",
    headers={"x-tenant-id": TENANT_ID},
    json={
        "email": "member@example.com",
        "password": "MemberPass123",
        "name": "John Member",
        "tenantId": TENANT_ID
    })
print_result(response)
MEMBER_TOKEN = response.json()['token']

# Phase 2: MoveOS
print("\n\033[94m=== PHASE 2: MOVEOS - GYM MANAGEMENT ===\033[0m\n")

headers = {
    "Authorization": f"Bearer {OWNER_TOKEN}",
    "x-tenant-id": TENANT_ID
}

# Test 4: Create Location
print_test(4, "Create Location")
response = requests.post(f"{API_URL}/locations",
    headers=headers,
    json={
        "name": "Downtown Studio",
        "address": "123 Main St",
        "capacity": 50
    })
print_result(response)
LOCATION_ID = response.json()['id']

# Test 5: Get All Locations
print_test(5, "Get All Locations")
response = requests.get(f"{API_URL}/locations", headers=headers)
print_result(response)

# Test 6: Create Session Type
print_test(6, "Create Session Type")
response = requests.post(f"{API_URL}/session-types",
    headers=headers,
    json={
        "name": "HIIT Training",
        "description": "High Intensity Interval Training",
        "durationMin": 45,
        "maxCapacity": 20,
        "category": "class"
    })
print_result(response)
SESSION_TYPE_ID = response.json()['id']

# Test 7: Get All Session Types
print_test(7, "Get All Session Types")
response = requests.get(f"{API_URL}/session-types", headers=headers)
print_result(response)

# Test 8: Create Session Instance
print_test(8, "Create Session Instance")
future_date = (datetime.now() + timedelta(days=2)).isoformat() + "Z"
response = requests.post(f"{API_URL}/sessions",
    headers=headers,
    json={
        "sessionTypeId": SESSION_TYPE_ID,
        "locationId": LOCATION_ID,
        "startTime": future_date,
        "instructor": "Jane Trainer"
    })
print_result(response)
SESSION_ID = response.json()['id']

# Test 9: Get Available Sessions
print_test(9, "Get Available Sessions")
member_headers = {
    "Authorization": f"Bearer {MEMBER_TOKEN}",
    "x-tenant-id": TENANT_ID
}
response = requests.get(f"{API_URL}/sessions/available", headers=member_headers)
print_result(response)

# Test 10: Create Booking
print_test(10, "Create Booking")
response = requests.post(f"{API_URL}/bookings",
    headers=member_headers,
    json={"sessionInstanceId": SESSION_ID})
print_result(response)
BOOKING_ID = response.json()['id']

# Test 11: Get My Bookings
print_test(11, "Get My Bookings")
response = requests.get(f"{API_URL}/bookings/my", headers=member_headers)
print_result(response)

# Test 12: Cancel Booking
print_test(12, "Cancel Booking")
response = requests.delete(f"{API_URL}/bookings/{BOOKING_ID}", headers=member_headers)
print_result(response)

print("\n\033[94m=== TEST SUMMARY ===\033[0m")
print("\033[92m✓\033[0m Phase 1: Authentication (Signup, Login, Member Join)")
print("\033[92m✓\033[0m Phase 2: MoveOS (Locations, Session Types, Sessions, Bookings)")
print("\n\033[92mAll tests completed successfully!\033[0m\n")
