import { Test, TestingModule } from '@nestjs/testing';
import { SessionInstanceService } from './session-instance.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SessionInstanceService', () => {
    let service: SessionInstanceService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        sessionInstance: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
        },
        extended: {
            sessionInstance: {
                findMany: jest.fn(),
                count: jest.fn(),
                findUnique: jest.fn(),
            },
            sessionType: {
                findUnique: jest.fn(),
            },
            location: {
                findUnique: jest.fn(),
            },
        },
        tenantId: 'test-tenant-id',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionInstanceService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<SessionInstanceService>(SessionInstanceService);
        prismaService = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('getAvailableSessions', () => {
        it('should show sessions with null capacity as available', async () => {
            const mockSessions = [
                {
                    id: 'session-unlimited',
                    capacity: null,
                    bookings: [], // No bookings
                },
                {
                    id: 'session-full',
                    capacity: 1,
                    bookings: [{ status: 'confirmed' }], // 1 booking = Full
                }
            ];

            mockPrismaService.sessionInstance.findMany.mockResolvedValue(mockSessions);
            mockPrismaService.sessionInstance.count.mockResolvedValue(2);

            const result = await service.getAvailableSessions({});

            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('session-unlimited');
        });

        it('should filter out sessions at capacity', async () => {
            const mockSessions = [
                {
                    id: 'session-available',
                    capacity: 10,
                    bookings: [{ status: 'confirmed' }], // 1/10 = Available
                }
            ];

            mockPrismaService.sessionInstance.findMany.mockResolvedValue(mockSessions);
            mockPrismaService.sessionInstance.count.mockResolvedValue(1);

            const result = await service.getAvailableSessions({});

            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('session-available');
        });
    });
});
