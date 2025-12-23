import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto, memberId: string) {
    const { sessionInstanceId } = createBookingDto;

    // Validate session instance exists and is bookable
    const sessionInstance =
      await this.prisma.extended.sessionInstance.findUnique({
        where: { id: sessionInstanceId },
        include: {
          sessionType: true,
          location: true,
        },
      });

    if (!sessionInstance) {
      throw new NotFoundException(
        `Session instance with ID ${sessionInstanceId} not found`,
      );
    }

    if (sessionInstance.status !== 'scheduled') {
      throw new BadRequestException(
        `Session is ${sessionInstance.status} and cannot be booked`,
      );
    }

    // Check if session is in the future
    if (new Date(sessionInstance.startTime) <= new Date()) {
      throw new BadRequestException(
        'Cannot book sessions that have already started',
      );
    }

    // Check for existing booking (prevent double booking)
    const existingBooking = await this.prisma.extended.booking.findUnique({
      where: {
        memberId_sessionInstanceId: {
          memberId,
          sessionInstanceId,
        },
      },
    });

    if (existingBooking) {
      throw new ConflictException('You have already booked this session');
    }

    // Check capacity
    const confirmedBookings = await this.prisma.extended.booking.count({
      where: {
        sessionInstanceId,
        status: 'confirmed',
      },
    });

    if (confirmedBookings >= sessionInstance.capacity) {
      throw new ConflictException('Session is full');
    }

    // Create booking in a transaction with MovementEvent
    return this.prisma.$transaction(async (tx) => {
      // Create the booking
      const booking = await tx.booking.create({
        data: {
          sessionInstanceId,
          memberId,
          tenantId: this.prisma.tenantId,
          notes: createBookingDto.notes,
        },
        include: {
          sessionInstance: {
            include: {
              sessionType: true,
              location: true,
            },
          },
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create MovementEvent for booking
      await tx.movementEvent.create({
        data: {
          memberId,
          sessionInstanceId,
          type: 'booking_created',
          tenantId: this.prisma.tenantId,
          metadata: {
            sessionType: sessionInstance.sessionType.name,
            location: sessionInstance.location.name,
            startTime: sessionInstance.startTime.toISOString(),
            instructor: sessionInstance.instructor,
          },
        },
      });

      return booking;
    });
  }

  async findAll(memberId?: string) {
    const where: any = {};

    if (memberId) {
      where.memberId = memberId;
    }

    return this.prisma.extended.booking.findMany({
      where,
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, memberId?: string) {
    const where: any = { id };

    if (memberId) {
      where.memberId = memberId;
    }

    const booking = await this.prisma.extended.booking.findFirst({
      where,
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async cancel(id: string, memberId?: string) {
    const booking = await this.findOne(id, memberId);

    if (booking.status !== 'confirmed') {
      throw new BadRequestException(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }

    // Check if session allows cancellation (not too close to start time)
    const sessionStartTime = new Date(booking.sessionInstance.startTime);
    const now = new Date();
    const hoursUntilStart =
      (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 2) {
      throw new BadRequestException(
        'Cannot cancel booking less than 2 hours before session start',
      );
    }

    // Update booking and create MovementEvent
    return this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
        include: {
          sessionInstance: {
            include: {
              sessionType: true,
              location: true,
            },
          },
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create MovementEvent for cancellation
      await tx.movementEvent.create({
        data: {
          memberId: booking.memberId,
          sessionInstanceId: booking.sessionInstanceId,
          type: 'booking_cancelled',
          tenantId: this.prisma.tenantId,
          metadata: {
            sessionType: booking.sessionInstance.sessionType.name,
            location: booking.sessionInstance.location.name,
            cancelledAt: new Date().toISOString(),
          },
        },
      });

      return updatedBooking;
    });
  }

  async checkIn(sessionInstanceId: string, memberId: string) {
    // Find the booking
    const booking = await this.prisma.extended.booking.findFirst({
      where: {
        sessionInstanceId,
        memberId,
        status: 'confirmed',
      },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        'No confirmed booking found for this session',
      );
    }

    // Check if session is in progress or recently completed
    const sessionStartTime = new Date(booking.sessionInstance.startTime);
    const sessionEndTime = new Date(booking.sessionInstance.endTime);
    const now = new Date();

    if (now < sessionStartTime) {
      throw new BadRequestException('Session has not started yet');
    }

    if (
      now > sessionEndTime &&
      now.getTime() - sessionEndTime.getTime() > 1000 * 60 * 60
    ) {
      // 1 hour grace period
      throw new BadRequestException(
        'Session has ended and check-in period has expired',
      );
    }

    // Update booking and create MovementEvent
    return this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'attended',
          attendedAt: new Date(),
        },
        include: {
          sessionInstance: {
            include: {
              sessionType: true,
              location: true,
            },
          },
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create MovementEvent for attendance
      await tx.movementEvent.create({
        data: {
          memberId,
          sessionInstanceId,
          type: 'class_attendance',
          tenantId: this.prisma.tenantId,
          metadata: {
            sessionType: booking.sessionInstance.sessionType.name,
            location: booking.sessionInstance.location.name,
            duration: booking.sessionInstance.sessionType.durationMin,
            instructor: booking.sessionInstance.instructor,
            checkedInAt: new Date().toISOString(),
          },
        },
      });

      return updatedBooking;
    });
  }

  async getMemberBookings(memberId: string, status?: string) {
    const where: any = { memberId };

    if (status) {
      where.status = status;
    }

    return this.prisma.extended.booking.findMany({
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
        createdAt: 'desc',
      },
    });
  }
}
