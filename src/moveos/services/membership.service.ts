import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from './payment.service';
import { PaymentType } from '../dto/create-payment-request.dto';

@Injectable()
export class MembershipService {
    private readonly logger = new Logger(MembershipService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentService: PaymentService,
    ) { }

    /**
     * Get all active membership plans for a tenant
     */
    async getPlans(tenantId: string) {
        return this.prisma.extended.membershipPlan.findMany({
            where: {
                tenantId,
                isActive: true,
            },
        });
    }

    /**
     * Subscribe a member to a plan
     */
    async subscribeMember(memberId: string, planId: string, tenantId: string) {
        // 1. Get the plan details
        const plan = await this.prisma.extended.membershipPlan.findUnique({
            where: { id: planId },
        });

        if (!plan || !plan.isActive) {
            throw new NotFoundException('Membership plan not found or inactive');
        }

        // 2. Check for existing active subscription
        const existingSub = await this.prisma.extended.membershipSubscription.findFirst({
            where: {
                memberId,
                tenantId,
                status: 'ACTIVE',
            },
        });

        if (existingSub) {
            // Logic could be added here to handle upgrades/downgrades
            // For now, let's just prevent duplicate subscriptions
            throw new BadRequestException('Member already has an active subscription');
        }

        // 3. Create the subscription
        const now = new Date();
        const endDate = new Date();
        if (plan.billingCycle === 'monthly') {
            endDate.setMonth(now.getMonth() + 1);
        } else if (plan.billingCycle === 'yearly') {
            endDate.setFullYear(now.getFullYear() + 1);
        } else {
            endDate.setMonth(now.getMonth() + 1); // Default to monthly
        }

        const subscription = await this.prisma.extended.membershipSubscription.create({
            data: {
                tenantId,
                memberId,
                membershipPlanId: planId,
                status: 'ACTIVE',
                startDate: now,
                endDate: endDate,
                nextBillingDate: endDate,
                autoRenew: true,
            },
        });

        // 4. Create a payment request for the first installment
        await this.paymentService.createPaymentRequest(
            {
                toMemberId: memberId,
                amount: plan.price,
                currency: plan.currency,
                paymentType: PaymentType.GYM_MEMBERSHIP,
                description: `Membership: ${plan.name} (${plan.billingCycle})`,
                metadata: {
                    subscriptionId: subscription.id,
                    planId: plan.id,
                },
            },
            null, // No fromMemberId for gym-to-client payments
            tenantId,
        );

        this.logger.log(`Member ${memberId} subscribed to plan ${plan.name}`);

        return subscription;
    }

    /**
     * Get member's subscription status
     */
    async getMemberSubscription(memberId: string) {
        return this.prisma.extended.membershipSubscription.findFirst({
            where: { memberId },
            include: {
                membershipPlan: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
