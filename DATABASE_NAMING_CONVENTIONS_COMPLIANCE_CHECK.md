# Database Naming Conventions Compliance Check

## Executive Summary

❌ **CRITICAL ISSUE FOUND** - The current database schema **DOES NOT** follow the official ZMOS database naming conventions.

**Current State:** Using simple PascalCase names without prefixes
**Required State:** Must use domain prefixes (MOV_, PLP_, CPM_, etc.) and table prefixes for all columns

---

## Official ZMOS Naming Convention (From docs/Database Naming Conventions.md)

### Table Names
**Pattern:** `<DOM>_<ENTITY>`

**Domain Prefixes:**
- `MOV_` = MoveOS (provider & ops: tenants, locations, sessions, bookings, check-ins)
- `PLP_` = PulseLoop (movement events, streaks, challenges, adherence)
- `CPM_` = CarePath Move (journeys, enrollments, MPPs)
- `COR_` = Corporate (corporate accounts, corporate members, corporate packages)
- `SYS_` = Shared/system (tenants, users, audit, etc.)

**Examples:**
- `MOV_TENANT`, `MOV_LOCATION`, `MOV_SESSION_TYPE`, `MOV_SESSION_INSTANCE`
- `PLP_MOVEMENT_EVENT`, `PLP_CHALLENGE`
- `CPM_MOVEMENT_JOURNEY`, `CPM_JOURNEY_ENROLLMENT`

### Column Names
**Pattern:** `<TBL>_<FIELD>`

Each table gets a 3-letter table prefix. All columns use this prefix:
- `MOV_TENANT` → `TEN_` prefix → `TEN_ID`, `TEN_NAME`, `TEN_CREATED_AT`
- `MOV_LOCATION` → `LOC_` prefix → `LOC_ID`, `LOC_TENANT_ID`, `LOC_NAME`
- `MOV_SESSION_TYPE` → `STY_` prefix → `STY_ID`, `STY_TENANT_ID`, `STY_NAME`
- `MOV_SESSION_INSTANCE` → `SIN_` prefix → `SIN_ID`, `SIN_SESSION_TYPE_ID`, `SIN_START_AT`
- `PLP_MOVEMENT_EVENT` → `MVE_` prefix → `MVE_ID`, `MVE_MEMBER_ID`, `MVE_TYPE`

### Foreign Keys
Use referenced table's prefix + `_ID`:
- `LOC_TENANT_ID` (in MOV_LOCATION) → references `TEN_ID` in MOV_TENANT
- `SIN_SESSION_TYPE_ID` → references `STY_ID` in MOV_SESSION_TYPE

### Audit Fields
Always include with table prefix:
- `<TBL>_CREATED_AT`, `<TBL>_CREATED_BY`
- `<TBL>_UPDATED_AT`, `<TBL>_UPDATED_BY`

---

## Current Implementation Analysis

### ❌ Current Prisma Schema (INCORRECT)

```prisma
// CURRENT (WRONG)
model Tenant {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}

model Location {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  address   String?
  capacity  Int?
  // ...
}

model SessionType {
  id          String @id @default(cuid())
  tenantId    String
  name        String
  durationMin Int
  maxCapacity Int?
  // ...
}
```

**Problems:**
1. ❌ No domain prefixes (`MOV_`, `PLP_`, etc.)
2. ❌ No table prefixes for columns (`TEN_`, `LOC_`, `STY_`, etc.)
3. ❌ Using camelCase instead of SCREAMING_SNAKE_CASE
4. ❌ No `@map()` and `@@map()` attributes
5. ❌ Audit fields not following prefix convention

### ✅ Required Prisma Schema (CORRECT)

```prisma
// REQUIRED (CORRECT)
model Tenant {
  id        String   @id @default(cuid()) @map("TEN_ID")
  name      String   @map("TEN_NAME")
  createdAt DateTime @default(now()) @map("TEN_CREATED_AT")
  updatedAt DateTime @updatedAt @map("TEN_UPDATED_AT")

  @@map("MOV_TENANT")
}

model Location {
  id        String   @id @default(cuid()) @map("LOC_ID")
  tenantId  String   @map("LOC_TENANT_ID")
  name      String   @map("LOC_NAME")
  address   String?  @map("LOC_ADDRESS")
  capacity  Int?     @map("LOC_CAPACITY")
  timezone  String   @default("UTC") @map("LOC_TIMEZONE")
  isActive  Boolean  @default(true) @map("LOC_IS_ACTIVE")
  createdAt DateTime @default(now()) @map("LOC_CREATED_AT")
  updatedAt DateTime @updatedAt @map("LOC_UPDATED_AT")

  @@map("MOV_LOCATION")
}

model SessionType {
  id          String  @id @default(cuid()) @map("STY_ID")
  tenantId    String  @map("STY_TENANT_ID")
  name        String  @map("STY_NAME")
  description String? @map("STY_DESCRIPTION")
  durationMin Int     @map("STY_DURATION_MIN")
  category    String  @map("STY_CATEGORY")
  maxCapacity Int?    @map("STY_MAX_CAPACITY")
  difficulty  String  @default("intermediate") @map("STY_DIFFICULTY")
  isActive    Boolean @default(true) @map("STY_IS_ACTIVE")
  createdAt   DateTime @default(now()) @map("STY_CREATED_AT")
  updatedAt   DateTime @updatedAt @map("STY_UPDATED_AT")

  @@map("MOV_SESSION_TYPE")
}

model SessionInstance {
  id            String   @id @default(cuid()) @map("SIN_ID")
  tenantId      String   @map("SIN_TENANT_ID")
  sessionTypeId String   @map("SIN_SESSION_TYPE_ID")
  locationId    String   @map("SIN_LOCATION_ID")
  startTime     DateTime @map("SIN_START_TIME")
  endTime       DateTime @map("SIN_END_TIME")
  capacity      Int?     @map("SIN_CAPACITY")
  status        String   @default("scheduled") @map("SIN_STATUS")
  instructor    String?  @map("SIN_INSTRUCTOR")
  notes         String?  @map("SIN_NOTES")
  createdAt     DateTime @default(now()) @map("SIN_CREATED_AT")
  updatedAt     DateTime @updatedAt @map("SIN_UPDATED_AT")

  @@map("MOV_SESSION_INSTANCE")
}

model Booking {
  id                String    @id @default(cuid()) @map("BOK_ID")
  tenantId          String    @map("BOK_TENANT_ID")
  memberId          String    @map("BOK_MEMBER_ID")
  sessionInstanceId String    @map("BOK_SESSION_INSTANCE_ID")
  status            String    @default("confirmed") @map("BOK_STATUS")
  bookedAt          DateTime  @default(now()) @map("BOK_BOOKED_AT")
  attendedAt        DateTime? @map("BOK_ATTENDED_AT")
  cancelledAt       DateTime? @map("BOK_CANCELLED_AT")
  notes             String?   @map("BOK_NOTES")
  createdAt         DateTime  @default(now()) @map("BOK_CREATED_AT")
  updatedAt         DateTime  @updatedAt @map("BOK_UPDATED_AT")

  @@map("MOV_BOOKING")
}

model MovementEvent {
  id                String    @id @default(cuid()) @map("MVE_ID")
  tenantId          String    @map("MVE_TENANT_ID")
  memberId          String    @map("MVE_MEMBER_ID")
  sessionInstanceId String?   @map("MVE_SESSION_INSTANCE_ID")
  type              String    @map("MVE_TYPE")
  metadata          Json?     @map("MVE_METADATA")
  createdAt         DateTime  @default(now()) @map("MVE_CREATED_AT")

  @@map("PLP_MOVEMENT_EVENT")  // Note: PLP_ domain for PulseLoop
}

model Waitlist {
  id                String   @id @default(cuid()) @map("WAI_ID")
  tenantId          String   @map("WAI_TENANT_ID")
  memberId          String   @map("WAI_MEMBER_ID")
  sessionInstanceId String   @map("WAI_SESSION_INSTANCE_ID")
  position          Int      @map("WAI_POSITION")
  createdAt         DateTime @default(now()) @map("WAI_CREATED_AT")
  updatedAt         DateTime @updatedAt @map("WAI_UPDATED_AT")

  @@map("MOV_WAITLIST")
}

model Favorite {
  id            String   @id @default(cuid()) @map("FAV_ID")
  tenantId      String   @map("FAV_TENANT_ID")
  memberId      String   @map("FAV_MEMBER_ID")
  sessionTypeId String   @map("FAV_SESSION_TYPE_ID")
  createdAt     DateTime @default(now()) @map("FAV_CREATED_AT")

  @@map("MOV_FAVORITE")
}
```

---

## Complete Table Mapping Reference

| Prisma Model | SQL Table Name | Table Prefix | Example Columns |
|--------------|----------------|--------------|-----------------|
| `Tenant` | `MOV_TENANT` | `TEN_` | `TEN_ID`, `TEN_NAME`, `TEN_CREATED_AT` |
| `Member` | `MOV_MEMBER` | `MEM_` | `MEM_ID`, `MEM_TENANT_ID`, `MEM_EMAIL`, `MEM_NAME` |
| `Location` | `MOV_LOCATION` | `LOC_` | `LOC_ID`, `LOC_TENANT_ID`, `LOC_NAME` |
| `SessionType` | `MOV_SESSION_TYPE` | `STY_` | `STY_ID`, `STY_NAME`, `STY_DURATION_MIN` |
| `SessionInstance` | `MOV_SESSION_INSTANCE` | `SIN_` | `SIN_ID`, `SIN_SESSION_TYPE_ID`, `SIN_START_TIME` |
| `Booking` | `MOV_BOOKING` | `BOK_` | `BOK_ID`, `BOK_MEMBER_ID`, `BOK_STATUS` |
| `MovementEvent` | `PLP_MOVEMENT_EVENT` | `MVE_` | `MVE_ID`, `MVE_TYPE`, `MVE_OCCURRED_AT` |
| `Waitlist` | `MOV_WAITLIST` | `WAI_` | `WAI_ID`, `WAI_POSITION` |
| `Favorite` | `MOV_FAVORITE` | `FAV_` | `FAV_ID`, `FAV_SESSION_TYPE_ID` |

---

## Impact Analysis

### Current State Issues

1. **Database Tables**
   - ❌ Tables named `Tenant`, `Member`, `Location` instead of `MOV_TENANT`, `MOV_MEMBER`, `MOV_LOCATION`
   - ❌ Columns named `id`, `name`, `tenantId` instead of `TEN_ID`, `TEN_NAME`, `TEN_TENANT_ID`

2. **Mobile App Compatibility**
   - ⚠️ Mobile app currently expects camelCase JSON (e.g., `tenantId`, `sessionType`)
   - ⚠️ Will need `@SerializedName` mapping updates if backend changes

3. **Migration Complexity**
   - 🔴 **HIGH** - Requires complete database schema migration
   - 🔴 **HIGH** - All existing data must be migrated to new table names
   - 🔴 **MEDIUM** - Mobile app JSON mapping must be updated
   - 🔴 **MEDIUM** - All TypeScript/Prisma code must be updated

### Why This Matters

1. **Standard Compliance**
   - Your project documentation specifies these conventions
   - All team members expect this naming pattern
   - Cursor AI should generate schemas following this pattern

2. **Long-term Maintainability**
   - Clear domain separation (MOV_, PLP_, CPM_, COR_, SYS_)
   - Prevents naming conflicts across domains
   - Makes schema evolution easier

3. **Database Clarity**
   - Looking at raw SQL, you immediately know the domain
   - Column prefixes prevent ambiguity in complex queries
   - Easier to write and debug raw SQL when needed

4. **Multi-Domain Architecture**
   - Current schema works for MoveOS only
   - When adding PulseLoop, CarePath Move, or Corporate features, the lack of prefixes will cause confusion

---

## Recommended Action Plan

### Option 1: Fix Now (Recommended if Early in Development)

**If you haven't deployed to production yet:**

1. **Create Migration Script**
   - Generate new Prisma migration with correct naming
   - Use Prisma's `@@map()` and `@map()` attributes
   - Test migration on dev database

2. **Update All Code**
   - Prisma schema updated with mappings
   - No TypeScript code changes needed (Prisma handles mapping)
   - Mobile app JSON stays the same (backend handles translation)

3. **Benefits**
   - ✅ Compliant with official standards from day 1
   - ✅ Prevents future technical debt
   - ✅ Makes future domain additions easier

**Effort:** 2-4 hours for complete migration

### Option 2: Document Exception (If Already in Production)

**If you've already deployed:**

1. **Document the Deviation**
   - Update `Database Naming Conventions.md` with exception clause
   - Note that existing MoveOS tables don't follow convention
   - Commit to following convention for ALL future tables

2. **Follow Convention for New Domains**
   - When adding PulseLoop features → use `PLP_` prefix
   - When adding CarePath Move → use `CPM_` prefix
   - Keep existing `MOV_` tables as-is for backward compatibility

3. **Gradual Migration Plan**
   - Plan migration for major version 2.0
   - Allows time for thorough testing
   - Minimizes production impact

**Effort:** Minimal now, deferred complexity later

### Option 3: Hybrid Approach (Recommended for Current State)

1. **Short Term: Add Mappings to Existing Schema**
   ```prisma
   model Tenant {
     id        String @id @default(cuid())  // Keep as-is in DB
     name      String
     // ... but document the convention violation

     @@map("Tenant")  // Explicit mapping showing non-compliance
   }
   ```

2. **Mid Term: Follow Convention for New Tables**
   - Phase 2+ entities follow proper naming
   - Creates mixed but manageable codebase

3. **Long Term: Complete Migration**
   - Plan for v2.0 when breaking changes acceptable
   - Migrate all at once with proper tooling

---

## Code Impact Examples

### Backend (NestJS/Prisma)

**Current Code:**
```typescript
// Works now, will continue working with @map()
const location = await prisma.location.findUnique({
  where: { id: locationId }
});
```

**After Adding Mappings:**
```typescript
// Same code - Prisma handles mapping transparently!
const location = await prisma.location.findUnique({
  where: { id: locationId }
});

// But database will have MOV_LOCATION table with LOC_ID column
```

**No TypeScript code changes needed** - Prisma's `@map()` handles everything!

### Mobile App (Android/Kotlin)

**Current Mobile Code:**
```kotlin
@SerializedName("tenantId") val tenantId: String
@SerializedName("sessionType") val sessionType: SessionType
```

**After Backend Changes:**
```kotlin
// NO CHANGES NEEDED!
// Backend sends JSON as camelCase
// Prisma translates from TEN_ID → id → tenantId in JSON
@SerializedName("tenantId") val tenantId: String
@SerializedName("sessionType") val sessionType: SessionType
```

**No mobile app changes needed** - Backend handles translation!

---

## Conclusion

### Critical Finding

❌ **The current database schema DOES NOT follow the official ZMOS naming conventions**

### Current State
- Tables: `Tenant`, `Member`, `Location`, `SessionType`, etc.
- Columns: `id`, `name`, `tenantId`, `createdAt`, etc.

### Required State (Per Official Docs)
- Tables: `MOV_TENANT`, `MOV_MEMBER`, `MOV_LOCATION`, `MOV_SESSION_TYPE`, etc.
- Columns: `TEN_ID`, `TEN_NAME`, `LOC_ID`, `LOC_TENANT_ID`, `STY_ID`, etc.

### Recommendation

**If Early in Development (Pre-Production):**
✅ **Migrate Now** - 2-4 hours to fix properly, prevents all future issues

**If Already in Production:**
⚠️ **Hybrid Approach** - Document exception, use correct naming for all future tables, plan v2.0 migration

### Next Steps

1. **Immediate:** Discuss with team whether to migrate now or defer
2. **Document:** Update my previous analysis to reflect official standards
3. **Decide:** Choose Option 1, 2, or 3 from recommendations above
4. **Execute:** Implement chosen approach with proper testing

---

## Apology

I apologize for my initial analysis which incorrectly assessed your naming conventions as "good." I should have checked your official documentation first. The official ZMOS naming convention with domain and table prefixes is **significantly different** from what's currently implemented, and this is an important compliance gap that needs to be addressed.

The good news is that Prisma's `@map()` and `@@map()` attributes make this fixable without changing any TypeScript or mobile app code!
