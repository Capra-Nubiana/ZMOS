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
  constructor(private readonly prisma: PrismaService) {}

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

    // Check for scheduling conflicts at the same location
    const conflictingSession =
      await this.prisma.extended.sessionInstance.findFirst({
        where: {
          locationId,
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
          status: { not: 'cancelled' },
        },
      });

    if (conflictingSession) {
      throw new ConflictException(
        'Location is already booked during this time slot',
      );
    }

    // Calculate end time if not provided (based on session type duration)
    let finalEndTime = endTime;
    if (!endTime) {
      const startDateTime = new Date(startTime);
      startDateTime.setMinutes(
        startDateTime.getMinutes() + sessionType.durationMin,
      );
      finalEndTime = startDateTime.toISOString();
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
      page = 1,
      limit = 20,
    } = query;

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

    const [sessions, total] = await Promise.all([
      this.prisma.extended.sessionInstance.findMany({
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
      this.prisma.extended.sessionInstance.count({ where }),
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
    const sessionInstance =
      await this.prisma.extended.sessionInstance.findUnique({
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
      const bookedCount = session.bookings.filter(
        (b) => b.status === 'confirmed',
      ).length;
      return bookedCount < session.capacity;
    });

    return {
      ...result,
      data: availableSessions,
    };
  }
}
