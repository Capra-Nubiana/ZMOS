import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ClsService } from 'nestjs-cls';

const { PrismaClient } = require('../generated/client');

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private prisma: any;

  constructor(private readonly cls: ClsService) {
    // Create PostgreSQL adapter
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://user:pass@localhost:5432/zmos_db?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new BadRequestException('Missing x-tenant-id header');
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new BadRequestException('Invalid x-tenant-id format');
    }

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Store tenantId in CLS
    this.cls.set('tenantId', tenantId);

    next();
  }
}
