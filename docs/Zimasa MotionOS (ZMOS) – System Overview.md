# Zimasa MotionOS (ZMOS) – System Overview

## 1. Purpose & Scope

**Zimasa MotionOS (ZMOS)** is the **Movement & Fitness OS** inside the Zimasa ecosystem.

It is a multi-tenant, multi-location system that:

- Runs movement providers (gyms, studios, outdoor clubs, bootcamps, etc.).
- Drives **ongoing movement habits** via engagement and gamification.
- Connects movement to **preventive health journeys** and, when available, to **ZHEP health scores, wallets and employer/payer programs**.

ZMOS must work in two modes:

1. **Standalone ZMOS-only**  
   For gyms or providers that only want a movement platform (no ZHEP, no payers).

2. **ZMOS + ZHEP integrated**  
   For full Zimasa deployments where movement is part of a broader health engagement and benefit ecosystem.

---

## 2. Role in the Zimasa Ecosystem

- In **ZMOS-only mode**  
  ZMOS acts as a complete Movement & Fitness SaaS for providers:
  - Onboarding tenants and locations,
  - Managing access plans, schedules and bookings,
  - Recording attendance and movement events,
  - Running basic corporate packages and engagement features.

- In **ZMOS + ZHEP mode**
  ZMOS becomes the **movement vertical** within the Zimasa Health Engagement Platform:
  - Identities come from ZHEP’s Party model.
  - Eligibility and utilisation for certain visits are validated via **ZPS wallets/benefits**.
  - Movement events become inputs to the **Zimasa Health Score**.
  - Employer and payer programs defined in ZHEP are enriched with **movement journeys, adherence metrics and engagement insights** from ZMOS.

All integration with ZHEP happens via **clear service interfaces/ports**, so ZMOS remains standalone-capable.

---

## 3. Deployment Modes

### 3.1 ZMOS-Only (Standalone)

- Local user identity & auth (within each tenant).
- Local corporate accounts and movement packages.
- Direct integration to PSPs (e.g. card, mobile money) for payments.
- Local notifications (email/SMS/whatsapp via generic providers).
- Local dashboards for providers and their corporate clients.

### 3.2 ZMOS + ZHEP Integrated

- Identity backed by ZHEP Party/Identity.
- Eligibility backed by **ZPS** (wellness wallets, caps, benefits).
- Movement events feed into the **Zimasa Health Score Engine**.
- Messaging routed via ZHEP’s communication layer where appropriate.
- Employer/payer programs and dashboards live in ZHEP, with ZMOS providing the **movement section** (journeys, adherence, challenges, etc.).

---

## 4. Core Modules

### 4.1 MoveOS – Provider & Operations Module

**Purpose:**  
Run multi-tenant, multi-location movement providers as a SaaS product.

**Key Responsibilities:**

- **Tenant & Location Management**
  - Onboard providers as tenants (gyms, studios, outdoor clubs).
  - Manage multiple locations/branches per tenant.
  - Per-location config: opening hours, time zone, capacity, local pricing.

- **Service Catalogue & Movement Prescription Profiles (MPP)**
  - Define class/PT/event types (`SessionType`).
  - Attach movement attributes (Intensity, Primary Goal, Contra-indications, Suggested Frequency).

- **Access Plans & Memberships**
  - Define access plans (memberships, passes, packs, corporate plans).
  - Manage member `Memberships` to those plans (status, dates, source).
  - Support location/network rules and basic visit limits.

- **Scheduling & Bookings**
  - Define recurring schedules (`SessionInstance`) for classes/PT/events.
  - Support booking rules, waitlists, and no-show/late cancellation policies.

- **Check-In & Access Control**
  - Handle check-in via QR/barcode/card/phone search.
  - Validate access against plans (and, in integrated mode, ZPS benefits).
  - Support walk-ins, guest passes and day passes.

- **Staff & Roles**
  - Manage staff accounts (coaches, managers, front desk).
  - Assign staff to SessionTypes and SessionInstances (instructors, PTs).

- **Basic Financials & Reporting**
  - Track revenue by plan, location and period.
  - Integrate with payments (local PSPs or ZHEP payments in integrated mode).
  - Provide basic provider reports (members, attendance, revenue).

---

### 4.2 PulseLoop – Engagement & Habit Module

**Purpose:**  
Turn occasional visits into **consistent movement habits**.

**Key Responsibilities:**

- **Movement Event Stream**
  - Capture all movement events (`MovementEvent`):
    - Class attendance,
    - Gym floor check-ins,
    - Outdoor events (hikes, runs),
    - Home/office “Movement Tiles”.

- **Movement Tiles (Micro-Doses)**
  - Very short, guided movement activities (5–10 minutes) that can be done anywhere.
  - Count towards movement goals and adherence (not just gym visits).

- **Streaks & Adherence**
  - Track daily/weekly streaks of activity.
  - Compute **Movement Adherence Score** per member and per journey:
    - % of recommended dose completed.

- **Challenges & Leaderboards**
  - Individual and team challenges (steps, minutes, sessions, Tiles).
  - Leaderboards by department, location, company, etc.

- **Rewards & Badges**
  - Points for adherence and completion of journeys/challenges.
  - Badges for milestones (streaks, journey completion, specific goals).

- **Nudges & Notifications**
  - Behaviour-triggered reminders:
    - Upcoming sessions, streak protection, lapsed activity nudges.
  - Uses local notification providers in ZMOS-only mode or ZHEP messaging in integrated mode.

- **Community (Lightweight)**
  - Interest-based groups/circles (e.g., runners, back-care, stress-reset).
  - Group announcements linked to journeys and challenges.

---

### 4.3 CarePath Move – Preventive & Clinical Integration Module

**Purpose:**  
Make movement a **formal preventive care pathway**, not just a perk.

**Key Responsibilities:**

- **Movement Journeys**
  - Structured, time-bound programs (`MovementJourney`), e.g.:
    - “8-week Metabolic Reset”
    - “6-week Back & Core Rescue”
    - “4-week Stress & Sleep Reset”
  - Define weekly targets, permitted activity types, and optional assessments.

- **Movement Prescription Profiles (MPP) Library**
  - Standardised movement profiles describing:
    - Indications (which risks/goals they support),
    - Contra-indications,
    - Intensity and suggested dose.

- **Risk & Screening Integration**
  - Map risk flags (e.g. BP, pre-diabetes, MSK, stress) to recommended journeys.
  - In integrated mode, consume risk/screening data from ZHEP & partners.

- **Journey Enrollment & Management**
  - Enrol members into journeys (`JourneyEnrollment`).
  - Track status (active, paused, completed, dropped) and adherence over time.
  - Allow adjustment of journeys (intensity, mix of Tiles vs classes) as people progress.

- **Coach / Care Console**
  - View per-member:
    - Risk category (where available),
    - Active journeys,
    - Movement Adherence Score and streaks.
  - Trigger targeted support:
    - Nudges, coach calls, changes to journeys, referrals.

- **Health Score & Outcomes (Integrated Mode)**
  - Publish movement adherence and journey completion to:
    - Zimasa Health Score Engine,
    - ZHEP analytics for employers/payers.

---

### 4.4 Corporate Accounts & Movement Packages (ZMOS Core)

**Purpose:**  
Allow tenants to run **corporate deals** and B2B movement programs in ZMOS-only mode.

**Key Responsibilities:**

- **Corporate Accounts**
  - Represent employer/organisation customers (`CorporateAccount`).
  - Store contact and billing details.

- **Corporate Members**
  - Link Members to CorporateAccounts (`CorporateMember`).
  - Track status and eligibility (active, suspended, ended).

- **Movement Packages for Corporates**
  - Bind CorporateAccounts to specific AccessPlans and/or MovementJourneys.
  - Track usage and basic outcomes for those corporate cohorts.

- **Reporting to Corporates**
  - Show participation, movement adherence, and engagement stats for each corporate package.

> In **ZMOS + ZHEP mode**, these concepts map or attach to ZHEP’s employer/payer program structures, but still use the same ZMOS entities internally.

---

## 5. ZMOS Interfaces & ZHEP Dependencies

ZMOS defines internal **service interfaces (ports)** for cross-cutting concerns. Implementations differ between **ZMOS-only** and **ZMOS + ZHEP** deployments.

Key interfaces:

- `IdentityService`
- `EligibilityService`
- `PaymentService`
- `NotificationService`
- `Analytics/EventPublisher`

### 5.1 ZMOS-Only Implementations

- `IdentityService` → local user/member auth & profiles.
- `EligibilityService` → decide access based on local Memberships/CorporateAccounts/AccessPlans.
- `PaymentService` → direct PSP integrations (card, mobile money).
- `NotificationService` → local email/SMS/WhatsApp providers.
- `Analytics/EventPublisher` → local dashboards and logs.

### 5.2 ZMOS + ZHEP Implementations

- `IdentityService` → ZHEP Party/Identity.
- `EligibilityService` → ZPS wallets/benefits & eligibility rules.
- `PaymentService` → ZHEP payment orchestration where desired.
- `NotificationService` → ZHEP messaging pipeline.
- `Analytics/EventPublisher` → send MovementEvents to:
  - Zimasa Health Score Engine,
  - ZHEP analytics & employer/payer dashboards.

This port-based approach lets ZMOS **run standalone** while still integrating deeply with ZHEP where available.

---

## 6. High-Level Core Data Concepts

ZMOS is built around a small set of core entities (conceptual):

- `Tenant`, `Location` – providers and their branches.
- `UserAccount` – staff/admin accounts per tenant.
- `Member` – individual end users.
- `CorporateAccount`, `CorporateMember` – B2B customers and covered individuals.
- `AccessPlan`, `Membership` – products and member entitlements.
- `SessionType`, `SessionInstance` – class/PT/event templates and scheduled occurrences.
- `Booking` – reservations for SessionInstances.
- `MovementEvent` – atomic record of movement activity.
- `MovementJourney`, `JourneyEnrollment` – structured programs and membership in those programs.

These entities provide the **stable backbone**; columns and secondary tables are evolved per feature using the AI-DLC process.

---

## 7. Summary

Zimasa MotionOS (ZMOS) is:

- A **standalone Movement & Fitness SaaS** for providers, **and**  
- A **movement vertical** of the Zimasa Health Engagement Platform when integrated with ZHEP.

It is structured into four main modules:

1. **MoveOS** – Provider & operations.  
2. **PulseLoop** – Engagement & habits.  
3. **CarePath Move** – Preventive & clinical movement journeys.  
4. **Corporate Accounts & Movement Packages** – B2B movement programs (with optional binding to ZHEP employer/payer programs).

Cross-cutting concerns (identity, eligibility, payments, messaging, analytics) are handled via **ports & adapters**, so ZMOS can operate independently and still plug deeply into ZHEP where required.

