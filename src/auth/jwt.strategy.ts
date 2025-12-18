import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Verify member exists and belongs to the current tenant
    const member = await this.prisma.extended.member.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
      },
    });

    if (!member) {
      return null;
    }

    return member;
  }
}
