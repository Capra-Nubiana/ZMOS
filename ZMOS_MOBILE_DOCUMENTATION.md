# ZMOS API Documentation - Mobile Integration Guide
**Version:** Phase 1 & 2 Complete
**Date:** 2026-01-06
**Status:** ✅ IMPLEMENTED & READY

## 1. Authentication Updates

### Login & Signup Changes
All authentication endpoints now return a `refreshToken` in addition to the `token` (JWT).

**Endpoints Updated:**
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/signup/member`
- `POST /auth/google`

**Response Structure:**
```json
{
  "member": {
    "id": "string",
    "email": "string",
    "role": "string",
    "tenantId": "string"
  },
  "tenant": {
    "id": "string",
    "name": "string"
  },
  "token": "JWT_ACCESS_TOKEN",
  "refreshToken": "RANDOM_REFRESH_TOKEN"
}
```

### Token Refresh
**Endpoint:** `POST /auth/refresh`
**Authentication:** Public (no Bearer token required)
**Request:**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```
**Response:** (Same as login response, includes new `token` and new rotating `refreshToken`)

---

## 2. Invitation System

### Acceptance Workflow (Invitees)
**Accept Invitation:** `POST /invitations/accept`
**Request:**
```json
{
  "invitationCode": "CODE_FROM_URL",
  "name": "User Name (Optional)"
}
```
**Decline Invitation:** `POST /invitations/decline`
**Request:**
```json
{
  "invitationCode": "CODE_FROM_URL"
}
```

### Management (Admins/Owners)
- `POST /invitations`: Create single invite.
- `POST /invitations/bulk`: Create multiple invites.
- `GET /invitations`: List all invites.
- `GET /invitations/summary`: Get stats (Pending, Accepted, etc.).
- `DELETE /invitations/:id`: Cancel invite.

---

## 3. Member Profile & Activity (`/my` Endpoints)

All member-specific endpoints are now consolidated under high-level `/my` path.

### Activity Tracking
- `GET /my/streak`: Current workout streak info.
- `GET /my/attendance`: List of session attendance records.
- `GET /my/events`: Chronological list of all movement events.

### Favorites (Restored)
- `GET /my/favorites`: Get list of favorite session types.
- `POST /my/favorites/:id`: Add session type to favorites.
- `DELETE /my/favorites/:id`: Remove from favorites.

---

## 4. Multi-Tenancy Rules
- The backend uses `x-tenant-id` header to isolate data.
- For most `/my` endpoints, the `tenantId` is extracted from the JWT, so the header is optional but recommended for consistency.
- **IMPORTANT:** Ensure `x-tenant-id` is correctly updated when switching gyms.

---

## 5. Implementation Summary
The backend has been refactored to remove redundant controllers and provide a clean, RESTful API for the mobile application. All Priority 1 and 2 features are verified and building.
