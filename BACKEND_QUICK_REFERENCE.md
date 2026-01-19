# ZMOS Backend - Quick Reference Guide

## API Endpoints by Category

### Authentication
- POST `/auth/signup` - Create gym + owner account
- POST `/auth/login` - Login (returns JWT)
- POST `/auth/google` - OAuth signup/login
- POST `/auth/signup/member` - Add member to gym
- GET `/auth/refresh` - Refresh token

### Locations (Maps & Facilities)
- POST `/locations` - Create location [AUTH]
- GET `/locations` - List all
- GET `/locations/search/facilities` - Search by amenities/equipment
- GET `/locations/search/nearby` - GPS radius search

### Sessions
- POST `/sessions` - Create session [AUTH]
- GET `/sessions` - List all
- GET `/sessions/upcoming` - Next 7 days
- GET `/sessions/today` - Today's sessions
- GET `/sessions/recommended` - AI recommendations [AUTH]
- GET `/sessions/:id/weather` - Weather data
- GET `/sessions/search` - Full-text search

### Bookings
- POST `/bookings` - Book session [AUTH]
- GET `/bookings/my` - My bookings [AUTH]
- DELETE `/bookings/:id` - Cancel booking [AUTH]
- POST `/sessions/:id/waitlist` - Join waitlist [AUTH]

### Member Profile
- GET `/my/profile` - Profile [AUTH]
- PUT `/my/profile` - Update profile [AUTH]
- GET `/my/stats` - Activity stats [AUTH]
- GET `/my/streak` - Streak info [AUTH]
- GET `/my/favorites` - Favorites [AUTH]
- GET `/my/business-stats` - Revenue/metrics [AUTH OWNER/ADMIN]

### Trainer
- GET `/trainer/sessions` - Assigned sessions [AUTH]
- GET `/trainer/clients` - Trainer's clients [AUTH]
- GET `/trainer/sessions/:id/roster` - Attendance [AUTH]

### Admin
- GET `/members` - List members [AUTH ADMIN]
- GET `/invitations` - Pending invites [AUTH]
- POST `/invitations` - Send invite [AUTH]

---

## Database Models (10 core tables)

1. **MOV_TENANT** - Gym/studio
2. **MOV_MEMBER** - User account (owner, trainer, member, staff)
3. **MOV_LOCATION** - Gym location with amenities
4. **MOV_SESSION_TYPE** - Class/session templates (HIIT, Yoga, etc.)
5. **MOV_SESSION_INSTANCE** - Scheduled sessions with capacity
6. **MOV_BOOKING** - Member bookings
7. **MOV_WAITLIST** - Session waitlist
8. **MOV_FAVORITE** - Member's favorite session types
9. **PLP_MOVEMENT_EVENT** - Activity tracking
10. **MOV_INVITATION** - Team invitations

---

## What Works (95% Complete)
✅ Multi-tenant gym management
✅ Location search with GPS & amenities
✅ Session scheduling & booking
✅ Weather integration for outdoor activities
✅ Member profiles with roles
✅ Trainer dashboard
✅ Waitlist management
✅ AI recommendations
✅ Team invitations
✅ Activity tracking & streaks

## What's Missing (0% - CRITICAL)
❌ PAYMENTS - NO INTEGRATION
❌ M-Pesa, Stripe, or any payment gateway
❌ Membership/subscription system
❌ Trainer earnings & payouts
❌ Session pricing
❌ Refund processing
❌ Payment webhooks
❌ Revenue reports
❌ Billing management

---

## Technology Stack
- Framework: NestJS (TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + Google OAuth
- Weather API: OpenWeather
- AI: Google Gemini (recommendations)

---

## File Locations
```
/home/turnkey/zmos-backend/
├── prisma/schema.prisma          ← All database models
├── src/auth/                      ← Authentication logic
├── src/moveos/
│   ├── controllers/               ← API endpoints
│   ├── services/                  ← Business logic
│   └── dto/                       ← Data structures
└── BACKEND_STRUCTURE_ANALYSIS.md  ← Full documentation
```

---

## Key Stats
- 30+ API endpoints implemented
- 10 core database tables
- 5 countries supported (ZA, US, GB, KE, NG)
- 7 session categories (class, PT, outdoor, hiking, etc.)
- 5 member roles (Owner, Admin, Trainer, Member, Staff)
- 0 payment endpoints (MAJOR GAP)

---

## Next Steps (Priority Order)
1. **URGENT:** Implement M-Pesa integration
2. Build membership/subscription system
3. Add trainer payment processing
4. Implement session pricing
5. Build admin dashboard with revenue metrics
6. Add payment webhooks
7. Create refund/chargeback handling
8. Build business reporting

