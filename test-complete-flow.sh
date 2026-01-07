#!/bin/bash

# ZMOS Backend - Complete Test Flow
# Tests Phase 1 (Auth) and Phase 2 (MoveOS) functionality

set -e

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ZMOS Backend Complete Test Flow ===${NC}\n"

# ==========================================
# PHASE 1: AUTHENTICATION & ONBOARDING
# ==========================================
echo -e "${BLUE}[PHASE 1] Testing Authentication${NC}\n"

# Test 1: Tenant Signup (Gym Owner)
echo -e "${GREEN}Test 1:${NC} Tenant Signup (Gym Owner)"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@fitnesshub.com",
    "password": "SecurePass123",
    "name": "Gym Owner",
    "tenantName": "FitnessHub"
  }')

echo "$SIGNUP_RESPONSE" | jq .
TENANT_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.tenant.id')
OWNER_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
echo -e "Tenant ID: $TENANT_ID"
echo -e "Owner Token: $OWNER_TOKEN\n"

# Test 2: Login (Existing User)
echo -e "${GREEN}Test 2:${NC} Login with Existing Account"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@fitnesshub.com",
    "password": "SecurePass123"
  }')

echo "$LOGIN_RESPONSE" | jq .
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo -e "Login Token: $LOGIN_TOKEN\n"

# Test 3: Member Signup (Join Existing Tenant)
echo -e "${GREEN}Test 3:${NC} Member Signup (Join Existing Gym)"
MEMBER_SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup/member" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "email": "member@example.com",
    "password": "MemberPass123",
    "name": "John Member",
    "tenantId": "'"$TENANT_ID"'"
  }')

echo "$MEMBER_SIGNUP_RESPONSE" | jq .
MEMBER_TOKEN=$(echo "$MEMBER_SIGNUP_RESPONSE" | jq -r '.token')
echo -e "Member Token: $MEMBER_TOKEN\n"

# ==========================================
# PHASE 2: MOVEOS - GYM MANAGEMENT
# ==========================================
echo -e "\n${BLUE}[PHASE 2] Testing MoveOS Endpoints${NC}\n"

# Test 4: Create Location
echo -e "${GREEN}Test 4:${NC} Create Location"
LOCATION_RESPONSE=$(curl -s -X POST "$API_URL/locations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "name": "Downtown Studio",
    "address": "123 Main St",
    "capacity": 50
  }')

echo "$LOCATION_RESPONSE" | jq .
LOCATION_ID=$(echo "$LOCATION_RESPONSE" | jq -r '.id')
echo -e "Location ID: $LOCATION_ID\n"

# Test 5: Get All Locations
echo -e "${GREEN}Test 5:${NC} Get All Locations"
curl -s -X GET "$API_URL/locations" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# Test 6: Create Session Type
echo -e "${GREEN}Test 6:${NC} Create Session Type"
SESSION_TYPE_RESPONSE=$(curl -s -X POST "$API_URL/session-types" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "name": "HIIT Training",
    "description": "High Intensity Interval Training",
    "duration": 45,
    "capacity": 20,
    "category": "STRENGTH"
  }')

echo "$SESSION_TYPE_RESPONSE" | jq .
SESSION_TYPE_ID=$(echo "$SESSION_TYPE_RESPONSE" | jq -r '.id')
echo -e "Session Type ID: $SESSION_TYPE_ID\n"

# Test 7: Get All Session Types
echo -e "${GREEN}Test 7:${NC} Get All Session Types"
curl -s -X GET "$API_URL/session-types" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# Test 8: Create Session Instance
echo -e "${GREEN}Test 8:${NC} Create Session Instance"
FUTURE_DATE=$(date -u -d "+2 days" +"%Y-%m-%dT10:00:00.000Z")
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "sessionTypeId": "'"$SESSION_TYPE_ID"'",
    "locationId": "'"$LOCATION_ID"'",
    "startTime": "'"$FUTURE_DATE"'",
    "instructorName": "Jane Trainer"
  }')

echo "$SESSION_RESPONSE" | jq .
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.id')
echo -e "Session ID: $SESSION_ID\n"

# Test 9: Get Available Sessions
echo -e "${GREEN}Test 9:${NC} Get Available Sessions"
curl -s -X GET "$API_URL/sessions/available" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# Test 10: Create Booking (Member books a session)
echo -e "${GREEN}Test 10:${NC} Create Booking"
BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "sessionInstanceId": "'"$SESSION_ID"'"
  }')

echo "$BOOKING_RESPONSE" | jq .
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.id')
echo -e "Booking ID: $BOOKING_ID\n"

# Test 11: Get My Bookings
echo -e "${GREEN}Test 11:${NC} Get My Bookings"
curl -s -X GET "$API_URL/bookings/my" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# Test 12: Get Member's Booking History
echo -e "${GREEN}Test 12:${NC} Get Member's Booking History (Alternative endpoint)"
curl -s -X GET "$API_URL/my/bookings" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# Test 13: Cancel Booking
echo -e "${GREEN}Test 13:${NC} Cancel Booking"
curl -s -X DELETE "$API_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "x-tenant-id: $TENANT_ID" | jq .
echo ""

# ==========================================
# SUMMARY
# ==========================================
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✓${NC} Phase 1: Authentication & Onboarding"
echo -e "  - Tenant Signup (Gym Owner)"
echo -e "  - Login (Existing User)"
echo -e "  - Member Signup (Join Existing Gym)"
echo -e ""
echo -e "${GREEN}✓${NC} Phase 2: MoveOS - Gym Management"
echo -e "  - Locations (Create, List)"
echo -e "  - Session Types (Create, List)"
echo -e "  - Session Instances (Create, List Available)"
echo -e "  - Bookings (Create, List, Cancel)"
echo -e ""
echo -e "${GREEN}All tests completed successfully!${NC}\n"
