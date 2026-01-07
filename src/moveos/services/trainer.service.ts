import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class TrainerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get trainer's assigned sessions
   */
  async getMySessions(trainerId: string, memberRole: MemberRole) {
    // Only trainers, staff, and admins can access this
    const allowedRoles: MemberRole[] = [
      MemberRole.TRAINER,
      MemberRole.STAFF,
      MemberRole.ADMIN,
      MemberRole.OWNER,
    ];
    if (!allowedRoles.includes(memberRole)) {
      throw new ForbiddenException(
        'Only trainers and staff can access this endpoint',
      );
    }

    // Get member to find their name
    const trainer = await this.prisma.extended.member.findUnique({
      where: { id: trainerId },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    // Find sessions where instructor matches trainer name
    const sessions = await this.prisma.extended.sessionInstance.findMany({
      where: {
        instructor: trainer.name || '',
        status: { in: ['scheduled', 'completed'] },
      },
      include: {
        sessionType: true,
        location: true,
        bookings: {
          where: {
            status: { in: ['confirmed', 'attended'] },
          },
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return sessions;
  }

  /**
   * Get trainer's clients (members who have booked their sessions)
   */
  async getMyClients(trainerId: string, memberRole: MemberRole) {
    // Only trainers, staff, and admins can access this
    const allowedRoles: MemberRole[] = [
      MemberRole.TRAINER,
      MemberRole.STAFF,
      MemberRole.ADMIN,
      MemberRole.OWNER,
    ];
    if (!allowedRoles.includes(memberRole)) {
      throw new ForbiddenException(
        'Only trainers and staff can access this endpoint',
      );
    }

    // Get trainer info
    const trainer = await this.prisma.extended.member.findUnique({
      where: { id: trainerId },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    // Get all sessions for this trainer
    const sessions = await this.prisma.extended.sessionInstance.findMany({
      where: {
        instructor: trainer.name || '',
      },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'attended'] },
          },
          include: {
            member: true,
            sessionInstance: {
              include: {
                sessionType: true,
              },
            },
          },
        },
      },
    });

    // Aggregate unique clients with their stats
    const clientMap = new Map<string, any>();

    sessions.forEach((session) => {
      session.bookings.forEach((booking) => {
        const clientId = booking.member.id;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: booking.member.id,
            name: booking.member.name,
            email: booking.member.email,
            phoneNumber: booking.member.phoneNumber,
            profilePhoto: booking.member.profilePhoto,
            joinDate: booking.member.createdAt,
            totalBookings: 0,
            attendedSessions: 0,
            lastVisit: null as Date | null,
            favoriteSessionTypes: new Map<string, number>(),
          });
        }

        const client = clientMap.get(clientId);
        client.totalBookings++;

        if (booking.status === 'attended') {
          client.attendedSessions++;
          if (!client.lastVisit || booking.attendedAt! > client.lastVisit) {
            client.lastVisit = booking.attendedAt;
          }
        }

        // Track session type preferences
        const sessionType = booking.sessionInstance.sessionType.name;
        const currentCount = client.favoriteSessionTypes.get(sessionType) || 0;
        client.favoriteSessionTypes.set(sessionType, currentCount + 1);
      });
    });

    // Convert to array and format
    const clients = Array.from(clientMap.values()).map((client) => {
      // Get top session type
      const sessionTypes = Array.from(
        client.favoriteSessionTypes.entries(),
      ).sort(([, a], [, b]) => (b as number) - (a as number)) as [
        string,
        number,
      ][];

      const favoriteSessionType =
        sessionTypes.length > 0 ? sessionTypes[0][0] : null;

      // Calculate current streak (simplified - could be enhanced)
      const currentStreak = 0; // TODO: Implement streak calculation

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        profilePhoto: client.profilePhoto,
        joinDate: client.joinDate,
        totalBookings: client.totalBookings,
        attendedSessions: client.attendedSessions,
        currentStreak,
        lastVisit: client.lastVisit,
        favoriteSessionType,
      };
    });

    // Sort by most recent visit
    clients.sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return b.lastVisit.getTime() - a.lastVisit.getTime();
    });

    return clients;
  }

  /**
   * Get upcoming sessions for trainer
   */
  async getUpcomingSessions(trainerId: string, memberRole: MemberRole) {
    // Only trainers, staff, and admins can access this
    const allowedRoles: MemberRole[] = [
      MemberRole.TRAINER,
      MemberRole.STAFF,
      MemberRole.ADMIN,
      MemberRole.OWNER,
    ];
    if (!allowedRoles.includes(memberRole)) {
      throw new ForbiddenException(
        'Only trainers and staff can access this endpoint',
      );
    }

    const trainer = await this.prisma.extended.member.findUnique({
      where: { id: trainerId },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    const now = new Date();
    const sessions = await this.prisma.extended.sessionInstance.findMany({
      where: {
        instructor: trainer.name || '',
        startTime: { gte: now },
        status: 'scheduled',
      },
      include: {
        sessionType: true,
        location: true,
        bookings: {
          where: {
            status: 'confirmed',
          },
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
      take: 20,
    });

    return sessions;
  }

  /**
   * Get session attendance roster for check-in
   */
  async getSessionRoster(
    trainerId: string,
    sessionId: string,
    memberRole: MemberRole,
  ) {
    // Only trainers, staff, and admins can access this
    const allowedRoles: MemberRole[] = [
      MemberRole.TRAINER,
      MemberRole.STAFF,
      MemberRole.ADMIN,
      MemberRole.OWNER,
    ];
    if (!allowedRoles.includes(memberRole)) {
      throw new ForbiddenException(
        'Only trainers and staff can access this endpoint',
      );
    }

    const session = await this.prisma.extended.sessionInstance.findUnique({
      where: { id: sessionId },
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
                phoneNumber: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}
