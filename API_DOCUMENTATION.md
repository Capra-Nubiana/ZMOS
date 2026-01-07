# ZMOS Backend API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3000`
**Last Updated**: December 25, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Location Endpoints](#location-endpoints)
   - [Session Type Endpoints](#session-type-endpoints)
   - [Session Instance Endpoints](#session-instance-endpoints)
   - [Booking Endpoints](#booking-endpoints)
   - [Member Endpoints](#member-endpoints)
4. [Error Handling](#error-handling)
5. [Testing](#testing)

---

## Overview

ZMOS Backend is a multi-tenant gym management API. Each tenant (gym) has isolated data managed through tenant IDs.

### Key Features
- Multi-tenant architecture
- JWT-based authentication
- Location and session management
- Booking system
- Member management

### Request Headers

Most endpoints require these headers:

```
Authorization: Bearer <jwt-token>
x-tenant-id: <tenant-id>
Content-Type: application/json
```

**Exceptions** (no auth required):
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/signup/member` (requires only `x-tenant-id`)

---

## Authentication

### How Authentication Works

1. **Signup/Login** → Receive JWT token
2. **Store token** → Use in `Authorization` header for subsequent requests
3. **Token expires** in 24 hours → Login again

### Token Structure

```json
{
  "sub": "member-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "iat": 1703001234,
  "exp": 1703087634
}
```

---

## API Endpoints

## Auth Endpoints

### 1. Gym Owner Signup

Create a new gym (tenant) and owner account.

**Endpoint**: `POST /auth/signup`
**Auth Required**: No
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "owner@fitgym.com",
  "password": "SecurePass123",
  "name": "Gym Owner",
  "tenantName": "FitGym"
}
```

**Success Response** (201):
```json
{
  "member": {
    "id": "cmjl...",
    "email": "owner@fitgym.com",
    "name": "Gym Owner",
    "tenantId": "cmjl..."
  },
  "tenant": {
    "id": "cmjl...",
    "name": "FitGym"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `409 Conflict`: Email already exists for this tenant

---

### 2. Login

Authenticate existing user.

**Endpoint**: `POST /auth/login`
**Auth Required**: No
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "owner@fitgym.com",
  "password": "SecurePass123"
}
```

**Success Response** (200):
```json
{
  "member": {
    "id": "cmjl...",
    "email": "owner@fitgym.com",
    "name": "Gym Owner",
    "tenantId": "cmjl..."
  },
  "tenant": {
    "id": "cmjl...",
    "name": "FitGym"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials

---

### 3. Member Signup (Join Existing Gym)

Allow new member to join an existing gym.

**Endpoint**: `POST /auth/signup/member`
**Auth Required**: No
**Headers**: `x-tenant-id: <tenant-id>`, `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "member@example.com",
  "password": "MemberPass123",
  "name": "John Member",
  "tenantId": "cmjl..."
}
```

**Success Response** (201):
```json
{
  "member": {
    "id": "cmjl...",
    "email": "member@example.com",
    "name": "John Member",
    "tenantId": "cmjl..."
  },
  "tenant": {
    "id": "cmjl...",
    "name": "FitGym"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `404 Not Found`: Tenant not found
- `409 Conflict`: Email already exists for this tenant

---

### 4. Google OAuth Login

Authenticate with Google account.

**Endpoint**: `POST /auth/google`
**Auth Required**: No
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "idToken": "google-id-token",
  "tenantId": "cmjl..." // Optional, for existing members
}
```

**Success Response** (200):
```json
{
  "member": { ... },
  "tenant": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Implementation details may vary based on Google OAuth setup.

---

## Location Endpoints

### 5. Create Location

Create a new gym location.

**Endpoint**: `POST /locations`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "Downtown Studio",
  "address": "123 Main St, City, State 12345",
  "capacity": 50
}
```

**Success Response** (201):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "name": "Downtown Studio",
  "address": "123 Main St, City, State 12345",
  "capacity": 50,
  "timezone": "UTC",
  "isActive": true,
  "createdAt": "2025-12-25T11:39:39.659Z",
  "updatedAt": "2025-12-25T11:39:39.659Z"
}
```

**Validation Rules**:
- `name`: Required, max 100 characters
- `address`: Required, max 500 characters
- `capacity`: Required, integer, min 1

---

### 6. Get All Locations

Retrieve all locations for the tenant.

**Endpoint**: `GET /locations`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "tenantId": "cmjl...",
    "name": "Downtown Studio",
    "address": "123 Main St",
    "capacity": 50,
    "timezone": "UTC",
    "isActive": true,
    "createdAt": "2025-12-25T11:39:39.659Z",
    "updatedAt": "2025-12-25T11:39:39.659Z"
  }
]
```

---

### 7. Get Active Locations

Retrieve only active locations.

**Endpoint**: `GET /locations/active`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "name": "Downtown Studio",
    "address": "123 Main St",
    "capacity": 50,
    "timezone": "UTC",
    "isActive": true,
    "createdAt": "2025-12-25T11:39:39.659Z",
    "updatedAt": "2025-12-25T11:39:39.659Z"
  }
]
```

---

### 8. Get Location by ID

Retrieve specific location.

**Endpoint**: `GET /locations/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "name": "Downtown Studio",
  "address": "123 Main St",
  "capacity": 50,
  "timezone": "UTC",
  "isActive": true,
  "createdAt": "2025-12-25T11:39:39.659Z",
  "updatedAt": "2025-12-25T11:39:39.659Z"
}
```

**Error Responses**:
- `404 Not Found`: Location not found

---

### 9. Update Location

Update location details.

**Endpoint**: `PATCH /locations/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body** (all fields optional):
```json
{
  "name": "Downtown Studio - Updated",
  "address": "123 Main St, Suite 200",
  "capacity": 60,
  "timezone": "America/New_York",
  "isActive": false
}
```

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "name": "Downtown Studio - Updated",
  "address": "123 Main St, Suite 200",
  "capacity": 60,
  "timezone": "America/New_York",
  "isActive": false,
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

### 10. Delete Location

Soft delete location (sets `isActive: false`).

**Endpoint**: `DELETE /locations/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "isActive": false,
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

## Session Type Endpoints

### 11. Create Session Type

Create a type of session/class.

**Endpoint**: `POST /session-types`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "HIIT Training",
  "description": "High Intensity Interval Training",
  "durationMin": 45,
  "maxCapacity": 20,
  "category": "class",
  "difficulty": "intermediate"
}
```

**Field Descriptions**:
- `name`: Required, max 100 characters
- `description`: Optional, max 1000 characters
- `durationMin`: Required, integer, min 1
- `maxCapacity`: Required, integer, min 1
- `category`: Required, one of: "class", "personal", "open-gym"
- `difficulty`: Optional, default "intermediate", one of: "beginner", "intermediate", "advanced"

**Success Response** (201):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "name": "HIIT Training",
  "description": "High Intensity Interval Training",
  "durationMin": 45,
  "category": "class",
  "maxCapacity": 20,
  "difficulty": "intermediate",
  "isActive": true,
  "createdAt": "2025-12-25T11:39:39.683Z",
  "updatedAt": "2025-12-25T11:39:39.683Z"
}
```

---

### 12. Get All Session Types

Retrieve all session types.

**Endpoint**: `GET /session-types`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Query Parameters** (optional):
- `category`: Filter by category ("class", "personal", "open-gym")
- `active`: Filter by active status (true/false)

**Example**: `GET /session-types?category=class&active=true`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "name": "HIIT Training",
    "description": "High Intensity Interval Training",
    "durationMin": 45,
    "category": "class",
    "maxCapacity": 20,
    "difficulty": "intermediate",
    "isActive": true,
    "createdAt": "2025-12-25T11:39:39.683Z",
    "updatedAt": "2025-12-25T11:39:39.683Z"
  }
]
```

---

### 13. Get Active Session Types

Retrieve only active session types.

**Endpoint**: `GET /session-types/active`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "name": "HIIT Training",
    "description": "High Intensity Interval Training",
    "durationMin": 45,
    "category": "class",
    "maxCapacity": 20,
    "difficulty": "intermediate",
    "isActive": true,
    "createdAt": "2025-12-25T11:39:39.683Z",
    "updatedAt": "2025-12-25T11:39:39.683Z"
  }
]
```

---

### 14. Get Session Types by Category

Retrieve session types filtered by category.

**Endpoint**: `GET /session-types/category/:category`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**URL Parameters**:
- `:category`: "class", "personal", or "open-gym"

**Example**: `GET /session-types/category/class`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "name": "HIIT Training",
    "category": "class",
    "durationMin": 45,
    "maxCapacity": 20,
    ...
  }
]
```

---

### 15. Get Session Type by ID

Retrieve specific session type.

**Endpoint**: `GET /session-types/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "name": "HIIT Training",
  "description": "High Intensity Interval Training",
  "durationMin": 45,
  "category": "class",
  "maxCapacity": 20,
  "difficulty": "intermediate",
  "isActive": true,
  "createdAt": "2025-12-25T11:39:39.683Z",
  "updatedAt": "2025-12-25T11:39:39.683Z"
}
```

**Error Responses**:
- `404 Not Found`: Session type not found

---

### 16. Update Session Type

Update session type details.

**Endpoint**: `PATCH /session-types/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body** (all fields optional):
```json
{
  "name": "HIIT Training - Advanced",
  "description": "Advanced High Intensity Interval Training",
  "durationMin": 60,
  "maxCapacity": 15,
  "difficulty": "advanced",
  "isActive": true
}
```

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "name": "HIIT Training - Advanced",
  "description": "Advanced High Intensity Interval Training",
  "durationMin": 60,
  "maxCapacity": 15,
  "difficulty": "advanced",
  "isActive": true,
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

### 17. Delete Session Type

Soft delete session type (sets `isActive: false`).

**Endpoint**: `DELETE /session-types/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "isActive": false,
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

## Session Instance Endpoints

### 18. Create Session Instance

Schedule a specific session at a location.

**Endpoint**: `POST /sessions`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body**:
```json
{
  "sessionTypeId": "cmjl...",
  "locationId": "cmjl...",
  "startTime": "2025-12-27T14:00:00.000Z",
  "instructor": "Jane Trainer",
  "notes": "Bring your own mat"
}
```

**Optional Fields**:
- `endTime`: Calculated automatically from `startTime + sessionType.durationMin` if not provided
- `capacity`: Defaults to `sessionType.maxCapacity` if not provided
- `instructor`: Instructor name
- `notes`: Additional notes

**Success Response** (201):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "sessionTypeId": "cmjl...",
  "locationId": "cmjl...",
  "startTime": "2025-12-27T14:00:00.000Z",
  "endTime": "2025-12-27T14:45:00.000Z",
  "capacity": 20,
  "status": "scheduled",
  "instructor": "Jane Trainer",
  "notes": "Bring your own mat",
  "createdAt": "2025-12-25T11:39:39.714Z",
  "updatedAt": "2025-12-25T11:39:39.714Z",
  "sessionType": {
    "id": "cmjl...",
    "name": "HIIT Training",
    "durationMin": 45,
    ...
  },
  "location": {
    "id": "cmjl...",
    "name": "Downtown Studio",
    ...
  },
  "bookings": []
}
```

**Business Rules**:
- Prevents scheduling conflicts at the same location
- Automatically calculates `endTime` if not provided
- Uses session type's `maxCapacity` if `capacity` not specified

**Error Responses**:
- `404 Not Found`: Session type or location not found
- `409 Conflict`: Location already booked during this time slot

---

### 19. Get All Sessions

Retrieve sessions with filtering and pagination.

**Endpoint**: `GET /sessions`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Query Parameters** (all optional):
- `date`: Filter by date (YYYY-MM-DD format)
- `category`: Filter by session type category ("class", "personal", "open-gym")
- `status`: Filter by status ("scheduled", "cancelled", "completed") - default: "scheduled"
- `locationId`: Filter by location ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example**: `GET /sessions?date=2025-12-27&category=class&page=1&limit=10`

**Success Response** (200):
```json
{
  "data": [
    {
      "id": "cmjl...",
      "sessionTypeId": "cmjl...",
      "locationId": "cmjl...",
      "startTime": "2025-12-27T14:00:00.000Z",
      "endTime": "2025-12-27T14:45:00.000Z",
      "capacity": 20,
      "status": "scheduled",
      "instructor": "Jane Trainer",
      "sessionType": {
        "id": "cmjl...",
        "name": "HIIT Training",
        "category": "class",
        ...
      },
      "location": {
        "id": "cmjl...",
        "name": "Downtown Studio",
        ...
      },
      "bookings": [
        {
          "id": "cmjl...",
          "status": "confirmed",
          "member": {
            "id": "cmjl...",
            "name": "John Member",
            "email": "member@example.com"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasNext": false
  }
}
```

---

### 20. Get Available Sessions

Retrieve only sessions with available capacity.

**Endpoint**: `GET /sessions/available`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Query Parameters**: Same as "Get All Sessions" (#19)

**Example**: `GET /sessions/available?date=2025-12-27`

**Success Response** (200):
```json
{
  "data": [
    {
      "id": "cmjl...",
      "startTime": "2025-12-27T14:00:00.000Z",
      "endTime": "2025-12-27T14:45:00.000Z",
      "capacity": 20,
      "status": "scheduled",
      "sessionType": { ... },
      "location": { ... },
      "bookings": [ ... ] // Only confirmed bookings
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasNext": false
  }
}
```

**Note**: Filters out sessions where confirmed bookings count >= capacity

---

### 21. Get Session by ID

Retrieve specific session instance.

**Endpoint**: `GET /sessions/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "sessionTypeId": "cmjl...",
  "locationId": "cmjl...",
  "startTime": "2025-12-27T14:00:00.000Z",
  "endTime": "2025-12-27T14:45:00.000Z",
  "capacity": 20,
  "status": "scheduled",
  "instructor": "Jane Trainer",
  "notes": "Bring your own mat",
  "sessionType": { ... },
  "location": { ... },
  "bookings": [ ... ]
}
```

**Error Responses**:
- `404 Not Found`: Session not found

---

### 22. Update Session

Update session instance details.

**Endpoint**: `PATCH /sessions/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body** (all fields optional):
```json
{
  "startTime": "2025-12-27T15:00:00.000Z",
  "endTime": "2025-12-27T15:45:00.000Z",
  "locationId": "cmjl...",
  "capacity": 25,
  "instructor": "Mike Trainer",
  "notes": "Updated notes"
}
```

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "startTime": "2025-12-27T15:00:00.000Z",
  "endTime": "2025-12-27T15:45:00.000Z",
  "capacity": 25,
  "instructor": "Mike Trainer",
  "notes": "Updated notes",
  "sessionType": { ... },
  "location": { ... },
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

**Business Rules**:
- Checks for scheduling conflicts if time or location changes

**Error Responses**:
- `404 Not Found`: Session not found
- `409 Conflict`: Location already booked during the new time slot

---

### 23. Cancel Session

Cancel a session instance.

**Endpoint**: `PUT /sessions/:id/cancel`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "status": "cancelled",
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Cannot cancel a completed session
- `404 Not Found`: Session not found

---

### 24. Complete Session

Mark session as completed.

**Endpoint**: `PUT /sessions/:id/complete`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "status": "completed",
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Only scheduled sessions can be marked as completed
- `404 Not Found`: Session not found

---

### 25. Check-in to Session

Check in a member to a session (placeholder implementation).

**Endpoint**: `POST /sessions/:id/checkin`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Note**: Current implementation returns session details. Future implementation will mark booking as attended.

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "sessionTypeId": "cmjl...",
  "startTime": "2025-12-27T14:00:00.000Z",
  ...
}
```

---

### 26. Delete Session

Delete a session (soft delete via cancel).

**Endpoint**: `DELETE /sessions/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "status": "cancelled",
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

## Booking Endpoints

### 27. Create Booking

Book a session for the authenticated member.

**Endpoint**: `POST /bookings`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Request Body**:
```json
{
  "sessionInstanceId": "cmjl...",
  "notes": "First time attending"
}
```

**Field Descriptions**:
- `sessionInstanceId`: Required, UUID of session to book
- `notes`: Optional, additional notes

**Note**: `memberId` is automatically extracted from JWT token

**Success Response** (201):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "memberId": "cmjl...",
  "sessionInstanceId": "cmjl...",
  "status": "confirmed",
  "bookedAt": "2025-12-25T11:39:39.758Z",
  "attendedAt": null,
  "cancelledAt": null,
  "notes": "First time attending",
  "createdAt": "2025-12-25T11:39:39.758Z",
  "updatedAt": "2025-12-25T11:39:39.758Z",
  "sessionInstance": {
    "id": "cmjl...",
    "startTime": "2025-12-27T14:00:00.000Z",
    "endTime": "2025-12-27T14:45:00.000Z",
    "capacity": 20,
    "sessionType": {
      "id": "cmjl...",
      "name": "HIIT Training",
      ...
    },
    "location": {
      "id": "cmjl...",
      "name": "Downtown Studio",
      ...
    }
  },
  "member": {
    "id": "cmjl...",
    "name": "John Member",
    "email": "member@example.com"
  }
}
```

**Business Rules**:
- Prevents duplicate bookings (same member + session)
- Checks session capacity
- Only allows booking for scheduled sessions

**Error Responses**:
- `404 Not Found`: Session not found
- `409 Conflict`: Member already has a booking for this session
- `400 Bad Request`: Session is at capacity or not scheduled

---

### 28. Get All Bookings

Get all bookings (admin view).

**Endpoint**: `GET /bookings`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Query Parameters** (optional):
- `status`: Filter by status ("confirmed", "cancelled", "attended")
- `sessionInstanceId`: Filter by session
- `memberId`: Filter by member

**Example**: `GET /bookings?status=confirmed`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "memberId": "cmjl...",
    "sessionInstanceId": "cmjl...",
    "status": "confirmed",
    "bookedAt": "2025-12-25T11:39:39.758Z",
    "sessionInstance": { ... },
    "member": {
      "id": "cmjl...",
      "name": "John Member",
      "email": "member@example.com"
    }
  }
]
```

---

### 29. Get My Bookings (Member View)

Get bookings for the authenticated member.

**Endpoint**: `GET /bookings/my`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Query Parameters** (optional):
- `status`: Filter by status ("confirmed", "cancelled", "attended")

**Example**: `GET /bookings/my?status=confirmed`

**Success Response** (200):
```json
[
  {
    "id": "cmjl...",
    "memberId": "cmjl...",
    "sessionInstanceId": "cmjl...",
    "status": "confirmed",
    "bookedAt": "2025-12-25T11:39:39.758Z",
    "attendedAt": null,
    "cancelledAt": null,
    "notes": "First time attending",
    "sessionInstance": {
      "id": "cmjl...",
      "startTime": "2025-12-27T14:00:00.000Z",
      "endTime": "2025-12-27T14:45:00.000Z",
      "sessionType": {
        "id": "cmjl...",
        "name": "HIIT Training",
        "description": "High Intensity Interval Training",
        "durationMin": 45,
        "category": "class",
        "maxCapacity": 20,
        "difficulty": "intermediate"
      },
      "location": {
        "id": "cmjl...",
        "name": "Downtown Studio",
        "address": "123 Main St"
      }
    }
  }
]
```

---

### 30. Get My Bookings (Alternative Route)

Alternative endpoint for member bookings.

**Endpoint**: `GET /my/bookings`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Note**: Returns same response as `GET /bookings/my` (#29)

---

### 31. Get Booking by ID

Retrieve specific booking.

**Endpoint**: `GET /bookings/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "memberId": "cmjl...",
  "sessionInstanceId": "cmjl...",
  "status": "confirmed",
  "bookedAt": "2025-12-25T11:39:39.758Z",
  "attendedAt": null,
  "cancelledAt": null,
  "notes": "First time attending",
  "sessionInstance": { ... },
  "member": { ... }
}
```

**Error Responses**:
- `404 Not Found`: Booking not found

---

### 32. Cancel Booking

Cancel a booking.

**Endpoint**: `DELETE /bookings/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "tenantId": "cmjl...",
  "memberId": "cmjl...",
  "sessionInstanceId": "cmjl...",
  "status": "cancelled",
  "bookedAt": "2025-12-25T11:39:39.758Z",
  "attendedAt": null,
  "cancelledAt": "2025-12-25T11:39:39.791Z",
  "notes": "First time attending",
  "sessionInstance": { ... },
  "member": { ... },
  "updatedAt": "2025-12-25T11:39:39.794Z"
}
```

**Business Rules**:
- Sets `status` to "cancelled"
- Sets `cancelledAt` timestamp

**Error Responses**:
- `404 Not Found`: Booking not found

---

## Member Endpoints

### 33. Get All Members (Admin)

Retrieve all members for the tenant (admin view).

**Endpoint**: `GET /members`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Note**: Currently returns mock data. Full implementation pending.

**Success Response** (200):
```json
[
  {
    "id": "member-1",
    "name": "John Doe",
    "email": "john@example.com",
    "joinDate": "2024-01-15",
    "totalBookings": 12,
    "currentStreak": 5
  },
  {
    "id": "member-2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "joinDate": "2024-02-01",
    "totalBookings": 8,
    "currentStreak": 3
  }
]
```

---

### 34. Create Member (Admin)

Create a new member account (admin function).

**Endpoint**: `POST /members`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Note**: Currently returns mock data. Use `POST /auth/signup/member` for actual member signup.

**Request Body**:
```json
{
  "name": "New Member",
  "email": "newmember@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (201):
```json
{
  "id": "new-member-id",
  "name": "New Member",
  "email": "newmember@example.com",
  "tenantId": "cmjl...",
  "createdAt": "2025-12-25T12:00:00.000Z"
}
```

---

### 35. Update Member (Admin)

Update member details.

**Endpoint**: `PUT /members/:id`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`, `Content-Type: application/json`

**Note**: Currently returns mock data. Full implementation pending.

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Success Response** (200):
```json
{
  "id": "cmjl...",
  "name": "Updated Name",
  "email": "updated@example.com",
  "updatedAt": "2025-12-25T12:00:00.000Z"
}
```

---

### 36. Get Member Stats (Admin)

Get member statistics for the tenant.

**Endpoint**: `GET /members/stats`
**Auth Required**: Yes
**Headers**: `Authorization`, `x-tenant-id`

**Note**: Currently returns mock data. Full implementation pending.

**Success Response** (200):
```json
{
  "totalMembers": 25,
  "activeThisMonth": 20,
  "newThisMonth": 3,
  "averageStreak": 4.2,
  "topPerformers": [
    { "name": "John Doe", "streak": 12 },
    { "name": "Jane Smith", "streak": 8 },
    { "name": "Mike Johnson", "streak": 6 }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource or business rule violation
- **500 Internal Server Error**: Server error

### Common Error Messages

**Authentication Errors**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Missing Tenant ID**:
```json
{
  "statusCode": 400,
  "message": "Missing x-tenant-id header",
  "error": "Bad Request"
}
```

**Resource Not Found**:
```json
{
  "statusCode": 404,
  "message": "Session instance with ID cmjl... not found",
  "error": "Not Found"
}
```

**Duplicate Booking**:
```json
{
  "statusCode": 409,
  "message": "Member already has a booking for this session",
  "error": "Conflict"
}
```

**Scheduling Conflict**:
```json
{
  "statusCode": 409,
  "message": "Location is already booked during this time slot",
  "error": "Conflict"
}
```

**Validation Error**:
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "capacity must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

## Testing

### Test Script

A complete Python test script is available at `test-api.py`. It tests all major functionality:

```bash
# Start the server first
npm run start:dev

# Run tests in a new terminal
python3 test-api.py
```

### Test Coverage

The test script covers:
1. Tenant signup
2. Login
3. Member signup
4. Location creation and retrieval
5. Session type creation and retrieval
6. Session instance creation (with auto-endTime)
7. Available sessions filtering
8. Booking creation
9. Booking retrieval
10. Booking cancellation

### Manual Testing Examples

#### Example 1: Complete User Flow

```bash
# 1. Signup as gym owner
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@mygym.com",
    "password": "SecurePass123",
    "name": "Gym Owner",
    "tenantName": "MyGym"
  }'

# Save the token and tenantId from response

# 2. Create a location
curl -X POST http://localhost:3000/locations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Studio",
    "address": "123 Fitness Ave",
    "capacity": 50
  }'

# 3. Create a session type
curl -X POST http://localhost:3000/session-types \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yoga Flow",
    "description": "Relaxing yoga session",
    "durationMin": 60,
    "maxCapacity": 30,
    "category": "class"
  }'

# 4. Schedule a session
curl -X POST http://localhost:3000/sessions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionTypeId": "<SESSION_TYPE_ID>",
    "locationId": "<LOCATION_ID>",
    "startTime": "2025-12-28T10:00:00.000Z",
    "instructor": "Sarah Instructor"
  }'

# 5. Member signup
curl -X POST http://localhost:3000/auth/signup/member \
  -H "x-tenant-id: <TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "password": "MemberPass123",
    "name": "John Member",
    "tenantId": "<TENANT_ID>"
  }'

# Save the member token

# 6. View available sessions
curl -X GET "http://localhost:3000/sessions/available" \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>"

# 7. Book a session
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionInstanceId": "<SESSION_ID>"
  }'

# 8. View my bookings
curl -X GET http://localhost:3000/bookings/my \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -H "x-tenant-id: <TENANT_ID>"
```

---

## API Summary

### Total Endpoints: 36

**Authentication** (4):
- POST /auth/signup
- POST /auth/login
- POST /auth/signup/member
- POST /auth/google

**Locations** (6):
- POST /locations
- GET /locations
- GET /locations/active
- GET /locations/:id
- PATCH /locations/:id
- DELETE /locations/:id

**Session Types** (7):
- POST /session-types
- GET /session-types
- GET /session-types/active
- GET /session-types/category/:category
- GET /session-types/:id
- PATCH /session-types/:id
- DELETE /session-types/:id

**Session Instances** (9):
- POST /sessions
- GET /sessions
- GET /sessions/available
- GET /sessions/:id
- PATCH /sessions/:id
- PUT /sessions/:id/cancel
- PUT /sessions/:id/complete
- POST /sessions/:id/checkin
- DELETE /sessions/:id

**Bookings** (6):
- POST /bookings
- GET /bookings
- GET /bookings/my
- GET /my/bookings
- GET /bookings/:id
- DELETE /bookings/:id

**Members** (4):
- GET /members
- POST /members
- PUT /members/:id
- GET /members/stats

---

**Version**: 1.0.0
**Last Updated**: December 25, 2025
**Status**: Production Ready (Phase 2 Complete)

For maintenance and troubleshooting, see `BACKEND_DOCUMENTATION.md`
