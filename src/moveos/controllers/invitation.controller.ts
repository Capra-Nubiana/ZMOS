import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  BulkInvitationDto,
} from '../dto/invitation.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { MemberRole } from '@prisma/client';
import { Public } from '../../auth/public.decorator';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * POST /invitations - Create a single invitation
   * Requires ADMIN or OWNER role
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const invitedById = req.user.sub;
    return this.invitationService.create(
      createInvitationDto,
      tenantId,
      invitedById,
    );
  }

  /**
   * POST /invitations/bulk - Create multiple invitations
   * Requires ADMIN or OWNER role
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async bulkCreate(
    @Body() bulkInvitationDto: BulkInvitationDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const invitedById = req.user.sub;
    return this.invitationService.bulkCreate(
      bulkInvitationDto,
      tenantId,
      invitedById,
    );
  }

  /**
   * GET /invitations - List all invitations for the tenant
   * Requires ADMIN or OWNER role
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.invitationService.findAll(tenantId);
  }

  /**
   * GET /invitations/summary - Get invitation statistics
   * Requires ADMIN or OWNER role
   */
  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async getSummary(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.invitationService.getSummary(tenantId);
  }

  /**
   * POST /invitations/accept - Accept an invitation
   * PUBLIC endpoint (no auth required)
   */
  @Public()
  @Post('accept')
  async accept(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.invitationService.accept(acceptInvitationDto);
  }

  /**
   * POST /invitations/decline - Decline an invitation
   * PUBLIC endpoint
   */
  @Public()
  @Post('decline')
  async decline(@Body() declineInvitationDto: DeclineInvitationDto) {
    return this.invitationService.decline(declineInvitationDto);
  }

  /**
   * GET /invitations/:id - Get invitation details
   * PUBLIC (to show invite info before accepting) or Guarded?
   * Frontend might call this to show "You are invited to [Gym Name] by [Instructor]"
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    // If we have a code instead of ID, we might need a separate endpoint
    // but the mobile app uses id in some places and code in others.
    // Let's support code lookup if ID doesn't work or just use findOne.
    return this.invitationService.findOne(id, tenantId);
  }

  /**
   * DELETE /invitations/:id - Cancel an invitation
   * Requires ADMIN or OWNER
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.invitationService.cancel(id, tenantId);
  }
}
