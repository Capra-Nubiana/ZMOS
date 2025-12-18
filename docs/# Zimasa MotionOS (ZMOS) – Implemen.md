# Zimasa MotionOS (ZMOS) – Implementation Plan (v1)

**Product:** Zimasa MotionOS (ZMOS)  
**Role:** Movement & Fitness OS for Zimasa, working both as:
- A **standalone SaaS** for gyms/movement providers, and  
- The **movement vertical** inside the Zimasa Health Engagement Platform (ZHEP).

This plan assumes:

- Backend: **NestJS + TypeScript + PostgreSQL + Prisma** (current work kept, treated as an explicit deviation from the generic Fastify+Drizzle blueprint).  
- Frontend: **React + TypeScript + Vite + Tailwind + shadcn/ui** (to be implemented later).  
- Development method: **AI-Driven Development Lifecycle (AI-DLC)** as per `ZMOS AI-DLC Working Agreement`.

---

## 1. How We Work – AI-DLC (Applies to All Phases)

For **every feature/EPIC from now on**:

1. **Problem Framing (Ticket)**  
   - Create an issue describing:
     - Module (MoveOS, PulseLoop, CarePath Move, Corporate, Integrations).
     - User story / use case.
     - Constraints (multi-tenant, standalone vs ZHEP-connected, performance, security).
   - Link to relevant docs (System Overview, ERD, Working Agreement).

2. **AI Elaboration (Design Note)**  
   - Use Cursor/ChatGPT to generate:
     - Proposed data model changes.
     - APIs & service interfaces.
     - Flows & edge cases.
     - Test cases.
   - Save as `design/<FEATURE_NAME>-ai-elaboration.md` in the repo.
   - Link from the ticket.

3. **Design Decision (Review)**  
   - Kizito reviews the design note.
   - Outcome recorded in the ticket:
     - “Approved with changes A, B…” or “Revise as follows…”.

4. **Implementation with AI Assist**  
   - Implement code + migrations + tests in a feature branch.
   - Use AI for boilerplate and suggestions, but **consultant is responsible** for correctness, clarity, and performance.
   - Update or add `docs/<FEATURE_NAME>.md` if conceptually important.

5. **Demo & Acceptance**  
   - Provide a short test script (steps to verify).
   - Demo to Kizito; he runs through or reviews.
   - Ticket marked Done only after acceptance.

**Rule:**  
No feature is considered complete without: ticket, design note, tests, and acceptance.

---

## 2. High-Level Phasing

- **Phase 0** – Alignment & Infra Hardening (NOW → 1–2 weeks)
- **Phase 1** – Core Platform & Auth (already mostly DONE; small refinements)
- **Phase 2** – MoveOS Walking Skeleton (core movement flows)
- **Phase 3** – PulseLoop Basics (events, streaks, simple adherence & challenges)
- **Phase 4** – CarePath Move v1 (movement journeys & adherence against goals)
- **Phase 5** – Corporate Accounts & Movement Packages (ZMOS-only)
- **Phase 6** – ZHEP Ports & Integration Adapters
- **Phase 7** – Frontend MVPs (Provider Console + minimal Member views)
- **Phase 8** – Hardening, CI/CD, Observability & Production Readiness

Each phase delivers **usable slices**, not just internal plumbing.

---

## 3. Phase 0 – Alignment & Infra Hardening

**Goal:** Lock in foundations so we don’t rework infra later.

### Objectives

- Confirm **stack, patterns and naming**.
- Add missing cross-cutting pieces:
  - Audit logging helper + audit table.
  - Health & readiness endpoints.
  - Baseline observability & rate limiting.
- Introduce **AI-DLC artifacts structure** into the repo.

### Tasks

1. **Stack Confirmation & Documentation**
   - Document in `docs/tech-profile.md`:
     - We are using **NestJS + Prisma + Postgres + Redis** for ZMOS.
     - How this aligns with overall Zimasa blueprint (explicit deviation from Fastify+Drizzle).
   - Ensure `README.md` clearly states:
     - How to run the service locally,
     - How multi-tenancy and auth are wired.

2. **AI-DLC Folders & Templates**
   - Create:
     - `design/` folder (for AI design notes).
     - `docs/` folder (for feature docs).
   - Add:
     - `design/TEMPLATE-feature-ai-elaboration.md`.
     - `docs/TEMPLATE-feature-doc.md`.

3. **Audit Logging**
   - Add central `AuditLog` table (Prisma model) matching agreed pattern:
     - `id`, `tenantId`, `actorId`, `actorType`, `action`, `entityType`, `entityId`, `metadata (JSON)`, `createdAt`.
   - Implement `AuditService.recordEvent(...)` helper.
   - Call this helper in:
     - Auth events (user created, login, password reset),
     - Tenant creation/updates.

4. **Health & Readiness**
   - Implement:
     - `GET /health` – simple liveness (no DB).
     - `GET /ready` – checks Postgres + Redis connectivity.
   - Document responses & usage for deployment (later K8s).

5. **Baseline Observability**
   - Introduce:
     - Structured logging (e.g. `pino` or Winston) with request IDs & tenant IDs in logs.
     - Basic metrics endpoint (even if not full Prometheus yet).

6. **Rate Limiting**
   - Add simple rate limiting middleware/guard (e.g. IP + optional user-based throttling) for auth endpoints.
   - Store state in Redis (if configured) or in-memory for dev.

**Deliverables**

- Updated `README.md` and `docs/tech-profile.md`.
- `AuditLog` model + `AuditService`.
- `/health` and `/ready` endpoints.
- Basic logging & metrics.
- Rate limiting on public-facing endpoints.

---

## 4. Phase 1 – Core Platform & Auth (Refinement)

**Status:** Largely DONE per current plan (Nest + Prisma, JWT auth, tenant middleware).

**Goal:** Tighten what’s there and align with naming & multi-tenancy rules.

### Objectives

- Ensure **multi-tenancy is consistent** (every relevant table has `tenantId`).
- Clean up auth & user models to align with core ZMOS entities (`Member`, future `UserAccount`).
- Add missing profile/onboarding pieces that are really needed.

### Tasks

1. **Review Tenant & Member Models**
   - Ensure:
     - `Tenant` is the ZMOS tenant (movement provider entity).
     - `Member` is clearly an **end-user** (employee/insured/D2C) *not* staff.
   - Decide if we need a separate `UserAccount` for staff/admin vs member logins or if Member covers both (document choice).

2. **Multi-Tenant Enforcement**
   - Confirm Prisma middlewares/extensions:
     - Automatically apply `tenantId` filter on all tenant-scoped models.
   - Add tests to ensure:
     - Tenant A cannot see Tenant B’s data.

3. **Auth & Profile Enhancement (Minimal)**
   - Extend signup/profile only as needed:
     - `firstName`, `lastName`, `phoneNumber`, `timezone`.
   - Implement **email verification** & **password reset** flows at a basic level.
   - All new endpoints follow AI-DLC (design note + tests).

4. **Audit Hooks**
   - Call `AuditService` for:
     - Tenant creation,
     - User/Member creation,
     - Role/permission changes (when RBAC is added).

**Deliverables**

- Stable Tenant/Member auth foundation.
- Clear multi-tenant enforcement.
- Minimal but solid profile & onboarding.

---

## 5. Phase 2 – MoveOS Walking Skeleton

**Goal:** Get the **core movement flow** working end-to-end for a single tenant.

> “Tenant → Location → SessionType → SessionInstance → Booking → MovementEvent → simple streak.”

### Objectives

- Implement the **core ERD** entities relevant for MoveOS.
- Allow providers to:
  - Create locations,
  - Define class/PT types (SessionTypes),
  - Schedule SessionInstances,
  - Register members,
  - Book and check them in,
  - Generate MovementEvents.

### Domain Entities (Prisma models)

- `Tenant`, `Member` (already exist; refine as needed).
- `Location`
- `SessionType`
- `SessionInstance`
- `Booking`
- `MovementEvent`

### Tasks

1. **AI-DLC: Core Movement ERD Design Note**
   - Design note `design/moveos-core-erd-ai-elaboration.md`:
     - Table structures for the entities above.
     - Relationships & constraints.
     - Basic API endpoints.
     - Edge cases (capacity, cancellations, no-shows).

2. **Entities & Migrations**
   - Implement models + migrations for `Location`, `SessionType`, `SessionInstance`, `Booking`, `MovementEvent`.
   - Ensure every model has `tenantId` and audit columns.

3. **Provider APIs**
   - Endpoints (examples):
     - `POST /locations`, `GET /locations`
     - `POST /session-types`, `GET /session-types`
     - `POST /session-instances`, `GET /session-instances`
   - Apply tenant scoping, auth guards, and audit logging.

4. **Booking & Check-in APIs**
   - Endpoints:
     - `POST /bookings` (create booking for a Member + SessionInstance)
     - `POST /bookings/:id/check-in` (or `/checkins`)
   - Logic:
     - Validate membership/entitlement (local rules for now).
     - Record `Booking` status.
     - Create `MovementEvent` for attendance.

5. **Simple Streaks (Per Member)**
   - For now, implement a simple streak calculation:
     - “Consecutive days with at least one MovementEvent.”
   - Endpoint:
     - `GET /members/:id/streak` or included in `GET /members/:id/summary`.

6. **Tests & Demo**
   - Tests for:
     - Tenant scoping,
     - Booking, check-in, movement event creation,
     - Streak logic.
   - Demo script:
     - Create tenant → create location → create member → create session type → schedule → book → check-in → view streak.

**Deliverables**

- Fully working **MoveOS skeleton** for one tenant (API-level).
- Design note + docs for MoveOS core.

---

## 6. Phase 3 – PulseLoop Basics

**Goal:** Turn raw MovementEvents into **habit signals**: streaks, simple adherence, basic challenges.

### Objectives

- Formalise `MovementEvent` types.
- Introduce **Movement Tiles** as micro-activities (even if basic in v1).
- Compute simple **Movement Adherence Score** per member.
- Implement basic challenges & leaderboards (v1 light, no heavy UI yet).

### Domain Entities

- Extend `MovementEvent` with:
  - `type` (class_attendance, gym_checkin, tile_completion, outdoor_event, etc.).
- New entities:
  - `MovementTile`
  - `Challenge`
  - `ChallengeParticipant` / `ChallengeProgress`

### Tasks

1. **AI-DLC: PulseLoop Design Note**
   - `design/pulseloop-v1-ai-elaboration.md`:
     - MovementEvent classification,
     - Tiles structure,
     - Adherence calculation (simple formula),
     - Challenge structure and API.

2. **Movement Tiles**
   - Model `MovementTile` with:
     - `id`, `tenantId`, `name`, `description`,
     - `durationMinutes`, `intensity`, `category`.
   - APIs to list and assign Tiles to members or journeys later.

3. **Adherence Calculation (v1 Simple)**
   - Define a simple formula, e.g.:
     - Weekly target = X MovementEvents or minutes.
     - Adherence = actual / target for last N weeks.
   - Implement service & endpoint:
     - `GET /members/:id/adherence-summary`.

4. **Challenges (Basic)**
   - Model `Challenge` and `ChallengeParticipant`.
   - Allow:
     - Creating a challenge (e.g. “Attend 3 sessions/week for 4 weeks”).
     - Joining a challenge.
     - Computing simple progress & completion.

5. **Leaderboards (Optional v1)**
   - Simple endpoint:
     - `GET /challenges/:id/leaderboard`.

6. **Tests & Demo**
   - Tests for adherence and challenge logic.
   - Demo script showing:
     - Member with some MovementEvents,
     - Adherence summary,
     - Participation in a challenge.

**Deliverables**

- PulseLoop v1 with basic adherence, Tiles, and challenges.
- Docs describing adherence formula and challenge model.

---

## 7. Phase 4 – CarePath Move v1 (Movement Journeys)

**Goal:** Introduce structured **Movement Journeys** and tie adherence to journeys, not just generic activity.

### Objectives

- Create `MovementJourney` entity and `JourneyEnrollment`.
- Attach simple goals/targets to journeys.
- Compute adherence per **JourneyEnrollment**.

### Domain Entities

- `MovementJourney`
- `JourneyEnrollment`

### Tasks

1. **AI-DLC: CarePath Move Design Note**
   - `design/carepath-move-v1-ai-elaboration.md`:
     - Journey structure,
     - Relationship to Tiles and Sessions,
     - Adherence at journey level,
     - Coach/console endpoints (v1 minimal).

2. **Entities & APIs**
   - `MovementJourney` with:
     - `name`, `description`, `durationWeeks`,
     - Simple targets (sessions/week, minutes/week).
   - `JourneyEnrollment` with:
     - `memberId`, `journeyId`, `startDate`, `status`, `adherenceScore`.

3. **Adherence per Journey**
   - Compute adherence based on MovementEvents inside enrollment window.
   - Endpoint:
     - `GET /journeys/:id/enrollments/:enrollmentId/summary`

4. **Coach/Console (Backend Only)**
   - APIs for coaches to:
     - List members in a journey,
     - See adherence & streak summaries,
     - Flag members for follow-up (design a simple “flag” model or reuse metadata).

5. **Tests & Demo**
   - Tests for journey enrollment and adherence.
   - Demo script:
     - Create journey,
     - Enrol member,
     - Record events,
     - Show journey adherence.

**Deliverables**

- CarePath Move v1 (backend).
- Journeys and enrollments integrated with MovementEvents.

---

## 8. Phase 5 – Corporate Accounts & Movement Packages

**Goal:** Support **corporate deals** in ZMOS-only mode (employers/organisations buying access).

### Objectives

- Add `CorporateAccount` and `CorporateMember`.
- Bind corporate accounts to **AccessPlans** and/or **MovementJourneys**.
- Provide basic corporate reporting.

### Domain Entities

- `CorporateAccount`
- `CorporateMember`
- Possible helper: `CorporatePackage` (plan + journey + rules).

### Tasks

1. **AI-DLC: Corporate Design Note**
   - `design/corporate-accounts-v1-ai-elaboration.md`.

2. **Entities & APIs**
   - Implement `CorporateAccount` + `CorporateMember`.
   - APIs:
     - `POST /corporate/accounts`
     - `POST /corporate/accounts/:id/members`
     - Basic listing/reporting endpoints.

3. **Corporate Packages**
   - Model binding between corporate account, access plan, and optionally default journey.

4. **Reporting**
   - For each CorporateAccount:
     - Participation (how many members active),
     - Movement events total,
     - High-level adherence stats.

5. **Tests & Demo**

**Deliverables**

- Corporate accounts working end-to-end in ZMOS-only mode.
- Simple corporate movement reports.

---

## 9. Phase 6 – ZHEP Ports & Integration Adapters

**Goal:** Prepare ZMOS to work as a **movement vertical inside ZHEP** without breaking standalone mode.

### Objectives

- Define **ports/interfaces** for:
  - Identity,
  - Eligibility/benefits,
  - Payments,
  - Messaging,
  - Health Score / Analytics.

- Implement **adapters** that can talk to ZHEP (even if some are stubbed initially).

### Tasks

1. **AI-DLC: Integration Design Note**
   - `design/zhep-integration-ports-ai-elaboration.md`:
     - Define TypeScript interfaces (`IdentityService`, `EligibilityService`, etc.).
     - Explain how ZMOS switches between local vs ZHEP-backed implementations.

2. **Ports Layer**
   - Create interfaces & base classes in a `core/ports` module.
   - Refactor existing code (where necessary) to use ports, not hard-coded local logic.

3. **Stub ZHEP Adapters**
   - Implement stubbed versions (e.g. log-only or fake responses) for:
     - Identity,
     - Eligibility,
     - Messaging,
     - Health score publisher.

4. **Configuration & Toggle**
   - Add configuration (env flags) to switch between:
     - `ZMOS_ONLY` mode (local implementations),
     - `ZMOS_ZHEP` mode (use adapters).

5. **Tests & Demo**
   - Ensure switching modes does not break core flows.

**Deliverables**

- Ports layer in place.
- ZHEP adapters stubbed and ready for real integration later.

---

## 10. Phase 7 – Frontend MVPs

**Goal:** Provide usable UIs for providers and basic member access to prove end-to-end flows.

### Objectives

- Build **Provider Console** MVP:
  - Tenants, locations, sessions, bookings, journeys, corporate accounts.
- Provide **Member UI** MVP:
  - View schedule,
  - Book sessions,
  - See basic streak/adherence.

(Details can be elaborated per feature with AI-DLC – this plan focuses more on backend/domain for now.)

---

## 11. Phase 8 – Hardening & Production Readiness

**Goal:** Make ZMOS safe, observable, and deployable to production.

### Objectives

- Comprehensive tests (unit + integration + some e2e).
- CI/CD pipelines.
- Observability & monitoring.
- Security hardening, backups, DR.

### Tasks

- Raise test coverage (especially movement domain logic).
- Set up CI (type-check, lint, tests, migrations dry-run).
- Dockerize service with health/readiness probes.
- Add:
  - Prometheus metrics,
  - Sentry (or equivalent),
  - Dashboards (Grafana, etc.).
- Define backup & restore procedures for Postgres.

**Deliverables**

- CI/CD pipelines defined and running.
- Monitoring & alerting in place.
- ZMOS ready for pilot deployments.

---

## 12. Summary for Consultant

- **You keep your NestJS + Prisma foundation**, but:
  - Align tightly with the ZMOS domain model and multi-tenancy rules.
  - Adopt the **AI-DLC workflow** for every feature.
- Early focus:
  - Phase 0 (infra & alignment),
  - Phase 1 refinements (auth/tenant),
  - Phase 2 (MoveOS walking skeleton) – this is the first big milestone.
- ZHEP integration comes **after** ZMOS is solid in standalone mode, via **ports & adapters**.

All significant work items should be created as tickets and go through the AI-DLC loop with design notes in `design/` and docs in `docs/`.

