import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
    let service: PaymentService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        extended: {
            paymentRequest: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn(),
            },
            trainerEarnings: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                upsert: jest.fn(),
            },
            member: {
                findUnique: jest.fn(),
            },
        },
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
        prismaService = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllTrainerEarnings', () => {
        it('should return trainer earnings for a tenant', async () => {
            const tenantId = 'tenant-123';
            const month = 1;
            const year = 2026;
            const mockEarnings = [
                { id: 'payout-1', netEarnings: 1000, status: 'PENDING' },
                { id: 'payout-2', netEarnings: 2000, status: 'PAID' },
            ];

            mockPrismaService.extended.trainerEarnings.findMany.mockResolvedValue(mockEarnings);

            const result = await service.getAllTrainerEarnings(tenantId, month, year);

            expect(mockPrismaService.extended.trainerEarnings.findMany).toHaveBeenCalledWith({
                where: { tenantId, month, year },
                include: expect.any(Object),
                orderBy: { netEarnings: 'desc' },
            });
            expect(result).toEqual(mockEarnings);
        });
    });

    describe('updatePayoutStatus', () => {
        const payoutId = 'payout-123';

        it('should update payout status to PAID', async () => {
            const mockPayout = { id: payoutId, status: 'PENDING' };
            mockPrismaService.extended.trainerEarnings.findUnique.mockResolvedValue(mockPayout);
            mockPrismaService.extended.trainerEarnings.update.mockResolvedValue({
                ...mockPayout,
                status: 'PAID',
                payoutDate: new Date(),
            });

            const result = await service.updatePayoutStatus(payoutId, 'PAID', 'REF-123', 'M-Pesa');

            expect(mockPrismaService.extended.trainerEarnings.update).toHaveBeenCalledWith({
                where: { id: payoutId },
                data: {
                    status: 'PAID',
                    payoutReference: 'REF-123',
                    payoutMethod: 'M-Pesa',
                    payoutDate: expect.any(Date),
                },
            });
            expect(result.status).toBe('PAID');
        });

        it('should throw NotFoundException if payout record not found', async () => {
            mockPrismaService.extended.trainerEarnings.findUnique.mockResolvedValue(null);

            await expect(service.updatePayoutStatus(payoutId, 'PAID')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
