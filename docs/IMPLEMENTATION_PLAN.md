# ZMOS Implementation Plan

## Overview

ZMOS is a multi-tenant SaaS backend platform built with NestJS, Prisma, and PostgreSQL. The system provides tenant-isolated authentication and user management with a clean architecture following the ports & adapters pattern.

## Core Requirements

Based on `docs/project-rules.md`:

- **Multi-tenant SaaS** with shared database/schema
- **Tenant isolation** via `nestjs-cls` and Prisma extensions
- **JWT authentication** for tenant members
- **Clean architecture** with no hard dependencies
- **PostgreSQL** with Prisma ORM

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

### Phase 2: User Management & Onboarding 🚧 (CURRENT)

#### Objectives
- Implement user registration and profile management
- Create onboarding workflows
- Add user preferences and settings

#### Deliverables
- [ ] User registration API with email verification
- [ ] User profile management
- [ ] Password reset functionality
- [ ] User preferences and settings
- [ ] Onboarding flow and welcome system

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

### Phase 3: Role-Based Access Control (RBAC)

#### Objectives
- Implement granular permissions system
- Create role management
- Add resource-level authorization

#### Deliverables
- [ ] Role definitions and permissions
- [ ] User-role assignments
- [ ] Resource-based authorization
- [ ] Admin role management interfaces

#### Implementation Details

##### 3.1 Permission System
```typescript
export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Tenant management
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',

  // System admin
  SYSTEM_ADMIN = 'system:admin'
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
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

### Phase 4: API Gateway & Rate Limiting

#### Objectives
- Implement API gateway for request routing
- Add rate limiting and throttling
- Create API versioning strategy

#### Deliverables
- [ ] API gateway configuration
- [ ] Rate limiting middleware
- [ ] API versioning
- [ ] Request logging and monitoring

### Phase 5: Notification System

#### Objectives
- Implement email and in-app notifications
- Create notification preferences
- Add webhook support

#### Deliverables
- [ ] Email service integration
- [ ] In-app notification system
- [ ] Notification preferences
- [ ] Webhook endpoints

### Phase 6: Audit Logging & Compliance

#### Objectives
- Implement comprehensive audit logging
- Add data retention policies
- Ensure GDPR compliance

#### Deliverables
- [ ] Audit log system
- [ ] Data export functionality
- [ ] GDPR compliance features
- [ ] Security monitoring

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

### Phase 8: Deployment & DevOps

#### Objectives
- Set up production deployment
- Implement monitoring and alerting
- Create backup and recovery procedures

#### Deliverables
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Backup and recovery
- [ ] SSL/TLS configuration

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

## Conclusion

This implementation plan provides a comprehensive roadmap for developing ZMOS as a robust, scalable multi-tenant SaaS platform. The foundation is solid, and the phased approach ensures incremental delivery of value while maintaining code quality and architectural integrity.

The current implementation (Phase 1) provides a strong foundation with proper tenant isolation, secure authentication, and clean architecture. Subsequent phases build upon this foundation to deliver a complete SaaS solution.
