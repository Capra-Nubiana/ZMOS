# ZMOS Testing Strategy

This document outlines the comprehensive testing strategy for the ZMOS platform, including unit testing, integration testing, end-to-end testing, performance testing, and CI/CD pipeline configuration.

## Testing Pyramid

```
┌─────────────────┐  End-to-End Tests (10%)
│   E2E Tests     │  User journey validation
│   (Black Box)   │  Business logic verification
└─────────────────┘
         │
┌─────────────────┐  Integration Tests (20%)
│ Integration     │  API contract testing
│   Tests         │  Component interaction
└─────────────────┘
         │
┌─────────────────┐  Unit Tests (70%)
│   Unit Tests    │  Function/method testing
│   (White Box)   │  Algorithm validation
└─────────────────┘
```

## Code Coverage Requirements

### Minimum Coverage Thresholds
```json
{
  "branches": 80,
  "functions": 85,
  "lines": 85,
  "statements": 85
}
```

### Coverage by Component
```json
{
  "controllers": {
    "branches": 90,
    "functions": 95,
    "lines": 90
  },
  "services": {
    "branches": 85,
    "functions": 90,
    "lines": 85
  },
  "utilities": {
    "branches": 95,
    "functions": 95,
    "lines": 95
  },
  "models": {
    "branches": 80,
    "functions": 85,
    "lines": 80
  }
}
```

### Coverage Exclusions
```javascript
// nyc configuration for exclusions
module.exports = {
  exclude: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'test/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    'src/generated/**',  // Generated Prisma client
    'scripts/**',
    'docs/**'
  ],
  excludeAfterRemap: false
};
```

## Unit Testing

### Service Layer Testing
```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '24h';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      tenantName: 'Test Tenant',
    };

    it('should create a new tenant and member successfully', async () => {
      // Arrange
      const expectedTenant = { id: 'tenant-123', name: 'Test Tenant' };
      const expectedMember = {
        id: 'member-456',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-123'
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(expectedTenant);
      mockPrismaService.member.create.mockResolvedValue(expectedMember);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');

      // Act
      const result = await service.signup(signupDto);

      // Assert
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { name: 'Test Tenant' },
      });
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: { name: 'Test Tenant' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrismaService.member.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          tenantId: 'tenant-123',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'member-456',
        email: 'test@example.com',
        tenantId: 'tenant-123',
      });
      expect(result).toEqual({
        member: expectedMember,
        token: 'jwt-token',
      });
    });

    it('should throw error if tenant already exists', async () => {
      // Arrange
      const existingTenant = { id: 'tenant-123', name: 'Test Tenant' };
      mockPrismaService.tenant.findUnique.mockResolvedValue(existingTenant);

      // Act & Assert
      await expect(service.signup(signupDto)).rejects.toThrow(
        'Tenant with name "Test Tenant" already exists'
      );
    });

    it('should throw error if member already exists', async () => {
      // Arrange
      const existingTenant = { id: 'tenant-123', name: 'Test Tenant' };
      const existingMember = {
        id: 'member-456',
        email: 'test@example.com',
        tenantId: 'tenant-123'
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(existingTenant);
      mockPrismaService.member.findUnique.mockResolvedValue(existingMember);

      // Act & Assert
      await expect(service.signup(signupDto)).rejects.toThrow(
        'Member with email "test@example.com" already exists in this tenant'
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should authenticate user successfully', async () => {
      // Arrange
      const member = {
        id: 'member-456',
        email: 'test@example.com',
        password: 'hashed-password',
        tenantId: 'tenant-123',
        name: 'Test User',
      };

      mockPrismaService.member.findUnique.mockResolvedValue(member);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockPrismaService.member.findUnique).toHaveBeenCalledWith({
        where: {
          email_tenantId: {
            email: 'test@example.com',
            tenantId: expect.any(String), // From ClsService
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toEqual({
        member: {
          id: 'member-456',
          email: 'test@example.com',
          name: 'Test User',
          tenantId: 'tenant-123',
        },
        token: 'jwt-token',
      });
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockPrismaService.member.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for incorrect password', async () => {
      // Arrange
      const member = {
        id: 'member-456',
        email: 'test@example.com',
        password: 'hashed-password',
        tenantId: 'tenant-123',
      };

      mockPrismaService.member.findUnique.mockResolvedValue(member);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });
});
```

### Controller Testing
```typescript
// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should call authService.signup with correct parameters', async () => {
      // Arrange
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        tenantName: 'Test Tenant',
      };

      const expectedResult = {
        member: { id: 'member-123' },
        token: 'jwt-token',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.signup(signupDto);

      // Assert
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signup errors', async () => {
      // Arrange
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        tenantName: 'Test Tenant',
      };

      mockAuthService.signup.mockRejectedValue(new Error('Signup failed'));

      // Act & Assert
      await expect(controller.signup(signupDto)).rejects.toThrow('Signup failed');
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        member: { id: 'member-123' },
        token: 'jwt-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle login errors', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(new Error('Login failed'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow('Login failed');
    });
  });
});
```

## Integration Testing

### API Contract Testing
```typescript
// test/auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.member.deleteMany();
    await prisma.tenant.deleteMany();
  });

  describe('POST /auth/signup', () => {
    it('should create tenant and member successfully', async () => {
      const signupData = {
        email: 'integration-test@example.com',
        password: 'password123',
        name: 'Integration Test User',
        tenantName: 'Integration Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201);

      expect(response.body).toHaveProperty('member');
      expect(response.body).toHaveProperty('token');
      expect(response.body.member.email).toBe(signupData.email);
      expect(response.body.member.name).toBe(signupData.name);

      // Verify database state
      const tenant = await prisma.tenant.findUnique({
        where: { name: signupData.tenantName },
      });
      expect(tenant).toBeTruthy();

      const member = await prisma.member.findUnique({
        where: {
          email_tenantId: {
            email: signupData.email,
            tenantId: tenant.id,
          },
        },
      });
      expect(member).toBeTruthy();
      expect(member.name).toBe(signupData.name);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '',
        tenantName: 'Test Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 409 for existing tenant', async () => {
      // Create tenant first
      await prisma.tenant.create({
        data: { name: 'Existing Tenant' },
      });

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        tenantName: 'Existing Tenant',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Setup test tenant and member
      const tenant = await prisma.tenant.create({
        data: { name: 'Login Test Tenant' },
      });

      await prisma.member.create({
        data: {
          email: 'login-test@example.com',
          password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8GYZQXgRe', // password123
          name: 'Login Test User',
          tenantId: tenant.id,
        },
      });

      this.testTenantId = tenant.id;
    });

    it('should authenticate user successfully', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', this.testTenantId)
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('member');
      expect(response.body).toHaveProperty('token');
      expect(response.body.member.email).toBe(loginData.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', this.testTenantId)
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});
```

## End-to-End Testing

### Complete User Journey Testing
```typescript
// test/moveos.e2e-spec.ts (already implemented in your codebase)
describe('MoveOS Walking Skeleton (e2e)', () => {
  // Implementation already exists in your codebase
  // Tests complete user flows from signup to check-in
});
```

### API Contract Validation
```typescript
// test/contract-validation.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Contract Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Test that all documented endpoints exist and return expected status codes
  const endpoints = [
    { method: 'POST', path: '/auth/signup', expectedStatus: 201 },
    { method: 'POST', path: '/auth/login', expectedStatus: 200 },
    { method: 'GET', path: '/locations', expectedStatus: 401 }, // Requires auth
    { method: 'GET', path: '/sessions', expectedStatus: 401 }, // Requires auth
    { method: 'GET', path: '/bookings', expectedStatus: 401 }, // Requires auth
  ];

  endpoints.forEach(({ method, path, expectedStatus }) => {
    it(`should return ${expectedStatus} for ${method} ${path}`, async () => {
      const req = request(app.getHttpServer())[method.toLowerCase()](path);

      if (expectedStatus === 401) {
        await req.expect(expectedStatus);
      } else {
        // Add authentication for protected endpoints
        await req.set('Authorization', `Bearer ${getTestToken()}`)
          .expect(expectedStatus);
      }
    });
  });
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# performance-tests.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load testing"
    - duration: 60
      arrivalRate: 100
      name: "Stress testing"

scenarios:
  - name: "User browsing sessions"
    weight: 70
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "loadtest@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - get:
          url: "/sessions"
          headers:
            Authorization: "Bearer {{ token }}"
            x-tenant-id: "load-test-tenant"
      - get:
          url: "/locations"
          headers:
            Authorization: "Bearer {{ token }}"
            x-tenant-id: "load-test-tenant"

  - name: "User booking session"
    weight: 30
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "loadtest@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - get:
          url: "/sessions/available"
          headers:
            Authorization: "Bearer {{ token }}"
            x-tenant-id: "load-test-tenant"
          capture:
            json: "$[0].id"
            as: "sessionId"
      - post:
          url: "/bookings"
          headers:
            Authorization: "Bearer {{ token }}"
            x-tenant-id: "load-test-tenant"
          json:
            sessionInstanceId: "{{ sessionId }}"
            notes: "Load test booking"
```

### JMeter Test Plan
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="ZMOS Load Test" enabled="true">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">http://localhost:3000</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Load Test Group" enabled="true">
        <intProp name="ThreadGroup.num_threads">50</intProp>
        <intProp name="ThreadGroup.ramp_time">30</intProp>
        <longProp name="ThreadGroup.duration">300</longProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
      </ThreadGroup>
      <hashTree>
        <!-- Authentication -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Login" enabled="true">
          <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.path">/auth/login</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <stringProp name="HTTPSampler.postBodyRaw">true</stringProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{"email":"loadtest@example.com","password":"password123"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <!-- Add more samplers for different endpoints -->
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit -- --coverage --passWithNoTests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zmos_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zmos_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          npx prisma migrate deploy
          npx prisma db seed

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zmos_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret

  performance:
    runs-on: ubuntu-latest
    needs: e2e
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Artillery
        run: npm install -g artillery

      - name: Run performance tests
        run: artillery run performance-tests.yml --output report.json

      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: report.json

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, e2e, performance]
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your deployment commands here

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, e2e, performance]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add your deployment commands here
```

### Quality Gates
```yaml
# Quality gate configuration
coverage:
  branches: 80
  functions: 85
  lines: 85
  statements: 85

performance:
  response_time_p95: 500ms
  error_rate: 1%
  availability: 99.9%

security:
  vulnerability_threshold: low
  secrets_scanned: true
  dependencies_audited: true
```

## Test Data Management

### Test Database Seeding
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test tenants
  const testTenant = await prisma.tenant.upsert({
    where: { name: 'Test Tenant' },
    update: {},
    create: {
      name: 'Test Tenant',
    },
  });

  // Create test members
  const hashedPassword = await bcrypt.hash('password123', 12);

  await prisma.member.upsert({
    where: {
      email_tenantId: {
        email: 'test@example.com',
        tenantId: testTenant.id,
      },
    },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      tenantId: testTenant.id,
    },
  });

  // Create test locations
  await prisma.location.upsert({
    where: { id: 'test-location-1' },
    update: {},
    create: {
      id: 'test-location-1',
      name: 'Test Studio',
      address: '123 Test Street, Test City, TC 12345',
      capacity: 20,
      timezone: 'America/New_York',
      tenantId: testTenant.id,
    },
  });

  // Create test session types
  await prisma.sessionType.upsert({
    where: { id: 'test-session-type-1' },
    update: {},
    create: {
      id: 'test-session-type-1',
      name: 'HIIT Class',
      description: 'High-intensity interval training',
      durationMin: 45,
      category: 'class',
      maxCapacity: 15,
      difficulty: 'intermediate',
      tenantId: testTenant.id,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Test Fixtures
```typescript
// test/fixtures/test-data.ts
export const testTenants = {
  default: {
    id: 'test-tenant-1',
    name: 'Test Tenant',
  },
};

export const testMembers = {
  admin: {
    id: 'test-member-admin',
    email: 'admin@test.com',
    name: 'Test Admin',
    tenantId: testTenants.default.id,
  },
  member: {
    id: 'test-member-1',
    email: 'member@test.com',
    name: 'Test Member',
    tenantId: testTenants.default.id,
  },
};

export const testLocations = {
  studio: {
    id: 'test-location-studio',
    name: 'Main Studio',
    capacity: 20,
    tenantId: testTenants.default.id,
  },
};

export const testSessionTypes = {
  hiit: {
    id: 'test-session-hiit',
    name: 'HIIT Express',
    durationMin: 30,
    category: 'class',
    maxCapacity: 15,
    tenantId: testTenants.default.id,
  },
};
```

## Automated Testing Scripts

### Pre-commit Hooks
```bash
#!/bin/bash
# .husky/pre-commit

echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Please fix linting errors."
  exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
  echo "Type checking failed. Please fix type errors."
  exit 1
fi

# Run unit tests
npm run test:unit -- --passWithNoTests
if [ $? -ne 0 ]; then
  echo "Unit tests failed. Please fix failing tests."
  exit 1
fi

echo "Pre-commit checks passed!"
```

### Test Report Generation
```javascript
// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

function generateTestReport() {
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('Coverage report not found. Run tests with coverage first.');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

  const report = {
    timestamp: new Date().toISOString(),
    coverage: {
      branches: coverage.total.branches.pct,
      functions: coverage.total.functions.pct,
      lines: coverage.total.lines.pct,
      statements: coverage.total.statements.pct,
    },
    thresholds: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    passed: coverage.total.branches.pct >= 80 &&
           coverage.total.functions.pct >= 85 &&
           coverage.total.lines.pct >= 85 &&
           coverage.total.statements.pct >= 85,
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('Test report generated:', report);

  if (!report.passed) {
    console.error('Coverage thresholds not met!');
    process.exit(1);
  }
}

if (require.main === module) {
  generateTestReport();
}
```

## Test Environment Management

### Docker Compose for Testing
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zmos_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d zmos_test"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_test_data:
```

### Parallel Test Execution
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/generated/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  maxWorkers: '50%', // Use 50% of available cores
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
};
```

---

## Test Metrics & KPIs

### Quality Metrics
- **Code Coverage**: 85%+ overall
- **Test Execution Time**: < 5 minutes for unit tests
- **Flaky Test Rate**: < 1%
- **Test-to-Code Ratio**: 1:1 minimum

### Performance Metrics
- **API Response Time**: P95 < 500ms
- **Concurrent Users**: 1000+ supported
- **Error Rate**: < 1%
- **Uptime**: 99.9%

### Process Metrics
- **Time to Feedback**: < 10 minutes for PR checks
- **Deployment Frequency**: Multiple times per day
- **Mean Time to Recovery**: < 1 hour
- **Change Failure Rate**: < 15%

---

## Continuous Testing Strategy

### Shift-Left Testing
- **Requirement Reviews**: Include test scenarios
- **Code Reviews**: Require test coverage for new code
- **Architecture Reviews**: Consider testability

### Test Automation Levels
```mermaid
graph TD
    A[Feature Request] --> B[Write Acceptance Tests]
    B --> C[Implement Code]
    C --> D[Write Unit Tests]
    D --> E[Write Integration Tests]
    E --> F[Write E2E Tests]
    F --> G[Performance Tests]
    G --> H[Security Tests]
    H --> I[Deploy to Production]
```

### Testing in Production
- **Feature Flags**: Gradual rollout with monitoring
- **Canary Deployments**: Test with subset of users
- **Synthetic Monitoring**: Automated user journey testing
- **Real User Monitoring**: Track actual user experience

---

*This testing strategy ensures high-quality, maintainable code with comprehensive coverage across all testing levels. Regular review and updates to this document are essential for maintaining testing standards.*
