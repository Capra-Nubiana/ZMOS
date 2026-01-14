/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // List of public browsing routes (matches TenantMiddleware)
  private readonly publicBrowsingRoutes = [
    '/locations',
    '/locations/active',
    '/locations/search/facilities',
    '/locations/search/nearby',
    '/sessions',
    '/sessions/available',
    '/sessions/upcoming',
    '/sessions/today',
    '/sessions/search',
    '/reference/locations/search',
  ];

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(
      '🔒 [JwtAuthGuard] canActivate called for:',
      request.method,
      request.url,
    );
    console.log(
      '   Authorization header:',
      request.headers['authorization']?.substring(0, 30) + '...',
    );

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      console.log('✅ [JwtAuthGuard] Route is public, allowing access');
      return true;
    }

    // Check if this is a public browsing endpoint (GET requests only)
    if (request.method === 'GET') {
      const path =
        request.originalUrl?.split('?')[0] || request.url?.split('?')[0];
      const isPublicBrowsing = this.publicBrowsingRoutes.some(
        (route) => path === route || path.startsWith(route + '/'),
      );

      if (isPublicBrowsing) {
        console.log('✅ [JwtAuthGuard] Public browsing route, allowing access');
        return true;
      }
    }

    console.log('🔐 [JwtAuthGuard] Calling Passport JWT validation...');

    try {
      const result = await super.canActivate(context);
      console.log('✅ [JwtAuthGuard] JWT validation succeeded');
      return result as boolean;
    } catch (error) {
      console.log('❌ [JwtAuthGuard] JWT validation failed:', error.message);

      // Log specific error details for debugging
      if (error.message?.includes('invalid signature')) {
        console.log(
          '   ⚠️  Token has invalid signature - likely signed with different JWT_SECRET',
        );
        console.log('   💡 User needs to log in again to get a fresh token');
      } else if (error.message?.includes('jwt expired')) {
        console.log('   ⚠️  Token has expired');
      } else if (error.message?.includes('jwt malformed')) {
        console.log('   ⚠️  Token is malformed or invalid format');
      } else if (error.message?.includes('No auth token')) {
        console.log('   ⚠️  No authorization token provided');
      }

      throw error;
    }
  }
}
