import { Test, TestingModule } from '@nestjs/testing';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from './payment.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MembershipService', () => {
    let service: MembershipService;
    let prismaService: PrismaService;
    let paymentService: PaymentService;

    const mockPrismaService = {
        extended: {
            membershipPlan: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            membershipSubscription: {
                findFirst: jest.fn(),
                create: jest.fn(),
            },
        },
    };

    const mockPaymentService = {
        createPaymentRequest: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MembershipService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
            ],
        }).compile();

        service = module.get<MembershipService>(MembershipService);
        prismaService = module.get<PrismaService>(PrismaService);
        paymentService = module.get<PaymentService>(PaymentService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getPlans', () => {
        it('should return active membership plans for a tenant', async () => {
            const tenantId = 'tenant-123';
            const mockPlans = [{ id: 'plan-1', name: 'Basic' }];
            mockPrismaService.extended.membershipPlan.findMany.mockResolvedValue(mockPlans);

            const result = await service.getPlans(tenantId);

            expect(mockPrismaService.extended.membershipPlan.findMany).toHaveBeenCalledWith({
                where: { tenantId, isActive: true },
            });
            expect(result).toEqual(mockPlans);
        });
    });

    describe('subscribeMember', () => {
        const memberId = 'member-123';
        const planId = 'plan-123';
        const tenantId = 'tenant-123';
        const mockPlan = {
            id: planId,
            name: 'Premium',
            price: 50.0,
            currency: 'USD',
            billingCycle: 'monthly',
            isActive: true
        };

        it('should subscribe a member successfully', async () => {
            mockPrismaService.extended.membershipPlan.findUnique.mockResolvedValue(mockPlan);
            mockPrismaService.extended.membershipSubscription.findFirst.mockResolvedValue(null);
            mockPrismaService.extended.membershipSubscription.create.mockResolvedValue({ id: 'sub-1' });

            const result = await service.subscribeMember(memberId, planId, tenantId);

            expect(mockPrismaService.extended.membershipSubscription.create).toHaveBeenCalled();
            expect(mockPaymentService.createPaymentRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    toMemberId: memberId,
                    amount: mockPlan.price,
                    paymentType: 'gym_membership',
                }),
                null,
                tenantId,
            );
            expect(result).toEqual({ id: 'sub-1' });
        });

        it('should throw NotFoundException if plan not found or inactive', async () => {
            mockPrismaService.extended.membershipPlan.findUnique.mockResolvedValue(null);

            await expect(service.subscribeMember(memberId, planId, tenantId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if member already has active subscription', async () => {
            mockPrismaService.extended.membershipPlan.findUnique.mockResolvedValue(mockPlan);
            mockPrismaService.extended.membershipSubscription.findFirst.mockResolvedValue({ id: 'existing-sub' });

            await expect(service.subscribeMember(memberId, planId, tenantId)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
