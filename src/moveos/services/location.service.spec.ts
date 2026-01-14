/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LocationService', () => {
  let service: LocationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    extended: {
      location: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
    tenantId: 'test-tenant-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a location successfully', async () => {
      const createLocationDto = {
        name: 'Test Studio',
        address: '123 Test St',
        capacity: 20,
      };

      const expectedResult = {
        id: 'location-id',
        ...createLocationDto,
        tenantId: 'test-tenant-id',
        timezone: 'UTC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.extended.location.findFirst.mockResolvedValue(null);
      mockPrismaService.extended.location.create.mockResolvedValue(
        expectedResult,
      );

      const result = await service.create(createLocationDto);

      expect(
        mockPrismaService.extended.location.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          name: createLocationDto.name,
          tenantId: 'test-tenant-id',
        },
      });
      expect(mockPrismaService.extended.location.create).toHaveBeenCalledWith({
        data: {
          ...createLocationDto,
          tenantId: 'test-tenant-id',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw conflict exception for duplicate name', async () => {
      const createLocationDto = {
        name: 'Existing Studio',
        address: '123 Test St',
      };

      mockPrismaService.extended.location.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'Existing Studio',
      });

      await expect(service.create(createLocationDto)).rejects.toThrow(
        'Location with name "Existing Studio" already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all active locations', async () => {
      const expectedLocations = [
        { id: '1', name: 'Studio A', isActive: true },
        { id: '2', name: 'Studio B', isActive: true },
      ];

      mockPrismaService.extended.location.findMany.mockResolvedValue(
        expectedLocations,
      );

      const result = await service.findAll();

      expect(mockPrismaService.extended.location.findMany).toHaveBeenCalledWith(
        {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      );
      expect(result).toEqual(expectedLocations);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      const location = { id: '1', name: 'Test Studio' };
      mockPrismaService.extended.location.findUnique.mockResolvedValue(
        location,
      );

      const result = await service.findOne('1');

      expect(
        mockPrismaService.extended.location.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(location);
    });

    it('should throw not found exception', async () => {
      mockPrismaService.extended.location.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Location with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update a location successfully', async () => {
      const updateDto = { name: 'Updated Studio', capacity: 25 };
      const existingLocation = { id: '1', name: 'Old Studio' };
      const updatedLocation = { id: '1', name: 'Updated Studio', capacity: 25 };

      mockPrismaService.extended.location.findUnique.mockResolvedValue(
        existingLocation,
      );
      mockPrismaService.extended.location.findFirst.mockResolvedValue(null);
      mockPrismaService.extended.location.update.mockResolvedValue(
        updatedLocation,
      );

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedLocation);
    });

    it('should throw conflict exception for duplicate name on update', async () => {
      const updateDto = { name: 'Existing Studio' };
      const existingLocation = { id: '1', name: 'Old Studio' };

      mockPrismaService.extended.location.findUnique.mockResolvedValue(
        existingLocation,
      );
      mockPrismaService.extended.location.findFirst.mockResolvedValue({
        id: '2',
        name: 'Existing Studio',
      });

      await expect(service.update('1', updateDto)).rejects.toThrow(
        'Location with name "Existing Studio" already exists',
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a location', async () => {
      const location = { id: '1', name: 'Test Studio' };
      const deletedLocation = { ...location, isActive: false };

      mockPrismaService.extended.location.findUnique.mockResolvedValue(
        location,
      );
      mockPrismaService.extended.location.update.mockResolvedValue(
        deletedLocation,
      );

      const result = await service.remove('1');

      expect(mockPrismaService.extended.location.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
      expect(result).toEqual(deletedLocation);
    });
  });
});
