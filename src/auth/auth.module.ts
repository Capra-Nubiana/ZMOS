/* eslint-disable @typescript-eslint/require-await */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret =
          configService.get<string>('JWT_SECRET') || 'your-secret-key';
        console.log('🔑 [JwtModule] Registering with JWT_SECRET:', secret);
        console.log('🔑 [JwtModule] Secret length:', secret.length);
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, PrismaService],
  exports: [AuthService, RolesGuard, JwtModule],
})
export class AuthModule {}
