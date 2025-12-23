import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// We'll need to add a decorator to get the member ID from JWT token

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    // TODO: Extract memberId from JWT token
    // For now, using placeholder - this needs to be implemented
    const memberId = 'placeholder-member-id';
    return this.bookingService.create(createBookingDto, memberId);
  }

  @Get()
  findAll() {
    // TODO: Extract memberId from JWT token for filtering
    return this.bookingService.findAll();
  }

  @Get('my')
  getMyBookings() {
    // TODO: Extract memberId from JWT token
    const memberId = 'placeholder-member-id';
    return this.bookingService.getMemberBookings(memberId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // TODO: Extract memberId from JWT token for authorization
    return this.bookingService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    // TODO: Extract memberId from JWT token for authorization
    return this.bookingService.cancel(id);
  }
}

// Additional controller for member-specific operations
@Controller('my')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly streakService: any, // TODO: import StreakService
  ) {}

  @Get('bookings')
  getMyBookings() {
    // TODO: Extract memberId from JWT token
    const memberId = 'placeholder-member-id';
    return this.bookingService.getMemberBookings(memberId);
  }

  @Get('streak')
  getStreak() {
    // TODO: Extract memberId from JWT token
    const memberId = 'placeholder-member-id';
    return this.streakService.getStreakInfo(memberId);
  }

  @Get('attendance')
  getAttendance() {
    // TODO: Extract memberId from JWT token
    const memberId = 'placeholder-member-id';
    return this.streakService.getAttendanceEvents(memberId);
  }
}
