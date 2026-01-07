import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationHierarchyService } from './location-hierarchy.service';

@Injectable()
export class MemberProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationHierarchyService: LocationHierarchyService,
  ) {}

  /**
   * Get current member's profile
   */
  async getMyProfile(memberId: string) {
    const member = await this.prisma.extended.member.findUnique({
      where: { id: memberId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Don't return password hash
    const { passwordHash, ...profileData } = member;

    return profileData;
  }

  /**
   * Update current member's profile
   */
  async updateMyProfile(
    memberId: string,
    updateData: {
      name?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      gender?: string;
      profilePhoto?: string;
    },
  ) {
    const member = await this.prisma.extended.member.update({
      where: { id: memberId },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { passwordHash, ...profileData } = member;
    return profileData;
  }

  /**
   * Get member's activity statistics
   */
  async getMyStats(memberId: string) {
    // Get all bookings
    const allBookings = await this.prisma.booking.findMany({
      where: {
        memberId,
      },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
          },
        },
      },
      orderBy: {
        bookedAt: 'desc',
      },
    });

    // Calculate stats
    const totalBookings = allBookings.length;
    const attendedSessions = allBookings.filter(
      (b) => b.status === 'attended',
    ).length;
    const cancelledBookings = allBookings.filter(
      (b) => b.status === 'cancelled',
    ).length;
    const noShows = allBookings.filter((b) => b.status === 'no_show').length;

    // Calculate attendance rate
    const attendanceRate =
      totalBookings > 0
        ? Math.round((attendedSessions / totalBookings) * 100)
        : 0;

    // Get favorite session types (most attended)
    const sessionTypeCounts = allBookings
      .filter((b) => b.status === 'attended')
      .reduce(
        (acc, booking) => {
          const sessionTypeName = booking.sessionInstance.sessionType.name;
          acc[sessionTypeName] = (acc[sessionTypeName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const favoriteSessionTypes = Object.entries(sessionTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Get monthly activity (last 12 months)
    const now = new Date();
    const monthlyActivity: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthCount = allBookings.filter((b) => {
        const bookedDate = new Date(b.bookedAt);
        return (
          b.status === 'attended' &&
          bookedDate >= monthStart &&
          bookedDate <= monthEnd
        );
      }).length;

      monthlyActivity[monthKey] = monthCount;
    }

    // Calculate current streak (consecutive days with attendance)
    const attendedBookings = allBookings
      .filter((b) => b.status === 'attended' && b.attendedAt)
      .sort((a, b) => b.attendedAt!.getTime() - a.attendedAt!.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    attendedBookings.forEach((booking) => {
      if (!booking.attendedAt) return;

      const attendedDate = new Date(booking.attendedAt);
      attendedDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        currentStreak = 1;
        lastDate = attendedDate;
      } else {
        const dayDiff = Math.floor(
          (lastDate.getTime() - attendedDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          // Only update current streak if this is part of the most recent streak
          if (currentStreak === tempStreak - 1) {
            currentStreak = tempStreak;
          }
        } else if (dayDiff > 1) {
          // Streak broken
          tempStreak = 1;
        }
        // Same day (dayDiff === 0) doesn't change streak
        lastDate = attendedDate;
      }
    });

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return {
      totalBookings,
      attendedSessions,
      cancelledBookings,
      noShows,
      attendanceRate,
      currentStreak,
      longestStreak,
      favoriteSessionTypes,
      monthlyActivity,
    };
  }

  /**
   * Get booking history with pagination
   */
  async getMyBookingHistory(
    memberId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      memberId,
    };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          sessionInstance: {
            include: {
              sessionType: true,
              location: true,
            },
          },
        },
        orderBy: {
          bookedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  /**
   * Get business statistics for owners/admins
   * Requires OWNER or ADMIN role (enforced by controller)
   */
  async getBusinessStats(tenantId: string) {
    // Get total and active members
    const totalMembers = await this.prisma.extended.member.count();

    // Active members = those who attended a session in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeMemberIds = await this.prisma.booking.findMany({
      where: {
        status: 'attended',
        attendedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        memberId: true,
      },
      distinct: ['memberId'],
    });

    const activeMembers = activeMemberIds.length;

    // Calculate retention rate
    const retentionRate = totalMembers > 0 ? activeMembers / totalMembers : 0;

    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await this.prisma.sessionInstance.count({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: 'cancelled',
        },
      },
    });

    // Get upcoming bookings (future confirmed bookings)
    const now = new Date();
    const upcomingBookings = await this.prisma.booking.count({
      where: {
        status: 'confirmed',
        sessionInstance: {
          startTime: {
            gte: now,
          },
        },
      },
    });

    // Revenue metrics (placeholder - requires payment/subscription system)
    // TODO: Implement when payment system is added
    const monthlyRevenue = 0.0;
    const revenueGrowth = 0.0;

    // Get tenant's currency from their primary location
    let currency = 'USD'; // Default currency
    try {
      // Get tenant's primary location to determine country
      const tenantLocation = await this.prisma.location.findFirst({
        where: {
          tenantId,
          country: { not: null },
        },
        select: {
          country: true,
        },
      });

      if (tenantLocation?.country) {
        const countryData = this.locationHierarchyService.getCountry(
          tenantLocation.country,
        );
        if (countryData) {
          currency = countryData.currency;
        }
      }
    } catch (error) {
      // If there's an error getting currency, use default USD
      console.error('Error getting currency:', error);
    }

    return {
      totalMembers,
      activeMembers,
      retentionRate,
      monthlyRevenue,
      revenueGrowth,
      todaySessions,
      upcomingBookings,
      currency,
    };
  }

  /**
   * Get detailed analytics for owners/admins
   * Requires OWNER or ADMIN role (enforced by controller)
   */
  async getDetailedAnalytics(tenantId: string, days: number = 30) {
    // Get business stats overview
    const overview = await this.getBusinessStats(tenantId);

    // Get member growth over time (last N months)
    const months = Math.ceil(days / 30);
    const memberGrowth: any[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const count = await this.prisma.extended.member.count({
        where: {
          createdAt: {
            lt: monthEnd,
          },
        },
      });

      memberGrowth.push({
        month: monthStart.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
        value: count,
      });
    }

    // Get session attendance over time
    const sessionAttendance: any[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const count = await this.prisma.booking.count({
        where: {
          status: 'attended',
          attendedAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      sessionAttendance.push({
        month: monthStart.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
        value: count,
      });
    }

    // Revenue growth (placeholder for now)
    const revenueGrowth = memberGrowth.map((data) => ({
      month: data.month,
      value: 0,
    }));

    // Get top session types
    const bookingsWithSessions = await this.prisma.booking.findMany({
      where: {
        status: 'attended',
      },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
          },
        },
      },
    });

    const sessionTypeCounts: Record<string, number> = {};
    bookingsWithSessions.forEach((booking) => {
      const typeName = booking.sessionInstance.sessionType.name;
      sessionTypeCounts[typeName] = (sessionTypeCounts[typeName] || 0) + 1;
    });

    const totalSessions = bookingsWithSessions.length;
    const topSessionTypes = Object.entries(sessionTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      }));

    // Get peak hours (hour of day with most bookings)
    const peakHours = new Array(24).fill(0);
    bookingsWithSessions.forEach((booking) => {
      if (booking.attendedAt) {
        const hour = new Date(booking.attendedAt).getHours();
        peakHours[hour]++;
      }
    });

    const peakHoursData = peakHours.map((count, hour) => ({
      hour,
      count,
    }));

    return {
      overview,
      memberGrowth,
      revenueGrowth,
      sessionAttendance,
      topSessionTypes,
      peakHours: peakHoursData,
    };
  }
}
