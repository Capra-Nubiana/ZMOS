import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    const { name, tenantId } = createLocationDto;

    // Check for duplicate name within tenant
    const existingLocation = await this.prisma.extended.location.findFirst({
      where: {
        name,
        tenantId: this.prisma.tenantId,
      },
    });

    if (existingLocation) {
      throw new ConflictException(
        `Location with name "${name}" already exists`,
      );
    }

    return this.prisma.extended.location.create({
      data: {
        ...createLocationDto,
        tenantId: tenantId ?? this.prisma.tenantId,
      },
    });
  }

  async findAll() {
    return this.prisma.extended.location.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.extended.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    // Check if location exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (updateLocationDto.name) {
      const existingLocation = await this.prisma.extended.location.findFirst({
        where: {
          name: updateLocationDto.name,
          tenantId: this.prisma.tenantId,
          id: { not: id },
        },
      });

      if (existingLocation) {
        throw new ConflictException(
          `Location with name "${updateLocationDto.name}" already exists`,
        );
      }
    }

    return this.prisma.extended.location.update({
      where: { id },
      data: updateLocationDto,
    });
  }

  async remove(id: string) {
    // Check if location exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    return this.prisma.extended.location.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findActive() {
    return this.prisma.extended.location.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
