import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionInstanceDto } from '../dto/create-session-instance.dto';
import { UpdateSessionInstanceDto } from '../dto/update-session-instance.dto';
import { QuerySessionsDto } from '../dto/query-sessions.dto';

@Injectable()
export class SessionInstanceService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createSessionInstanceDto: CreateSessionInstanceDto) {
    const { sessionTypeId, locationId, startTime, endTime, capacity } =
      createSessionInstanceDto;

    // Validate session type exists
    const sessionType = await this.prisma.extended.sessionType.findUnique({
      where: { id: sessionTypeId },
    });

    if (!sessionType) {
      throw new NotFoundException(
        `Session type with ID ${sessionTypeId} not found`,
      );
    }

    // Validate location exists
    const location = await this.prisma.extended.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Calculate end time if not provided (based on session type duration)
    // This must be done BEFORE checking for conflicts
    let finalEndTime: string;
    if (!endTime) {
      const startDateTime = new Date(startTime);
      startDateTime.setMinutes(
        startDateTime.getMinutes() + sessionType.durationMin,
      );
      finalEndTime = startDateTime.toISOString();
    } else {
      finalEndTime = endTime;
    }

    // Check for scheduling conflicts at the same location
    const conflictingSession =
      await this.prisma.extended.sessionInstance.findFirst({
        where: {
          locationId,
          startTime: { lt: new Date(finalEndTime) },
          endTime: { gt: new Date(startTime) },
          status: { not: 'cancelled' },
        },
      });

    if (conflictingSession) {
      throw new ConflictException(
        'Location is already booked during this time slot',
      );
    }

    // Determine capacity (use session type default or override)
    const finalCapacity = capacity ?? sessionType.maxCapacity;

    return this.prisma.extended.sessionInstance.create({
      data: {
        ...createSessionInstanceDto,
        endTime: finalEndTime,
        capacity: finalCapacity,
        tenantId: this.prisma.tenantId,
      },
      include: {
        sessionType: true,
        location: true,
        bookings: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(query: QuerySessionsDto = {}) {
    const {
      date,
      category,
      status = 'scheduled',
      locationId,
      page: rawPage = 1,
      limit: rawLimit = 20,
    } = query;

    // Ensure page and limit are numbers (query params come as strings)
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
    const limit =
      typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit;

    const where: any = {
      status,
    };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filter by location if provided
    if (locationId) {
      where.locationId = locationId;
    }

    // Filter by session type category if provided
    if (category) {
      where.sessionType = {
        category,
      };
    }

    const skip = (page - 1) * limit;

    // Use base prisma for public browsing (cross-tenant)
    const [sessions, total] = await Promise.all([
      this.prisma.sessionInstance.findMany({
        where,
        include: {
          sessionType: true,
          location: true,
          bookings: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.sessionInstance.count({ where }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
      },
    };
  }

  async findOne(id: string) {
    // Use base prisma for public browsing (cross-tenant)
    const sessionInstance = await this.prisma.sessionInstance.findUnique({
      where: { id },
      include: {
        sessionType: true,
        location: true,
        bookings: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!sessionInstance) {
      throw new NotFoundException(`Session instance with ID ${id} not found`);
    }

    return sessionInstance;
  }

  async update(id: string, updateSessionInstanceDto: UpdateSessionInstanceDto) {
    const sessionInstance = await this.findOne(id);

    // If updating time/location, check for conflicts
    if (
      updateSessionInstanceDto.startTime ||
      updateSessionInstanceDto.endTime ||
      updateSessionInstanceDto.locationId
    ) {
      const newStartTime =
        updateSessionInstanceDto.startTime ||
        sessionInstance.startTime.toISOString();
      const newEndTime =
        updateSessionInstanceDto.endTime ||
        sessionInstance.endTime.toISOString();
      const newLocationId =
        updateSessionInstanceDto.locationId || sessionInstance.locationId;

      const conflictingSession =
        await this.prisma.extended.sessionInstance.findFirst({
          where: {
            locationId: newLocationId,
            startTime: { lt: new Date(newEndTime) },
            endTime: { gt: new Date(newStartTime) },
            status: { not: 'cancelled' },
            id: { not: id },
          },
        });

      if (conflictingSession) {
        throw new ConflictException(
          'Location is already booked during this time slot',
        );
      }
    }

    return this.prisma.extended.sessionInstance.update({
      where: { id },
      data: updateSessionInstanceDto,
      include: {
        sessionType: true,
        location: true,
      },
    });
  }

  async cancel(id: string) {
    const sessionInstance = await this.findOne(id);

    if (sessionInstance.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed session');
    }

    return this.prisma.extended.sessionInstance.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async complete(id: string) {
    const sessionInstance = await this.findOne(id);

    if (sessionInstance.status !== 'scheduled') {
      throw new BadRequestException(
        'Only scheduled sessions can be marked as completed',
      );
    }

    return this.prisma.extended.sessionInstance.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  async getAvailableSessions(query: QuerySessionsDto = {}) {
    const result = await this.findAll(query);

    // Filter out sessions that are at capacity
    const availableSessions = result.data.filter((session) => {
      // If capacity is null, it's unlimited
      if (session.capacity === null) return true;

      const bookedCount = session.bookings.filter(
        (b) => b.status === 'confirmed',
      ).length;
      return bookedCount < (session.capacity || 0);
    });

    return {
      ...result,
      data: availableSessions,
    };
  }

  /**
   * Get upcoming sessions within specified number of days
   */
  async getUpcomingSessions(
    days = 7,
    filters: { category?: string; locationId?: string } = {},
  ) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      startTime: {
        gte: now,
        lte: futureDate,
      },
      status: 'scheduled',
    };

    if (filters.category) {
      where.sessionType = { category: filters.category };
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    // Use base prisma for public browsing (cross-tenant)
    const sessions = await this.prisma.sessionInstance.findMany({
      where,
      include: {
        sessionType: true,
        location: true,
        bookings: {
          where: { status: 'confirmed' },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Add availability information
    return sessions.map((session) => ({
      ...session,
      spotsAvailable: (session.capacity || 0) - session.bookings.length,
      isAvailable: session.bookings.length < (session.capacity || 0),
    }));
  }

  /**
   * Get sessions for today
   */
  async getTodaysSessions(
    filters: { category?: string; locationId?: string } = {},
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      status: 'scheduled',
    };

    if (filters.category) {
      where.sessionType = { category: filters.category };
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    // Use base prisma for public browsing (cross-tenant)
    const sessions = await this.prisma.sessionInstance.findMany({
      where,
      include: {
        sessionType: true,
        location: true,
        bookings: {
          where: { status: 'confirmed' },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Add availability information
    return sessions.map((session) => ({
      ...session,
      spotsAvailable: (session.capacity || 0) - session.bookings.length,
      isAvailable: session.bookings.length < (session.capacity || 0),
    }));
  }

  /**
   * Get sessions booked by a specific member
   */
  async getMemberBookedSessions(memberId: string) {
    const now = new Date();

    const bookings = await this.prisma.booking.findMany({
      where: {
        memberId,
        sessionInstance: {
          startTime: { gte: now },
          status: { in: ['scheduled', 'completed'] },
        },
      },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
            bookings: {
              where: { status: 'confirmed' },
            },
          },
        },
      },
      orderBy: {
        sessionInstance: {
          startTime: 'asc',
        },
      },
    });

    // Transform to session-centric format with booking info
    return bookings.map((booking) => ({
      ...booking.sessionInstance,
      bookingId: booking.id,
      bookingStatus: booking.status,
      bookedAt: booking.bookedAt,
      spotsAvailable:
        (booking.sessionInstance.capacity || 0) -
        booking.sessionInstance.bookings.length,
      isAvailable:
        booking.sessionInstance.bookings.length <
        (booking.sessionInstance.capacity || 0),
    }));
  }

  /**
   * Search sessions
   */
  async searchSessions(query: {
    q?: string;
    date?: string;
    category?: string;
    difficulty?: string;
  }) {
    const where: any = {
      status: 'scheduled',
    };

    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    if (query.category || query.difficulty || query.q) {
      where.sessionType = {};
      if (query.category) where.sessionType.category = query.category;
      if (query.difficulty) where.sessionType.difficulty = query.difficulty;
      if (query.q) {
        where.sessionType.OR = [
          { name: { contains: query.q } },
          { description: { contains: query.q } },
        ];
      }
    }

    // Use base prisma for public browsing (cross-tenant)
    const results = await this.prisma.sessionInstance.findMany({
      where,
      include: {
        sessionType: true,
        location: true,
        bookings: { where: { status: 'confirmed' } },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });

    return {
      results: results.map((session) => ({
        ...session,
        spotsAvailable: (session.capacity || 0) - session.bookings.length,
        isAvailable: session.bookings.length < (session.capacity || 0),
      })),
      total: results.length,
    };
  }
}
