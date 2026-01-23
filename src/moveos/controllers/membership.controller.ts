import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MembershipService } from '../services/membership.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentMember } from '../../auth/current-member.decorator';

@Controller('memberships')
export class MembershipController {
    constructor(private readonly membershipService: MembershipService) { }

    /**
     * GET /memberships/plans
     * Get all active membership plans for the current tenant
     */
    @Get('plans')
    @UseGuards(JwtAuthGuard)
    getPlans(@CurrentMember() member: any) {
        return this.membershipService.getPlans(member.tenantId);
    }

    /**
     * POST /memberships/subscribe
     * Subscribe current member to a plan
     */
    @Post('subscribe')
    @UseGuards(JwtAuthGuard)
    subscribeMember(
        @CurrentMember() member: any,
        @Body('planId') planId: string,
    ) {
        return this.membershipService.subscribeMember(
            member.id,
            planId,
            member.tenantId,
        );
    }

    /**
     * GET /memberships/subscription
     * Get current member's subscription status
     */
    @Get('subscription')
    @UseGuards(JwtAuthGuard)
    getMemberSubscription(@CurrentMember() member: any) {
        return this.membershipService.getMemberSubscription(member.id);
    }
}
