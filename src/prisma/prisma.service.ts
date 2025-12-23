import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const { PrismaClient } = require('../generated/client');

type PrismaClientType = typeof PrismaClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private _extended: any;

  constructor(private readonly cls: ClsService) {
    // Set default DATABASE_URL if not provided
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://user:pass@localhost:5432/zmos_db?schema=public';
    }

    // Create PostgreSQL adapter
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    this._extended = this.$extends({
      query: {
        // Existing Member entity extensions
        member: {
          async findUnique({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findFirst({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async findMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async create({ args, query }) {
            return query({
              ...args,
              data: {
                ...args.data,
                tenantId: args.data.tenantId ?? this.cls.get('tenantId'),
              },
            });
          },

          async update({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async updateMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async upsert({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async delete({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
              },
            });
          },

          async deleteMany({ args, query }) {
            return query({
              ...args,
              where: {
                ...args.where,
                tenantId: this.cls.get('tenantId'),
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
    await this.$connect();
  }

  get extended(): any {
    return this._extended;
  }
}
