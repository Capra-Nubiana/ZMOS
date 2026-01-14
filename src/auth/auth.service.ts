/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-misused-promises */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { MemberSignupDto } from './dto/member-signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class AuthService {
  private prismaClient: PrismaClient;
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Prisma 7.x requires an adapter for SQLite
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    const dbPath = dbUrl.replace('file:', '');
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    this.prismaClient = new PrismaClient({ adapter });

    // Initialize Google OAuth client
    // In production, this should come from environment variables
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    );
  }

  /**
   * Generate unique gym code (GYM0001, GYM0002, etc.)
   */
  private async generateGymCode(): Promise<string> {
    // Get the count of existing tenants
    const tenantCount = await this.prismaClient.tenant.count();
    const nextNumber = tenantCount + 1;
    const code = `GYM${nextNumber.toString().padStart(4, '0')}`;

    // Check if code already exists (unlikely but safe)
    const existing = await this.prismaClient.tenant.findUnique({
      where: { code },
    });

    if (existing) {
      // If exists, use timestamp to ensure uniqueness
      return `GYM${Date.now().toString().slice(-4)}`;
    }

    return code;
  }

  async signup(dto: SignupDto) {
    const { email, password, name, tenantName } = dto;

    console.log(
      '🚀 Starting signup process for:',
      email,
      '| Requested Role:',
      dto.role,
    );
    console.log('📦 Raw signup DTO:', JSON.stringify(dto));

    try {
      // Check if tenant with this name already exists
      const existingTenant = await this.prismaClient.tenant.findFirst({
        where: { name: tenantName },
      });

      if (existingTenant) {
        throw new ConflictException(
          `Tenant with name "${tenantName}" already exists`,
        );
      }

      // Check if member with this email already exists
      const existingMember = await this.prismaClient.member.findFirst({
        where: { email },
      });

      if (existingMember) {
        throw new ConflictException(
          `Member with email "${email}" already exists`,
        );
      }

      // Hash password with bcrypt (12 rounds)
      const passwordHash = await bcrypt.hash(password, 12);
      console.log('✓ Password hashed successfully');

      // Generate gym code
      const gymCode = await this.generateGymCode();
      console.log('✓ Generated gym code:', gymCode);

      // Create tenant and member in a transaction
      const result = await this.prismaClient.$transaction(async (tx: any) => {
        // 1. Create tenant with unique code
        const tenant = await tx.tenant.create({
          data: {
            name: tenantName,
            code: gymCode,
          },
        });
        console.log('✓ Tenant created:', tenant.id, 'Code:', tenant.code);

        // 2. Create member
        const member = await tx.member.create({
          data: {
            email,
            passwordHash,
            name,
            tenantId: tenant.id,
            role: (dto.role as any) || 'OWNER', // Body role or OWNER default for creator
          },
        });
        console.log(`✓ Member created: ${member.id} with role: ${member.role}`);

        return { tenant, member };
      });

      // Generate JWT token with member ID, tenant ID, and role
      const payload = {
        sub: result.member.id,
        email: result.member.email,
        tenantId: result.tenant.id,
        role: result.member.role,
      };
      const token = this.jwtService.sign(payload);

      // Generate and save refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex');
      await this.prismaClient.member.update({
        where: { id: result.member.id },
        data: { refreshToken },
      });

      console.log('✓ JWT token generated with role:', result.member.role);
      console.log(
        '📦 Final member object for response:',
        JSON.stringify(result.member),
      );

      console.log('🎉 Signup completed successfully');

      return {
        member: {
          id: result.member.id,
          email: result.member.email,
          name: result.member.name,
          tenantId: result.tenant.id,
          role: result.member.role,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  }

  async signupMember(dto: MemberSignupDto) {
    const { email, password, name, tenantId } = dto;

    console.log(
      '🚀 Starting member signup for:',
      email,
      'at tenant:',
      tenantId,
    );

    try {
      // Verify tenant exists
      const tenant = await this.prismaClient.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      // Check if member with this email already exists in this tenant
      const existingMember = await this.prismaClient.member.findFirst({
        where: {
          email,
          tenantId,
        },
      });

      if (existingMember) {
        throw new ConflictException(
          `Member with email "${email}" already exists in this tenant`,
        );
      }

      // Hash password with bcrypt (12 rounds)
      const passwordHash = await bcrypt.hash(password, 12);
      console.log('✓ Password hashed successfully');

      // Create member (regular member role)
      const member = await this.prismaClient.member.create({
        data: {
          email,
          passwordHash,
          name,
          tenantId,
          role: (dto.role as any) || 'MEMBER',
        },
      });
      console.log('✓ Member created:', member.id, 'with role: MEMBER');

      // Generate JWT token
      const payload = {
        sub: member.id,
        email: member.email,
        tenantId: member.tenantId,
        role: member.role,
      };
      const token = this.jwtService.sign(payload);

      // Generate and save refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex');
      await this.prismaClient.member.update({
        where: { id: member.id },
        data: { refreshToken },
      });

      console.log('✓ JWT token generated');

      console.log('🎉 Member signup completed successfully');

      return {
        member: {
          id: member.id,
          email: member.email,
          name: member.name,
          tenantId: member.tenantId,
          role: member.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('❌ Member signup error:', error);
      throw error;
    }
  }

  async googleAuth(dto: GoogleAuthDto) {
    const { idToken, tenantName, tenantId } = dto;

    console.log('🚀 Starting Google authentication');
    console.log('📍 Tenant Name:', tenantName, '| Tenant ID:', tenantId);

    try {
      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;

      console.log('✓ Google token verified for:', email);

      // Check if user with this Google ID or email already exists
      const existingMember = await this.prismaClient.member.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
        include: {
          tenant: true,
        },
      });

      // CASE 1: User exists - Login flow
      if (existingMember) {
        console.log('✓ Existing member found, logging in...');

        // Update googleId if not set (for users who signed up with email/password first)
        if (!existingMember.googleId) {
          await this.prismaClient.member.update({
            where: { id: existingMember.id },
            data: { googleId, avatarUrl: picture },
          });
          console.log('✓ Updated member with Google ID');
        }

        // Generate JWT token
        const jwtPayload = {
          sub: existingMember.id,
          email: existingMember.email,
          tenantId: existingMember.tenantId,
          role: existingMember.role,
        };
        const token = this.jwtService.sign(jwtPayload);

        // Generate and save refresh token
        const refreshToken = crypto.randomBytes(32).toString('hex');
        await this.prismaClient.member.update({
          where: { id: existingMember.id },
          data: { refreshToken },
        });

        console.log('✓ JWT token generated');
        console.log('🔑 Token preview:', token.substring(0, 50) + '...');
        console.log('🔑 Token length:', token.length);

        console.log('🎉 Google login completed successfully');

        return {
          member: {
            id: existingMember.id,
            email: existingMember.email,
            name: existingMember.name,
            tenantId: existingMember.tenantId,
            role: existingMember.role,
          },
          tenant: {
            id: existingMember.tenant.id,
            name: existingMember.tenant.name,
          },
          token,
          refreshToken,
        };
      }

      // CASE 2: New user - Signup flow
      console.log('✓ New user, proceeding with signup...');

      // Determine if creating new tenant or joining existing
      let tenant;
      let member;

      if (tenantId) {
        // Join existing tenant
        console.log('📍 Joining existing tenant:', tenantId);

        tenant = await this.prismaClient.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          throw new BadRequestException('Tenant not found');
        }

        // Check if email already exists in this tenant
        const memberInTenant = await this.prismaClient.member.findFirst({
          where: {
            email,
            tenantId,
          },
        });

        if (memberInTenant) {
          throw new ConflictException(
            `Member with email "${email}" already exists in this tenant`,
          );
        }

        // Create member in existing tenant (regular member role)
        member = await this.prismaClient.member.create({
          data: {
            email,
            name: name || email?.split('@')[0] || 'User',
            googleId,
            avatarUrl: picture,
            tenantId: tenant.id,
            role: (dto.role as any) || 'MEMBER', // Default to MEMBER when joining existing tenant
          },
        });
        console.log(
          `✓ Member created in existing tenant: ${member.id} with role: ${member.role}`,
        );
      } else if (tenantName) {
        // Create new tenant
        console.log('📍 Creating new tenant:', tenantName);

        // Check if tenant with this name already exists
        const existingTenant = await this.prismaClient.tenant.findFirst({
          where: { name: tenantName },
        });

        if (existingTenant) {
          throw new ConflictException(
            `Tenant with name "${tenantName}" already exists`,
          );
        }

        // Create tenant and member in transaction
        const result = await this.prismaClient.$transaction(async (tx: any) => {
          const newTenant = await tx.tenant.create({
            data: { name: tenantName },
          });
          console.log('✓ Tenant created:', newTenant.id);

          const newMember = await tx.member.create({
            data: {
              email,
              name: name || email?.split('@')[0] || 'User',
              googleId,
              avatarUrl: picture,
              tenantId: newTenant.id,
              role: (dto.role as any) || 'OWNER', // Default to OWNER when creating new tenant
            },
          });
          console.log(
            `✓ Member created: ${newMember.id} with role: ${newMember.role}`,
          );

          return { tenant: newTenant, member: newMember };
        });

        tenant = result.tenant;
        member = result.member;
      } else {
        throw new BadRequestException(
          'Either tenantId (to join existing tenant) or tenantName (to create new tenant) must be provided',
        );
      }

      // Generate JWT token
      const jwtPayload = {
        sub: member.id,
        email: member.email,
        tenantId: tenant.id,
        role: member.role,
      };
      const token = this.jwtService.sign(jwtPayload);

      // Generate and save refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex');
      await this.prismaClient.member.update({
        where: { id: member.id },
        data: { refreshToken },
      });

      console.log('✓ JWT token generated');

      console.log('🎉 Google signup completed successfully');

      return {
        member: {
          id: member.id,
          email: member.email,
          name: member.name,
          tenantId: tenant.id,
          role: member.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('❌ Google authentication error:', error);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Login doesn't have tenant context yet, so use direct prismaClient
    // (not the tenant-filtered extended client)
    const member = await this.prismaClient.member.findFirst({
      where: { email },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, member.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch tenant info
    const tenant = await this.prismaClient.tenant.findUnique({
      where: { id: member.tenantId },
    });

    // Generate JWT with email included
    const payload = {
      sub: member.id,
      email: member.email,
      tenantId: member.tenantId,
      role: member.role,
    };
    const token = this.jwtService.sign(payload);

    // Generate and save refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.prismaClient.member.update({
      where: { id: member.id },
      data: { refreshToken },
    });

    return {
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        tenantId: member.tenantId,
        role: member.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      token,
      refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const { refreshToken } = dto;

    const member = await this.prismaClient.member.findFirst({
      where: { refreshToken },
      include: { tenant: true },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new JWT
    const payload = {
      sub: member.id,
      email: member.email,
      tenantId: member.tenantId,
      role: member.role,
    };
    const token = this.jwtService.sign(payload);

    // Optional: Rotate refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    await this.prismaClient.member.update({
      where: { id: member.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        tenantId: member.tenantId,
        role: member.role,
      },
      tenant: {
        id: member.tenant.id,
        name: member.tenant.name,
      },
      token,
      refreshToken: newRefreshToken,
    };
  }
}
