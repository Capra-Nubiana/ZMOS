/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionTypeDto } from '../dto/create-session-type.dto';
import { UpdateSessionTypeDto } from '../dto/update-session-type.dto';

@Injectable()
export class SessionTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSessionTypeDto: CreateSessionTypeDto) {
    const { name } = createSessionTypeDto;

    // Check for duplicate name within tenant
    const existingSessionType =
      await this.prisma.extended.sessionType.findFirst({
        where: {
          name,
          tenantId: this.prisma.tenantId,
        },
      });

    if (existingSessionType) {
      throw new ConflictException(
        `Session type with name "${name}" already exists`,
      );
    }

    return this.prisma.extended.sessionType.create({
      data: {
        ...createSessionTypeDto,
        tenantId: this.prisma.tenantId,
      },
    });
  }

  async findAll() {
    return this.prisma.extended.sessionType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const sessionType = await this.prisma.extended.sessionType.findUnique({
      where: { id },
    });

    if (!sessionType) {
      throw new NotFoundException(`Session type with ID ${id} not found`);
    }

    return sessionType;
  }

  async update(id: string, updateSessionTypeDto: UpdateSessionTypeDto) {
    // Check if session type exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (updateSessionTypeDto.name) {
      const existingSessionType =
        await this.prisma.extended.sessionType.findFirst({
          where: {
            name: updateSessionTypeDto.name,
            tenantId: this.prisma.tenantId,
            id: { not: id },
          },
        });

      if (existingSessionType) {
        throw new ConflictException(
          `Session type with name "${updateSessionTypeDto.name}" already exists`,
        );
      }
    }

    return this.prisma.extended.sessionType.update({
      where: { id },
      data: updateSessionTypeDto,
    });
  }

  async remove(id: string) {
    // Check if session type exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    return this.prisma.extended.sessionType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByCategory(category: string) {
    return this.prisma.extended.sessionType.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findActive() {
    return this.prisma.extended.sessionType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
