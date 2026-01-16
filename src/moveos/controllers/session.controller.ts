/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SessionInstanceService } from '../services/session-instance.service';
import { RecommendationService } from '../services/recommendation.service';
import { RecommendationResult } from '../../ai/ai.service';
import { WaitlistService } from '../services/waitlist.service';
import { WeatherService } from '../services/weather.service';
import { CreateSessionInstanceDto } from '../dto/create-session-instance.dto';
import { UpdateSessionInstanceDto } from '../dto/update-session-instance.dto';
import { QuerySessionsDto } from '../dto/query-sessions.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentMember } from '../../auth/current-member.decorator';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly sessionInstanceService: SessionInstanceService,
    private readonly recommendationService: RecommendationService,
    private readonly waitlistService: WaitlistService,
    private readonly weatherService: WeatherService,
  ) { }

  // Protected endpoints (require authentication)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSessionInstanceDto: CreateSessionInstanceDto) {
    return this.sessionInstanceService.create(createSessionInstanceDto);
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  getMyBookings(@CurrentMember() currentMember: any) {
    return this.sessionInstanceService.getMemberBookedSessions(
      currentMember.id,
    );
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  getRecommendations(
    @CurrentMember() currentMember: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.recommendationService.getRecommendationsWithAI(
      currentMember.id,
      limitNum,
    );
  }

  // Public browsing endpoints (no auth required for discovery)
  @Get()
  findAll(@Query() query: QuerySessionsDto) {
    return this.sessionInstanceService.findAll(query);
  }

  @Get('available')
  getAvailableSessions(@Query() query: QuerySessionsDto) {
    return this.sessionInstanceService.getAvailableSessions(query);
  }

  @Get('upcoming')
  getUpcomingSessions(
    @Query('days') days?: string,
    @Query('category') category?: string,
    @Query('locationId') locationId?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.sessionInstanceService.getUpcomingSessions(daysNum, {
      category,
      locationId,
    });
  }

  @Get('today')
  getTodaysSessions(
    @Query('category') category?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.sessionInstanceService.getTodaysSessions({
      category,
      locationId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionInstanceService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateSessionInstanceDto: UpdateSessionInstanceDto,
  ) {
    return this.sessionInstanceService.update(id, updateSessionInstanceDto);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string) {
    return this.sessionInstanceService.cancel(id);
  }

  @Put(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id') id: string) {
    return this.sessionInstanceService.complete(id);
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  checkIn(@Param('id') id: string) {
    // This will need to be updated to get memberId from JWT token
    // For now, we'll assume it's passed or extracted from auth
    return this.sessionInstanceService.findOne(id); // Placeholder
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.sessionInstanceService.cancel(id); // Soft delete via cancel
  }

  // Waitlist endpoints
  @Post(':id/waitlist')
  @UseGuards(JwtAuthGuard)
  joinWaitlist(@Param('id') id: string, @CurrentMember() currentMember: any) {
    return this.waitlistService.joinWaitlist(id, currentMember.id);
  }

  @Get(':id/waitlist')
  getWaitlist(@Param('id') id: string) {
    return this.waitlistService.getWaitlist(id);
  }

  @Delete(':id/waitlist')
  @UseGuards(JwtAuthGuard)
  leaveWaitlist(@Param('id') id: string, @CurrentMember() currentMember: any) {
    return this.waitlistService.leaveWaitlist(id, currentMember.id);
  }

  // Public search endpoint
  @Get('search')
  searchSessions(
    @Query('q') q?: string,
    @Query('date') date?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.sessionInstanceService.searchSessions({
      q,
      date,
      category,
      difficulty,
    });
  }

  // Public weather endpoints for outdoor sessions
  @Get(':id/weather')
  async getSessionWeather(@Param('id') id: string) {
    const session = await this.sessionInstanceService.findOne(id);
    const location = session.location;

    if (!location.latitude || !location.longitude) {
      return {
        error: 'Location coordinates not available',
        sessionId: id,
      };
    }

    const weatherData = await this.weatherService.getCurrentWeather(
      location.latitude,
      location.longitude,
    );

    return {
      sessionId: id,
      locationName: location.name,
      weatherData,
    };
  }

  @Get(':id/weather/safety')
  async checkSessionWeatherSafety(@Param('id') id: string) {
    const session = await this.sessionInstanceService.findOne(id);
    const sessionType = session.sessionType;
    const location = session.location;

    if (!location.latitude || !location.longitude) {
      return {
        error: 'Location coordinates not available',
        sessionId: id,
      };
    }

    // Build weather requirements from session type
    const requirements: any = {};
    if (sessionType.temperatureMin !== null)
      requirements.minTemp = sessionType.temperatureMin;
    if (sessionType.temperatureMax !== null)
      requirements.maxTemp = sessionType.temperatureMax;
    if (sessionType.weatherConditions) {
      requirements.allowedConditions = sessionType.weatherConditions.split(',');
    }

    const safetyCheck = await this.weatherService.checkWeatherSafety(
      location.latitude,
      location.longitude,
      requirements,
    );

    return {
      sessionId: id,
      sessionType: sessionType.name,
      locationName: location.name,
      ...safetyCheck,
    };
  }

  @Get(':id/weather/forecast')
  async getSessionWeatherForecast(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const session = await this.sessionInstanceService.findOne(id);
    const location = session.location;

    if (!location.latitude || !location.longitude) {
      return {
        error: 'Location coordinates not available',
        sessionId: id,
      };
    }

    const daysNum = days ? parseInt(days, 10) : 7;
    const forecast = await this.weatherService.getWeatherForecast(
      location.latitude,
      location.longitude,
      daysNum,
    );

    return {
      sessionId: id,
      locationName: location.name,
      forecast,
    };
  }
}
