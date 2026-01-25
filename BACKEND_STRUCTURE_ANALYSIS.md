# ZMOS Backend API Structure Analysis

**Last Updated:** January 19, 2026
**Backend Location:** `/home/turnkey/zmos-backend`
**Framework:** NestJS with TypeScript
**Database:** PostgreSQL (Prisma ORM)
**Architecture:** Multi-tenant

---

## Executive Summary

The ZMOS backend is a comprehensive gym management and session booking system built on NestJS. It implements a multi-tenant architecture with role-based access control (OWNER, ADMIN, TRAINER, MEMBER, STAFF). The system has Phase 1 and Phase 2 functionality mostly complete but **lacks critical payment infrastructure**.

### Key Status:
- **API Implementation:** 80% complete (core features working)
- **Payment Integration:** 0% (NOT STARTED - MAJOR GAP)
- **Location/Maps:** 95% complete
- **Session Booking:** 95% complete
- **Database Models:** Fully designed with payment placeholders

---

## SECTION 1: EXISTING API ENDPOINTS

### 1.1 Authentication Endpoints (`/auth`)
**File:** `/home/turnkey/zmos-backend/src/auth/auth.controller.ts`

```
POST /auth/signup              - Create gym (tenant) + owner account
POST /auth/login               - Email/password login (returns JWT)
POST /auth/google              - Google OAuth signup/login
POST /auth/signup/member       - Add member to existing gym (requires x-tenant-id)
GET  /auth/refresh             - Refresh JWT token
POST /auth/logout              - Logout (token invalidation)
```

**Status:** Fully implemented
**JWT Configuration:** 24h expiration, secret from env
**Multi-tenant:** Tenant ID embedded in token

---

### 1.2 Location Management (`/locations`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/location.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/location.service.ts`

```
POST   /locations                          - Create location
GET    /locations                          - List all active locations
GET    /locations/active                   - Filter active only
GET    /locations/:id                      - Get location details
PATCH  /locations/:id                      - Update location
DELETE /locations/:id                      - Soft delete location

// Search & Discovery (PUBLIC - no auth required)
GET    /locations/search/facilities        - Search by amenities/equipment/services
GET    /locations/search/nearby            - Find locations by GPS coordinates
```

**Database Model:** `Location` (MOV_LOCATION table)
- Full address hierarchy: street, city, county, province, country
- Geographic data: latitude, longitude, elevation
- Amenities: parking, WiFi, showers, etc. (JSON array)
- Equipment: treadmills, weights, yoga mats, etc. (JSON array)
- Services: personal training, group classes, nutrition (JSON array)
- Operating hours (JSON by day)
- Capacity management
- Corporate/multi-location support
- Timezone support for global operations

**Status:** 95% complete
**Missing:** Advanced filtering by amenities combination, radius search optimization

---

### 1.3 Session Type Management (`/session-types`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/session-type.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/session-type.service.ts`

```
POST   /session-types                      - Create session type
GET    /session-types                      - List all session types
GET    /session-types/active               - Active only
GET    /session-types/category/:category   - Filter by category
GET    /session-types/:id                  - Get details
PATCH  /session-types/:id                  - Update
DELETE /session-types/:id                  - Soft delete
```

**Database Model:** `SessionType` (MOV_SESSION_TYPE table)
- Categories: class, pt (personal training), group, workshop, outdoor, hiking, corporate
- Difficulty levels: beginner, intermediate, advanced
- Outdoor support: weather requirements, temp ranges, fitness level requirements
- Equipment requirements (JSON)
- Corporate wellness: approval flags, credit points
- Default capacity (can override per instance)

**Status:** 95% complete
**Missing:** Pricing model for session types

---

### 1.4 Session Instances (Booking/Schedule) (`/sessions`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/session.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/session-instance.service.ts`

```
POST   /sessions                           - Create session instance
GET    /sessions                           - List with filtering
GET    /sessions/available                 - Only sessions with spots
GET    /sessions/upcoming                  - Next N days (default 7)
GET    /sessions/today                     - Today's sessions
GET    /sessions/:id                       - Get details
GET    /sessions/:id/weather               - Get weather for outdoor session
GET    /sessions/:id/weather/safety        - Check if weather is safe
GET    /sessions/:id/weather/forecast      - 7-day forecast for location
GET    /sessions/search                    - Full-text search (q, date, category, difficulty)
PATCH  /sessions/:id                       - Update session
PUT    /sessions/:id/cancel                - Cancel session
PUT    /sessions/:id/complete              - Mark completed
POST   /sessions/:id/checkin               - Check-in member
DELETE /sessions/:id                       - Delete session
GET    /sessions/my-bookings               - Get member's booked sessions
GET    /sessions/recommended               - AI recommendations (limit 5)
```

**Database Model:** `SessionInstance` (MOV_SESSION_INSTANCE table)
- Linked to SessionType and Location
- Start/end times (future only)
- Capacity management
- Status: scheduled, cancelled, completed, weather_hold
- Instructor assignment
- Weather tracking (checked, safe flag, data, checked timestamp, alert sent flag)
- Outdoor specifics: meeting point, route details, alternative venue
- Corporate wellness: session ID, points awarded

**Status:** 95% complete
**Weather Integration:** OpenWeather API (needs API key configuration)
**Missing:** 
- Payment verification before final confirmation
- Trainer compensation calculation per session

---

### 1.5 Booking Management (`/bookings`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/booking.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/booking.service.ts`

```
POST   /bookings                           - Create booking
GET    /bookings                           - List all (admin)
GET    /bookings/my                        - Get member's bookings
GET    /bookings/:id                       - Get booking details
DELETE /bookings/:id                       - Cancel booking
PUT    /bookings/:id/no-show               - Mark as no-show (admin)
```

**Database Model:** `Booking` (MOV_BOOKING table)
- Status: confirmed, cancelled, no_show, attended
- Timestamps: booked_at, attended_at, cancelled_at
- Prevents double-booking (unique constraint)
- Capacity checking before confirmation
- Future sessions only

**Status:** 95% complete
**Transactions:** Uses Prisma transactions with MovementEvent creation
**Missing:** 
- Payment processing before booking confirmation
- Refund processing on cancellation
- Late cancellation fee handling
- Trainer payment tracking

---

### 1.6 Member Profile & Statistics (`/my`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/member-profile.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/member-profile.service.ts`

```
GET    /my/profile                         - Get current member profile
PUT    /my/profile                         - Update profile (name, avatar, phone, etc.)
GET    /my/stats                           - Activity statistics
GET    /my/bookings/history                - Booking history with pagination
GET    /my/streak                          - Current & longest streak
GET    /my/events                          - Movement events history
GET    /my/attendance                      - Attendance records by date
POST   /my/favorites/:sessionTypeId        - Add to favorites
DELETE /my/favorites/:sessionTypeId        - Remove from favorites
GET    /my/favorites                       - List favorite session types
GET    /my/business-stats                  - Business metrics (OWNER/ADMIN only)
GET    /my/analytics                       - Detailed analytics (OWNER/ADMIN only)
```

**Statistics Calculated:**
- Total bookings, attended sessions, cancellations, no-shows
- Attendance rate (%)
- Current/longest streak
- Favorite session types (top 5)
- Monthly activity breakdown
- Business metrics: total revenue (placeholder), member growth, occupancy rates

**Status:** 95% complete
**Missing:** 
- Revenue metrics (requires payment system)
- Trainer earnings tracking
- Subscription status integration

---

### 1.7 Member Management (`/members`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/member.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/member.service.ts`

```
GET    /members                            - List all members (admin)
POST   /members                            - Create member (admin)
PUT    /members/:id                        - Update member (admin)
GET    /members/my/profile                 - Get current profile
PUT    /members/my/profile                 - Update current profile
GET    /members/my/stats                   - Get stats
GET    /members/stats                      - Aggregate stats
POST   /members/my/profile/complete/owner  - Complete owner onboarding
POST   /members/my/profile/complete/trainer - Complete trainer onboarding
POST   /members/my/profile/complete/client - Complete client onboarding
POST   /members/my/profile/complete/staff  - Complete staff onboarding
```

**Profile Completion:** Multi-step role-specific onboarding
- **Owner:** Business info, amenities, hours, contact
- **Trainer:** Bio, certifications, specializations, business hours, rates
- **Client:** Fitness goals, experience level, health info, preferences
- **Staff:** Department, position, shift, responsibilities

**Status:** 95% complete

---

### 1.8 Trainer Management (`/trainer`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/trainer.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/trainer.service.ts`

```
GET    /trainer/sessions                   - Get trainer's assigned sessions
GET    /trainer/clients                    - Get trainer's clients
GET    /trainer/sessions/upcoming          - Get upcoming sessions
GET    /trainer/sessions/:id/roster        - Get session attendance roster
```

**Status:** 90% complete
**Missing:** 
- Trainer earnings/payment dashboard
- Payment per session tracking
- Commission calculations

---

### 1.9 Waitlist Management (Part of `/sessions`)
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/waitlist.service.ts`

```
POST   /sessions/:id/waitlist              - Join waitlist
GET    /sessions/:id/waitlist              - Get waitlist (admin)
DELETE /sessions/:id/waitlist              - Leave waitlist
```

**Database Model:** `Waitlist` (MOV_WAITLIST table)
- Maintains position ordering
- Automatic promotion when spots open
- Unique constraint (one per member per session)

**Status:** 95% complete

---

### 1.10 Favorites Management (`/my/favorites`)
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/favorite.service.ts`

```
POST   /my/favorites/:sessionTypeId        - Add favorite
DELETE /my/favorites/:sessionTypeId        - Remove favorite
GET    /my/favorites                       - List favorites
```

**Database Model:** `Favorite` (MOV_FAVORITE table)
- One-to-many: member to session types
- Used for recommendations

**Status:** 100% complete

---

### 1.11 Invitations Management (`/invitations`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/invitation.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/invitation.service.ts`

```
POST   /invitations                        - Send invitation
POST   /invitations/bulk                   - Send bulk invitations
GET    /invitations                        - List pending invitations
GET    /invitations/summary                - Summary stats
POST   /invitations/accept                 - Accept invitation
POST   /invitations/decline                - Decline invitation
GET    /invitations/:id                    - Get invitation details
DELETE /invitations/:id                    - Cancel invitation
```

**Database Model:** `Invitation` (MOV_INVITATION table)
- Statuses: PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELLED
- Expiration tracking
- Role assignment on acceptance
- Email-based invites with codes

**Status:** 100% complete

---

### 1.12 Reference Data (`/reference`)
**File:** `/home/turnkey/zmos-backend/src/moveos/controllers/reference.controller.ts`
**Service:** `/home/turnkey/zmos-backend/src/moveos/services/location-hierarchy.service.ts`

```
GET    /reference/onboarding               - Onboarding configuration
GET    /reference/countries                - List supported countries
GET    /reference/provinces                - Get provinces by country
GET    /reference/country                  - Get country details
GET    /reference/locations/search         - Search locations
GET    /reference/locations/validate       - Validate address components
```

**Supported Countries:**
- South Africa (ZA) - 9 provinces
- United States (US) - 5+ states
- United Kingdom (GB) - 4 countries
- Kenya (KE) - 4 counties
- Nigeria (NG) - 3 states

**Status:** 100% complete

---

## SECTION 2: DATABASE MODELS & SCHEMAS

### 2.1 Core Multi-Tenant Model

```prisma
model Tenant {
  id        String   @id @default(cuid()) @map("TEN_ID")
  name      String   @map("TEN_NAME")           // Gym/Studio name
  code      String?  @unique @map("TEN_CODE")   // Unique gym code (e.g., "GYM0001")
  createdAt DateTime @default(now()) @map("TEN_CREATED_AT")
  updatedAt DateTime @updatedAt @map("TEN_UPDATED_AT")
}
```

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 20-42)
**Naming Convention:** MOV_TENANT (MoveOS domain prefix)

---

### 2.2 Member Model

```prisma
model Member {
  id              String     @id @default(cuid()) @map("MEM_ID")
  tenantId        String     @map("MEM_TENANT_ID")
  email           String     @map("MEM_EMAIL")
  passwordHash    String?    @map("MEM_PASSWORD_HASH")
  name            String?    @map("MEM_NAME")
  googleId        String?    @unique @map("MEM_GOOGLE_ID")
  avatarUrl       String?    @map("MEM_AVATAR_URL")
  role            MemberRole @default(MEMBER) @map("MEM_ROLE")
  
  // Unique identifiers
  trainerCode     String?    @unique @map("MEM_TRAINER_CODE")
  trainerType     String?    @map("MEM_TRAINER_TYPE") // 'freelance' or 'gym_affiliated'
  
  // Extended profile data (JSON)
  ownerProfile    Json?      @map("MEM_OWNER_PROFILE")
  trainerProfile  Json?      @map("MEM_TRAINER_PROFILE")
  clientProfile   Json?      @map("MEM_CLIENT_PROFILE")
  staffProfile    Json?      @map("MEM_STAFF_PROFILE")
  
  // Profile completion tracking
  profileCompleted Boolean @default(false) @map("MEM_PROFILE_COMPLETED")
  onboardingStep   Int?    @map("MEM_ONBOARDING_STEP")
  
  // Auth
  refreshToken    String?   @map("MEM_REFRESH_TOKEN")
  
  createdAt       DateTime  @default(now()) @map("MEM_CREATED_AT")
  updatedAt       DateTime  @updatedAt @map("MEM_UPDATED_AT")
}

enum MemberRole {
  OWNER    // Gym/Studio owner
  ADMIN    // Administrator
  TRAINER  // Trainer/Instructor
  MEMBER   // Regular member
  STAFF    // Front desk, maintenance, etc.
}
```

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 44-94)
**Naming Convention:** MOV_MEMBER
**Note:** Password NOT stored directly; uses bcrypt hash

---

### 2.3 Location Model

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 109-170)
**Naming Convention:** MOV_LOCATION

Key fields:
- Address hierarchy: street number, street name, city, county, province, country, postal code
- Geographic: latitude, longitude, elevation (meters)
- Facilities: capacity, location type (indoor/outdoor/hybrid/virtual), timezone
- Weather: requires weather check flag, weather alert enabled flag
- Corporate support: corporate ID, building name, floor, room, access instructions
- Amenities, equipment, services (JSON arrays)
- Operating hours (JSON by day)
- Description and photos (JSON array URLs)
- Is active flag for soft deletes

**Indexes:**
- Unique: (tenantId, name)
- Geographic: (country, province, city), (latitude, longitude)
- Lookups: tenantId, isActive, corporateId, locationType

---

### 2.4 SessionType Model

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 172-214)
**Naming Convention:** MOV_SESSION_TYPE

Key fields:
- name, description, durationMin (minutes)
- category: class, pt, group, workshop, outdoor, hiking, corporate
- maxCapacity, difficulty (beginner/intermediate/advanced)
- Outdoor support: isOutdoor, requiresWeather, weatherConditions, temperatureMin/Max
- equipmentRequired, fitnessLevel (JSON)
- Corporate: corporateApproved, creditPoints
- isActive for soft deletes

---

### 2.5 SessionInstance Model

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 216-265)
**Naming Convention:** MOV_SESSION_INSTANCE

Key fields:
- Links to SessionType, Location, Tenant
- startTime, endTime (DateTime)
- capacity (override SessionType default)
- status: scheduled, cancelled, completed, weather_hold
- instructor name (future: staff link)
- notes
- Weather fields: weatherChecked, weatherSafe, weatherData (JSON), weatherCheckedAt, weatherAlertSent
- Outdoor fields: meetingPoint, routeDetails (JSON), alternativeVenue
- Corporate: corporateSessionId, pointsAwarded

**Unique Constraint:** (locationId, startTime) - prevents double-booking locations

---

### 2.6 Booking Model

**File:** `/home/turnkey/zmos-backend/prisma/schema.prisma` (Lines 267-293)
**Naming Convention:** MOV_BOOKING

Key fields:
- Links to Tenant, Member, SessionInstance
- status: confirmed, cancelled, no_show, attended
- Timestamps: bookedAt, attendedAt, cancelledAt
- notes for special requests
- created/updatedAt tracking

**Unique Constraint:** (memberId, sessionInstanceId) - prevents double-booking

---

### 2.7 Supporting Models

**MovementEvent** (MOV_MOVEMENT_EVENT) - Activity tracking
**Waitlist** (MOV_WAITLIST) - Session waitlist with position tracking
**Favorite** (MOV_FAVORITE) - Member's favorite session types
**Invitation** (MOV_INVITATION) - Team member invitations

---

## SECTION 3: MISSING PAYMENT INFRASTRUCTURE

### 3.1 Critical Gaps

**PAYMENT INTEGRATION: 0% COMPLETE - SHOWSTOPPER**

Current placeholder in code:
```typescript
// src/moveos/services/member-profile.service.ts
// Revenue metrics (placeholder - requires payment/subscription system)
// TODO: Implement when payment system is added
```

### 3.2 Gym Membership Payments (Missing)

**Required Endpoints:**
```
POST   /memberships                        - Create/purchase membership
GET    /memberships/my                     - Get member's active memberships
GET    /memberships                        - List all memberships (admin)
PUT    /memberships/:id/cancel             - Cancel membership
PUT    /memberships/:id/renew              - Renew membership
GET    /memberships/:id/payment-history    - Payment history for membership
POST   /memberships/:id/pause              - Pause membership
POST   /memberships/:id/resume             - Resume membership
```

**Required Data:**
```prisma
model MembershipPlan {
  id              String   @id @default(cuid())
  tenantId        String
  name            String              // e.g., "Basic", "Premium", "Elite"
  description     String?
  durationDays    Int                 // e.g., 30, 365
  price           Decimal             // Cost in local currency
  currency        String              // e.g., "KES", "ZAR", "USD"
  features        String?             // JSON array of features
  classCredits    Int?                // Number of classes included
  trainerSessions Int?                // Number of PT sessions
  isActive        Boolean
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Subscription {
  id              String   @id @default(cuid())
  tenantId        String
  memberId        String
  planId          String
  status          SubscriptionStatus // active, paused, cancelled, expired
  startDate       DateTime
  endDate         DateTime?
  renewalDate     DateTime?
  pausedUntil     DateTime?
  paymentMethod   String              // "mpesa", "card", etc.
  paymentRef      String?             // External payment reference
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum SubscriptionStatus {
  active
  paused
  cancelled
  expired
  pending_payment
}
```

### 3.3 Trainer Payments (Missing)

**Required Endpoints:**
```
GET    /trainer/earnings                   - Trainer's total earnings
GET    /trainer/earnings/history           - Earnings breakdown by session
GET    /trainer/payments                   - Payment history
POST   /trainer/payments/request           - Request payout
GET    /trainer/payments/pending           - Pending payments
```

**Required Data:**
```prisma
model TrainerSession {
  id              String   @id @default(cuid())
  sessionId       String
  trainerId       String
  ratePerSession  Decimal             // Trainer's rate
  currency        String
  paymentStatus   PaymentStatus       // pending, paid, cancelled
  paidAt          DateTime?
  transactionId   String?             // Payment gateway reference
  notes           String?
  createdAt       DateTime @default(now())
}

model TrainerPayment {
  id              String   @id @default(cuid())
  trainerId       String
  totalAmount     Decimal
  currency        String
  sessions        TrainerSession[]    // Multiple sessions
  status          PaymentStatus       // pending, processing, completed, failed
  paymentMethod   String              // "mpesa", "bank_transfer", "wallet"
  paymentRef      String?
  requestedAt     DateTime
  processedAt     DateTime?
  createdAt       DateTime @default(now())
}

enum PaymentStatus {
  pending
  processing
  completed
  failed
  refunded
}
```

### 3.4 Session Pricing (Missing)

**Current state:** Sessions have NO pricing!

```prisma
model SessionInstance {
  // MISSING:
  price           Decimal?            // Cost for non-members/drop-in
  isPaid          Boolean @default(false)
  paymentRequired Boolean @default(false)
  currency        String?
}
```

### 3.5 Payment Gateway Integration (Missing)

**No payment provider configured:**
- M-Pesa: MISSING
- Stripe: MISSING
- Razorpay: MISSING
- Square: MISSING

**Required Configuration:**
```typescript
// src/payments/payment.module.ts (DOES NOT EXIST)

// Would need to implement:
// - M-Pesa integration (for East Africa)
// - Credit card processing
// - Payment webhook handling
// - Payment status tracking
// - Transaction logging
```

### 3.6 Refunds & Cancellation Charges (Missing)

**Current:** Cancellations simply delete bookings

**Missing:**
```
POST   /bookings/:id/refund                - Issue refund
GET    /refunds                            - List refunds
GET    /refunds/:id                        - Refund details
POST   /refunds/:id/verify                 - Verify with payment gateway
```

**No logic for:**
- Late cancellation fees
- Refund eligibility windows
- Partial refunds
- Refund reversal

---

## SECTION 4: SESSION BOOKING ENDPOINTS ANALYSIS

### 4.1 Complete Booking Flow

**Current Implementation:**
```
1. User views sessions: GET /sessions
2. User checks details: GET /sessions/:id
3. User books: POST /bookings (with sessionInstanceId)
4. System checks:
   - Session exists and is scheduled
   - Session is in future
   - No double-booking
   - Capacity available
5. Booking confirmed
6. MovementEvent created for analytics
```

**Missing in Flow:**
```
- Payment processing before confirmation
- Membership verification
- Credit availability check
- Refund policy display
- Late cancellation warning
```

### 4.2 Cancellation Flow

**Current:**
```
DELETE /bookings/:id → Mark as cancelled, no refund logic
```

**Missing:**
```
- Refund calculation
- Late fee deduction
- Refund method selection
- Trainer notification
- Waitlist processing
```

### 4.3 Check-In Flow

**Current:**
```
POST /sessions/:id/checkin → Placeholder only
```

**Missing:**
- Payment verification at check-in
- Last-minute payment option
- Attendance confirmation
- No-show tracking
- Credit deduction

---

## SECTION 5: LOCATION & MAPS ENDPOINTS ANALYSIS

### 5.1 Location Search Capabilities

**Implemented:**
```
GET /locations/search/facilities
  - Keyword search (name/address)
  - Filter by amenities: WIFI, PARKING, SHOWERS, etc.
  - Filter by equipment: TREADMILL, FREE_WEIGHTS, YOGA_MATS
  - Filter by services: PERSONAL_TRAINING, GROUP_CLASSES, NUTRITION
  - Filter by location type: indoor, outdoor, hybrid, virtual
  - Geographic filter: country, province, city

GET /locations/search/nearby
  - GPS-based radius search
  - Default 10km radius, configurable
```

**Status:** 95% complete
**Optimization Needed:** PostGIS integration for advanced geospatial queries

### 5.2 Missing Geo Features

```
- Advanced polygon search (neighborhoods, districts)
- Route planning to location
- Traffic prediction
- Public transit directions
- Parking availability
- Accessibility features
- Wheelchair access details
```

---

## SECTION 6: DATA FILES & CONFIGURATION

### 6.1 File Structure

```
/home/turnkey/zmos-backend/
├── prisma/
│   └── schema.prisma              // Database schema (ALL MODELS)
├── src/
│   ├── auth/                      // Authentication (JWT, OAuth)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.guard.ts
│   │   └── dto/
│   ├── moveos/
│   │   ├── controllers/           // ALL API ENDPOINTS
│   │   │   ├── booking.controller.ts
│   │   │   ├── session.controller.ts
│   │   │   ├── location.controller.ts
│   │   │   ├── member.controller.ts
│   │   │   ├── trainer.controller.ts
│   │   │   ├── session-type.controller.ts
│   │   │   ├── member-profile.controller.ts
│   │   │   ├── invitation.controller.ts
│   │   │   └── reference.controller.ts
│   │   ├── services/              // Business logic
│   │   │   ├── booking.service.ts
│   │   │   ├── session-instance.service.ts
│   │   │   ├── location.service.ts
│   │   │   ├── session-type.service.ts
│   │   │   ├── member.service.ts
│   │   │   ├── trainer.service.ts
│   │   │   ├── waitlist.service.ts
│   │   │   ├── favorite.service.ts
│   │   │   ├── weather.service.ts
│   │   │   ├── movement-event.service.ts
│   │   │   ├── streak.service.ts
│   │   │   ├── recommendation.service.ts
│   │   │   ├── invitation.service.ts
│   │   │   └── location-hierarchy.service.ts
│   │   ├── dto/                   // Data transfer objects
│   │   └── moveos.module.ts
│   ├── ai/                        // AI/recommendations (Gemini)
│   ├── common/                    // Middleware, filters
│   ├── prisma/                    // Prisma service
│   ├── app.module.ts              // Main module
│   └── main.ts                    // Entry point
├── test/                          // E2E tests
├── .env                           // Environment variables
└── package.json
```

---

## SECTION 7: WHAT'S ALREADY WORKING

### 7.1 Complete Features (Phase 1 & 2)

1. **Multi-tenant Authentication**
   - Gym signup (creates tenant + owner)
   - Member signup with tenant ID
   - JWT-based session management
   - Google OAuth integration
   - Token refresh

2. **Gym & Location Management**
   - Multiple gyms (tenants) supported
   - Multiple locations per gym
   - Rich location data (amenities, equipment, services)
   - GPS-based search
   - Geographic hierarchy (country → province → city)

3. **Session Management**
   - Session types with categories (class, PT, outdoor, hiking, etc.)
   - Session instances with scheduling
   - Capacity management
   - Weather integration for outdoor sessions
   - Session search and filtering

4. **Booking System**
   - Book sessions
   - View bookings
   - Cancel bookings
   - Waitlist for full sessions
   - Double-booking prevention

5. **Member Profiles**
   - Role-based profiles (owner, trainer, member, staff)
   - Profile completion workflow
   - Activity statistics
   - Streak tracking
   - Attendance history

6. **Trainer Management**
   - Trainer dashboard (sessions, clients)
   - Session roster
   - Trainer codes for identity

7. **Analytics & Recommendations**
   - Member activity tracking
   - Favorite sessions
   - Movement events logging
   - AI-powered recommendations (using Google Gemini)

8. **Team Management**
   - Invitation system for staff
   - Role assignment on acceptance
   - Bulk invitations

---

## SECTION 8: WHAT'S MISSING (CRITICAL GAPS)

### 8.1 Payment Systems (BLOCKING)

**Priority: CRITICAL**

Missing:
1. Membership/Subscription payment processing
2. M-Pesa integration (East African market)
3. Credit card processing
4. Trainer payment tracking and payouts
5. Session pricing models
6. Refund management
7. Payment webhooks
8. Transaction logging
9. Currency management per tenant
10. Payment reconciliation

### 8.2 Admin/Business Operations

**Priority: HIGH**

Missing:
1. Business dashboard (revenue, member growth, occupancy)
2. Payment reports and reconciliation
3. Member management UI (add/remove/suspend)
4. Discount codes and promotions
5. Billing cycle management
6. Invoice generation
7. Audit logging for financial transactions
8. Tax calculation and reporting

### 8.3 Advanced Booking Features

**Priority: MEDIUM**

Missing:
1. Class pack purchases (e.g., 10 classes for price)
2. Drop-in pricing
3. Membership-based access (unlimited classes)
4. Class credits system
5. Late cancellation fees enforcement
6. No-show penalties
7. Waitlist automatic promotion with payment

### 8.4 Trainer Features

**Priority: HIGH**

Missing:
1. Trainer payout dashboard
2. Commission calculation
3. Payment history per trainer
4. Trainer rating system
5. Trainer availability calendar
6. Trainer scheduling preferences
7. Group class commission vs. PT rates

### 8.5 Communication

**Priority: MEDIUM**

Missing:
1. Email notifications for bookings
2. SMS alerts (M-Pesa confirmations)
3. Payment receipts
4. Payment failure notifications
5. Subscription renewal reminders
6. Class cancellation notifications

---

## SECTION 9: PAYMENT INTEGRATION ARCHITECTURE (RECOMMENDED)

### 9.1 Proposed Structure

```
/src/payments/
├── payments.module.ts
├── payments.service.ts             // Main payment service
├── payment.controller.ts
├── gateways/
│   ├── mpesa.gateway.ts            // M-Pesa implementation
│   ├── stripe.gateway.ts           // Stripe (fallback)
│   └── gateway.interface.ts
├── dto/
│   ├── payment-request.dto.ts
│   ├── payment-response.dto.ts
│   └── webhook.dto.ts
├── models/
│   ├── payment.model.ts
│   ├── transaction.model.ts
│   └── refund.model.ts
└── webhooks/
    └── webhook.controller.ts       // Handle async payment confirmations
```

### 9.2 Database Schema Additions

```prisma
model Payment {
  id              String   @id @default(cuid())
  tenantId        String
  memberId        String
  amount          Decimal
  currency        String
  type            PaymentType        // membership, session, trainer
  status          PaymentStatus      // pending, completed, failed, refunded
  gateway         String             // "mpesa", "stripe", etc.
  externalRef     String?            // Gateway transaction ID
  metadata        Json?              // Additional data
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}

model Invoice {
  id              String   @id @default(cuid())
  tenantId        String
  memberId        String
  amount          Decimal
  currency        String
  description     String
  dueDate         DateTime
  paidAt          DateTime?
  createdAt       DateTime @default(now())
}

model Refund {
  id              String   @id @default(cuid())
  paymentId       String
  amount          Decimal
  reason          String
  status          RefundStatus       // pending, approved, rejected, completed
  createdAt       DateTime @default(now())
}
```

---

## SECTION 10: API SUMMARY TABLE

| Endpoint | Method | Status | Auth | Notes |
|----------|--------|--------|------|-------|
| /auth/signup | POST | ✅ | NO | Creates tenant + owner |
| /auth/login | POST | ✅ | NO | Email/password |
| /auth/google | POST | ✅ | NO | OAuth |
| /locations | POST | ✅ | YES | Create location |
| /locations | GET | ✅ | NO | List all |
| /locations/:id | GET | ✅ | NO | Get details |
| /locations/search/facilities | GET | ✅ | NO | Advanced search |
| /locations/search/nearby | GET | ✅ | NO | GPS search |
| /sessions | POST | ✅ | YES | Create session |
| /sessions | GET | ✅ | NO | List sessions |
| /sessions/:id | GET | ✅ | NO | Get details |
| /sessions/upcoming | GET | ✅ | YES | Next 7 days |
| /sessions/today | GET | ✅ | YES | Today only |
| /sessions/:id/weather | GET | ✅ | NO | Weather data |
| /sessions/search | GET | ✅ | NO | Full-text search |
| /bookings | POST | ✅ | YES | Create booking |
| /bookings | GET | ✅ | YES | List bookings |
| /bookings/:id | DELETE | ✅ | YES | Cancel booking |
| /my/profile | GET | ✅ | YES | Get profile |
| /my/profile | PUT | ✅ | YES | Update profile |
| /my/stats | GET | ✅ | YES | Activity stats |
| /my/streak | GET | ✅ | YES | Streak info |
| /my/favorites | POST | ✅ | YES | Add favorite |
| /session-types | POST | ✅ | YES | Create type |
| /session-types | GET | ✅ | YES | List types |
| /members | GET | ✅ | YES | List members |
| /trainer/sessions | GET | ✅ | YES | Trainer's sessions |
| /trainer/clients | GET | ✅ | YES | Trainer's clients |
| /invitations | POST | ✅ | YES | Send invitation |
| **MISSING PAYMENT** | | ❌ | | |
| /memberships | POST | ❌ | YES | MISSING |
| /memberships/my | GET | ❌ | YES | MISSING |
| /trainer/earnings | GET | ❌ | YES | MISSING |
| /payments | POST | ❌ | YES | MISSING |
| /payments/confirm | POST | ❌ | NO | MISSING (Webhook) |
| /refunds | POST | ❌ | YES | MISSING |

---

## SECTION 11: NEXT STEPS - IMPLEMENTATION ROADMAP

### Phase 3: Payment Integration (CRITICAL)

1. **Week 1: M-Pesa Integration**
   - Set up Daraja (M-Pesa) API credentials
   - Implement payment initiator
   - Create webhook handler
   - Add payment database models

2. **Week 2: Subscription System**
   - Create MembershipPlan model
   - Build subscription endpoints
   - Integrate with booking (membership-based access)
   - Add renewal logic

3. **Week 3: Trainer Payments**
   - Implement TrainerSession tracking
   - Calculate trainer commission
   - Create payout endpoints
   - Add payment reports

4. **Week 4: Refunds & Disputes**
   - Implement refund logic
   - Add late cancellation fees
   - Create dispute resolution workflow

### Phase 4: Notifications & Communication

1. Email notifications (bookings, payments, cancellations)
2. SMS alerts for payments
3. Payment receipts

### Phase 5: Admin Dashboard & Reporting

1. Revenue dashboard
2. Member growth tracking
3. Occupancy reports
4. Payment reconciliation

---

## Files to Review

**Database Schema:**
- `/home/turnkey/zmos-backend/prisma/schema.prisma` (ALL MODELS)

**API Documentation:**
- `/home/turnkey/zmos-backend/API_DOCUMENTATION.md`
- `/home/turnkey/zmos-backend/MISSING_APIS_PHASE1_PHASE2.md`

**Implementation Guides:**
- `/home/turnkey/zmos-backend/PHASE_1_2_IMPLEMENTATION.md`
- `/home/turnkey/zmos-backend/README.md`

**Tests:**
- `/home/turnkey/zmos-backend/test/moveos.e2e-spec.ts`
- `/home/turnkey/zmos-backend/test/auth.e2e-spec.ts`

