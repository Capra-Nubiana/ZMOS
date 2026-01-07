import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
  Post,
  Delete,
} from '@nestjs/common';
import { MemberProfileService } from '../services/member-profile.service';
import { FavoriteService } from '../services/favorite.service';
import { StreakService } from '../services/streak.service';
import { MovementEventService } from '../services/movement-event.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { MemberRole } from '@prisma/client';

@Controller('my')
@UseGuards(JwtAuthGuard)
export class MemberProfileController {
  constructor(
    private readonly memberProfileService: MemberProfileService,
    private readonly favoriteService: FavoriteService,
    private readonly streakService: StreakService,
    private readonly movementEventService: MovementEventService,
  ) {}

  /**
   * GET /my/profile - Get current member's profile
   */
  @Get('profile')
  async getMyProfile(@Req() req: any) {
    const memberId = req.user.sub;
    return this.memberProfileService.getMyProfile(memberId);
  }

  /**
   * PUT /my/profile - Update current member's profile
   */
  @Put('profile')
  async updateMyProfile(
    @Req() req: any,
    @Body()
    updateData: {
      name?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      gender?: string;
      profilePhoto?: string;
    },
  ) {
    const memberId = req.user.sub;
    return this.memberProfileService.updateMyProfile(memberId, updateData);
  }

  /**
   * GET /my/stats - Get member's activity statistics
   */
  @Get('stats')
  async getMyStats(@Req() req: any) {
    const memberId = req.user.sub;
    return this.memberProfileService.getMyStats(memberId);
  }

  /**
   * GET /my/bookings/history - Get booking history with pagination
   */
  @Get('bookings/history')
  async getMyBookingHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const memberId = req.user.sub;
    return this.memberProfileService.getMyBookingHistory(memberId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });
  }

  /**
   * GET /my/business-stats - Get business statistics for owners/admins
   * Requires OWNER or ADMIN role
   */
  @Get('business-stats')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async getBusinessStats(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.memberProfileService.getBusinessStats(tenantId);
  }

  /**
   * GET /my/analytics - Get detailed analytics for owners/admins
   * Requires OWNER or ADMIN role
   */
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async getDetailedAnalytics(@Req() req: any, @Query('days') days?: string) {
    const tenantId = req.user.tenantId;
    const daysParam = days ? parseInt(days, 10) : 30;
    return this.memberProfileService.getDetailedAnalytics(tenantId, daysParam);
  }

  // ============================================================================
  // Activity & Streak Endpoints
  // ============================================================================

  /**
   * GET /my/streak - Get current streak information
   */
  @Get('streak')
  async getStreak(@Req() req: any) {
    const memberId = req.user.sub;
    const streakInfo = await this.streakService.getStreakInfo(memberId);

    // Transform to match mobile app's AttendanceDay structure
    const groupedAttendance: Record<
      string,
      { date: string; count: number; sessionTypes: string[] }
    > = {};

    streakInfo.recentAttendance.forEach((event) => {
      const dateStr = new Date(event.date).toISOString().split('T')[0];
      if (!groupedAttendance[dateStr]) {
        groupedAttendance[dateStr] = {
          date: dateStr,
          count: 0,
          sessionTypes: [],
        };
      }
      groupedAttendance[dateStr].count++;
      if (
        event.sessionType &&
        !groupedAttendance[dateStr].sessionTypes.includes(event.sessionType)
      ) {
        groupedAttendance[dateStr].sessionTypes.push(event.sessionType);
      }
    });

    return {
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      recentAttendance: Object.values(groupedAttendance),
      lastAttendanceDate: streakInfo.recentAttendance[0]?.date || null,
    };
  }

  /**
   * GET /my/events - Get movement event history
   */
  @Get('events')
  async getMovementEvents(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const memberId = req.user.sub;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    const events = type
      ? await this.movementEventService.findByType(type, limitNum)
      : await this.movementEventService.findByMember(memberId, limitNum);

    // Filter by memberId if we used findByType
    const filteredEvents = type
      ? (events as any[]).filter((e) => e.memberId === memberId)
      : events;

    return filteredEvents;
  }

  /**
   * GET /my/attendance - Get attendance record history
   */
  @Get('attendance')
  async getAttendanceHistory(
    @Req() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const memberId = req.user.sub;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    const events = await this.movementEventService.getAttendanceEvents(
      memberId,
      startDate,
      endDate,
    );

    // Group by date to match Frontend's AttendanceRecord
    const grouped: Record<string, any[]> = {};

    events.forEach((event) => {
      const dateStr = new Date(event.createdAt).toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }

      grouped[dateStr].push({
        sessionType: event.sessionInstance?.sessionType?.name || 'Unknown',
        location: event.sessionInstance?.location?.name || 'Unknown',
        startTime:
          event.sessionInstance?.startTime?.toISOString() ||
          event.createdAt.toISOString(),
        status: 'attended', // These are all 'class_attendance' events by definition
      });
    });

    return Object.entries(grouped).map(([date, sessions]) => ({
      date,
      sessions,
    }));
  }

  // ============================================================================
  // Favorites Endpoints
  // ============================================================================

  /**
   * POST /my/favorites/:sessionTypeId - Add session type to favorites
   */
  @Post('favorites/:sessionTypeId')
  async addFavorite(
    @Req() req: any,
    @Param('sessionTypeId') sessionTypeId: string,
  ) {
    const memberId = req.user.sub;
    return this.favoriteService.addFavorite(sessionTypeId, memberId);
  }

  /**
   * DELETE /my/favorites/:sessionTypeId - Remove session type from favorites
   */
  @Delete('favorites/:sessionTypeId')
  async removeFavorite(
    @Req() req: any,
    @Param('sessionTypeId') sessionTypeId: string,
  ) {
    const memberId = req.user.sub;
    await this.favoriteService.removeFavorite(sessionTypeId, memberId);
    return { success: true };
  }

  /**
   * GET /my/favorites - List current member's favorites
   */
  @Get('favorites')
  async getFavorites(@Req() req: any) {
    const memberId = req.user.sub;
    return this.favoriteService.getFavorites(memberId);
  }
}
