/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private prisma: any;

  constructor(private readonly cls: ClsService) {
    // Prisma 7.x requires an adapter for SQLite
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    const dbPath = dbUrl.replace('file:', '');
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    this.prisma = new PrismaClient({ adapter });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // This middleware validates tenant ID for all routes except auth endpoints
    // Auth endpoints are excluded in app.module.ts configuration

    // Allow public browsing for certain endpoints (GET requests only)
    const publicBrowsingRoutes = [
      '/locations',
      '/locations/active',
      '/locations/search/facilities',
      '/locations/search/nearby',
      '/sessions',
      '/sessions/available',
      '/sessions/upcoming',
      '/sessions/today',
      '/sessions/search',
      '/reference/onboarding',
      '/reference/locations/search',
    ];

    // Use req.originalUrl to get the full path (not affected by other middleware)
    const path =
      (req as any).originalUrl?.split('?')[0] || req.url.split('?')[0];

    const isPublicBrowsing =
      req.method === 'GET' &&
      publicBrowsingRoutes.some(
        (route) => path === route || path.startsWith(route + '/'),
      );

    const tenantId = req.headers['x-tenant-id'] as string;

    // For public browsing endpoints, tenant ID is optional
    if (!tenantId && !isPublicBrowsing) {
      throw new BadRequestException('Missing x-tenant-id header');
    }

    // If no tenant ID provided (public browsing), skip tenant validation
    if (!tenantId) {
      next();
      return;
    }

    // Validate ID format (supports both UUID and CUID)
    // CUID format: c[a-z0-9]{24} (starts with 'c', followed by 24 alphanumeric chars)
    // UUID format: standard UUID v4
    const cuidRegex = /^c[a-z0-9]{24}$/i;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!cuidRegex.test(tenantId) && !uuidRegex.test(tenantId)) {
      throw new BadRequestException(
        'Invalid x-tenant-id format (must be CUID or UUID)',
      );
    }

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Validate JWT tenantId matches header tenantId (if user is authenticated)
    // This prevents users from accessing other tenants' data
    const user = (req as any).user; // Set by JWT strategy after authentication
    if (user && user.tenantId && user.tenantId !== tenantId) {
      throw new BadRequestException(
        'Tenant ID mismatch: JWT tenant does not match x-tenant-id header',
      );
    }

    // Store tenantId in CLS
    this.cls.set('tenantId', tenantId);

    next();
  }
}
