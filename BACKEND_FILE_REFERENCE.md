# ZMOS Backend - Complete File Reference

## File Locations for Each Component

### AUTHENTICATION
**Implementation:**
- `/home/turnkey/zmos-backend/src/auth/auth.controller.ts` - API endpoints
- `/home/turnkey/zmos-backend/src/auth/auth.service.ts` - Business logic
- `/home/turnkey/zmos-backend/src/auth/jwt.strategy.ts` - JWT strategy
- `/home/turnkey/zmos-backend/src/auth/jwt-auth.guard.ts` - Auth guard
- `/home/turnkey/zmos-backend/src/auth/roles.guard.ts` - Role-based access
- `/home/turnkey/zmos-backend/src/auth/auth.module.ts` - Module definition

**DTOs:**
- `/home/turnkey/zmos-backend/src/auth/dto/signup.dto.ts`
- `/home/turnkey/zmos-backend/src/auth/dto/login.dto.ts`
- `/home/turnkey/zmos-backend/src/auth/dto/google-auth.dto.ts`
- `/home/turnkey/zmos-backend/src/auth/dto/member-signup.dto.ts`

---

### LOCATION MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/location.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/location.service.ts`

**Helper Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/location-hierarchy.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/create-location.dto.ts`
- `/home/turnkey/zmos-backend/src/moveos/dto/update-location.dto.ts`

**Database Model:**
- Lines 109-170 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### SESSION TYPE MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/session-type.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/session-type.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/create-session-type.dto.ts`
- `/home/turnkey/zmos-backend/src/moveos/dto/update-session-type.dto.ts`

**Database Model:**
- Lines 172-214 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### SESSION INSTANCES (BOOKING SCHEDULE)
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/session.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/session-instance.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/create-session-instance.dto.ts`
- `/home/turnkey/zmos-backend/src/moveos/dto/update-session-instance.dto.ts`
- `/home/turnkey/zmos-backend/src/moveos/dto/query-sessions.dto.ts`

**Database Model:**
- Lines 216-265 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

**Weather Integration:**
- `/home/turnkey/zmos-backend/src/moveos/services/weather.service.ts`

---

### BOOKING MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/booking.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/booking.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/create-booking.dto.ts`

**Database Model:**
- Lines 267-293 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### MEMBER PROFILE & STATISTICS
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/member-profile.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/member-profile.service.ts`

**Database Model:**
- Lines 44-94 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### MEMBER MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/member.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/member.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/complete-profile.dto.ts`

---

### TRAINER MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/trainer.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/trainer.service.ts`

---

### WAITLIST MANAGEMENT
**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/waitlist.service.ts`

**Database Model:**
- Lines 329-349 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### FAVORITES MANAGEMENT
**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/favorite.service.ts`

**Database Model:**
- Lines 352-370 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### INVITATIONS MANAGEMENT
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/invitation.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/invitation.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/invitation.dto.ts`

**Database Model:**
- Lines 372-396 in `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

### REFERENCE DATA & LOCATION HIERARCHY
**Controller:**
- `/home/turnkey/zmos-backend/src/moveos/controllers/reference.controller.ts`

**Service:**
- `/home/turnkey/zmos-backend/src/moveos/services/location-hierarchy.service.ts`

**DTOs:**
- `/home/turnkey/zmos-backend/src/moveos/dto/reference-data.dto.ts`

---

### ANALYTICS & RECOMMENDATIONS
**Streak Tracking:**
- `/home/turnkey/zmos-backend/src/moveos/services/streak.service.ts`

**Movement Events:**
- `/home/turnkey/zmos-backend/src/moveos/services/movement-event.service.ts`

**AI Recommendations:**
- `/home/turnkey/zmos-backend/src/moveos/services/recommendation.service.ts`
- `/home/turnkey/zmos-backend/src/ai/ai.service.ts`

**Database Models:**
- MovementEvent: Lines 300-321 in schema.prisma

---

### DATABASE & ORM
**Prisma Configuration:**
- `/home/turnkey/zmos-backend/prisma/schema.prisma` - ALL database models
- `/home/turnkey/zmos-backend/prisma.config.ts` - Prisma config

**Prisma Service:**
- `/home/turnkey/zmos-backend/src/prisma/prisma.service.ts`

---

### MODULE DEFINITIONS
**Main Application:**
- `/home/turnkey/zmos-backend/src/app.module.ts` - Main module
- `/home/turnkey/zmos-backend/src/main.ts` - Application entry point

**Feature Modules:**
- `/home/turnkey/zmos-backend/src/moveos/moveos.module.ts` - MoveOS module
- `/home/turnkey/zmos-backend/src/auth/auth.module.ts` - Auth module
- `/home/turnkey/zmos-backend/src/ai/ai.module.ts` - AI module

---

### MIDDLEWARE & FILTERS
**Middleware:**
- `/home/turnkey/zmos-backend/src/common/tenant.middleware.ts` - Tenant extraction

**Filters:**
- `/home/turnkey/zmos-backend/src/common/all-exceptions.filter.ts` - Exception handling
- `/home/turnkey/zmos-backend/src/auth/auth-exception.filter.ts` - Auth exceptions

---

### CONFIGURATION & ENVIRONMENT
**Configuration Files:**
- `/home/turnkey/zmos-backend/.env` - Environment variables (local)
- `/home/turnkey/zmos-backend/.env.example` - Example env
- `/home/turnkey/zmos-backend/.env.production` - Production env

**Build Configuration:**
- `/home/turnkey/zmos-backend/tsconfig.json` - TypeScript config
- `/home/turnkey/zmos-backend/tsconfig.build.json` - Build config
- `/home/turnkey/zmos-backend/nest-cli.json` - NestJS CLI config

---

### TESTING
**E2E Tests:**
- `/home/turnkey/zmos-backend/test/moveos.e2e-spec.ts`
- `/home/turnkey/zmos-backend/test/auth.e2e-spec.ts`
- `/home/turnkey/zmos-backend/test/app.e2e-spec.ts`

**Test Configuration:**
- `/home/turnkey/zmos-backend/test/jest-e2e.json`

**Unit Tests (Services):**
- `/home/turnkey/zmos-backend/src/moveos/services/booking.service.spec.ts`
- `/home/turnkey/zmos-backend/src/moveos/services/location.service.spec.ts`
- `/home/turnkey/zmos-backend/src/moveos/services/streak.service.spec.ts`

---

### DOCUMENTATION
**API Documentation:**
- `/home/turnkey/zmos-backend/API_DOCUMENTATION.md`

**Missing APIs:**
- `/home/turnkey/zmos-backend/MISSING_APIS_PHASE1_PHASE2.md`

**Implementation Guides:**
- `/home/turnkey/zmos-backend/PHASE_1_2_IMPLEMENTATION.md`
- `/home/turnkey/zmos-backend/PHASE1_COMPLETION_SUMMARY.md`
- `/home/turnkey/zmos-backend/PHASE2_COMPLETION_SUMMARY.md`

**Audit Reports:**
- `/home/turnkey/zmos-backend/BACKEND_AUDIT_REPORT.md`
- `/home/turnkey/zmos-backend/DATABASE_NAMING_CONVENTIONS_ANALYSIS.md`
- `/home/turnkey/zmos-backend/DATABASE_NAMING_CONVENTIONS_COMPLIANCE_CHECK.md`

**Deployment:**
- `/home/turnkey/zmos-backend/DEPLOYMENT.md`
- `/home/turnkey/zmos-backend/CLOUD_RUN_SETUP.md`
- `/home/turnkey/zmos-backend/CLOUD_RUN_QUICK_START.md`

**Other Documentation:**
- `/home/turnkey/zmos-backend/README.md`
- `/home/turnkey/zmos-backend/PROFILE_COMPLETION_IMPLEMENTATION.md`
- `/home/turnkey/zmos-backend/TRAINER_GYM_CODES_IMPLEMENTATION.md`
- `/home/turnkey/zmos-backend/GOOGLE_SIGNIN_INTEGRATION_GUIDE.md`
- `/home/turnkey/zmos-backend/GOOGLE_GEMINI_INTEGRATION.md`
- `/home/turnkey/zmos-backend/ANDROID_AUTH_FIX.md`
- `/home/turnkey/zmos-backend/WORKOUT_PREFERENCES_AND_FACILITIES.md`
- `/home/turnkey/zmos-backend/ZMOS_NAMING_CONVENTIONS_MIGRATION_COMPLETE.md`

**Analysis Files:**
- `/home/turnkey/zmos-backend/BACKEND_STRUCTURE_ANALYSIS.md` (NEW - 1114 lines)

---

### DOCKER & BUILD
**Docker:**
- `/home/turnkey/zmos-backend/Dockerfile`
- `/home/turnkey/zmos-backend/.dockerignore`

**Package Management:**
- `/home/turnkey/zmos-backend/package.json`
- `/home/turnkey/zmos-backend/package-lock.json`

---

### DATABASE FILES
**Development Database:**
- `/home/turnkey/zmos-backend/dev.db` (SQLite for development)

---

## Key File Statistics

- **Total API Controllers:** 9
- **Total Services:** 20+
- **Total DTOs:** 11
- **Database Tables:** 10 core + extended models
- **Lines in Schema:** 396 lines (full database definition)
- **Authentication Guards:** 2 (JWT + Roles)
- **Test Specs:** 3 main E2E + multiple unit tests

---

## Payment Integration (Missing)

**Files that SHOULD exist but DON'T:**
- `/src/payments/payments.module.ts` - MISSING
- `/src/payments/payments.service.ts` - MISSING
- `/src/payments/payment.controller.ts` - MISSING
- `/src/payments/gateways/mpesa.gateway.ts` - MISSING
- `/src/payments/gateways/stripe.gateway.ts` - MISSING
- `/src/payments/dto/payment-request.dto.ts` - MISSING
- `/src/payments/webhooks/webhook.controller.ts` - MISSING

**Database Models MISSING:**
- Payment (prisma model) - Lines NOT YET ADDED to schema.prisma
- Invoice (prisma model) - Lines NOT YET ADDED to schema.prisma
- Refund (prisma model) - Lines NOT YET ADDED to schema.prisma
- MembershipPlan (prisma model) - Lines NOT YET ADDED to schema.prisma
- Subscription (prisma model) - Lines NOT YET ADDED to schema.prisma

