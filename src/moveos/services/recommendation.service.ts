import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { MemberService } from './member.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private memberService: MemberService,
  ) {}

  /**
   * Get session recommendations for a member with AI enhancement
   * Tries AI first, falls back to rule-based if AI is unavailable
   */
  async getRecommendationsWithAI(memberId: string, limit = 5) {
    try {
      if (this.aiService.isAvailable()) {
        // Get member profile and stats
        const [memberProfile, memberStats] = await Promise.all([
          this.memberService.getProfile(memberId),
          this.memberService.getMemberStats(memberId),
        ]);

        // Get available sessions
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const upcomingSessions =
          await this.prisma.extended.sessionInstance.findMany({
            where: {
              startTime: {
                gte: now,
                lte: futureDate,
              },
              status: 'scheduled',
            },
            include: {
              sessionType: true,
              location: true,
              bookings: {
                where: { status: 'confirmed' },
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          });

        // Filter out sessions already booked by member
        const memberBookings = await this.prisma.booking.findMany({
          where: { memberId },
          select: { sessionInstanceId: true },
        });
        const bookedSessionIds = memberBookings.map((b) => b.sessionInstanceId);

        const availableSessions = upcomingSessions.filter((session) => {
          const isNotBooked = !bookedSessionIds.includes(session.id);
          const hasSpots = session.bookings.length < session.capacity;
          return isNotBooked && hasSpots;
        });

        // Try to get AI recommendations
        try {
          const aiResult = await this.aiService.generateSessionRecommendations(
            memberProfile,
            memberStats,
            availableSessions,
          );

          this.logger.log(`AI recommendations returned for member ${memberId}`);

          return {
            recommendations: aiResult.recommendations.slice(0, limit),
            totalAvailable: availableSessions.length,
            source: 'ai',
            confidence: aiResult.confidence,
            reasoning: aiResult.reasoning,
          };
        } catch (aiError) {
          this.logger.warn(
            `AI recommendations failed: ${aiError.message}, falling back to rule-based`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in AI recommendation flow: ${error.message}`);
    }

    // Fallback to rule-based
    this.logger.log(`Using rule-based recommendations for member ${memberId}`);
    return this.getRecommendations(memberId, limit);
  }

  /**
   * Get session recommendations for a member
   * Uses rule-based algorithm (can be enhanced with AI later)
   */
  async getRecommendations(memberId: string, limit = 5) {
    // Get member's booking history
    const memberBookings = await this.prisma.booking.findMany({
      where: { memberId },
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

    // Analyze member's favorite categories
    const categoryCount = new Map<string, number>();
    memberBookings.forEach((booking) => {
      const category = booking.sessionInstance.sessionType.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    // Sort categories by frequency
    const favoriteCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    // Get upcoming sessions in favorite categories
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const where: any = {
      startTime: {
        gte: now,
        lte: futureDate,
      },
      status: 'scheduled',
    };

    // If user has favorite categories, prioritize them
    if (favoriteCategories.length > 0) {
      where.sessionType = {
        category: { in: favoriteCategories.slice(0, 3) }, // Top 3 categories
      };
    }

    const upcomingSessions =
      await this.prisma.extended.sessionInstance.findMany({
        where,
        include: {
          sessionType: true,
          location: true,
          bookings: {
            where: { status: 'confirmed' },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

    // Filter out full sessions and sessions already booked
    const bookedSessionIds = memberBookings.map((b) => b.sessionInstance.id);
    const availableSessions = upcomingSessions.filter((session) => {
      const isNotBooked = !bookedSessionIds.includes(session.id);
      const hasSpots = session.bookings.length < session.capacity;
      return isNotBooked && hasSpots;
    });

    // Score sessions based on multiple factors
    const scoredSessions = availableSessions.map((session) => {
      let score = 0;

      // Factor 1: Category match (higher score for favorite categories)
      const categoryIndex = favoriteCategories.indexOf(
        session.sessionType.category,
      );
      if (categoryIndex !== -1) {
        score += (3 - categoryIndex) * 10; // 30, 20, 10 points
      }

      // Factor 2: Availability (more spots available = higher score)
      const spotsAvailable = session.capacity - session.bookings.length;
      const availabilityRatio = spotsAvailable / session.capacity;
      score += availabilityRatio * 5;

      // Factor 3: Timing (sooner sessions get slightly higher score)
      const daysUntil = Math.ceil(
        (new Date(session.startTime).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      score += Math.max(0, 7 - daysUntil); // Max 7 points for sessions today

      return {
        session,
        score,
        reason: this.generateRecommendationReason(
          session,
          categoryIndex,
          memberBookings.length,
        ),
      };
    });

    // Sort by score and return top N
    const recommendations = scoredSessions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ session, score, reason }) => ({
        ...session,
        spotsAvailable: session.capacity - session.bookings.length,
        recommendationScore: Math.round(score),
        recommendationReason: reason,
      }));

    return {
      recommendations,
      totalAvailable: availableSessions.length,
      source: 'rule-based',
    };
  }

  /**
   * Generate a human-readable reason for the recommendation
   */
  private generateRecommendationReason(
    session: any,
    categoryMatch: number,
    totalBookings: number,
  ): string {
    const reasons: string[] = [];

    if (categoryMatch === 0) {
      reasons.push(`You love ${session.sessionType.category} classes`);
    } else if (categoryMatch === 1) {
      reasons.push(`Based on your interest in ${session.sessionType.category}`);
    } else if (categoryMatch === 2) {
      reasons.push(`Try this ${session.sessionType.category} session`);
    }

    const spotsAvailable = session.capacity - session.bookings.length;
    if (spotsAvailable <= 3) {
      reasons.push('Only a few spots left!');
    }

    const hoursUntil = Math.ceil(
      (new Date(session.startTime).getTime() - new Date().getTime()) /
        (1000 * 60 * 60),
    );
    if (hoursUntil <= 24) {
      reasons.push('Starting soon');
    }

    if (totalBookings === 0) {
      reasons.push('Perfect for getting started!');
    }

    return reasons.join(' • ') || 'Popular choice this week';
  }
}
