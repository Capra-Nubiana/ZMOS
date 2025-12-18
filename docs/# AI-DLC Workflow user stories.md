# AI-DLC Workflow user stories

Got it — we’re now zooming into just one slice of AI-DLC:

Problem Framing → AI Elaboration inside Cursor, per module.

I’ll:

Clarify what “good” Problem Framing + AI Elaboration look like.

Give you generic prompt templates.

Then give module-specific variants for:

MoveOS

PulseLoop

CarePath Move

Corporate Accounts

ZHEP Ports / Integrations

You can literally copy-paste these into Cursor, tweak a few words, and go.

1. What happens at this stage?
Problem Framing (in Cursor)
Goal: turn a fuzzy idea (“we need corporate challenges”) into a sharp ticket.

Output should be:

1 clear problem statement (not solution-first),

bullet user stories,

constraints (multi-tenant, Nest + Prisma, ZMOS-only vs ZMOS+ZHEP),

acceptance criteria,

any non-goals (what we won’t do in this slice).

You’ll then put that into your tracker (Jira/GitHub).

AI Elaboration (in Cursor)
Goal: take that framed ticket and produce a design note:

Restated problem in the AI’s own words (to check understanding).

Data model proposals (Prisma models, relations, indexes).

APIs (routes, DTOs, response shapes).

Flows / sequence (happy path & key edge cases).

Security & multi-tenancy rules.

ZHEP port usage vs local logic.

Testing strategy and stepwise implementation plan.

Where relevant, options + recommended choice.

You then review, tweak, and save it as:
design/<feature-name>-ai-elaboration.md.

2. Generic prompts for Cursor
2.1 Generic Problem Framing prompt (for any module)
Use this when you have an idea in your head and want Cursor to help you turn it into a crisp ticket.

You are helping me define a feature for Zimasa MotionOS (ZMOS), our Movement & Fitness OS.

Context:
- Backend: NestJS + TypeScript + PostgreSQL + Prisma.
- Multi-tenant SaaS: every tenant is a movement provider (gym, studio, etc.).
- Tenant isolation is critical (row-level via tenantId).
- ZMOS can run:
  - Standalone (ZMOS_ONLY mode), OR
  - Integrated with ZHEP (ZMOS_ZHEP mode) via ports/adapters.
- We follow an AI-DLC workflow:
  - Problem Framing → AI Elaboration → Design Decision → Implementation.

TASK:
Given the rough idea below, help me produce a SHARP feature ticket.

Rough idea:
[PASTE YOUR IDEA HERE – e.g. “Allow a provider to create and manage class types and schedules for each location”]

Please output:

1. **Feature Name**
2. **Problem Statement** – in 3–5 sentences, from the product/user perspective.
3. **User Stories** – 3–7 stories in “As a … I want … so that …” format.
4. **Scope & Constraints**
   - Multi-tenancy expectations.
   - ZMOS_ONLY vs ZMOS_ZHEP assumptions.
   - Performance/security constraints if any.
5. **Acceptance Criteria**
   - 6–12 bullet points that can be tested.
6. **Non-Goals**
   - What is explicitly out of scope for this feature.

Keep it concise and implementation-agnostic (no low-level code yet).
You then paste that output into your ticket system.

2.2 Generic AI Elaboration prompt (for any module)
Once the ticket exists, use this to generate the design note.

You are a senior backend + domain architect working on Zimasa MotionOS (ZMOS).

Stack & constraints:
- Backend: NestJS + TypeScript + PostgreSQL + Prisma.
- Multi-tenant: all domain data is tenant-scoped via tenantId; strong isolation between tenants.
- Architecture: modular monolith; ports & adapters for cross-cutting concerns (identity, eligibility, payments, messaging, analytics).
- Modes:
  - ZMOS_ONLY: local identity & entitlements.
  - ZMOS_ZHEP: ZHEP-backed Identity/Eligibility/etc. behind ports.

We follow an AI-Driven Development Lifecycle (AI-DLC). Your job is the **AI Elaboration** step for this feature.

Here is the feature ticket:

[TICKET TEXT HERE]

Please produce a design note in **markdown**, with the following sections:

1. **Problem Restatement**
   - Summarise the feature in your own words.
2. **Context & Assumptions**
   - Which ZMOS module this belongs to (MoveOS, PulseLoop, CarePath Move, Corporate, ZHEP Ports).
   - Any assumptions about deployment mode (ZMOS_ONLY vs ZMOS_ZHEP).
3. **Domain Concepts**
   - Key domain entities involved and how they relate (in words).
4. **Data Model (Prisma)**
   - Proposed Prisma models (with fields, types, relations, indexes).
   - Mention how tenantId is used.
   - Note any alternative modelling options if relevant.
5. **APIs**
   - List REST endpoints (method + path).
   - For each: purpose, auth rules, and a sketch of request/response DTOs.
6. **Core Flows**
   - Describe the main flows step-by-step (e.g., booking, check-in, journey enrollment).
   - Include main edge cases.
7. **Multi-Tenancy, Security & Permissions**
   - How we enforce tenant isolation.
   - Any RBAC or permission considerations.
8. **ZHEP Integration Boundaries (if relevant)**
   - Which parts use local logic vs which touch ZHEP ports (IdentityService, EligibilityService, etc.).
   - Confirm there is no hard coupling to ZHEP inside core domain logic.
9. **Testing Strategy**
   - Key unit tests.
   - Key integration tests (API-level).
   - Any special cases to cover.
10. **Implementation Plan**
    - Concrete steps the developer should follow in sequence.
    - Highlight migration steps and any risk areas.

Optimise for:
- Minimal yet extendable design (we’re building an MVP, not the final kingdom).
- Clarity of domain concepts.
- Clean separation between ZMOS-only logic and ZHEP integrations.
3. Module-specific prompts
These build on the generic ones but “bake in” the right mental model for each module so you don’t repeat domain context every time.

3.1 MoveOS – Problem Framing prompt
Use when framing provider/ops features: tenants, locations, services, schedules, bookings, check-ins.

You are helping me define a MoveOS feature for Zimasa MotionOS (ZMOS).

MoveOS handles:
- Tenants (movement providers),
- Locations/branches,
- Service catalogue (SessionTypes),
- Schedules (SessionInstances),
- Memberships & access rules (at least local),
- Bookings & check-ins.

Stack:
- NestJS + TypeScript + PostgreSQL + Prisma.
- Multi-tenant: tenantId on all domain data.

Rough feature idea (MoveOS):
[PASTE IDEA – e.g. “Allow a provider to define class templates and recurring schedules per location, with capacity rules.”]

Please output:

1. Feature Name
2. Problem Statement (3–5 sentences) from provider/operator perspective.
3. User Stories (provider staff, front-desk, sometimes member).
4. Scope & Constraints
   - Multi-tenant expectations.
   - ZMOS_ONLY vs ZMOS_ZHEP assumptions (for this feature, likely ZMOS_ONLY).
   - Required performance, any SLAs (e.g., check-in must be fast).
5. Acceptance Criteria
6. Non-Goals (e.g., no payments, no ZHEP eligibility for this slice).

Keep it clearly anchored in MOVEOS (provider ops), not PulseLoop or CarePath Move.
3.1 MoveOS – AI Elaboration prompt
You are designing a MoveOS backend feature for Zimasa MotionOS (ZMOS).

MoveOS responsibilities:
- Tenants, locations, staff.
- Service catalogue (`SessionType`).
- Schedules (`SessionInstance`).
- Memberships/entitlements (local).
- Bookings & check-ins.
- MovementEvents generated from attendance.

Stack:
- NestJS + TypeScript + PostgreSQL + Prisma.
- Multi-tenant: tenantId.
- ZMOS_ONLY mode for now (no ZHEP eligibility in this feature).

Here is the feature ticket:

[PASTE MOVEOS TICKET]

Produce a markdown design note with:

- Domain concepts (Tenant, Location, SessionType, SessionInstance, Booking, MovementEvent).
- Prisma models and relations.
- API endpoints and DTOs.
- Booking & check-in workflow (including edge cases like full class, no-show, late cancellation).
- Multi-tenancy rules & auth (which roles can call which endpoints).
- How MovementEvents are generated here and consumed later by PulseLoop.
- Testing strategy & implementation steps.
3.2 PulseLoop – Problem Framing prompt
Use for Tiles, streaks, adherence, challenges, leaderboards.

You are helping define a PulseLoop feature for Zimasa MotionOS (ZMOS).

PulseLoop handles:
- MovementEvents stream from MoveOS & Tiles.
- Movement Tiles (small guided activities).
- Streaks and Movement Adherence Score.
- Challenges and light leaderboards.
- Nudges and engagement signals.

Stack:
- NestJS + TypeScript + PostgreSQL + Prisma.
- Multi-tenant: tenantId.
- Must never break tenant isolation while aggregating data.

Rough PulseLoop feature idea:
[PASTE IDEA – e.g. “Compute a simple weekly Movement Adherence Score per member based on MovementEvents and target sessions per week.”]

Please output the usual ticket elements (Feature name, Problem statement, User stories, Scope/constraints, Acceptance criteria, Non-goals), but pay special attention to:

- Behaviour change angle (this is about habit-building, not just counting).
- Data sources (MovementEvent) and any assumptions about data quality.
3.2 PulseLoop – AI Elaboration prompt
You are designing a PulseLoop feature for Zimasa MotionOS (ZMOS).

PulseLoop:
- Consumes MovementEvents (class_attendance, gym_checkin, tile_completion, etc.).
- Computes streaks and Movement Adherence Scores.
- Manages challenges and basic leaderboards.

Stack:
- NestJS + TS + Postgres + Prisma.
- Multi-tenant.

Here is the PulseLoop feature ticket:

[PASTE TICKET]

Please produce a markdown design note focusing on:

1. How MovementEvents will be interpreted for this feature (e.g., by type, by day/week).
2. Data model additions (e.g., AdherenceSnapshot, Challenge, ChallengeParticipant).
3. Algorithms (in plain English + pseudo-code) for:
   - Adherence calculation.
   - Streak detection.
   - Challenge progress.
4. APIs:
   - Reads (e.g., `GET /members/:id/adherence-summary`, `GET /challenges/:id/leaderboard`).
   - Writes (e.g., create/join challenge).
5. Multi-tenancy and performance:
   - How to query per tenant safely and efficiently.
6. How this feature can later feed CarePath Move (journeys) and ZHEP Health Score.
7. Testing strategy and an implementation plan in small steps.
3.3 CarePath Move – Problem Framing prompt
Use for journeys, MPPs, prescriptions, adherence vs prescribed plan.

You are helping define a CarePath Move feature for Zimasa MotionOS (ZMOS).

CarePath Move handles:
- MovementJourneys (structured programs: “8-week Metabolic Reset”, etc.).
- JourneyEnrollment per member.
- Movement Prescription Profiles (MPPs) as building blocks.
- Adherence vs prescribed plan (not just raw activity).

Stack:
- NestJS + TS + Postgres + Prisma.
- Multi-tenant.
- May later integrate with ZHEP risk flags, but this feature may be local-only.

Rough CarePath Move feature idea:
[PASTE IDEA – e.g. “Create MovementJourneys with weekly session targets, and track each enrolled member’s adherence against the journey targets.”]

Please produce a ticket that clearly distinguishes:
- Journeys vs generic activity.
- What is covered in v1 vs what is left for v2 (e.g., no complex risk-based personalisation yet).
3.3 CarePath Move – AI Elaboration prompt
You are designing a CarePath Move v1 feature for Zimasa MotionOS (ZMOS).

CarePath Move:
- Wraps raw movement into structured programs (MovementJourneys).
- Tracks JourneyEnrollments and journey-specific adherence.

Stack:
- NestJS + TS + Postgres + Prisma.
- Multi-tenant.

Feature ticket:
[PASTE TICKET]

Produce a markdown design note covering:

- Domain distinctions:
  - MovementJourney vs MovementTile vs generic MovementEvent.
  - JourneyEnrollment vs Membership vs Challenge participation.
- Prisma models:
  - MovementJourney, JourneyEnrollment, any supporting tables (e.g., JourneyTarget).
- How adherence is computed at the JourneyEnrollment level using MovementEvents.
- APIs for:
  - Managing journeys (create/update/list).
  - Enrolling members.
  - Viewing journey adherence per member & per journey.
- Multi-tenant + security rules:
  - Who can define journeys (tenant admins, coaches).
  - How corporate/payer journeys could be supported later.
- Future ZHEP integration points (e.g., risk flags, Health Score updates) but implemented **behind ports**.
- Testing strategy and implementation steps.
3.4 Corporate Accounts – Problem Framing prompt
You are helping define a Corporate Accounts feature for Zimasa MotionOS (ZMOS).

Corporate module handles:
- CorporateAccount (employer/organisation).
- CorporateMember (mapping their people to Members).
- Corporate Movement Packages (binding access plans and journeys).
- Corporate-level reporting (participation, adherence, engagement).

Stack:
- NestJS + TS + Postgres + Prisma.
- Multi-tenant: each Tenant (provider) can have multiple corporate clients.

Rough corporate feature idea:
[PASTE IDEA – e.g. “Allow a tenant to onboard a corporate customer, upload a list of employees as corporate members, and see simple movement reports for that corporate.”]

Please output a ticket that:
- Explicitly states ZMOS_ONLY scope (no ZHEP payer integration yet).
- Highlights the B2B nature (corporate as customer).
- Defines corporate admin vs provider admin responsibilities.
3.4 Corporate Accounts – AI Elaboration prompt
You are designing a Corporate Accounts feature for Zimasa MotionOS (ZMOS).

Corporate module:
- Lives inside a Tenant (movement provider).
- Represents B2B clients (CorporateAccount).
- Links CorporateMembers to Members.
- Aggregates movement stats per corporate.

Stack:
- NestJS + TS + Postgres + Prisma.
- Multi-tenant (Tenant → CorporateAccount → CorporateMember).

Feature ticket:
[PASTE TICKET]

Please produce a design note in markdown covering:

- Prisma models:
  - CorporateAccount, CorporateMember, optional CorporatePackage.
  - Relations to Tenant, Member, AccessPlan, MovementJourney.
- APIs for:
  - Creating/managing CorporateAccounts.
  - Linking members as CorporateMembers (manual + CSV upload in future).
  - Fetching corporate-level movement summaries.
- How movement data is aggregated safely per corporate without leaking between corporates or tenants.
- How this will later map to ZHEP employer programs (conceptually), *without* coupling now.
- Testing strategy & implementation steps.
3.5 ZHEP Ports & Integrations – AI Elaboration prompt
This one is usually more elaboration-heavy than framing-heavy; framing is just “we need ports, not direct calls”.

You are designing the ZHEP integration ports for Zimasa MotionOS (ZMOS).

Goal:
- Define TypeScript interfaces (ports) and their usage patterns for:
  - IdentityService
  - EligibilityService
  - PaymentService
  - NotificationService
  - Analytics/EventPublisher (e.g., Health Score events)
- Ensure ZMOS can run:
  - ZMOS_ONLY: use local implementations.
  - ZMOS_ZHEP: use ZHEP-backed adapters.

Stack:
- NestJS + TS + Postgres + Prisma.
- Modular monolith with dependency injection for swapping implementations.

Feature ticket:
[PASTE TICKET]

Please produce a markdown design note that includes:

1. Clear responsibilities and boundaries for each port.
2. TypeScript interface definitions for each port (high-level, not full code).
3. Examples of how core modules (MoveOS, PulseLoop, CarePath Move) should call these ports instead of direct logic.
4. Strategy for configuration-based switching between local and ZHEP implementations.
5. Error handling and fallback strategies when ZHEP is down (ZMOS should degrade gracefully).
6. Testing approach (unit tests with mocked ports, integration tests for adapters).
7. Implementation plan:
   - Define interfaces.
   - Implement local versions.
   - Implement stub ZHEP adapters.
   - Wire in DI / provider configuration.