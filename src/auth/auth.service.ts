import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const { PrismaClient } = require('../generated/client');

@Injectable()
export class AuthService {
  private prismaClient: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Create PostgreSQL adapter for the separate client
    const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/zmos_db?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prismaClient = new PrismaClient({ adapter });
  }

  async signup(dto: SignupDto) {
    const { email, password, name, tenantName } = dto;

    // Create or find tenant
    let tenant = await this.prismaClient.tenant.findFirst({
      where: { name: tenantName },
    });

    if (!tenant) {
      tenant = await this.prismaClient.tenant.create({
        data: { name: tenantName },
      });
    }

    // Check if member already exists in this tenant
    const existingMember = await this.prisma.extended.member.findFirst({
      where: { email, tenantId: tenant.id },
    });

    if (existingMember) {
      throw new ConflictException('Member already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create member
    const member = await this.prisma.extended.member.create({
      data: {
        email,
        passwordHash,
        name,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
      },
    });

    // Generate JWT
    const payload = { sub: member.id, tenantId: member.tenantId };
    const token = this.jwtService.sign(payload);

    return { member, token };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Find member by email (tenantId will be filtered automatically by PrismaService)
    const member = await this.prisma.extended.member.findFirst({
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

    // Generate JWT
    const payload = { sub: member.id, tenantId: member.tenantId };
    const token = this.jwtService.sign(payload);

    return {
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        tenantId: member.tenantId,
      },
      token,
    };
  }
}
