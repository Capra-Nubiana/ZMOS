import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Services
import { LocationService } from './services/location.service';
import { SessionTypeService } from './services/session-type.service';
import { SessionInstanceService } from './services/session-instance.service';
import { BookingService } from './services/booking.service';
import { MovementEventService } from './services/movement-event.service';
import { StreakService } from './services/streak.service';

// Controllers
import { LocationController } from './controllers/location.controller';
import { SessionTypeController } from './controllers/session-type.controller';
import { SessionController } from './controllers/session.controller';
import {
  BookingController,
  MemberController,
} from './controllers/booking.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    LocationController,
    SessionTypeController,
    SessionController,
    BookingController,
    MemberController,
  ],
  providers: [
    LocationService,
    SessionTypeService,
    SessionInstanceService,
    BookingService,
    MovementEventService,
    StreakService,
  ],
  exports: [
    LocationService,
    SessionTypeService,
    SessionInstanceService,
    BookingService,
    MovementEventService,
    StreakService,
  ],
})
export class MoveosModule {}
