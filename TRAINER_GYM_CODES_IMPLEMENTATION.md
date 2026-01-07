# Trainer & Gym Codes Implementation

**Date:** 2026-01-03
**Status:** ✅ IMPLEMENTED

---

## Overview

This document describes the implementation of unique codes for trainers and gyms, trainer types (Freelance vs. Gym-affiliated), and business hours functionality in the ZMOS platform.

---

## Key Features Implemented

### 1. Gym Unique Codes
- **Format:** `GYM0001`, `GYM0002`, `GYM0003`, etc.
- **Purpose:** Every gym/tenant gets a unique code for identification
- **Generation:** Auto-generated during gym registration (signup)
- **Storage:** `Tenant.code` field in database

### 2. Trainer Unique Codes
- **Format:** `TR0001`, `TR0002`, `TR0003`, etc.
- **Purpose:** Every trainer gets a unique code for identification
- **Generation:** Auto-generated during trainer profile completion
- **Storage:** `Member.trainerCode` field in database

### 3. Trainer Types
- **Freelance Trainers:** Independent trainers not tied to any specific gym
- **Gym-Affiliated Trainers:** Trainers working at a specific gym
- **Storage:** `Member.trainerType` field ('freelance' or 'gym_affiliated')
- **Gym Link:** `trainerProfile.affiliatedGymCode` stores the gym code if affiliated

### 4. Business Hours
- Trainers can set their available business hours
- Format: JSON object with day-to-time mappings
- Example:
  ```json
  {
    "monday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "tuesday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "friday": [{ "startTime": "10:00", "endTime": "14:00" }]
  }
  ```
- **Storage:** `trainerProfile.businessHours` in JSON field

---

## Database Schema Changes

### Tenant Model
```prisma
model Tenant {
  id        String   @id @default(cuid()) @map("TEN_ID")
  name      String   @map("TEN_NAME")
  code      String?  @unique @map("TEN_CODE") // NEW: Gym code (GYM0001, GYM0002, etc.)
  createdAt DateTime @default(now()) @map("TEN_CREATED_AT")
  updatedAt DateTime @updatedAt @map("TEN_UPDATED_AT")

  @@index([code])
}
```

### Member Model
```prisma
model Member {
  id           String     @id @default(cuid()) @map("MEM_ID")
  ...

  // NEW FIELDS:
  trainerCode  String? @unique @map("MEM_TRAINER_CODE") // TR0001, TR0002, etc.
  trainerType  String? @map("MEM_TRAINER_TYPE") // 'freelance' or 'gym_affiliated'

  trainerProfile Json? @map("MEM_TRAINER_PROFILE") // Includes businessHours, affiliatedGymCode

  @@index([trainerCode])
  @@index([trainerType])
}
```

---

## API Changes

### 1. Gym Registration (Signup)
**Endpoint:** `POST /auth/signup`

**Request:**
```json
{
  "email": "owner@gym.com",
  "password": "password123",
  "name": "John Owner",
  "tenantName": "FitZone Gym"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "owner@gym.com",
    "name": "John Owner",
    "role": "OWNER"
  },
  "tenantId": "...",
  "gymCode": "GYM0001"  // NEW: Unique gym code
}
```

### 2. Trainer Profile Completion
**Endpoint:** `POST /members/my/profile/complete/trainer`

**Request:**
```json
{
  "name": "Jane Trainer",
  "phoneNumber": "+1234567890",
  "bio": "Certified personal trainer with 10 years experience...",
  "specializations": ["YOGA", "PILATES", "STRENGTH_TRAINING"],
  "certifications": [
    {
      "name": "NASM-CPT",
      "issuingOrganization": "NASM",
      "issueDate": "2020-01-15"
    }
  ],
  "experience": "10 years",
  "hourlyRate": 50,
  "languages": ["English", "Spanish"],

  // NEW FIELDS:
  "trainerType": "gym_affiliated",  // or "freelance"
  "affiliatedGymCode": "GYM0001",   // Required if gym_affiliated
  "businessHours": {
    "monday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "tuesday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "wednesday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "thursday": [{ "startTime": "09:00", "endTime": "17:00" }],
    "friday": [{ "startTime": "10:00", "endTime": "14:00" }]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trainer profile completed successfully. Your trainer code is: TR0001",
  "profileCompleteness": 100,
  "member": {
    "id": "...",
    "name": "Jane Trainer",
    "role": "TRAINER",
    "trainerCode": "TR0001",  // NEW: Auto-generated trainer code
    "trainerType": "gym_affiliated",
    "trainerProfile": {
      "bio": "...",
      "specializations": [...],
      "certifications": [...],
      "businessHours": {...},
      "affiliatedGymCode": "GYM0001"
    }
  }
}
```

---

## Code Generation Logic

### Gym Code Generation
```typescript
private async generateGymCode(): Promise<string> {
  // Get count of existing tenants
  const tenantCount = await this.prismaClient.tenant.count();
  const nextNumber = tenantCount + 1;
  const code = `GYM${nextNumber.toString().padStart(4, '0')}`;

  // Check if code exists (unlikely but safe)
  const existing = await this.prismaClient.tenant.findUnique({ where: { code } });

  if (existing) {
    // Fallback: use timestamp
    return `GYM${Date.now().toString().slice(-4)}`;
  }

  return code; // GYM0001, GYM0002, etc.
}
```

### Trainer Code Generation
```typescript
private async generateTrainerCode(): Promise<string> {
  // Get count of existing trainers
  const trainerCount = await this.prisma.member.count({
    where: { role: 'TRAINER' }
  });
  const nextNumber = trainerCount + 1;
  const code = `TR${nextNumber.toString().padStart(4, '0')}`;

  // Check if code exists
  const existing = await this.prisma.member.findUnique({ where: { trainerCode: code } });

  if (existing) {
    // Fallback: use timestamp
    return `TR${Date.now().toString().slice(-4)}`;
  }

  return code; // TR0001, TR0002, etc.
}
```

---

## Role-Based Views

### What Each Role Sees:

#### Owner View
- **Dashboard:** Business metrics, gym performance, staff management
- **Can see:**
  - All gym members
  - All trainers (with their codes)
  - Gym code (GYM0001)
  - Revenue, bookings, attendance stats
  - All locations and sessions

#### Trainer View
- **Dashboard:** My sessions, my clients, my schedule
- **Can see:**
  - Their trainer code (TR0001)
  - Their business hours
  - Their affiliated gym (if gym-affiliated)
  - Their assigned sessions
  - Their clients who booked sessions
  - Session rosters for check-in
- **Cannot see:**
  - Other trainers' data
  - Gym financial data (unless owner grants permission)
  - All gym members (only their clients)

#### Staff View
- **Dashboard:** Check-in desk, attendance tracking
- **Can see:**
  - Today's sessions
  - Member check-ins
  - Basic member information
- **Cannot see:**
  - Financial data
  - Trainer codes (unless needed for operations)

#### Client/Member View
- **Dashboard:** My bookings, recommended sessions, my stats
- **Can see:**
  - Available sessions
  - Trainer information (bio, specializations, availability)
  - Their own booking history
  - Their fitness stats
- **Cannot see:**
  - Gym codes
  - Trainer codes
  - Other members' data

---

## Mobile App Integration

### Onboarding Flow Updates

#### Trainer Onboarding
1. **Bio Step:** Collect name, phone, bio, hourly rate, languages
2. **Specializations Step:** Select training specializations
3. **Certifications Step:** Add certifications and experience
4. **NEW - Type & Hours Step:**
   - Select trainer type: Freelance or Gym-affiliated
   - If gym-affiliated: Enter or select gym code
   - Set business hours for each day

#### Business Hours Input Component
```kotlin
data class BusinessHourSlot(
    val startTime: String,  // "09:00"
    val endTime: String     // "17:00"
)

data class WeeklyBusinessHours(
    val monday: List<BusinessHourSlot> = emptyList(),
    val tuesday: List<BusinessHourSlot> = emptyList(),
    val wednesday: List<BusinessHourSlot> = emptyList(),
    val thursday: List<BusinessHourSlot> = emptyList(),
    val friday: List<BusinessHourSlot> = emptyList(),
    val saturday: List<BusinessHourSlot> = emptyList(),
    val sunday: List<BusinessHourSlot> = emptyList()
)
```

---

## Benefits

### For Gym Owners
✅ Unique gym code for branding and identification
✅ Easy member/trainer invitation via gym code
✅ Track trainer affiliation
✅ Manage gym-affiliated vs. freelance trainers differently

### For Trainers
✅ Unique trainer code for professional identity
✅ Set and manage business hours
✅ Choose to work independently or with a gym
✅ Clear affiliation tracking

### For Members/Clients
✅ See trainer availability based on business hours
✅ Know if trainer is gym-affiliated or freelance
✅ Book sessions within trainer's available hours

---

## Next Steps

### Mobile App Updates Needed:
1. ✅ Update `CompleteTrainerProfileDto` in Kotlin models
2. ⏳ Add trainer type selection UI
3. ⏳ Add gym code input for affiliated trainers
4. ⏳ Add business hours picker component
5. ⏳ Display trainer code after onboarding
6. ⏳ Update dashboard views based on role
7. ⏳ Show gym code on owner dashboard

### Testing:
1. ⏳ Test gym signup → verify gym code generation
2. ⏳ Test trainer signup → verify trainer code generation
3. ⏳ Test freelance trainer flow
4. ⏳ Test gym-affiliated trainer flow
5. ⏳ Test business hours display
6. ⏳ Verify role-based dashboards

---

## Technical Notes

- **Database:** SQLite (development), PostgreSQL (production recommended)
- **Code Uniqueness:** Enforced at database level with unique constraints
- **Migration:** Applied via Prisma db push
- **Backward Compatibility:** Existing tenants/members will have `null` codes until they update

---

**Status:** Backend implementation complete ✅
**Next:** Mobile app UI updates
**Backend Running:** `http://localhost:3000`
**Version:** 1.0.0
