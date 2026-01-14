/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Join waitlist for a session
   */
  async joinWaitlist(sessionInstanceId: string, memberId: string) {
    // Check if session exists
    const session = await this.prisma.extended.sessionInstance.findUnique({
      where: { id: sessionInstanceId },
      include: { bookings: { where: { status: 'confirmed' } } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if already on waitlist
    const existingEntry = await this.prisma.waitlist.findUnique({
      where: {
        memberId_sessionInstanceId: {
          memberId,
          sessionInstanceId,
        },
      },
    });

    if (existingEntry) {
      throw new ConflictException('Already on waitlist for this session');
    }

    // Check if already booked
    const existingBooking = await this.prisma.booking.findUnique({
      where: {
        memberId_sessionInstanceId: {
          memberId,
          sessionInstanceId,
        },
      },
    });

    if (existingBooking && existingBooking.status === 'confirmed') {
      throw new ConflictException('Already booked this session');
    }

    // Calculate position (count existing waitlist entries + 1)
    const currentCount = await this.prisma.waitlist.count({
      where: { sessionInstanceId },
    });

    const waitlistEntry = await this.prisma.waitlist.create({
      data: {
        memberId,
        sessionInstanceId,
        tenantId: this.prisma.tenantId!,
        position: currentCount + 1,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
      },
    });

    this.logger.log(
      `Member ${memberId} joined waitlist for session ${sessionInstanceId} at position ${waitlistEntry.position}`,
    );

    return waitlistEntry;
  }

  /**
   * Leave waitlist
   */
  async leaveWaitlist(sessionInstanceId: string, memberId: string) {
    const entry = await this.prisma.waitlist.findUnique({
      where: {
        memberId_sessionInstanceId: {
          memberId,
          sessionInstanceId,
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Not on waitlist for this session');
    }

    await this.prisma.waitlist.delete({
      where: { id: entry.id },
    });

    // Update positions for remaining entries
    await this.recalculatePositions(sessionInstanceId);

    this.logger.log(
      `Member ${memberId} left waitlist for session ${sessionInstanceId}`,
    );
  }

  /**
   * Get waitlist for a session
   */
  async getWaitlist(sessionInstanceId: string) {
    return this.prisma.waitlist.findMany({
      where: { sessionInstanceId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get member's waitlist entries
   */
  async getMemberWaitlists(memberId: string) {
    return this.prisma.waitlist.findMany({
      where: { memberId },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Recalculate positions after someone leaves
   */
  private async recalculatePositions(sessionInstanceId: string) {
    const entries = await this.prisma.waitlist.findMany({
      where: { sessionInstanceId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].position !== i + 1) {
        await this.prisma.waitlist.update({
          where: { id: entries[i].id },
          data: { position: i + 1 },
        });
      }
    }
  }
}
