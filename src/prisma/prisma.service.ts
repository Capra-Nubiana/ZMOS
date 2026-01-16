/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type PrismaClientType = typeof PrismaClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private _extended: any;
  private cls: ClsService;

  constructor(cls: ClsService) {
    // Set default DATABASE_URL if not provided
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

    // Choose adapter based on URL protocol
    let adapter: any;
    console.log(`[PrismaService] DATABASE_URL detected: ${dbUrl.substring(0, 10)}... (length: ${dbUrl.length})`);

    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      console.log('[PrismaService] Using PostgreSQL adapter');
      const pool = new Pool({ connectionString: dbUrl });
      adapter = new PrismaPg(pool);
    } else {
      console.log('[PrismaService] Falling back to SQLite adapter');
      // Prisma 7.x requires an adapter for SQLite
      const dbPath = dbUrl.replace('file:', '');
      adapter = new PrismaBetterSqlite3({ url: dbPath });
    }

    // Pass the adapter to PrismaClient constructor
    super({ adapter });

    // Store cls immediately after calling super()
    this.cls = cls;

    // Initialize extended client - must be done after cls assignment
    // Capture 'this' reference for use in extensions
    const self = this;
    this._extended = (this as any).$extends({
      query: {
        // Shared extensions for multiple entities
        member: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId') || args.where?.tenantId,
              },
            });
          },
          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId') || args.where?.tenantId,
              },
            });
          },
          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },
          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },

        // MoveOS Location entity extensions
        location: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },

        // MoveOS SessionType entity extensions
        sessionType: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },

        // MoveOS SessionInstance entity extensions
        sessionInstance: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },

        // MoveOS Booking entity extensions
        booking: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },

        // MoveOS MovementEvent entity extensions
        movementEvent: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },
        // MoveOS Invitation entity extensions
        invitation: {
          async findUnique({ args, query }) {
            // Some findUnique might be public (by code), so we don't always filter by tenantId
            // but if it's there, we should respect it.
            return query(args);
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId') || args.where?.tenantId,
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? self.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId') || args.where?.tenantId,
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: self.cls.get('tenantId'),
              },
            });
          },
        },
      },
    });
  }

  get tenantId(): string | undefined {
    return this.cls.get('tenantId');
  }

  async onModuleInit() {
    console.log('[PrismaService] Connecting to database...');
    try {
      await this.$connect();
      console.log('[PrismaService] Connected successfully to database');
    } catch (error) {
      console.error(
        '[PrismaService] FATAL: Failed to connect to database:',
        error,
      );
    }
  }

  get extended(): any {
    return this._extended;
  }
}
