import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MoveOS Walking Skeleton (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let memberId: string;
  let authToken: string;
  let locationId: string;
  let sessionTypeId: string;
  let sessionInstanceId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Clean up any existing test data
    await prisma.extended.movementEvent.deleteMany();
    await prisma.extended.booking.deleteMany();
    await prisma.extended.sessionInstance.deleteMany();
    await prisma.extended.sessionType.deleteMany();
    await prisma.extended.location.deleteMany();
    await prisma.extended.member.deleteMany();
    await prisma.extended.tenant.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Walking Skeleton Flow', () => {
    it('Step 1: Provider signs up and creates tenant', async () => {
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'provider@test.com',
          password: 'password123',
          name: 'Test Provider',
          tenantName: 'Test Fitness Center',
        })
        .expect(201);

      tenantId = signupResponse.body.member.tenantId;
      memberId = signupResponse.body.member.id;
      authToken = signupResponse.body.token;

      expect(signupResponse.body.member).toHaveProperty('tenantId');
      expect(signupResponse.body.token).toBeDefined();
    });

    it('Step 2: Provider creates location', async () => {
      const locationResponse = await request(app.getHttpServer())
        .post('/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          name: 'Main Studio',
          address: '123 Fitness Street, Test City, TC 12345',
          capacity: 20,
          timezone: 'America/New_York',
        })
        .expect(201);

      locationId = locationResponse.body.id;
      expect(locationResponse.body.name).toBe('Main Studio');
      expect(locationResponse.body.capacity).toBe(20);
    });

    it('Step 3: Provider creates session type', async () => {
      const sessionTypeResponse = await request(app.getHttpServer())
        .post('/session-types')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          name: 'HIIT Class',
          description: 'High-intensity interval training for all levels',
          durationMin: 45,
          category: 'class',
          maxCapacity: 15,
          difficulty: 'intermediate',
        })
        .expect(201);

      sessionTypeId = sessionTypeResponse.body.id;
      expect(sessionTypeResponse.body.name).toBe('HIIT Class');
      expect(sessionTypeResponse.body.durationMin).toBe(45);
    });

    it('Step 4: Provider schedules session instance', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow

      const sessionResponse = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          sessionTypeId,
          locationId,
          startTime: tomorrow.toISOString(),
          capacity: 12,
          instructor: 'Sarah Johnson',
          notes: 'Bring water bottle and towel',
        })
        .expect(201);

      sessionInstanceId = sessionResponse.body.id;
      expect(sessionResponse.body.status).toBe('scheduled');
      expect(sessionResponse.body.capacity).toBe(12);
    });

    it('Step 5: Member browses available sessions', async () => {
      const sessionsResponse = await request(app.getHttpServer())
        .get('/sessions/available')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .query({ category: 'class' })
        .expect(200);

      expect(Array.isArray(sessionsResponse.body.data)).toBe(true);
      expect(sessionsResponse.body.data.length).toBeGreaterThan(0);
      expect(sessionsResponse.body.data[0]).toHaveProperty('sessionType');
      expect(sessionsResponse.body.data[0]).toHaveProperty('location');
    });

    it('Step 6: Member books a session', async () => {
      const bookingResponse = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          sessionInstanceId,
          notes: 'First time attending HIIT',
        })
        .expect(201);

      bookingId = bookingResponse.body.id;
      expect(bookingResponse.body.status).toBe('confirmed');
      expect(bookingResponse.body.sessionInstance.id).toBe(sessionInstanceId);
    });

    it('Step 7: Member views their bookings', async () => {
      const bookingsResponse = await request(app.getHttpServer())
        .get('/my/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(bookingsResponse.body)).toBe(true);
      expect(bookingsResponse.body.length).toBeGreaterThan(0);
      expect(bookingsResponse.body[0].id).toBe(bookingId);
    });

    it('Step 8: Provider views session bookings', async () => {
      const sessionBookingsResponse = await request(app.getHttpServer())
        .get(`/sessions/${sessionInstanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(sessionBookingsResponse.body.bookings).toBeDefined();
      expect(sessionBookingsResponse.body.bookings.length).toBeGreaterThan(0);
    });

    it('Step 9: Member checks in to session (simulated)', async () => {
      // First, we need to update the session start time to be in the past for check-in
      const pastStartTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const pastEndTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      await prisma.extended.sessionInstance.update({
        where: { id: sessionInstanceId },
        data: {
          startTime: pastStartTime,
          endTime: pastEndTime,
        },
      });

      // Now check in
      const checkInResponse = await request(app.getHttpServer())
        .post(`/sessions/${sessionInstanceId}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(checkInResponse.body.status).toBe('attended');
      expect(checkInResponse.body.attendedAt).toBeDefined();
    });

    it('Step 10: Verify movement events were created', async () => {
      const eventsResponse = await request(app.getHttpServer())
        .get('/my/events')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(eventsResponse.body)).toBe(true);
      expect(eventsResponse.body.length).toBeGreaterThan(0);

      // Should have booking_created and class_attendance events
      const eventTypes = eventsResponse.body.map((event: any) => event.type);
      expect(eventTypes).toContain('booking_created');
      expect(eventTypes).toContain('class_attendance');
    });

    it('Step 11: Check member streak', async () => {
      const streakResponse = await request(app.getHttpServer())
        .get('/my/streak')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(streakResponse.body).toHaveProperty('currentStreak');
      expect(streakResponse.body).toHaveProperty('recentAttendance');
      expect(typeof streakResponse.body.currentStreak).toBe('number');
    });

    it('Step 12: Demonstrate complete tenant isolation', async () => {
      // Create a second tenant
      const secondTenantResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'provider2@test.com',
          password: 'password123',
          name: 'Second Provider',
          tenantName: 'Second Fitness Center',
        })
        .expect(201);

      const secondTenantId = secondTenantResponse.body.member.tenantId;
      const secondToken = secondTenantResponse.body.token;

      // Second tenant should not see first tenant's data
      const secondTenantLocations = await request(app.getHttpServer())
        .get('/locations')
        .set('Authorization', `Bearer ${secondToken}`)
        .set('x-tenant-id', secondTenantId)
        .expect(200);

      expect(secondTenantLocations.body.length).toBe(0); // No locations for second tenant yet

      // First tenant should still see their location
      const firstTenantLocations = await request(app.getHttpServer())
        .get('/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(firstTenantLocations.body.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.extended.movementEvent.deleteMany();
    await prisma.extended.booking.deleteMany();
    await prisma.extended.sessionInstance.deleteMany();
    await prisma.extended.sessionType.deleteMany();
    await prisma.extended.location.deleteMany();
    await prisma.extended.member.deleteMany();
    await prisma.extended.tenant.deleteMany();
  });
});
