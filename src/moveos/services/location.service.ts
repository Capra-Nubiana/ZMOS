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
    const { name } = createLocationDto;

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
        tenantId: this.prisma.tenantId,
      },
    });
  }

  async findAll() {
    // Use base prisma client for public browsing (cross-tenant)
    return this.prisma.location.findMany({
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
    // Use base prisma client for public browsing (cross-tenant)
    return this.prisma.location.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Search locations by facilities (amenities, equipment, services)
   */
  async searchByFacilities(criteria: {
    q?: string;
    amenities?: string[];
    equipment?: string[];
    services?: string[];
    locationType?: string;
    country?: string;
    province?: string;
    city?: string;
  }) {
    // Use base prisma client for public browsing (cross-tenant)
    const locations = await this.prisma.location.findMany({
      where: {
        isActive: true,
        ...(criteria.locationType && { locationType: criteria.locationType }),
        ...(criteria.country && { country: criteria.country }),
        ...(criteria.province && { province: criteria.province }),
        ...(criteria.city && { city: criteria.city }),
        ...(criteria.q && {
          OR: [
            { name: { contains: criteria.q } },
            { address: { contains: criteria.q } },
          ],
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter by amenities, equipment, services (JSON arrays)
    let filtered = locations;

    if (criteria.amenities && criteria.amenities.length > 0) {
      filtered = filtered.filter((loc: any) => {
        if (!loc.amenities) return false;
        try {
          const locationAmenities = JSON.parse(loc.amenities);
          return criteria.amenities!.every((a) =>
            locationAmenities.includes(a),
          );
        } catch {
          return false;
        }
      });
    }

    if (criteria.equipment && criteria.equipment.length > 0) {
      filtered = filtered.filter((loc: any) => {
        if (!loc.equipment) return false;
        try {
          const locationEquipment = JSON.parse(loc.equipment);
          return criteria.equipment!.every((e) =>
            locationEquipment.includes(e),
          );
        } catch {
          return false;
        }
      });
    }

    if (criteria.services && criteria.services.length > 0) {
      filtered = filtered.filter((loc: any) => {
        if (!loc.services) return false;
        try {
          const locationServices = JSON.parse(loc.services);
          return criteria.services!.every((s) => locationServices.includes(s));
        } catch {
          return false;
        }
      });
    }

    // Parse JSON fields for response
    return filtered.map((loc: any) => ({
      ...loc,
      amenities: loc.amenities ? JSON.parse(loc.amenities) : [],
      equipment: loc.equipment ? JSON.parse(loc.equipment) : [],
      services: loc.services ? JSON.parse(loc.services) : [],
      photos: loc.photos ? JSON.parse(loc.photos) : [],
      operatingHours: loc.operatingHours
        ? JSON.parse(loc.operatingHours)
        : null,
    }));
  }

  /**
   * Find locations nearby based on coordinates (Haversine formula)
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number = 10) {
    // Use base prisma client for public browsing (cross-tenant)
    const locations = await this.prisma.location.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // Calculate distance for each location
    const locationsWithDistance = locations
      .map((loc: any) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          loc.latitude,
          loc.longitude,
        );

        return {
          ...loc,
          distance,
          amenities: loc.amenities ? JSON.parse(loc.amenities) : [],
          equipment: loc.equipment ? JSON.parse(loc.equipment) : [],
          services: loc.services ? JSON.parse(loc.services) : [],
          photos: loc.photos ? JSON.parse(loc.photos) : [],
          operatingHours: loc.operatingHours
            ? JSON.parse(loc.operatingHours)
            : null,
        };
      })
      .filter((loc) => loc.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return locationsWithDistance;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
