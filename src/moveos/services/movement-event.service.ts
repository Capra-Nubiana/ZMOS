/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MovementEventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    memberId: string;
    sessionInstanceId?: string;
    type: string;
    metadata?: any;
  }) {
    return this.prisma.extended.movementEvent.create({
      data: {
        ...data,
        tenantId: this.prisma.tenantId,
      },
    });
  }

  async findByMember(memberId: string, limit = 50) {
    return this.prisma.extended.movementEvent.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByType(type: string, limit = 100) {
    return this.prisma.extended.movementEvent.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
  }

  async getAttendanceEvents(
    memberId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      memberId,
      type: 'class_attendance',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return this.prisma.extended.movementEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
            location: true,
          },
        },
      },
    });
  }
}
