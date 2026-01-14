/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = app.get(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.extended.member.deleteMany();
    await (prismaService as any).prismaClient.tenant.deleteMany();
  });

  describe('POST /auth/signup', () => {
    it('should create a new tenant and member', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          tenantName: 'Test Gym',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('member');
          expect(res.body).toHaveProperty('token');
          expect(res.body.member.email).toBe('test@example.com');
          expect(res.body.member.name).toBe('Test User');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);
    });

    it('should reject duplicate email in same tenant', async () => {
      // First signup
      await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'First User',
        tenantName: 'Test Gym',
      });

      // Second signup with same email and tenant
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
          name: 'Second User',
          tenantName: 'Test Gym',
        })
        .expect(409); // Conflict
    });

    it('should allow same email in different tenants', async () => {
      // First signup
      await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'same@example.com',
        password: 'password123',
        name: 'User One',
        tenantName: 'Gym One',
      });

      // Second signup with same email but different tenant
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'same@example.com',
          password: 'password456',
          name: 'User Two',
          tenantName: 'Gym Two',
        })
        .expect(201);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User',
        tenantName: 'Login Gym',
      });
    });

    it('should authenticate user with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('member');
          expect(res.body).toHaveProperty('token');
          expect(res.body.member.email).toBe('login@example.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should require tenant header for protected routes', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(400) // Bad Request - missing tenant header
        .expect((res) => {
          expect(res.body.message).toContain('x-tenant-id header');
        });
    });

    it('should validate tenant exists', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('x-tenant-id', 'nonexistent-uuid')
        .expect(400) // Bad Request - tenant not found
        .expect((res) => {
          expect(res.body.message).toContain('Tenant not found');
        });
    });
  });
});
