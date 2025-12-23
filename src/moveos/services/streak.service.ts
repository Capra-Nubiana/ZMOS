import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStreak(memberId: string): Promise<number> {
    // Get all attendance events for the member, ordered by most recent first
    const attendanceEvents = await this.prisma.extended.movementEvent.findMany({
      where: {
        memberId,
        type: 'class_attendance',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });

    if (attendanceEvents.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();

    // Check each day backwards from today
    for (const event of attendanceEvents) {
      const eventDate = new Date(event.createdAt);
      const eventDateString = eventDate.toDateString();
      const expectedDateString = currentDate.toDateString();

      if (eventDateString === expectedDateString) {
        // Attendance on the expected date - streak continues
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (eventDateString < expectedDateString) {
        // Gap in attendance - check if it's the previous day
        const previousDay = new Date(currentDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const previousDayString = previousDay.toDateString();

        if (eventDateString === previousDayString) {
          // Attendance on previous day - continue checking from there
          currentDate = previousDay;
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Gap found - streak broken
          break;
        }
      }
      // If event is in the future, ignore it (shouldn't happen with proper data)
    }

    return streak;
  }

  async getStreakInfo(memberId: string) {
    const currentStreak = await this.calculateStreak(memberId);

    // Get recent attendance events for context
    const recentEvents = await this.prisma.extended.movementEvent.findMany({
      where: {
        memberId,
        type: 'class_attendance',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        createdAt: true,
        metadata: true,
      },
    });

    // Calculate longest streak (more complex - would need historical data)
    // For now, return current streak
    const longestStreak = currentStreak; // Placeholder

    return {
      currentStreak,
      longestStreak,
      recentAttendance: recentEvents.map((event) => ({
        date: event.createdAt,
        sessionType: event.metadata?.sessionType,
        location: event.metadata?.location,
      })),
    };
  }

  async createStreakMilestone(memberId: string, streakDays: number) {
    // Create a milestone event when reaching significant streak numbers
    const milestoneEvents = [7, 14, 30, 50, 100]; // Configurable milestones

    if (milestoneEvents.includes(streakDays)) {
      await this.prisma.extended.movementEvent.create({
        data: {
          memberId,
          type: 'streak_milestone',
          tenantId: this.prisma.tenantId,
          metadata: {
            streakDays,
            achievement: this.getAchievementName(streakDays),
            achievedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  private getAchievementName(streakDays: number): string {
    if (streakDays >= 100) return 'Century Champion';
    if (streakDays >= 50) return 'Golden Streak';
    if (streakDays >= 30) return 'Monthly Master';
    if (streakDays >= 14) return 'Fortnight Fighter';
    if (streakDays >= 7) return 'Week Warrior';
    return 'Consistency Builder';
  }

  async getStreakLeaderboard(limit = 10) {
    // This would require a more complex query to calculate streaks for all members
    // For Phase 2, we'll implement a simplified version

    // Get all members and calculate their streaks
    const members = await this.prisma.extended.member.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const streaks = await Promise.all(
      members.map(async (member) => ({
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
        },
        currentStreak: await this.calculateStreak(member.id),
      })),
    );

    // Sort by streak and return top performers
    return streaks
      .filter((s) => s.currentStreak > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, limit);
  }
}
