/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentMember } from '../../auth/current-member.decorator';
import { MemberService } from '../services/member.service';
import {
  CompleteOwnerProfileDto,
  CompleteTrainerProfileDto,
  CompleteClientProfileDto,
  CompleteStaffProfileDto,
} from '../dto/complete-profile.dto';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MemberManagementController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  getAllMembers(@CurrentMember() currentMember: any) {
    // TODO: Only allow gym owners/administrators to access this
    return this.memberService.getAllMembers(currentMember.tenantId);
  }

  @Get('my/profile')
  getMyProfile(@CurrentMember() currentMember: any) {
    return this.memberService.getProfile(currentMember.id);
  }

  @Put('my/profile')
  updateMyProfile(
    @CurrentMember() currentMember: any,
    @Body() updateData: { name?: string; avatar?: string },
  ) {
    return this.memberService.updateProfile(currentMember.id, updateData);
  }

  @Get('my/stats')
  getMyStats(@CurrentMember() currentMember: any) {
    return this.memberService.getMemberStats(currentMember.id);
  }

  @Post()
  createMember(
    @Body() createMemberDto: any,
    @CurrentMember() currentMember: any,
  ) {
    // TODO: Implement member creation
    return {
      id: 'new-member-id',
      ...createMemberDto,
      tenantId: currentMember.tenantId,
      createdAt: new Date(),
    };
  }

  @Put(':id')
  updateMember(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentMember() currentMember: any,
  ) {
    // TODO: Implement member update
    return {
      id,
      ...updateDto,
      updatedAt: new Date(),
    };
  }

  @Get('stats')
  getMemberStats(@CurrentMember() currentMember: any) {
    // TODO: Calculate real member statistics
    return {
      totalMembers: 25,
      activeThisMonth: 20,
      newThisMonth: 3,
      averageStreak: 4.2,
      topPerformers: [
        { name: 'John Doe', streak: 12 },
        { name: 'Jane Smith', streak: 8 },
        { name: 'Mike Johnson', streak: 6 },
      ],
    };
  }

  // ===== Profile Completion Endpoints =====

  @Post('my/profile/complete/owner')
  completeOwnerProfile(
    @CurrentMember() currentMember: any,
    @Body() dto: CompleteOwnerProfileDto,
  ) {
    return this.memberService.completeOwnerProfile(currentMember.id, dto);
  }

  @Post('my/profile/complete/trainer')
  completeTrainerProfile(
    @CurrentMember() currentMember: any,
    @Body() dto: CompleteTrainerProfileDto,
  ) {
    return this.memberService.completeTrainerProfile(currentMember.id, dto);
  }

  @Post('my/profile/complete/client')
  completeClientProfile(
    @CurrentMember() currentMember: any,
    @Body() dto: CompleteClientProfileDto,
  ) {
    return this.memberService.completeClientProfile(currentMember.id, dto);
  }

  @Post('my/profile/complete/staff')
  completeStaffProfile(
    @CurrentMember() currentMember: any,
    @Body() dto: CompleteStaffProfileDto,
  ) {
    return this.memberService.completeStaffProfile(currentMember.id, dto);
  }
}
