# Database Naming Conventions Analysis

## Executive Summary

✅ **Overall Assessment: GOOD** - The database naming conventions are mostly following industry best practices with a few recommendations for improvement.

**Current Convention:** PascalCase for model/table names, camelCase for field/column names

---

## Current State Analysis

### Backend (NestJS + Prisma)

#### Table Names (Prisma Models)
Current convention: **PascalCase**

```prisma
✅ Tenant
✅ Member
✅ Location
✅ SessionType
✅ SessionInstance
✅ Booking
✅ MovementEvent
✅ Waitlist
✅ Favorite
```

#### Column Names (Prisma Fields)
Current convention: **camelCase**

```prisma
✅ id, name, email, createdAt, updatedAt
✅ tenantId, memberId, sessionTypeId
✅ passwordHash, googleId, avatarUrl
✅ maxCapacity, durationMin, isActive
```

#### Database Table Names (SQLite)
Current state: **PascalCase** (directly from Prisma model names)

```sql
✅ Tenant
✅ Member
✅ Location
✅ SessionType
✅ SessionInstance
✅ Booking
✅ MovementEvent
✅ Waitlist
✅ Favorite
```

**Note:** No `@map()` or `@@map()` attributes are used, meaning Prisma model names directly map to database table names.

### Mobile App (Android/Kotlin)

#### Model Class Names
Current convention: **PascalCase**

```kotlin
✅ Member
✅ Tenant
✅ SessionInstance
✅ SessionType
✅ Location
✅ Booking
✅ MemberRole (enum)
```

#### Property Names
Current convention: **camelCase**

```kotlin
✅ id, name, email, tenantId, role
✅ sessionType, location, startTime, endTime
✅ currentBookings, spotsLeft, isAvailable
```

#### JSON Serialization
Using `@SerializedName` for mapping:

```kotlin
✅ @SerializedName("tenantId") val tenantId
✅ @SerializedName("startTime") val startTime
✅ @SerializedName("durationMin") val durationMinutes
✅ @SerializedName("maxCapacity") val maxCapacity
```

---

## Industry Standards Comparison

### Standard Convention 1: PostgreSQL/MySQL Best Practices

**Recommended:**
- Table names: `snake_case` (lowercase with underscores)
- Column names: `snake_case` (lowercase with underscores)

**Examples:**
```sql
-- Standard PostgreSQL/MySQL style
CREATE TABLE session_types (
    id VARCHAR PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    max_capacity INT,
    duration_min INT,
    is_active BOOLEAN,
    created_at TIMESTAMP
);
```

**Why:**
- Avoids case-sensitivity issues across different databases
- Consistent with SQL conventions (SQL keywords are lowercase)
- Works universally across all database systems

### Standard Convention 2: Prisma/TypeScript Ecosystem

**Recommended:**
- Prisma models: `PascalCase`
- Prisma fields: `camelCase`
- Database tables: `snake_case` (using `@@map()`)
- Database columns: `snake_case` (using `@map()`)

**Examples:**
```prisma
// Prisma best practice
model SessionType {
  id          String @id @default(cuid())
  tenantId    String @map("tenant_id")
  maxCapacity Int?   @map("max_capacity")

  @@map("session_types")
}
```

**Why:**
- Separates application layer (PascalCase/camelCase) from database layer (snake_case)
- Follows Node.js/TypeScript conventions in code
- Follows SQL conventions in database
- Easier database migration to other systems

### Standard Convention 3: Mobile API Best Practices

**Recommended:**
- JSON field names: `camelCase` or `snake_case` (consistent choice)
- Most modern APIs use `camelCase` for JSON

**Current State:**
```json
{
  "member": {
    "id": "...",
    "tenantId": "...",  // ✅ camelCase
    "email": "..."
  },
  "sessionInstance": {
    "startTime": "...",  // ✅ camelCase
    "endTime": "...",
    "currentBookings": 0
  }
}
```

**Why:** Google's JSON Style Guide recommends camelCase for property names.

---

## Current Implementation Analysis

### ✅ What's Working Well

1. **Consistent Prisma Conventions**
   - All models use PascalCase consistently
   - All fields use camelCase consistently
   - No mixing of conventions

2. **Mobile App Alignment**
   - Kotlin models match backend exactly (PascalCase)
   - Properties use camelCase matching JSON responses
   - Proper use of `@SerializedName` for explicit mapping

3. **API Response Consistency**
   - JSON responses use camelCase throughout
   - Backend and mobile use same naming
   - No transformation issues

4. **Clear Naming Semantics**
   - Descriptive names: `SessionInstance`, `SessionType`
   - Clear relationships: `sessionTypeId`, `memberId`
   - Boolean flags: `isActive`, `isAvailable`

5. **Compound Names**
   - Consistent use of camelCase: `maxCapacity`, `durationMin`
   - Clear abbreviations: `Min` for minutes, `Id` for identifier

### ⚠️ Potential Issues

1. **Database Table Case Sensitivity**
   - **Issue:** SQLite is case-sensitive for table names on some systems
   - **Risk:** `Tenant` vs `tenant` could cause issues when migrating to PostgreSQL/MySQL
   - **Current State:** Using PascalCase (`Tenant`, `Member`, `SessionType`)

   ```sql
   -- Current (case-sensitive)
   SELECT * FROM Member WHERE tenantId = '...';

   -- PostgreSQL would prefer
   SELECT * FROM members WHERE tenant_id = '...';
   ```

2. **Future Database Migration**
   - **Issue:** Moving from SQLite to PostgreSQL/MySQL may require table renames
   - **Risk:** All table names would need migration scripts
   - **Impact:** Medium - doable but requires careful migration planning

3. **Column Name Case**
   - **Issue:** `camelCase` columns are non-standard for SQL databases
   - **Current:** `tenantId`, `maxCapacity`, `createdAt`
   - **Standard:** `tenant_id`, `max_capacity`, `created_at`
   - **Risk:** Low - Prisma handles this transparently

4. **No Explicit Database Mapping**
   - **Issue:** No `@map()` or `@@map()` attributes in Prisma schema
   - **Impact:** Prisma model names directly become table names
   - **Risk:** Makes future database conventions harder to change

---

## Recommendations

### Option 1: Keep Current Convention (Recommended for Now)

**✅ Pros:**
- No breaking changes required
- Everything works correctly
- Consistent across backend and mobile
- Follows TypeScript/JavaScript conventions
- Easier for developers familiar with these ecosystems

**❌ Cons:**
- Non-standard for SQL databases
- May complicate future database migrations
- Some database tools expect snake_case

**Recommendation:** **KEEP AS-IS** for now, but plan for future improvement.

**Why:** Your current convention works well and is consistent. Making changes now would be disruptive with little immediate benefit.

### Option 2: Add Database Mapping (Recommended for Future)

Add `@map()` and `@@map()` to separate Prisma models from database tables:

```prisma
model SessionType {
  id          String @id @default(cuid())
  tenantId    String @map("tenant_id")
  name        String
  durationMin Int    @map("duration_min")
  maxCapacity Int?   @map("max_capacity")
  isActive    Boolean @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("session_types")
}
```

**✅ Pros:**
- Best of both worlds
- Code uses TypeScript conventions
- Database uses SQL conventions
- Easy migration to PostgreSQL/MySQL
- Follows Prisma best practices

**❌ Cons:**
- Requires migration
- More verbose Prisma schema
- One-time effort to update all models

**When to do this:** When migrating from SQLite to PostgreSQL/MySQL for production.

### Option 3: Full Snake_Case Conversion (NOT Recommended)

Convert everything to `snake_case`:

```prisma
model session_type {
  id            String @id @default(cuid())
  tenant_id     String
  max_capacity  Int?
  // ...
}
```

**❌ Not Recommended Because:**
- Breaks TypeScript/JavaScript conventions
- Requires changes to mobile app
- API responses would need transformation
- Goes against ecosystem conventions

---

## Specific Issues Found

### Issue 1: Inconsistent Abbreviations

**Current:**
```prisma
durationMin    Int    // ✅ Uses "Min"
maxCapacity    Int?   // ✅ Uses full "max"
```

**Recommendation:** Consistent - use full words or consistent abbreviations.

**Assessment:** ✅ **OKAY** - "Min" is clear abbreviation for minutes, "max" is standard prefix.

### Issue 2: Timestamp Fields

**Current:**
```prisma
createdAt  DateTime @default(now())
updatedAt  DateTime @updatedAt
bookedAt   DateTime @default(now())
attendedAt DateTime?
```

**Standard Options:**
- `createdAt` / `updatedAt` (current) ✅
- `created_at` / `updated_at` (SQL standard)
- `created_date` / `modified_date`

**Assessment:** ✅ **GOOD** - camelCase is consistent with ecosystem.

### Issue 3: Boolean Field Prefixes

**Current:**
```prisma
isActive   Boolean @default(true)  // ✅ Good
isAvailable Boolean                // ✅ Good
```

**Assessment:** ✅ **EXCELLENT** - consistent `is` prefix for booleans.

### Issue 4: Foreign Key Naming

**Current:**
```prisma
tenantId          String  // ✅ Good
memberId          String  // ✅ Good
sessionTypeId     String  // ✅ Good
sessionInstanceId String  // ✅ Good
```

**Standard Options:**
- `tenantId` (current) ✅
- `tenant_id` (SQL standard)
- `fk_tenant_id` (explicit FK prefix)

**Assessment:** ✅ **GOOD** - clear and consistent.

---

## Mobile-Backend Mapping Analysis

### ✅ Correct Mappings

| Backend (Prisma) | Database | Mobile (Kotlin) | Status |
|-----------------|----------|-----------------|--------|
| `SessionType` | `SessionType` | `SessionType` | ✅ Perfect match |
| `durationMin` | `durationMin` | `durationMinutes` via `@SerializedName("durationMin")` | ✅ Good - descriptive in Kotlin |
| `maxCapacity` | `maxCapacity` | `maxCapacity` | ✅ Perfect match |
| `tenantId` | `tenantId` | `tenantId` | ✅ Perfect match |

### Serialization Strategy

**Backend → Mobile:**
```typescript
// Backend sends
{
  "sessionType": {
    "durationMin": 60,
    "maxCapacity": 20
  }
}

// Mobile receives
@SerializedName("durationMin") val durationMinutes: Int
@SerializedName("maxCapacity") val maxCapacity: Int
```

**Assessment:** ✅ **EXCELLENT** - Mobile uses descriptive names while maintaining API compatibility.

---

## Database Migration Considerations

### Current Setup (SQLite)
```sql
CREATE TABLE "Tenant" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### If Migrating to PostgreSQL (Future)

**Option A: Keep Current (Requires Quoted Identifiers)**
```sql
CREATE TABLE "Tenant" (
    "id" TEXT PRIMARY KEY,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Queries must use quotes
SELECT * FROM "Tenant" WHERE "tenantId" = '...';
```

**Option B: Use Standard Convention**
```sql
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Queries are cleaner
SELECT * FROM tenants WHERE tenant_id = '...';
```

**Recommendation:** When migrating to PostgreSQL, use Prisma's `@map()` and `@@map()` to adopt Option B without changing application code.

---

## Action Items

### Immediate (Do Now)
✅ **No action required** - current conventions are working well.

### Short-term (Next Sprint)
1. ✅ Document current naming conventions (this document)
2. ✅ Ensure all new models follow existing conventions
3. ⚠️ Add linting rules to enforce conventions

### Long-term (Before Production)
1. 📋 When migrating to PostgreSQL/MySQL:
   - Add `@@map("snake_case_table_name")` to all models
   - Add `@map("snake_case_column")` to all fields
   - Create migration script
   - Update documentation

2. 📋 Consider adding database naming documentation to:
   - `README.md`
   - `CONTRIBUTING.md`
   - Prisma schema comments

---

## Convention Documentation

### Official Convention (Current)

**Prisma Models:** PascalCase
```prisma
model SessionType { }
model MemberRole { }
```

**Prisma Fields:** camelCase
```prisma
tenantId, maxCapacity, createdAt
```

**Database Tables:** PascalCase (same as models)
```sql
Tenant, Member, SessionType
```

**Database Columns:** camelCase (same as fields)
```sql
tenantId, maxCapacity, createdAt
```

**Mobile Models:** PascalCase
```kotlin
data class SessionType
enum class MemberRole
```

**Mobile Properties:** camelCase
```kotlin
val tenantId: String
val maxCapacity: Int
```

**JSON API:** camelCase
```json
{
  "tenantId": "...",
  "sessionType": { }
}
```

---

## Conclusion

### Overall Rating: ✅ 8.5/10

**Strengths:**
- ✅ Fully consistent across entire codebase
- ✅ Follows TypeScript/JavaScript ecosystem conventions
- ✅ Clean and readable
- ✅ Proper mobile-backend alignment
- ✅ Good use of `@SerializedName` in mobile app

**Minor Areas for Improvement:**
- ⚠️ Non-standard for SQL databases (minor issue)
- ⚠️ Will need mapping layer when migrating to PostgreSQL
- ⚠️ Some database tools may not work as smoothly

**Final Recommendation:**

**✅ KEEP CURRENT CONVENTION** - Your naming conventions are consistent, clean, and follow best practices for the Node.js/TypeScript/Kotlin ecosystem.

**Plan ahead:** When you migrate from SQLite to PostgreSQL for production, add Prisma's `@map()` and `@@map()` attributes to maintain your clean application code while adopting standard SQL database conventions.

**No immediate changes needed.** Focus on building features with your current consistent conventions.
