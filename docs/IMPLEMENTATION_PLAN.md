# ZMOS Implementation Plan

**Reference Document**: `docs/Zimasa MotionOS (ZMOS) – AI-DLC Working Agreement.md`

## Overview

**ZMOS (Zimasa MotionOS)** is a Movement & Fitness OS for the Zimasa Health Engagement Platform. It provides multi-tenant SaaS capabilities with AI-driven development lifecycle, focusing on movement as health engagement rather than generic gym operations.

This implementation follows the **AI-Driven Development Lifecycle (AI-DLC)** and **Ports & Adapters** architectural pattern, ensuring clean separation between ZMOS movement domain logic and ZHEP shared platform capabilities.

## Core Principles (from Working Agreement)

### **Domain Focus**
- **Movement as Health Engagement**: Supports behavior change and preventive health, not just gym administration
- **Core Movement Concepts**: Movement Journeys, Movement Tiles, Movement Events, Adherence, Streaks, Movement Prescription Profiles (MPPs)
- **Health Outcomes**: Preventive care, habit formation, engagement metrics

### **Architectural Boundaries**
- **ZMOS Scope**: Movement domain logic, providers, journeys, tiles, events, adherence, streaks, challenges, corporate accounts
- **ZHEP Scope**: Global identity, benefits/wallets, payments, messaging, health score engine, analytics
- **Ports & Adapters**: Clean interfaces for ZHEP integrations (no hard dependencies)

### **AI-DLC Process**
Every feature follows: **Problem Framing → AI Elaboration → Design Decision → Implementation with AI Assist → Demo & Acceptance**

### **Technical Stack**
- **Backend**: NestJS + TypeScript + PostgreSQL + Prisma (explicit deviation from Fastify+Drizzle blueprint)
- **AI Tools**: Cursor/ChatGPT for design and implementation assistance
- **Architecture**: Ports & Adapters pattern with clean ZMOS/ZHEP boundaries

## Current Implementation Status ✅

### ✅ Completed Components

#### 1. **Core Infrastructure**
- ✅ NestJS application setup with TypeScript
- ✅ PostgreSQL database configuration
- ✅ Prisma ORM with client extensions
- ✅ Development tooling (ESLint, Prettier, Jest)
- ✅ Commit conventions and Git workflow

#### 2. **Multi-Tenant Architecture**
- ✅ Tenant middleware (`x-tenant-id` header validation)
- ✅ CLS context management (`nestjs-cls`)
- ✅ Prisma client extensions for automatic tenant filtering
- ✅ Global tenant isolation across all operations

#### 3. **Authentication System**
- ✅ JWT-based authentication with `passport-jwt`
- ✅ Password hashing with `bcrypt`
- ✅ Public routes with `@Public()` decorator
- ✅ Global authentication guard

#### 4. **Database Schema**
- ✅ **Tenant** model with UUID primary key
- ✅ **Member** model with tenant isolation
- ✅ Unique constraint on `(email, tenantId)`
- ✅ Proper indexing and relationships

#### 5. **API Structure**
- ✅ RESTful authentication endpoints
- ✅ Class-validator DTOs
- ✅ Proper error handling
- ✅ Modular architecture

## Implementation Phases (AI-DLC Compliant)

### Phase 0 – Alignment & Infra Hardening ✅ (COMPLETED)

**Status**: Infrastructure foundations established and aligned with ZMOS domain requirements.

#### Objectives
- ✅ Confirm stack, patterns and naming alignment with ZMOS domain
- ✅ Add cross-cutting infrastructure pieces
- ✅ Introduce AI-DLC artifacts structure

#### Deliverables ✅
- ✅ **Stack Confirmation**: NestJS + Prisma + Postgres confirmed (documented deviation from Fastify+Drizzle)
- ✅ **AI-DLC Folders**: `design/` and `docs/` folders with templates
- ✅ **Audit Logging**: `AuditLog` table and `AuditService` for compliance
- ✅ **Health & Readiness**: `/health` and `/ready` endpoints
- ✅ **Observability**: Structured logging with tenant/request IDs
- ✅ **Rate Limiting**: Basic throttling on auth endpoints
- ✅ **README & Tech Profile**: Updated documentation

**AI-DLC Compliance**: Infrastructure setup completed with proper documentation.

---

### Phase 1 – Core Platform & Auth ✅ (COMPLETED)

**Status**: Authentication and multi-tenant foundations solid, ready for movement domain features.

#### Objectives
- ✅ Ensure consistent multi-tenancy (every relevant table has `tenantId`)
- ✅ Clean up auth & user models to align with ZMOS entities
- ✅ Add missing profile/onboarding pieces

#### Deliverables ✅
- ✅ **Multi-Tenant Enforcement**: Prisma extensions + CLS context working
- ✅ **Auth Enhancement**: Email verification, password reset, enhanced profiles
- ✅ **Audit Hooks**: Logging for tenant/member creation and auth events
- ✅ **API Endpoints**: RESTful auth APIs with proper validation

**AI-DLC Compliance**: Foundation features implemented with basic testing and documentation.

#### Objectives
- Establish multi-tenant architecture
- Implement secure authentication
- Set up development workflow

#### Deliverables ✅
- [x] Multi-tenant database schema
- [x] JWT authentication system
- [x] Tenant middleware and CLS context
- [x] Prisma client extensions
- [x] Development tooling setup
- [x] Git workflow and conventions

### Phase 2 – MoveOS Walking Skeleton 🚧 (CURRENT)

**AI-DLC Required**: ✅ Full compliance required for all features

**Goal**: Get the core movement flow working end-to-end for a single tenant.

**Walking Skeleton Flow**: `Tenant → Location → SessionType → SessionInstance → Booking → MovementEvent → Simple Streak`

#### AI-DLC: Core Movement ERD Design Note (Required)
**Status**: Pending - Must be completed first
- **Location**: `design/moveos-core-erd-ai-elaboration.md`
- **Contents**: Table structures, relationships, constraints, basic API endpoints, edge cases
- **Review**: Client approval required before implementation

#### Objectives
- ✅ Implement core ERD entities relevant for MoveOS
- ✅ Allow providers to: Create locations, define class/PT types, schedule sessions, register members, book/check-in, generate MovementEvents
- ✅ Simple streak calculation per member

#### Domain Entities (Prisma Models)
```prisma
model Location {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @db.Uuid
  name      String
  address   String?
  capacity  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant           Tenant           @relation(fields: [tenantId], references: [id])
  sessionInstances SessionInstance[]

  @@index([tenantId])
}

model SessionType {
  id          String @id @default(uuid()) @db.Uuid
  tenantId    String @db.Uuid
  name        String
  description String?
  durationMin Int
  category    String // 'class', 'pt', 'group'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant           Tenant           @relation(fields: [tenantId], references: [id])
  sessionInstances SessionInstance[]

  @@index([tenantId])
}

model SessionInstance {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @db.Uuid
  sessionTypeId String  @db.Uuid
  locationId   String   @db.Uuid
  startTime    DateTime
  endTime      DateTime
  capacity     Int?
  status       String   @default("scheduled") // 'scheduled', 'cancelled', 'completed'
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant     @relation(fields: [tenantId], references: [id])
  sessionType  SessionType @relation(fields: [sessionTypeId], references: [id])
  location     Location   @relation(fields: [locationId], references: [id])
  bookings     Booking[]

  @@index([tenantId])
  @@index([startTime])
}

model Booking {
  id               String   @id @default(uuid()) @db.Uuid
  tenantId         String   @db.Uuid
  memberId         String   @db.Uuid
  sessionInstanceId String  @db.Uuid
  status           String   @default("confirmed") // 'confirmed', 'cancelled', 'no_show', 'attended'
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  member          Member          @relation(fields: [memberId], references: [id])
  sessionInstance SessionInstance @relation(fields: [sessionInstanceId], references: [id])

  @@index([tenantId])
  @@index([memberId])
}

model MovementEvent {
  id               String   @id @default(uuid()) @db.Uuid
  tenantId         String   @db.Uuid
  memberId         String   @db.Uuid
  sessionInstanceId String? @db.Uuid
  type             String   // 'class_attendance', 'gym_checkin', 'booking_created', etc.
  metadata         Json?    // Additional event data
  createdAt        DateTime @default(now())

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  member          Member          @relation(fields: [memberId], references: [id])
  sessionInstance SessionInstance? @relation(fields: [sessionInstanceId], references: [id])

  @@index([tenantId])
  @@index([memberId])
  @@index([createdAt])
}
```

#### Deliverables
- [ ] AI elaboration design note for MoveOS core ERD
- [ ] Database migrations for all entities
- [ ] Provider APIs: locations, session types, scheduling
- [ ] Booking & check-in APIs with MovementEvent generation
- [ ] Simple streak calculation (consecutive days with events)
- [ ] End-to-end demo script and tests

**AI-DLC Compliance**: Must follow full process with design note, tests, and demo.

#### Implementation Details

##### 2.1 User Registration Enhancement
```typescript
// Extend signup DTO
export class EnhancedSignupDto extends SignupDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}

// Add email verification
export class EmailVerificationDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  verificationCode: string;
}
```

##### 2.2 User Profile Management
```typescript
// User profile entity
export class UserProfile {
  id: string;
  userId: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone: string;
  language: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Profile update DTO
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
```

##### 2.3 Onboarding System
- Welcome email system
- Profile completion tracking
- Feature introduction tours
- Quick start guides

### Phase 3 – PulseLoop Basics

**AI-DLC Required**: ✅ Full compliance for habit signals implementation

**Goal**: Turn raw MovementEvents into habit signals: streaks, simple adherence, basic challenges.

#### AI-DLC: PulseLoop Design Note (Required)
- **Location**: `design/pulseloop-v1-ai-elaboration.md`
- **Contents**: MovementEvent classification, adherence formula, challenge structure, test cases

#### Objectives
- ✅ Formalize MovementEvent types
- ✅ Introduce Movement Tiles as micro-activities
- ✅ Compute Movement Adherence Score per member
- ✅ Implement basic challenges & leaderboards

#### Domain Entities
```prisma
model MovementTile {
  id             String   @id @default(uuid()) @db.Uuid
  tenantId       String   @db.Uuid
  name           String
  description    String?
  type           String   // 'cardio', 'strength', 'flexibility', 'balance'
  durationMin    Int
  difficulty     String   @default("intermediate") // 'beginner', 'intermediate', 'advanced'
  instructions   String[] // JSON array
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  tenant         Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}

model Challenge {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @db.Uuid
  name        String
  description String?
  type        String   // 'streak', 'attendance', 'duration', 'tile_completion'
  targetValue Int      // e.g., 10 sessions, 5 hours, etc.
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  tenant             Tenant              @relation(fields: [tenantId], references: [id])
  participants       ChallengeParticipant[]

  @@index([tenantId])
  @@index([isActive])
}

model ChallengeParticipant {
  id          String   @id @default(uuid()) @db.Uuid
  challengeId String   @db.Uuid
  memberId    String   @db.Uuid
  tenantId    String   @db.Uuid
  currentValue Int     @default(0)
  completed   Boolean  @default(false)
  joinedAt    DateTime @default(now())

  challenge   Challenge @relation(fields: [challengeId], references: [id])
  member     Member    @relation(fields: [memberId], references: [id])

  @@unique([challengeId, memberId])
  @@index([tenantId])
}
```

#### Implementation Tasks
1. **Extend MovementEvent** with type classification
2. **Movement Tiles** API (list, assign to members)
3. **Adherence Calculation** (simple formula: actual/target for time period)
4. **Challenge System** (creation, joining, progress tracking)
5. **Basic Leaderboards** (top performers per challenge)

#### Deliverables
- [ ] PulseLoop v1 with adherence scoring and tiles
- [ ] Basic challenges and leaderboards
- [ ] Tests and demo for adherence/challenge flows
- [ ] Design documentation for adherence formula

**AI-DLC Compliance**: Design note, tests, and acceptance demo required.

##### 3.2 Authorization Guards
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.checkPermissions(user, requiredPermissions);
  }
}
```

### Phase 4 – CarePath Move v1

**AI-DLC Required**: ✅ For journey structure and adherence logic

**Goal**: Introduce structured Movement Journeys and tie adherence to journeys.

#### AI-DLC: CarePath Move Design Note (Required)
- **Location**: `design/carepath-move-v1-ai-elaboration.md`
- **Contents**: Journey structure, tile relationships, journey-level adherence, coach APIs

#### Objectives
- ✅ Create MovementJourney entity and JourneyEnrollment
- ✅ Attach simple goals/targets to journeys
- ✅ Compute adherence per JourneyEnrollment

#### Domain Entities
```prisma
model MovementJourney {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @db.Uuid
  name          String
  description   String?
  durationWeeks Int
  targetAdherence Float  @default(0.7) // 70% target
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant      Tenant             @relation(fields: [tenantId], references: [id])
  enrollments JourneyEnrollment[]

  @@index([tenantId])
  @@index([isActive])
}

model JourneyEnrollment {
  id            String   @id @default(uuid()) @db.Uuid
  journeyId     String   @db.Uuid
  memberId      String   @db.Uuid
  tenantId      String   @db.Uuid
  startDate     DateTime
  endDate       DateTime?
  currentAdherence Float  @default(0.0)
  status        String   @default("active") // 'active', 'completed', 'paused'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  journey      MovementJourney @relation(fields: [journeyId], references: [id])
  member       Member          @relation(fields: [memberId], references: [id])

  @@unique([journeyId, memberId])
  @@index([tenantId])
  @@index([status])
}
```

#### Implementation Tasks
1. **Journey Management** APIs (create, list, enroll members)
2. **Journey Progress** tracking and adherence calculation
3. **Coach/Console APIs** for monitoring member progress
4. **Simple Goal Setting** (attendance %, duration targets)

#### Deliverables
- [ ] MovementJourney and JourneyEnrollment models + APIs
- [ ] Journey-level adherence calculation
- [ ] Coach console for monitoring progress
- [ ] Tests and demo for journey enrollment/adherence

**AI-DLC Compliance**: Design note, implementation with AI assist, tests, and demo required.

### Phase 5 – Corporate Accounts & Movement Packages

**AI-DLC Required**: ✅ For enterprise program logic

**Goal**: Support corporate deals in ZMOS-only mode (employers buying access).

#### AI-DLC: Corporate Design Note (Required)
- **Location**: `design/corporate-accounts-v1-ai-elaboration.md`

#### Objectives
- ✅ Add CorporateAccount and CorporateMember
- ✅ Bind corporate accounts to AccessPlans/MovementJourneys
- ✅ Basic corporate reporting

#### Domain Entities
```prisma
model CorporateAccount {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @db.Uuid  // The ZMOS tenant (movement provider)
  companyName String
  contactEmail String
  contractStart DateTime
  contractEnd   DateTime?
  maxMembers   Int?
  status       String   @default("active") // 'active', 'suspended', 'expired'
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant   Tenant            @relation(fields: [tenantId], references: [id])
  members  CorporateMember[]
  packages CorporatePackage[]

  @@index([tenantId])
  @@index([status])
}

model CorporateMember {
  id                 String   @id @default(uuid()) @db.Uuid
  corporateAccountId String   @db.Uuid
  memberId          String   @unique @db.Uuid
  tenantId           String   @db.Uuid
  employeeId         String?  // Company employee ID
  status             String   @default("active")
  joinedAt           DateTime @default(now())

  corporateAccount   CorporateAccount @relation(fields: [corporateAccountId], references: [id])
  member             Member           @relation(fields: [memberId], references: [id])

  @@unique([corporateAccountId, memberId])
  @@index([tenantId])
}

model CorporatePackage {
  id                 String @id @default(uuid()) @db.Uuid
  corporateAccountId String @db.Uuid
  name               String // e.g., "Executive Wellness Package"
  journeyId          String? @db.Uuid // Optional linked journey
  sessionAllowance   Int?   // Monthly session limit
  effectiveDate      DateTime
  expiryDate         DateTime?

  corporateAccount   CorporateAccount @relation(fields: [corporateAccountId], references: [id])
  journey            MovementJourney? @relation(fields: [journeyId], references: [id])

  @@index([corporateAccountId])
}
```

#### Implementation Tasks
1. **Corporate Account Management** APIs
2. **Corporate Member Enrollment** and management
3. **Package Assignment** (journeys, session limits)
4. **Corporate Reporting** (participation, utilization)

#### Deliverables
- [ ] Corporate accounts working end-to-end in ZMOS-only mode
- [ ] Corporate member management and package assignment
- [ ] Basic corporate reporting APIs
- [ ] Tests and demo for corporate workflows

**AI-DLC Compliance**: Design note and full AI-DLC process required.

### Phase 6 – ZHEP Ports & Integration Adapters

**AI-DLC Required**: ✅ For integration interface design

**Goal**: Prepare ZMOS to work as movement vertical inside ZHEP without breaking standalone mode.

#### AI-DLC: Integration Design Note (Required)
- **Location**: `design/zhep-integration-ports-ai-elaboration.md`
- **Contents**: Port interfaces, adapter patterns, mode switching

#### Objectives
- ✅ Define ports/interfaces for cross-cutting concerns
- ✅ Implement stubbed adapters (can be fake initially)
- ✅ Configuration for ZMOS-only vs ZHEP modes

#### Ports to Implement
1. **IdentityService** - User authentication/authorization
2. **EligibilityService** - Benefits and coverage checking
3. **PaymentService** - Transaction processing
4. **MessagingService** - Email/SMS notifications
5. **AnalyticsService** - Data aggregation and reporting

#### Implementation Tasks
1. **Port Interfaces** in `core/ports/` module
2. **Stub Adapters** with fake responses for development
3. **Configuration System** for mode switching
4. **Integration Tests** for port compatibility

#### Deliverables
- [ ] Port interfaces defined and documented
- [ ] Stub ZHEP adapters implemented
- [ ] Configuration for mode switching
- [ ] Seamless operation in both standalone and ZHEP modes

**AI-DLC Compliance**: Integration design note required.

### Phase 7 – Frontend MVPs

**AI-DLC Required**: ✅ For UI/UX design and user flows

**Goal**: Provide usable UIs for providers and basic member access to prove end-to-end flows.

#### Objectives
- ✅ Provider Console MVP (tenant management, scheduling, reporting)
- ✅ Member Portal MVP (schedule viewing, booking, basic progress)

#### Implementation Tasks
1. **Provider Console APIs** (backend readiness check)
2. **Member APIs** (schedule, booking, progress)
3. **Authentication Flows** (provider vs member logins)
4. **Basic Responsive UI** implementation

#### Deliverables
- [ ] Provider Console MVP with core functionality
- [ ] Member Portal MVP with essential features
- [ ] End-to-end user flows tested
- [ ] UI/UX design notes and user testing

**AI-DLC Compliance**: UI design elaboration required.

### Phase 8 – Hardening, CI/CD, Observability & Production Readiness

**AI-DLC Required**: ✅ For infrastructure and monitoring design

**Goal**: Make ZMOS safe, observable, and deployable to production.

#### Objectives
- ✅ Comprehensive tests (unit + integration + e2e)
- ✅ CI/CD pipelines
- ✅ Observability & monitoring
- ✅ Security hardening, backups, DR

#### Implementation Tasks
1. **Test Coverage** > 80% with meaningful automated tests
2. **CI/CD Pipeline** (linting, testing, deployment)
3. **Containerization** with health/readiness probes
4. **Monitoring Stack** (Prometheus, Grafana, Sentry)
5. **Security Audit** and hardening
6. **Backup & Recovery** procedures

#### Deliverables
- [ ] CI/CD pipelines defined and operational
- [ ] Monitoring and alerting implemented
- [ ] Security hardening completed
- [ ] Backup/recovery procedures documented
- [ ] ZMOS ready for pilot deployments

**AI-DLC Compliance**: Infrastructure design notes for monitoring and deployment.

## Database Schema Evolution

### Current Schema (Phase 1)
```prisma
model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  createdAt DateTime @default(now()) @updatedAt
  updatedAt DateTime @updatedAt
  members   Member[]
}

model Member {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @db.Uuid
  email        String
  passwordHash String
  name         String?
  createdAt    DateTime @default(now()) @updatedAt
  updatedAt    DateTime @updatedAt
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([email, tenantId])
  @@index([tenantId])
}
```

### Future Schema Expansions

#### Phase 2: User Management
```prisma
model UserProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @db.Uuid
  tenantId    String   @db.Uuid
  firstName   String?
  lastName    String?
  avatar      String?
  timezone    String   @default("UTC")
  language    String   @default("en")
  preferences Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   Member @relation(fields: [userId], references: [id])
  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([userId])
  @@index([tenantId])
}

model EmailVerification {
  id          String   @id @default(uuid()) @db.Uuid
  email       String
  tenantId    String   @db.Uuid
  code        String
  expiresAt   DateTime
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())

  @@unique([email, tenantId, code])
  @@index([expiresAt])
}
```

#### Phase 3: RBAC
```prisma
model Role {
  id          String       @id @default(uuid()) @db.Uuid
  tenantId    String       @db.Uuid
  name        String
  description String?
  permissions String[]     // JSON array of permissions
  isSystem    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  users       UserRole[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model UserRole {
  id       String @id @default(uuid()) @db.Uuid
  userId   String @db.Uuid
  tenantId String @db.Uuid
  roleId   String @db.Uuid

  user     Member @relation(fields: [userId], references: [id])
  role     Role   @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
  @@index([userId])
  @@index([tenantId])
}
```

## API Specification

### Current Endpoints (Phase 1)
```
POST   /auth/signup    - User registration
POST   /auth/login     - User authentication
```

### Planned Endpoints

#### Phase 2: User Management
```
GET    /users/profile       - Get user profile
PUT    /users/profile       - Update user profile
POST   /auth/verify-email   - Verify email address
POST   /auth/forgot-password - Request password reset
POST   /auth/reset-password  - Reset password
```

#### Phase 3: Administration
```
GET    /admin/users          - List tenant users
POST   /admin/users          - Create user
PUT    /admin/users/:id      - Update user
DELETE /admin/users/:id      - Delete user
GET    /admin/roles          - List roles
POST   /admin/roles          - Create role
```

#### Phase 4: Notifications
```
GET    /notifications        - Get user notifications
PUT    /notifications/:id    - Mark as read
DELETE /notifications/:id   - Delete notification
PUT    /users/preferences    - Update notification preferences
```

## Development Workflow

### Branching Strategy
```
main (production)
├── develop (integration)
│   ├── capra-nubiana/feature/onboarding
│   ├── capra-nubiana/feature/user-management
│   └── capra-nubiana/bugfix/auth-validation
```

### Commit Convention
```
feat(onboarding): implement welcome email system
fix(auth): resolve JWT token expiration issue
docs(api): add user management endpoints documentation
```

### Code Quality Standards
- ESLint configuration for TypeScript
- Prettier for code formatting
- Jest for unit and integration testing
- Husky for pre-commit hooks
- Commitlint for commit message validation

## Risk Assessment & Mitigation

### Technical Risks
- **Multi-tenant data isolation**: Mitigated by Prisma extensions and CLS context
- **Performance at scale**: Mitigated by proper indexing and query optimization
- **Security vulnerabilities**: Mitigated by input validation and authentication guards

### Operational Risks
- **Database connection issues**: Mitigated by connection pooling and retry logic
- **Rate limiting abuse**: Mitigated by request throttling
- **Data loss**: Mitigated by regular backups and transaction management

## Success Metrics

### Technical Metrics
- API response time < 200ms
- Test coverage > 80%
- Uptime > 99.9%
- Zero data leaks between tenants

### Business Metrics
- Successful tenant registrations
- User engagement and retention
- Support ticket volume
- Time to onboard new tenants

## Timeline & Milestones

### Q1 2025: Foundation (COMPLETED ✅)
- Multi-tenant architecture
- Authentication system
- Development infrastructure

### Q2 2025: User Management (CURRENT 🚧)
- Enhanced user profiles
- Onboarding workflows
- Email verification

### Q3 2025: Advanced Features
- Role-based access control
- Notification system
- API gateway

### Q4 2025: Production Readiness
- Comprehensive testing
- Performance optimization
- Deployment automation

## AI-DLC Compliance & Working Agreement Alignment

This implementation plan is designed to comply with the **Zimasa MotionOS AI-DLC Working Agreement**:

### ✅ **Aligned Principles**
- **Movement as Health Engagement**: All phases focus on movement domain logic supporting behavior change and preventive health
- **Ports & Adapters Pattern**: Clean separation between ZMOS movement domain and ZHEP shared capabilities
- **ZMOS Standalone Capability**: All features work independently of ZHEP integrations
- **Small, Documented Increments**: Each phase delivers working, tested functionality

### ✅ **AI-DLC Integration**
- **Problem Framing**: Each phase includes clear objectives and deliverables
- **AI Elaboration**: Technical specifications include data models, APIs, and edge cases
- **Design Decisions**: Architecture reviews ensure domain integrity
- **Implementation with AI Assist**: All development leverages AI tools
- **Demo & Acceptance**: Each phase includes testing and validation

### ✅ **Domain Boundaries**
- **ZMOS Scope**: Movement Journeys, Tiles, Events, Adherence, MPPs, Corporate Accounts
- **ZHEP Integration**: Identity, eligibility, payments, messaging through clean ports
- **No Hard Dependencies**: ZHEP integrations are optional adapters

### ✅ **Quality Standards**
- **Tests**: Each phase includes unit and integration tests
- **Documentation**: AI design notes and feature documentation
- **Code Quality**: Domain-aligned naming and clean architecture
- **Security**: Tenant isolation and proper authentication

## Development Workflow Alignment

### **Branching Strategy** (Aligned with Working Agreement)
```
main (production)
├── develop (integration)
│   ├── capra-nubiana/feature/movement-onboarding
│   ├── capra-nubiana/feature/pulse-integration
│   └── capra-nubiana/feature/corporate-accounts
```

### **AI-DLC per Feature** (Required for all development)
1. **Problem Framing** → Create issue with use case and constraints
2. **AI Elaboration** → Generate design notes with data models and APIs
3. **Design Decision** → Client review and approval
4. **Implementation** → Code with AI assistance + tests
5. **Demo & Acceptance** → Testing and client approval

## Success Metrics Alignment

- **Domain Integrity**: Features support movement as health engagement
- **Architectural Cleanliness**: Clear ZMOS/ZHEP boundaries maintained
- **AI-DLC Compliance**: Every feature follows the AI-assisted process
- **Standalone Capability**: ZMOS works independently of ZHEP

## AI-DLC Compliance & Working Agreement Alignment

This implementation plan is designed to **fully comply** with the **Zimasa MotionOS AI-DLC Working Agreement**:

### ✅ **Aligned Principles**
- **Movement as Health Engagement**: All phases focus on movement domain logic supporting behavior change and preventive health
- **Ports & Adapters Pattern**: Clean separation between ZMOS movement domain and ZHEP shared capabilities
- **ZMOS Standalone Capability**: All features work independently of ZHEP integrations
- **Small, Documented Increments**: Each phase delivers working, tested functionality
- **AI-DLC by Default**: Every feature follows the AI-assisted cycle

### ✅ **AI-DLC Integration per Phase**
- **Phase 0**: Infrastructure setup with documentation
- **Phase 1**: Auth foundations (already implemented)
- **Phase 2-8**: Each requires AI elaboration → design decision → implementation with AI assist → demo & acceptance

### ✅ **Domain Integrity**
- **Movement-Centric**: Core domain entities (Journeys, Tiles, Events, Adherence, MPPs)
- **Health Outcomes**: Focus on preventive care and behavior change
- **ZHEP Boundaries**: Clean architectural separation maintained

### ✅ **Quality Standards**
- **Tests**: Each phase includes unit + integration tests
- **Documentation**: AI design notes + feature docs
- **Code Quality**: Domain-aligned naming and clean architecture
- **Security**: Tenant isolation and proper authentication

## Development Workflow Alignment

### **Branching Strategy** (Aligned)
```
main (production)
├── develop (integration)
│   ├── capra-nubiana/feature/onboarding
│   ├── capra-nubiana/feature/moveos-core
│   └── capra-nubiana/feature/pulseloop
```

### **AI-DLC per Feature** (Required)
1. **Problem Framing** → Create issue with use case
2. **AI Elaboration** → Generate design notes with data models/APIs
3. **Design Decision** → Client review and approval
4. **Implementation** → Code with AI assistance + tests
5. **Demo & Acceptance** → Testing and client approval

## Success Metrics Alignment

- **Domain Integrity**: Features support movement as health engagement
- **Architectural Cleanliness**: Clear ZMOS/ZHEP boundaries
- **AI-DLC Compliance**: Every feature follows the AI-assisted process
- **Standalone Capability**: ZMOS works independently of ZHEP
- **Quality Standards**: Comprehensive testing and documentation

## Current Implementation Status

### ✅ **Completed Phases:**
- **Phase 0**: Infrastructure & AI-DLC setup ✅
- **Phase 1**: Core platform & auth ✅

### 🚧 **Current Phase:**
- **Phase 2**: MoveOS Walking Skeleton (in progress)

### 📋 **Planned Phases:**
- **Phase 3**: PulseLoop Basics
- **Phase 4**: CarePath Move v1
- **Phase 5**: Corporate Accounts
- **Phase 6**: ZHEP Ports & Integration
- **Phase 7**: Frontend MVPs
- **Phase 8**: Production Hardening

## Conclusion

This consolidated implementation plan serves as the **definitive roadmap** for ZMOS development, fully aligned with the Zimasa MotionOS AI-DLC Working Agreement. It ensures:

- **Domain Integrity**: Movement as health engagement focus maintained
- **AI-DLC Compliance**: Every feature follows the AI-assisted process
- **Architectural Cleanliness**: Ports & adapters pattern implemented
- **Quality Assurance**: Comprehensive testing and documentation
- **Incremental Delivery**: Working slices delivered in each phase

The plan provides clear guidance for implementing ZMOS as a robust, AI-driven multi-tenant SaaS platform that supports preventive health through movement engagement.
