/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BookingService', () => {
  let service: BookingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    extended: {
      sessionInstance: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      booking: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      movementEvent: {
        create: jest.fn(),
      },
    },
    tenantId: 'test-tenant-id',
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  // Alias root properties to extended for transaction support
  (mockPrismaService as any).booking = mockPrismaService.extended.booking;
  (mockPrismaService as any).movementEvent = mockPrismaService.extended.movementEvent;
  (mockPrismaService as any).sessionInstance = mockPrismaService.extended.sessionInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const memberId = 'member-123';
    const sessionInstanceId = 'session-456';
    const createBookingDto = { sessionInstanceId, notes: 'Test booking' };

    const mockSessionInstance = {
      id: sessionInstanceId,
      startTime: new Date(Date.now() + 3600000 * 24), // 24 hours from now
      endTime: new Date(Date.now() + 3600000 * 25), // 25 hours from now
      capacity: 10,
      status: 'scheduled',
      sessionType: { name: 'HIIT Class' },
      location: { name: 'Main Studio' },
    };

    it('should create a booking successfully', async () => {
      const expectedBooking = {
        id: 'booking-789',
        memberId,
        sessionInstanceId,
        status: 'confirmed',
        sessionInstance: mockSessionInstance,
        member: { id: memberId, name: 'John Doe', email: 'john@example.com' },
      };

      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        mockSessionInstance,
      );
      mockPrismaService.extended.booking.findUnique.mockResolvedValue(null);
      mockPrismaService.extended.booking.count.mockResolvedValue(5); // 5 existing bookings
      mockPrismaService.extended.booking.create.mockResolvedValue(
        expectedBooking,
      );
      mockPrismaService.extended.movementEvent.create.mockResolvedValue({});

      const result = await service.create(createBookingDto, memberId);

      expect(
        mockPrismaService.extended.sessionInstance.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: sessionInstanceId },
        include: { sessionType: true, location: true },
      });
      expect(mockPrismaService.extended.booking.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.extended.booking.count).toHaveBeenCalled();
      expect(mockPrismaService.extended.booking.create).toHaveBeenCalled();
      expect(
        mockPrismaService.extended.movementEvent.create,
      ).toHaveBeenCalled();
      expect(result).toEqual(expectedBooking);
    });

    it('should throw error for non-existent session', async () => {
      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        null,
      );

      await expect(service.create(createBookingDto, memberId)).rejects.toThrow(
        'Session instance with ID session-456 not found',
      );
    });

    it('should throw error for past sessions', async () => {
      const pastSession = {
        ...mockSessionInstance,
        startTime: new Date(Date.now() - 3600000),
      };
      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        pastSession,
      );

      await expect(service.create(createBookingDto, memberId)).rejects.toThrow(
        'Cannot book sessions that have already started',
      );
    });

    it('should throw error for double booking', async () => {
      const existingBooking = { id: 'existing-booking' };
      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        mockSessionInstance,
      );
      mockPrismaService.extended.booking.findUnique.mockResolvedValue(
        existingBooking,
      );

      await expect(service.create(createBookingDto, memberId)).rejects.toThrow(
        'You have already booked this session',
      );
    });

    it('should throw error when session is full', async () => {
      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        mockSessionInstance,
      );
      mockPrismaService.extended.booking.findUnique.mockResolvedValue(null);
      mockPrismaService.extended.booking.count.mockResolvedValue(10); // At capacity

      await expect(service.create(createBookingDto, memberId)).rejects.toThrow(
        'Session is full',
      );
    });

    it('should create a booking successfully when capacity is null (unlimited)', async () => {
      const mockSessionUnlimited = {
        ...mockSessionInstance,
        capacity: null,
      };

      const expectedBooking = {
        id: 'booking-unlimited',
        memberId,
        sessionInstanceId,
        status: 'confirmed',
        sessionInstance: mockSessionUnlimited,
        member: { id: memberId, name: 'John Doe', email: 'john@example.com' },
      };

      mockPrismaService.extended.sessionInstance.findUnique.mockResolvedValue(
        mockSessionUnlimited,
      );
      mockPrismaService.extended.booking.findUnique.mockResolvedValue(null);
      mockPrismaService.extended.booking.create.mockResolvedValue(
        expectedBooking,
      );

      const result = await service.create(createBookingDto, memberId);

      expect(mockPrismaService.extended.booking.count).not.toHaveBeenCalled();
      expect(result).toEqual(expectedBooking);
    });
  });

  describe('checkIn', () => {
    const memberId = 'member-123';
    const sessionInstanceId = 'session-456';

    const mockBooking = {
      id: 'booking-789',
      memberId,
      sessionInstanceId,
      status: 'confirmed',
      sessionInstance: {
        sessionType: { name: 'HIIT Class' },
        location: { name: 'Main Studio' },
      },
    };

    it('should check in successfully', async () => {
      const now = new Date();
      const sessionStart = new Date(now.getTime() - 1800000); // 30 min ago
      const sessionEnd = new Date(now.getTime() + 1800000); // 30 min from now

      const sessionWithTimes = {
        ...mockBooking.sessionInstance,
        startTime: sessionStart,
        endTime: sessionEnd,
      };

      mockPrismaService.extended.booking.findFirst.mockResolvedValue({
        ...mockBooking,
        sessionInstance: sessionWithTimes,
      });
      mockPrismaService.extended.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'attended',
        attendedAt: now,
      });
      mockPrismaService.extended.movementEvent.create.mockResolvedValue({});

      const result = await service.checkIn(sessionInstanceId, memberId);

      expect(result.status).toBe('attended');
      expect(
        mockPrismaService.extended.movementEvent.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          memberId,
          type: 'class_attendance',
        }),
      });
    });

    it('should throw error for session not started', async () => {
      const futureSession = {
        ...mockBooking.sessionInstance,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 7200000),
      };

      mockPrismaService.extended.booking.findFirst.mockResolvedValue({
        ...mockBooking,
        sessionInstance: futureSession,
      });

      await expect(
        service.checkIn(sessionInstanceId, memberId),
      ).rejects.toThrow('Session has not started yet');
    });

    it('should throw error for no booking found', async () => {
      mockPrismaService.extended.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.checkIn(sessionInstanceId, memberId),
      ).rejects.toThrow('No confirmed booking found for this session');
    });
  });

  describe('cancel', () => {
    const bookingId = 'booking-789';
    const memberId = 'member-123';

    const mockBooking = {
      id: bookingId,
      memberId,
      sessionInstanceId: 'session-456',
      status: 'confirmed',
      sessionInstance: {
        startTime: new Date(Date.now() + 3600000 * 5), // 5 hours from now
        sessionType: { name: 'HIIT Class' },
        location: { name: 'Main Studio' },
      },
    };

    it('should cancel booking successfully', async () => {
      mockPrismaService.extended.booking.findFirst.mockResolvedValue(
        mockBooking,
      );
      mockPrismaService.extended.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'cancelled',
        cancelledAt: new Date(),
      });
      mockPrismaService.extended.movementEvent.create.mockResolvedValue({});

      const result = await service.cancel(bookingId, memberId);

      expect(result.status).toBe('cancelled');
      expect(
        mockPrismaService.extended.movementEvent.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          memberId,
          type: 'booking_cancelled',
        }),
      });
    });

    it('should throw error for late cancellation', async () => {
      const closeSession = {
        ...mockBooking,
        sessionInstance: {
          ...mockBooking.sessionInstance,
          startTime: new Date(Date.now() + 3600000), // 1 hour from now
        },
      };

      mockPrismaService.extended.booking.findFirst.mockResolvedValue(
        closeSession,
      );

      await expect(service.cancel(bookingId, memberId)).rejects.toThrow(
        'Cannot cancel booking less than 2 hours before session start',
      );
    });
  });
});
