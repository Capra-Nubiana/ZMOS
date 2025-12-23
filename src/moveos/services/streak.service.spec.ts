import { Test, TestingModule } from '@nestjs/testing';
import { StreakService } from './streak.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StreakService', () => {
  let service: StreakService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    extended: {
      movementEvent: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      member: {
        findMany: jest.fn(),
      },
    },
    tenantId: 'test-tenant-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateStreak', () => {
    it('should return 0 for no attendance events', async () => {
      mockPrismaService.extended.movementEvent.findMany.mockResolvedValue([]);

      const result = await service.calculateStreak('member-123');

      expect(result).toBe(0);
      expect(
        mockPrismaService.extended.movementEvent.findMany,
      ).toHaveBeenCalledWith({
        where: {
          memberId: 'member-123',
          type: 'class_attendance',
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
    });

    it('should calculate consecutive day streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      const events = [
        { createdAt: today },
        { createdAt: yesterday },
        { createdAt: twoDaysAgo },
      ];

      mockPrismaService.extended.movementEvent.findMany.mockResolvedValue(
        events,
      );

      const result = await service.calculateStreak('member-123');

      expect(result).toBe(3);
    });

    it('should break streak on gap in attendance', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3); // Gap of 2 days

      const events = [
        { createdAt: today },
        { createdAt: yesterday },
        { createdAt: threeDaysAgo },
      ];

      mockPrismaService.extended.movementEvent.findMany.mockResolvedValue(
        events,
      );

      const result = await service.calculateStreak('member-123');

      expect(result).toBe(2); // Only today and yesterday
    });

    it('should handle non-consecutive attendance', async () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);

      const events = [
        { createdAt: today },
        { createdAt: threeDaysAgo },
        { createdAt: weekAgo },
      ];

      mockPrismaService.extended.movementEvent.findMany.mockResolvedValue(
        events,
      );

      const result = await service.calculateStreak('member-123');

      expect(result).toBe(1); // Only today
    });
  });

  describe('getStreakInfo', () => {
    it('should return comprehensive streak information', async () => {
      const memberId = 'member-123';
      const events = [
        {
          createdAt: new Date(),
          metadata: { sessionType: 'HIIT', location: 'Studio A' },
        },
        {
          createdAt: new Date(Date.now() - 86400000),
          metadata: { sessionType: 'Yoga', location: 'Studio B' },
        },
      ];

      mockPrismaService.extended.movementEvent.findMany
        .mockResolvedValueOnce([]) // For calculateStreak
        .mockResolvedValueOnce(events); // For attendance events

      const result = await service.getStreakInfo(memberId);

      expect(result).toHaveProperty('currentStreak');
      expect(result).toHaveProperty('longestStreak');
      expect(result).toHaveProperty('recentAttendance');
      expect(result.recentAttendance).toHaveLength(2);
    });
  });

  describe('createStreakMilestone', () => {
    it('should create milestone for 7-day streak', async () => {
      mockPrismaService.extended.movementEvent.create.mockResolvedValue({});

      await service.createStreakMilestone('member-123', 7);

      expect(
        mockPrismaService.extended.movementEvent.create,
      ).toHaveBeenCalledWith({
        data: {
          memberId: 'member-123',
          type: 'streak_milestone',
          tenantId: 'test-tenant-id',
          metadata: expect.objectContaining({
            streakDays: 7,
            achievement: 'Week Warrior',
          }),
        },
      });
    });

    it('should not create milestone for non-milestone streaks', async () => {
      await service.createStreakMilestone('member-123', 5);

      expect(
        mockPrismaService.extended.movementEvent.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return top performers ordered by streak', async () => {
      const members = [
        { id: 'member-1', name: 'Alice', email: 'alice@test.com' },
        { id: 'member-2', name: 'Bob', email: 'bob@test.com' },
        { id: 'member-3', name: 'Charlie', email: 'charlie@test.com' },
      ];

      mockPrismaService.extended.member.findMany.mockResolvedValue(members);

      // Mock calculateStreak calls - Alice: 5, Bob: 3, Charlie: 0
      mockPrismaService.extended.movementEvent.findMany
        .mockResolvedValueOnce([{ createdAt: new Date() }]) // Alice streak 1
        .mockResolvedValueOnce([{ createdAt: new Date() }]) // Bob streak 1
        .mockResolvedValueOnce([]); // Charlie streak 0

      const result = await service.getStreakLeaderboard(5);

      expect(result).toHaveLength(2); // Only members with streaks > 0
      expect(result[0].member.name).toBe('Alice');
      expect(result[1].member.name).toBe('Bob');
    });
  });
});
