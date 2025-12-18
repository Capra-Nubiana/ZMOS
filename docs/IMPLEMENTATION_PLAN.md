# ZMOS Implementation Plan

## Overview

**ZMOS (Zimasa MotionOS)** is a Movement & Fitness OS for the Zimasa Health Engagement Platform. It provides multi-tenant SaaS capabilities with AI-driven development lifecycle, focusing on movement as health engagement rather than generic gym operations.

This implementation follows the **AI-Driven Development Lifecycle (AI-DLC)** and **Ports & Adapters** architectural pattern, ensuring clean separation between ZMOS movement domain logic and ZHEP shared platform capabilities.

## Core Requirements

Based on `docs/project-rules.md` and `docs/Zimasa MotionOS (ZMOS) – AI-DLC Working Agreement.md`:

### **Domain Requirements**
- **Movement-Centric**: Movement Journeys, Movement Tiles, Movement Events, Movement Adherence Score, Movement Prescription Profiles (MPPs)
- **Health Engagement Focus**: Behavior change and preventive health, not just administrative operations
- **Multi-tenant SaaS** with shared database/schema for gyms and corporate accounts

### **Technical Requirements**
- **AI-DLC Process**: Every feature follows AI elaboration → design review → implementation cycle
- **Tenant isolation** via `nestjs-cls` and Prisma extensions
- **JWT authentication** for tenant members
- **Ports & Adapters pattern** with clean ZMOS/ZHEP boundaries
- **PostgreSQL** with Prisma ORM

### **Architectural Boundaries**
- **ZMOS owns**: Movement domain logic, Movement providers, Journeys, Tiles, Events, Adherence, Streaks, Challenges
- **ZHEP owns**: Global Party/Identity, Benefits, Payments, Messaging, Health Score Engine, Analytics

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

## Implementation Plan Phases

### Phase 1: Foundation & Authentication ✅ (COMPLETED)

**AI-DLC Status**: ✅ Implemented without AI assistance (initial setup)

**Deliverables**:
- ✅ Multi-tenant database schema with Tenant/Member models
- ✅ JWT authentication system with bcrypt
- ✅ Prisma client extensions for tenant isolation
- ✅ CLS context management with nestjs-cls
- ✅ RESTful API endpoints with class-validator DTOs
- ✅ Development tooling and Git workflow

**Domain Alignment**: Generic authentication foundation ready for movement-specific features

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

### Phase 2: Core Movement Domain & AI-DLC Setup 🚧 (CURRENT)

**AI-DLC Required**: ✅ Every feature must follow AI elaboration process

**Modules to Implement** (from Working Agreement):
- **MoveOS**: Core movement domain logic
- **PulseLoop**: Movement tracking and monitoring
- **CarePath Move**: Care pathway movement prescriptions
- **Corporate Accounts**: Enterprise movement programs

#### Objectives
- Establish core conceptual data model (MovementJourney, MovementEvent, MovementTile, etc.)
- Implement AI-DLC workflow for all features
- Create movement domain entities and services
- Set up movement prescription profiles (MPPs)
- Build adherence scoring system

#### AI-DLC Process per Feature
1. **Problem Framing**: Create ticket with use case and constraints
2. **AI Elaboration**: Generate design notes with data models, APIs, edge cases
3. **Design Decision**: Client review and approval
4. **Implementation**: Code with AI assistance, tests, docs
5. **Demo & Acceptance**: Test scenarios and client approval

#### Deliverables
- [ ] Core conceptual ERD with movement domain entities
- [ ] MovementJourney, MovementEvent, MovementTile models
- [ ] Movement Prescription Profile (MPP) system
- [ ] Basic adherence calculation engine
- [ ] AI-DLC workflow documentation and templates
- [ ] Movement domain glossary and terminology guide

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

### Phase 3: Movement Prescription & Care Integration

**AI-DLC Required**: ✅ Full AI elaboration for prescription logic

#### Objectives
- Implement Movement Prescription Profiles (MPPs)
- Create care pathway movement integration
- Build prescription adherence monitoring
- Connect with ZHEP eligibility and benefits systems

#### Deliverables
- [ ] MPP creation and management APIs
- [ ] CarePath Move integration adapters
- [ ] Prescription assignment to users
- [ ] Movement adherence tracking against prescriptions
- [ ] ZHEP eligibility port (non-hard dependency)

#### Domain Entities
```typescript
// Movement Prescription Profile
export class MovementPrescriptionProfile {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  movementTiles: MovementTile[];
  durationWeeks: number;
  targetAdherence: number;
  carePathwayId?: string; // Optional ZHEP integration
}

// Movement Tile (building block of prescriptions)
export class MovementTile {
  id: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'balance';
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
}
```

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

### Phase 4: Movement Analytics & Reporting

**AI-DLC Required**: ✅ For analytics algorithms and reporting logic

#### Objectives
- Build movement adherence analytics
- Create movement journey progress tracking
- Implement streak and challenge systems
- Generate movement health insights

#### Deliverables
- [ ] Movement adherence score calculation
- [ ] Journey progress analytics APIs
- [ ] Streak tracking and rewards system
- [ ] Movement challenge creation and monitoring
- [ ] Basic health insights dashboard data
- [ ] Movement event aggregation and reporting

### Phase 5: Corporate Accounts & Enterprise Features

**AI-DLC Required**: ✅ For enterprise movement program logic

#### Objectives
- Implement corporate account management
- Create enterprise movement programs
- Build team/group movement challenges
- Add corporate reporting and analytics

#### Deliverables
- [ ] Corporate account creation and management
- [ ] Enterprise movement program templates
- [ ] Team-based challenges and competitions
- [ ] Corporate wellness dashboard
- [ ] Employee participation tracking
- [ ] Enterprise reporting APIs

### Phase 6: PulseLoop & Movement Tracking

**AI-DLC Required**: ✅ For movement tracking algorithms

#### Objectives
- Implement real-time movement tracking
- Create movement session recording
- Build pulse/heart rate integration
- Add movement quality assessment

#### Deliverables
- [ ] Movement session start/stop tracking
- [ ] Real-time movement data capture
- [ ] Pulse/heart rate monitoring integration
- [ ] Movement form/quality assessment
- [ ] Session summary and analytics
- [ ] Historical movement data storage

### Phase 7: Testing & Quality Assurance

#### Objectives
- Achieve comprehensive test coverage
- Implement CI/CD pipeline
- Add performance monitoring

#### Deliverables
- [ ] Unit test coverage > 80%
- [ ] Integration tests
- [ ] E2E test suite
- [ ] CI/CD pipeline
- [ ] Performance monitoring

### Phase 7: Integration & ZHEP Ports

**AI-DLC Required**: ✅ For integration adapter design

#### Objectives
- Implement ZHEP integration ports
- Create identity and eligibility adapters
- Build payment and messaging interfaces
- Ensure clean architectural boundaries

#### Deliverables
- [ ] Identity service port (non-hard dependency)
- [ ] Eligibility/benefits adapter
- [ ] Payment orchestration interface
- [ ] Messaging infrastructure adapter
- [ ] Health score engine integration port

### Phase 8: Production Deployment & Monitoring

#### Objectives
- Set up production deployment pipeline
- Implement comprehensive monitoring
- Create backup and disaster recovery
- Establish security hardening

#### Deliverables
- [ ] Docker containerization with health checks
- [ ] Kubernetes deployment with auto-scaling
- [ ] Comprehensive monitoring (Prometheus/Grafana)
- [ ] Automated backup and recovery procedures
- [ ] Security hardening and compliance auditing
- [ ] Performance optimization and load testing

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

## Conclusion

This implementation plan is **fully aligned** with the Zimasa MotionOS AI-DLC Working Agreement. It respects:

- **Domain boundaries** between ZMOS movement logic and ZHEP platform capabilities
- **AI-DLC process** requirements for every feature development
- **Movement-centric focus** on health engagement rather than generic gym operations
- **Clean architecture** with ports & adapters for cross-cutting concerns
- **Quality standards** for testing, documentation, and code quality

The phased approach ensures incremental delivery while maintaining architectural integrity and domain alignment. Each phase builds upon the previous one, creating a comprehensive Movement & Fitness OS that supports preventive health and behavior change.
