import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TrainerService } from '../services/trainer.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { MemberRole } from '@prisma/client';

@Controller('trainer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  /**
   * GET /trainer/sessions - Get trainer's assigned sessions
   */
  @Get('sessions')
  @Roles(
    MemberRole.TRAINER,
    MemberRole.STAFF,
    MemberRole.ADMIN,
    MemberRole.OWNER,
  )
  async getMySessions(@Req() req: any) {
    const trainerId = req.user.sub;
    const memberRole = req.user.role;
    return this.trainerService.getMySessions(trainerId, memberRole);
  }

  /**
   * GET /trainer/clients - Get trainer's clients
   */
  @Get('clients')
  @Roles(
    MemberRole.TRAINER,
    MemberRole.STAFF,
    MemberRole.ADMIN,
    MemberRole.OWNER,
  )
  async getMyClients(@Req() req: any) {
    const trainerId = req.user.sub;
    const memberRole = req.user.role;
    return this.trainerService.getMyClients(trainerId, memberRole);
  }

  /**
   * GET /trainer/sessions/upcoming - Get upcoming sessions
   */
  @Get('sessions/upcoming')
  @Roles(
    MemberRole.TRAINER,
    MemberRole.STAFF,
    MemberRole.ADMIN,
    MemberRole.OWNER,
  )
  async getUpcomingSessions(@Req() req: any) {
    const trainerId = req.user.sub;
    const memberRole = req.user.role;
    return this.trainerService.getUpcomingSessions(trainerId, memberRole);
  }

  /**
   * GET /trainer/sessions/:id/roster - Get session attendance roster
   */
  @Get('sessions/:id/roster')
  @Roles(
    MemberRole.TRAINER,
    MemberRole.STAFF,
    MemberRole.ADMIN,
    MemberRole.OWNER,
  )
  async getSessionRoster(@Req() req: any, @Param('id') sessionId: string) {
    const trainerId = req.user.sub;
    const memberRole = req.user.role;
    return this.trainerService.getSessionRoster(
      trainerId,
      sessionId,
      memberRole,
    );
  }
}
