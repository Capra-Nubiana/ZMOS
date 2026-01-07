import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { MemberService } from '../services/member.service';
import { FavoriteService } from '../services/favorite.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentMember } from '../../auth/current-member.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentMember() member: any,
  ) {
    return this.bookingService.create(createBookingDto, member.id);
  }

  @Get()
  findAll() {
    // TODO: Extract memberId from JWT token for filtering
    return this.bookingService.findAll();
  }

  @Get('my')
  getMyBookings(@CurrentMember() member: any) {
    return this.bookingService.getMemberBookings(member.id);
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

  @Put(':id/no-show')
  markNoShow(@Param('id') id: string) {
    // Admin only endpoint
    return this.bookingService.markNoShow(id);
  }
}
