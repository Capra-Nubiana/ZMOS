/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-require-imports */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    extended: {
      member: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new tenant and member successfully', async () => {
      const signupDto: SignupDto = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User',
        tenantName: 'New Gym',
      };

      const mockTenant = { id: 'tenant-1', name: 'New Gym' };
      const mockMember = {
        id: 'member-1',
        email: 'newuser@example.com',
        name: 'New User',
        tenantId: 'tenant-1',
      };

      // Mock tenant creation (new tenant)
      mockPrismaService.extended.member.findFirst.mockResolvedValue(null);
      (service as any).prismaClient = {
        tenant: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockTenant),
        },
      };

      mockPrismaService.extended.member.create.mockResolvedValue(mockMember);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signup(signupDto);

      expect(result).toEqual({
        member: {
          id: 'member-1',
          email: 'newuser@example.com',
          name: 'New User',
          tenantId: 'tenant-1',
        },
        token: 'jwt-token',
      });
    });

    it('should use existing tenant if it already exists', async () => {
      const signupDto: SignupDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        tenantName: 'Existing Gym',
      };

      const mockTenant = { id: 'tenant-1', name: 'Existing Gym' };

      // Mock existing tenant
      const mockPrismaClient = {
        tenant: {
          findFirst: jest.fn().mockResolvedValue(mockTenant),
          create: jest.fn(),
        },
      };

      (service as any).prismaClient = mockPrismaClient;

      mockPrismaService.extended.member.findFirst.mockResolvedValue(null);
      mockPrismaService.extended.member.create.mockResolvedValue({
        id: 'member-2',
        email: 'existing@example.com',
        name: 'Existing User',
        tenantId: 'tenant-1',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      await service.signup(signupDto);

      expect(mockPrismaClient.tenant.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if member already exists', async () => {
      const signupDto: SignupDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        tenantName: 'Existing Gym',
      };

      const mockTenant = { id: 'tenant-1', name: 'Existing Gym' };
      const existingMember = {
        id: 'member-1',
        email: 'existing@example.com',
        tenantId: 'tenant-1',
      };

      (service as any).prismaClient = {
        tenant: {
          findFirst: jest.fn().mockResolvedValue(mockTenant),
        },
      };

      mockPrismaService.extended.member.findFirst.mockResolvedValue(
        existingMember,
      );

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should authenticate user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'correctpassword',
      };

      const mockMember = {
        id: 'member-1',
        email: 'user@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        passwordHash: '$2a$12$hashedpassword', // Mock bcrypt hash
      };

      mockPrismaService.extended.member.findFirst.mockResolvedValue(mockMember);

      // Mock bcrypt.compare to return true
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        member: {
          id: 'member-1',
          email: 'user@example.com',
          name: 'Test User',
          tenantId: 'tenant-1',
        },
        token: 'jwt-token',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.extended.member.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      const mockMember = {
        id: 'member-1',
        email: 'user@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        passwordHash: '$2a$12$hashedpassword',
      };

      mockPrismaService.extended.member.findFirst.mockResolvedValue(mockMember);

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
