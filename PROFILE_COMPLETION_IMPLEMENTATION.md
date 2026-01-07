# Profile Completion Backend Implementation

## Overview

Successfully implemented comprehensive profile completion endpoints for the ZMOS backend. The mobile app can now submit extended profile data for all user roles through dedicated API endpoints.

## Implementation Summary

### 1. Database Schema Changes

**File:** `prisma/schema.prisma`

Added extended profile fields to the `Member` model:

```prisma
model Member {
  // ... existing fields ...

  // Extended Profile Fields
  phoneNumber       String? @map("MEM_PHONE_NUMBER")
  dateOfBirth       String? @map("MEM_DATE_OF_BIRTH")
  gender            String? @map("MEM_GENDER")
  profilePhoto      String? @map("MEM_PROFILE_PHOTO")

  // Role-specific profile data (JSON for flexibility)
  ownerProfile      Json?   @map("MEM_OWNER_PROFILE")
  trainerProfile    Json?   @map("MEM_TRAINER_PROFILE")
  clientProfile     Json?   @map("MEM_CLIENT_PROFILE")
  staffProfile      Json?   @map("MEM_STAFF_PROFILE")

  // Profile completion tracking
  profileCompleted  Boolean @default(false) @map("MEM_PROFILE_COMPLETED")
  onboardingStep    Int?    @map("MEM_ONBOARDING_STEP")
}
```

**Migration:** `20260101065736_add_extended_profile_fields`

**Design Decision:**
- Common fields (phoneNumber, dateOfBirth, gender) stored as direct columns
- Role-specific data stored in JSON fields for maximum flexibility
- Allows easy addition of new fields without schema migrations
- Each role has its own JSON field to keep data organized

### 2. DTOs Created

**File:** `src/moveos/dto/complete-profile.dto.ts`

Created separate DTOs for each role:

1. **CompleteOwnerProfileDto** - Business information
   - businessName, businessDescription, businessType
   - address, city, state, zipCode, country
   - logo, coverPhoto, amenities, businessHours
   - socialMedia links

2. **CompleteTrainerProfileDto** - Trainer credentials
   - bio, specializations, certifications
   - experience, hourlyRate, languages
   - availability schedule

3. **CompleteClientProfileDto** - Fitness profile
   - fitnessGoals, experienceLevel, preferredActivities
   - healthConditions, height, weight
   - emergencyContact, preferences

4. **CompleteStaffProfileDto** - Work information
   - department, position, shift
   - responsibilities, schedule

5. **ProfileCompletionResponseDto** - Unified response
   - success, message, profileCompleteness (0-100%)
   - Updated member object

**File:** `src/moveos/dto/reference-data.dto.ts`

Created reference data DTOs for onboarding lookups:
- DepartmentData, ShiftData, ResponsibilityData
- BusinessTypeData, AmenityData
- FitnessGoalData, ExperienceLevelData, SpecializationData
- ActivityData, LanguageData, GenderData

### 3. Service Methods

**File:** `src/moveos/services/member.service.ts`

Added 4 profile completion methods:

```typescript
async completeOwnerProfile(memberId: string, dto: CompleteOwnerProfileDto)
async completeTrainerProfile(memberId: string, dto: CompleteTrainerProfileDto)
async completeClientProfile(memberId: string, dto: CompleteClientProfileDto)
async completeStaffProfile(memberId: string, dto: CompleteStaffProfileDto)
```

Each method:
1. Validates member exists
2. Extracts common fields (name, phone, etc.)
3. Stores role-specific data in JSON field
4. Sets `profileCompleted = true`
5. Calculates profile completeness percentage
6. Returns success response with updated member

**Profile Completeness Calculation:**
- 50% for common fields (name, email, phoneNumber, profilePhoto)
- 50% for role-specific profile data
- Total: 0-100% based on completion

### 4. Controller Endpoints

**File:** `src/moveos/controllers/member.controller.ts`

Added 4 new endpoints:

```typescript
POST /members/my/profile/complete/owner
POST /members/my/profile/complete/trainer
POST /members/my/profile/complete/client
POST /members/my/profile/complete/staff
```

All endpoints:
- Protected by `JwtAuthGuard` (require authentication)
- Use `@CurrentMember()` decorator to get authenticated user
- Validate request body using DTOs
- Return ProfileCompletionResponseDto

**File:** `src/moveos/controllers/reference.controller.ts`

Added reference data endpoint:

```typescript
GET /reference/onboarding
```

Returns all lookup data needed for onboarding:
- Staff: departments, shifts, responsibilities (by department)
- Owner: businessTypes, amenities
- Trainer: specializations, languages
- Client: fitnessGoals, experienceLevels, activities, genders

### 5. Module Registration

**File:** `src/moveos/moveos.module.ts`

Registered `ReferenceDataController` in the MoveOS module.

## API Usage

### Authentication

All endpoints require:
```
Headers:
  Authorization: Bearer <jwt-token>
  x-tenant-id: <tenant-id>
  Content-Type: application/json
```

### Complete Owner Profile

```http
POST /members/my/profile/complete/owner
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "businessName": "FitZone Gym",
  "businessType": "GYM",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "amenities": ["WIFI", "PARKING", "SHOWERS"],
  "businessHours": {
    "Monday": { "openTime": "06:00", "closeTime": "22:00" },
    "Tuesday": { "openTime": "06:00", "closeTime": "22:00" }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Owner profile completed successfully",
  "profileCompleteness": 100,
  "member": {
    "id": "cm...",
    "email": "john@example.com",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "profileCompleted": true,
    "ownerProfile": { ... },
    "tenantId": "cm...",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

### Complete Trainer Profile

```http
POST /members/my/profile/complete/trainer

{
  "name": "Jane Smith",
  "phoneNumber": "+1234567891",
  "bio": "Certified yoga instructor with 10 years experience",
  "specializations": ["YOGA", "PILATES"],
  "certifications": [
    {
      "name": "RYT-500",
      "issuingOrganization": "Yoga Alliance",
      "issueDate": "2015-06-01",
      "expiryDate": "2026-06-01"
    }
  ],
  "experience": "10 years",
  "hourlyRate": 75,
  "languages": ["EN", "ES"],
  "availability": {
    "Monday": [
      { "startTime": "09:00", "endTime": "12:00" },
      { "startTime": "14:00", "endTime": "18:00" }
    ]
  }
}
```

### Complete Client Profile

```http
POST /members/my/profile/complete/client

{
  "name": "Mike Johnson",
  "phoneNumber": "+1234567892",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "fitnessGoals": ["WEIGHT_LOSS", "MUSCLE_GAIN"],
  "experienceLevel": "INTERMEDIATE",
  "preferredActivities": ["STRENGTH_TRAINING", "CARDIO"],
  "healthConditions": ["Lower back pain"],
  "height": 180,
  "weight": 85,
  "emergencyContact": {
    "name": "Sarah Johnson",
    "relationship": "Spouse",
    "phoneNumber": "+1234567893"
  },
  "preferences": {
    "preferredSessionTimes": ["MORNING", "EVENING"],
    "notificationEnabled": true,
    "privacySettings": {
      "showProfile": true,
      "showProgress": false,
      "allowMessages": true
    }
  }
}
```

### Complete Staff Profile

```http
POST /members/my/profile/complete/staff

{
  "name": "Tom Brown",
  "phoneNumber": "+1234567894",
  "department": "FRONT_DESK",
  "position": "Front Desk Associate",
  "shift": "MORNING",
  "responsibilities": ["CHECKIN", "PHONE", "TOURS"],
  "schedule": {
    "Monday": [{ "startTime": "06:00", "endTime": "14:00" }],
    "Tuesday": [{ "startTime": "06:00", "endTime": "14:00" }],
    "Wednesday": [{ "startTime": "06:00", "endTime": "14:00" }]
  }
}
```

### Get Reference Data

```http
GET /reference/onboarding
```

**Response:**
```json
{
  "departments": [
    { "id": "FRONT_DESK", "name": "FRONT_DESK", "displayName": "Front Desk" },
    { "id": "MAINTENANCE", "name": "MAINTENANCE", "displayName": "Maintenance" }
  ],
  "shifts": [
    { "id": "MORNING", "name": "Morning", "timeRange": "6AM - 2PM" },
    { "id": "AFTERNOON", "name": "Afternoon", "timeRange": "2PM - 10PM" }
  ],
  "responsibilities": {
    "FRONT_DESK": [
      { "id": "CHECKIN", "name": "Member Check-in", "department": "FRONT_DESK" }
    ],
    "COMMON": [
      { "id": "CUSTOMER_SERVICE", "name": "Customer Service" }
    ]
  },
  "businessTypes": [...],
  "amenities": [...],
  "specializations": [...],
  "languages": [...],
  "fitnessGoals": [...],
  "experienceLevels": [...],
  "activities": [...],
  "genders": [...]
}
```

## Data Flow

### Onboarding Complete Flow

```
Mobile App                    Backend                     Database
    |                            |                            |
    |--- POST /members/.../----> |                            |
    |    complete/{role}         |                            |
    |                            |--- Validate Member ------->|
    |                            |<--- Member Found ----------|
    |                            |                            |
    |                            |--- Extract Common Fields   |
    |                            |--- Build Role Profile JSON |
    |                            |                            |
    |                            |--- UPDATE Member --------->|
    |                            |    - phoneNumber           |
    |                            |    - {role}Profile (JSON)  |
    |                            |    - profileCompleted=true |
    |                            |                            |
    |                            |<--- Updated Member --------|
    |                            |                            |
    |                            |--- Calculate Completeness  |
    |                            |                            |
    |<--- ProfileCompletion -----|                            |
    |     Response (success)     |                            |
```

### Reference Data Flow

```
Mobile App                    Backend
    |                            |
    |--- GET /reference/------> |
    |    onboarding              |
    |                            |--- Return hardcoded data
    |<--- Reference Data --------|
    |     (departments, etc.)    |
```

## Testing

### Manual Testing with cURL

#### 1. Sign Up / Login (Get JWT Token)

```bash
# Sign up as owner
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@fitzone.com",
    "password": "password123",
    "name": "John Doe",
    "tenantName": "FitZone Gym"
  }'

# Save the token and tenantId from response
export TOKEN="<jwt-token-from-response>"
export TENANT_ID="<tenant-id-from-response>"
```

#### 2. Get Reference Data

```bash
curl -X GET http://localhost:3000/reference/onboarding \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

#### 3. Complete Owner Profile

```bash
curl -X POST http://localhost:3000/members/my/profile/complete/owner \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "FitZone Gym",
    "businessType": "GYM",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "amenities": ["WIFI", "PARKING", "SHOWERS"]
  }'
```

#### 4. Verify Profile

```bash
curl -X GET http://localhost:3000/members/my/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

### Testing Different Roles

```bash
# Trainer
curl -X POST http://localhost:3000/members/my/profile/complete/trainer \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Certified trainer",
    "specializations": ["YOGA"],
    "experience": "5 years"
  }'

# Client
curl -X POST http://localhost:3000/members/my/profile/complete/client \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "fitnessGoals": ["WEIGHT_LOSS"],
    "experienceLevel": "BEGINNER"
  }'

# Staff
curl -X POST http://localhost:3000/members/my/profile/complete/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "department": "FRONT_DESK",
    "position": "Associate",
    "shift": "MORNING"
  }'
```

## Database Schema

### Member Table After Migration

```sql
CREATE TABLE "MOV_MEMBER" (
    "MEM_ID" TEXT NOT NULL PRIMARY KEY,
    "MEM_TENANT_ID" TEXT NOT NULL,
    "MEM_EMAIL" TEXT NOT NULL,
    "MEM_PASSWORD_HASH" TEXT,
    "MEM_NAME" TEXT,
    "MEM_GOOGLE_ID" TEXT,
    "MEM_AVATAR_URL" TEXT,
    "MEM_ROLE" TEXT NOT NULL DEFAULT 'MEMBER',
    "MEM_CREATED_AT" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "MEM_UPDATED_AT" DATETIME NOT NULL,

    -- Extended profile fields
    "MEM_PHONE_NUMBER" TEXT,
    "MEM_DATE_OF_BIRTH" TEXT,
    "MEM_GENDER" TEXT,
    "MEM_PROFILE_PHOTO" TEXT,

    -- Role-specific JSON fields
    "MEM_OWNER_PROFILE" TEXT,      -- JSON
    "MEM_TRAINER_PROFILE" TEXT,    -- JSON
    "MEM_CLIENT_PROFILE" TEXT,     -- JSON
    "MEM_STAFF_PROFILE" TEXT,      -- JSON

    -- Profile tracking
    "MEM_PROFILE_COMPLETED" INTEGER NOT NULL DEFAULT 0,
    "MEM_ONBOARDING_STEP" INTEGER,

    CONSTRAINT "MOV_MEMBER_MEM_TENANT_ID_fkey"
      FOREIGN KEY ("MEM_TENANT_ID") REFERENCES "MOV_TENANT" ("TEN_ID")
      ON DELETE CASCADE ON UPDATE CASCADE
);
```

### Example JSON Data

**Owner Profile:**
```json
{
  "businessName": "FitZone Gym",
  "businessType": "GYM",
  "address": "123 Main St",
  "city": "New York",
  "amenities": ["WIFI", "PARKING"],
  "businessHours": {
    "Monday": { "openTime": "06:00", "closeTime": "22:00" }
  }
}
```

**Trainer Profile:**
```json
{
  "bio": "Certified yoga instructor",
  "specializations": ["YOGA", "PILATES"],
  "certifications": [
    {
      "name": "RYT-500",
      "issuingOrganization": "Yoga Alliance",
      "issueDate": "2015-06-01"
    }
  ],
  "hourlyRate": 75
}
```

## Files Changed

### Created Files:
1. `src/moveos/dto/complete-profile.dto.ts` - Profile completion DTOs
2. `src/moveos/dto/reference-data.dto.ts` - Reference data DTOs
3. `src/moveos/controllers/reference.controller.ts` - Reference data controller
4. `prisma/migrations/20260101065736_add_extended_profile_fields/migration.sql` - Database migration

### Modified Files:
1. `prisma/schema.prisma` - Added extended profile fields to Member model
2. `src/moveos/services/member.service.ts` - Added profile completion methods
3. `src/moveos/controllers/member.controller.ts` - Added profile completion endpoints
4. `src/moveos/moveos.module.ts` - Registered ReferenceDataController

## Mobile App Integration

The mobile app (`zmos-mobile`) is already configured to use these endpoints:

1. **API Service** (`ZMOSApiService.kt`) - Endpoints defined
2. **OnboardingViewModel** - Calls endpoints and handles responses
3. **Profile Models** - Match backend DTOs exactly

### Integration Points:

```kotlin
// Mobile app will call:
apiService.completeOwnerProfile(request)
apiService.completeTrainerProfile(request)
apiService.completeClientProfile(request)
apiService.completeStaffProfile(request)
apiService.getOnboardingReferenceData()
```

**Backend URLs:**
- Development: `http://localhost:3000`
- Production: Configure in `NetworkModule.kt`

## Benefits

### 1. Flexible Data Model
- JSON fields allow adding new fields without migrations
- Each role has its own schema
- Easy to extend in the future

### 2. Type Safety
- DTOs provide validation at the controller level
- Prisma ensures database consistency
- TypeScript provides compile-time checks

### 3. Scalability
- Profile data grows with application
- No need for multiple tables
- Easy to query and update

### 4. API-First Design
- RESTful endpoints
- Clear separation of concerns
- Easy to test and document

## Next Steps

### For Backend Team:
1. ✅ Database migration applied
2. ✅ Endpoints implemented and tested
3. 🔄 Deploy to staging environment
4. 🔄 Create API documentation (Swagger/OpenAPI)
5. 🔄 Add unit tests for service methods
6. 🔄 Add integration tests for endpoints

### For Mobile Team:
1. ✅ API endpoints configured in app
2. ✅ OnboardingViewModel ready
3. 🔄 Update base URL to point to backend server
4. 🔄 Test onboarding flows end-to-end
5. 🔄 Handle error cases gracefully
6. 🔄 Add offline support (store locally, sync later)

### Optional Enhancements:
1. Add profile photo upload endpoint
2. Add profile validation rules
3. Add profile progress tracking
4. Add admin endpoints to view member profiles
5. Add search/filter by profile fields
6. Add profile completion reminders

## Troubleshooting

### Common Issues:

**1. Missing x-tenant-id header**
```
Error: Tenant ID is required
Solution: Include x-tenant-id header in all requests
```

**2. Invalid JWT token**
```
Error: Unauthorized
Solution: Login first, get fresh token
```

**3. Profile already completed**
```
Behavior: Updates existing profile data
Note: Can call endpoint multiple times to update profile
```

**4. Invalid role-specific data**
```
Error: Validation failed
Solution: Check DTO requirements in complete-profile.dto.ts
```

## Conclusion

The profile completion backend is now fully implemented and ready for integration with the mobile app. All endpoints are functional, validated, and following NestJS best practices.

**Status:** ✅ Complete and Ready for Testing
**Migration:** ✅ Applied Successfully
**Build:** ✅ Compiles Without Errors
**Endpoints:** ✅ All Registered and Accessible

The mobile app can now submit complete onboarding profiles for all user roles!
