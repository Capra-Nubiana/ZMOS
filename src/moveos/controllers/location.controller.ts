import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LocationService } from '../services/location.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // Protected endpoints (require authentication)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }

  // Public endpoints (no authentication required for browsing)
  @Get()
  findAll() {
    return this.locationService.findAll();
  }

  @Get('active')
  findActive() {
    return this.locationService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  /**
   * Search locations by amenities, equipment, or services
   * Allows filtering by multiple criteria
   * PUBLIC - No auth required for discovery
   */
  @Get('search/facilities')
  searchByFacilities(
    @Query('q') q?: string, // Keyword search (name/address)
    @Query('amenities') amenities?: string, // Comma-separated: "WIFI,PARKING,SHOWERS"
    @Query('equipment') equipment?: string, // Comma-separated: "TREADMILL,FREE_WEIGHTS"
    @Query('services') services?: string, // Comma-separated: "PERSONAL_TRAINING,GROUP_CLASSES"
    @Query('locationType') locationType?: string, // indoor, outdoor, hybrid, virtual
    @Query('country') country?: string,
    @Query('province') province?: string,
    @Query('city') city?: string,
  ) {
    return this.locationService.searchByFacilities({
      q,
      amenities: amenities?.split(',').filter(Boolean),
      equipment: equipment?.split(',').filter(Boolean),
      services: services?.split(',').filter(Boolean),
      locationType,
      country,
      province,
      city,
    });
  }

  /**
   * Get locations nearby based on coordinates
   * PUBLIC - No auth required for discovery
   */
  @Get('search/nearby')
  findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.locationService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radiusKm ? parseFloat(radiusKm) : 10,
    );
  }
}
