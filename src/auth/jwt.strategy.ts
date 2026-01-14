/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    // Validate JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is not configured. Please set JWT_SECRET environment variable.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('🔐 [JwtStrategy] validate() called');
    console.log('   Payload:', JSON.stringify(payload, null, 2));

    // Verify member exists and belongs to the current tenant
    const member = await this.prisma.extended.member.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        role: true,
      },
    });

    if (!member) {
      console.log('❌ [JwtStrategy] Member not found with ID:', payload.sub);
      return null;
    }

    console.log(
      '✅ [JwtStrategy] Member found:',
      member.email,
      'Role:',
      member.role,
    );
    return { ...member, sub: member.id };
  }
}
