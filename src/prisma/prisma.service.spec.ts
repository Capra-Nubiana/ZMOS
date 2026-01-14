/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ClsService } from 'nestjs-cls';

describe('PrismaService', () => {
  let service: PrismaService;
  let clsService: ClsService;

  const mockClsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tenant isolation', () => {
    it('should get tenantId from CLS context', () => {
      mockClsService.get.mockReturnValue('tenant-123');
      expect(service.tenantId).toBe('tenant-123');
    });

    it('should return undefined when no tenant in CLS', () => {
      mockClsService.get.mockReturnValue(undefined);
      expect(service.tenantId).toBe(undefined);
    });
  });

  describe('extended client', () => {
    it('should have extended property', () => {
      expect(service.extended).toBeDefined();
    });

    it('should have member model in extended client', () => {
      expect(service.extended.member).toBeDefined();
    });

    it('should have tenant model in extended client', () => {
      expect(service.extended.tenant).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database on module initialization', async () => {
      const connectSpy = jest.spyOn(service, '$connect');
      connectSpy.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });
  });
});
