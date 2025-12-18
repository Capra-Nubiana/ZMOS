# Database Naming Conventions

Here’s a clean rule you can paste straight into .cursorrules or docs/project-rules.md.

I’ll give you:

A short version (for Cursor rules)

A longer spec with examples (you can keep in docs if you want)

1. Short version (for Cursor rules)
# DB NAMING CONVENTIONS – ZMOS

When generating SQL/Prisma models for Zimasa MotionOS (ZMOS), follow this naming pattern:

1. TABLE NAMES
   - Use a 3-letter DOMAIN prefix for every table name: `<DOM>_<ENTITY>`.
   - Domain prefixes:
     - MOV_ = MoveOS (provider & ops: tenants, locations, sessions, bookings, check-ins)
     - PLP_ = PulseLoop (movement events, streaks, challenges, adherence)
     - CPM_ = CarePath Move (journeys, enrollments, MPPs)
     - COR_ = Corporate (corporate accounts, corporate members, corporate packages)
     - SYS_ = Shared/system (tenants, users, audit, etc.)
   - Examples:
     - MOV_TENANT, MOV_LOCATION, MOV_SESSION_TYPE, MOV_SESSION_INSTANCE
     - PLP_MOVEMENT_EVENT, PLP_CHALLENGE
     - CPM_MOVEMENT_JOURNEY, CPM_JOURNEY_ENROLLMENT
     - COR_CORPORATE_ACCOUNT, COR_CORPORATE_MEMBER
     - SYS_AUDIT_LOG

2. COLUMN NAMES
   - Each table has a 3-letter TABLE prefix. All its “own” columns start with that prefix.
   - Pattern: `<TBL>_<FIELD>`.
   - Choose a short, mnemonic table prefix:
     - MOV_TENANT → TEN_ (TEN_ID, TEN_NAME, TEN_CREATED_AT, …)
     - MOV_LOCATION → LOC_ (LOC_ID, LOC_TENANT_ID, LOC_NAME, …)
     - MOV_SESSION_TYPE → STY_ (STY_ID, STY_TENANT_ID, STY_NAME, …)
     - MOV_SESSION_INSTANCE → SIN_ (SIN_ID, SIN_SESSION_TYPE_ID, SIN_START_AT, …)
     - PLP_MOVEMENT_EVENT → MVE_ (MVE_ID, MVE_MEMBER_ID, MVE_TYPE, MVE_OCCURRED_AT, …)
     - CPM_MOVEMENT_JOURNEY → MJY_ (MJY_ID, MJY_TENANT_ID, MJY_NAME, …)
     - CPM_JOURNEY_ENROLLMENT → JEN_ (JEN_ID, JEN_MEMBER_ID, JEN_JOURNEY_ID, JEN_STATUS, …)
     - COR_CORPORATE_ACCOUNT → CCA_ (CCA_ID, CCA_TENANT_ID, CCA_NAME, …)
     - COR_CORPORATE_MEMBER → CCM_ (CCM_ID, CCM_CORPORATE_ACCOUNT_ID, CCM_MEMBER_ID, CCM_STATUS, …)
     - SYS_AUDIT_LOG → AUD_ (AUD_ID, AUD_TENANT_ID, AUD_ACTION, AUD_ENTITY_TYPE, AUD_ENTITY_ID, AUD_TIMESTAMP, …)

   - Foreign-key columns use the **referenced table’s prefix + _ID**:
     - LOC_TENANT_ID (inside MOV_LOCATION) → TEN_ID in MOV_TENANT
     - SIN_SESSION_TYPE_ID → STY_ID in MOV_SESSION_TYPE
     - MVE_MEMBER_ID → MEM_ID in MOV_MEMBER (if that’s the table)

3. PRISMA MAPPING
   - Prisma model names can use PascalCase (e.g. `model MovementEvent { ... }`).
   - Always map to the prefixed SQL table and columns using `@@map` and `@map`:
     - `@@map("PLP_MOVEMENT_EVENT")`
     - `@map("MVE_ID")`, `@map("MVE_MEMBER_ID")`, etc.

4. GENERAL
   - Always include `tenantId` (mapped to `<TBL>_TENANT_ID`) on tenant-scoped tables.
   - Always include standard audit fields per table using the table prefix:
     - `<TBL>_CREATED_AT`, `<TBL>_CREATED_BY`, `<TBL>_UPDATED_AT`, `<TBL>_UPDATED_BY` (and deleted_ fields where applicable).
   - Do NOT mix naming styles (no snake_case without prefixes, no random column names).
2. If you want a tiny “reminder” version for Cursor
If you want something even shorter in .cursorrules and keep the full thing in docs, use:

DB NAMING (ZMOS):

- All SQL table names: `<DOM>_<ENTITY>`, where DOM is a 3-letter domain prefix:
  - MOV_ (MoveOS), PLP_ (PulseLoop), CPM_ (CarePath Move), COR_ (Corporate), SYS_ (Shared/system).
- Each table has a 3-letter table prefix; all its columns start with that prefix: `<TBL>_<FIELD>`.
  - Example: MOV_TENANT → TEN_ID, TEN_NAME, TEN_CREATED_AT.
- Foreign keys use the referenced table’s prefix + `_ID`: LOC_TENANT_ID → TEN_ID.
- Prisma models MUST map to these SQL names using `@@map` (table) and `@map` (columns).
- Always add `<TBL>_TENANT_ID` + standard audit fields with the table prefix.
You can now tell Cursor: “When you generate Prisma or SQL, obey this naming convention,” and it’ll stop inventing random names.
