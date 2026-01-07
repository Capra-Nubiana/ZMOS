import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

// Services
import { LocationService } from './services/location.service';
import { SessionTypeService } from './services/session-type.service';
import { SessionInstanceService } from './services/session-instance.service';
import { BookingService } from './services/booking.service';
import { MovementEventService } from './services/movement-event.service';
import { StreakService } from './services/streak.service';
import { MemberService } from './services/member.service';
import { RecommendationService } from './services/recommendation.service';
import { WaitlistService } from './services/waitlist.service';
import { FavoriteService } from './services/favorite.service';
import { WeatherService } from './services/weather.service';
import { LocationHierarchyService } from './services/location-hierarchy.service';
import { MemberProfileService } from './services/member-profile.service';
import { TrainerService } from './services/trainer.service';

// Controllers
import { LocationController } from './controllers/location.controller';
import { SessionTypeController } from './controllers/session-type.controller';
import { SessionController } from './controllers/session.controller';
import { BookingController } from './controllers/booking.controller';
import { MemberManagementController } from './controllers/member.controller';
import { ReferenceDataController } from './controllers/reference.controller';
import { MemberProfileController } from './controllers/member-profile.controller';
import { TrainerController } from './controllers/trainer.controller';
import { InvitationController } from './controllers/invitation.controller';
import { InvitationService } from './services/invitation.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AiModule, AuthModule],
  controllers: [
    LocationController,
    SessionTypeController,
    SessionController,
    BookingController,
    MemberManagementController,
    ReferenceDataController,
    MemberProfileController,
    TrainerController,
    InvitationController,
  ],
  providers: [
    LocationService,
    SessionTypeService,
    SessionInstanceService,
    BookingService,
    MovementEventService,
    StreakService,
    MemberService,
    RecommendationService,
    WaitlistService,
    FavoriteService,
    WeatherService,
    LocationHierarchyService,
    MemberProfileService,
    TrainerService,
    InvitationService,
  ],
  exports: [
    LocationService,
    SessionTypeService,
    SessionInstanceService,
    BookingService,
    MovementEventService,
    StreakService,
    MemberService,
    RecommendationService,
    WaitlistService,
    FavoriteService,
    WeatherService,
    LocationHierarchyService,
    InvitationService,
  ],
})
export class MoveosModule {}
