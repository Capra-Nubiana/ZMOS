import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';
import { OnboardingReferenceDataDto } from '../dto/reference-data.dto';
import { LocationHierarchyService } from '../services/location-hierarchy.service';

/**
 * Reference Data Controller
 * Provides lookup data for dropdowns and multi-select inputs
 */
@Controller('reference')
@UseGuards(JwtAuthGuard)
export class ReferenceDataController {
  constructor(private locationHierarchyService: LocationHierarchyService) {}
  /**
   * Get onboarding reference data
   * Returns all lookup data needed for onboarding flows
   * Public endpoint - accessible to all authenticated and unauthenticated users
   */
  @Public()
  @Get('onboarding')
  getOnboardingReferenceData(): OnboardingReferenceDataDto {
    return {
      // Staff data
      departments: [
        { id: 'FRONT_DESK', name: 'FRONT_DESK', displayName: 'Front Desk' },
        { id: 'MAINTENANCE', name: 'MAINTENANCE', displayName: 'Maintenance' },
        { id: 'CLEANING', name: 'CLEANING', displayName: 'Cleaning' },
        { id: 'MANAGEMENT', name: 'MANAGEMENT', displayName: 'Management' },
        { id: 'SALES', name: 'SALES', displayName: 'Sales' },
        {
          id: 'CUSTOMER_SERVICE',
          name: 'CUSTOMER_SERVICE',
          displayName: 'Customer Service',
        },
      ],
      shifts: [
        { id: 'MORNING', name: 'Morning', timeRange: '6AM - 2PM' },
        { id: 'AFTERNOON', name: 'Afternoon', timeRange: '2PM - 10PM' },
        { id: 'NIGHT', name: 'Night', timeRange: '10PM - 6AM' },
        { id: 'FLEXIBLE', name: 'Flexible', timeRange: 'Flexible Schedule' },
      ],
      responsibilities: {
        FRONT_DESK: [
          { id: 'CHECKIN', name: 'Member Check-in', department: 'FRONT_DESK' },
          { id: 'PHONE', name: 'Phone Support', department: 'FRONT_DESK' },
          { id: 'TOURS', name: 'Tour Facility', department: 'FRONT_DESK' },
          { id: 'PAYMENTS', name: 'Handle Payments', department: 'FRONT_DESK' },
        ],
        MAINTENANCE: [
          { id: 'REPAIR', name: 'Equipment Repair', department: 'MAINTENANCE' },
          {
            id: 'CLEAN_FACILITY',
            name: 'Facility Cleaning',
            department: 'MAINTENANCE',
          },
          {
            id: 'SAFETY',
            name: 'Safety Inspection',
            department: 'MAINTENANCE',
          },
          { id: 'SETUP', name: 'Equipment Setup', department: 'MAINTENANCE' },
        ],
        CLEANING: [
          {
            id: 'SANITIZE',
            name: 'Sanitize Equipment',
            department: 'CLEANING',
          },
          { id: 'LOCKERS', name: 'Locker Rooms', department: 'CLEANING' },
          { id: 'FLOORS', name: 'Floor Maintenance', department: 'CLEANING' },
          { id: 'TRASH', name: 'Trash Removal', department: 'CLEANING' },
        ],
        MANAGEMENT: [
          {
            id: 'SUPERVISION',
            name: 'Staff Supervision',
            department: 'MANAGEMENT',
          },
          {
            id: 'SCHEDULING',
            name: 'Schedule Management',
            department: 'MANAGEMENT',
          },
          { id: 'BUDGET', name: 'Budget Planning', department: 'MANAGEMENT' },
          {
            id: 'RELATIONS',
            name: 'Member Relations',
            department: 'MANAGEMENT',
          },
        ],
        SALES: [
          { id: 'MEMBERSHIPS', name: 'Membership Sales', department: 'SALES' },
          { id: 'RETENTION', name: 'Retention Calls', department: 'SALES' },
          { id: 'PROMOTIONS', name: 'Promotions', department: 'SALES' },
          { id: 'LEADS', name: 'Lead Follow-up', department: 'SALES' },
        ],
        COMMON: [
          { id: 'CUSTOMER_SERVICE', name: 'Customer Service' },
          { id: 'EMERGENCY', name: 'Emergency Response' },
          { id: 'TRAINING_SUPPORT', name: 'Training Support' },
          { id: 'EVENTS', name: 'Event Coordination' },
        ],
      },

      // Owner data
      businessTypes: [
        { id: 'GYM', name: 'GYM', displayName: 'Gym' },
        {
          id: 'FITNESS_STUDIO',
          name: 'FITNESS_STUDIO',
          displayName: 'Fitness Studio',
        },
        {
          id: 'WELLNESS_CENTER',
          name: 'WELLNESS_CENTER',
          displayName: 'Wellness Center',
        },
        { id: 'YOGA_STUDIO', name: 'YOGA_STUDIO', displayName: 'Yoga Studio' },
        {
          id: 'CROSSFIT_BOX',
          name: 'CROSSFIT_BOX',
          displayName: 'CrossFit Box',
        },
        {
          id: 'SPORTS_FACILITY',
          name: 'SPORTS_FACILITY',
          displayName: 'Sports Facility',
        },
      ],
      amenities: [
        { id: 'WIFI', name: 'WIFI', displayName: 'WiFi' },
        { id: 'PARKING', name: 'PARKING', displayName: 'Parking' },
        { id: 'SHOWERS', name: 'SHOWERS', displayName: 'Showers' },
        { id: 'LOCKERS', name: 'LOCKERS', displayName: 'Lockers' },
        { id: 'SAUNA', name: 'SAUNA', displayName: 'Sauna' },
        { id: 'POOL', name: 'POOL', displayName: 'Pool' },
        { id: 'CAFE', name: 'CAFE', displayName: 'Café' },
        { id: 'PRO_SHOP', name: 'PRO_SHOP', displayName: 'Pro Shop' },
        { id: 'CHILDCARE', name: 'CHILDCARE', displayName: 'Childcare' },
        {
          id: 'PERSONAL_TRAINING',
          name: 'PERSONAL_TRAINING',
          displayName: 'Personal Training',
        },
      ],

      // Trainer data
      specializations: [
        { id: 'YOGA', name: 'YOGA', displayName: 'Yoga' },
        { id: 'PILATES', name: 'PILATES', displayName: 'Pilates' },
        {
          id: 'STRENGTH_TRAINING',
          name: 'STRENGTH_TRAINING',
          displayName: 'Strength Training',
        },
        { id: 'CARDIO', name: 'CARDIO', displayName: 'Cardio' },
        { id: 'CROSSFIT', name: 'CROSSFIT', displayName: 'CrossFit' },
        {
          id: 'MARTIAL_ARTS',
          name: 'MARTIAL_ARTS',
          displayName: 'Martial Arts',
        },
        { id: 'DANCE', name: 'DANCE', displayName: 'Dance' },
        { id: 'SWIMMING', name: 'SWIMMING', displayName: 'Swimming' },
        { id: 'CYCLING', name: 'CYCLING', displayName: 'Cycling' },
        { id: 'NUTRITION', name: 'NUTRITION', displayName: 'Nutrition' },
        {
          id: 'PHYSICAL_THERAPY',
          name: 'PHYSICAL_THERAPY',
          displayName: 'Physical Therapy',
        },
      ],
      languages: [
        { id: 'EN', name: 'English' },
        { id: 'ES', name: 'Spanish' },
        { id: 'FR', name: 'French' },
        { id: 'DE', name: 'German' },
        { id: 'ZH', name: 'Mandarin' },
        { id: 'PT', name: 'Portuguese' },
        { id: 'AR', name: 'Arabic' },
        { id: 'HI', name: 'Hindi' },
      ],

      // Client data
      fitnessGoals: [
        { id: 'WEIGHT_LOSS', name: 'WEIGHT_LOSS', displayName: 'Weight Loss' },
        { id: 'MUSCLE_GAIN', name: 'MUSCLE_GAIN', displayName: 'Muscle Gain' },
        { id: 'ENDURANCE', name: 'ENDURANCE', displayName: 'Endurance' },
        { id: 'FLEXIBILITY', name: 'FLEXIBILITY', displayName: 'Flexibility' },
        {
          id: 'GENERAL_FITNESS',
          name: 'GENERAL_FITNESS',
          displayName: 'General Fitness',
        },
        {
          id: 'REHABILITATION',
          name: 'REHABILITATION',
          displayName: 'Rehabilitation',
        },
        {
          id: 'SPORTS_PERFORMANCE',
          name: 'SPORTS_PERFORMANCE',
          displayName: 'Sports Performance',
        },
      ],
      experienceLevels: [
        {
          id: 'BEGINNER',
          name: 'BEGINNER',
          description: 'Just starting my fitness journey',
        },
        {
          id: 'INTERMEDIATE',
          name: 'INTERMEDIATE',
          description: 'I work out regularly',
        },
        {
          id: 'ADVANCED',
          name: 'ADVANCED',
          description: 'Highly experienced athlete',
        },
        {
          id: 'PROFESSIONAL',
          name: 'PROFESSIONAL',
          description: 'Professional athlete or trainer',
        },
      ],
      activities: [
        { id: 'YOGA', name: 'Yoga' },
        { id: 'PILATES', name: 'Pilates' },
        { id: 'STRENGTH_TRAINING', name: 'Strength Training' },
        { id: 'CARDIO', name: 'Cardio' },
        { id: 'CROSSFIT', name: 'CrossFit' },
        { id: 'SWIMMING', name: 'Swimming' },
        { id: 'CYCLING', name: 'Cycling' },
        { id: 'DANCE', name: 'Dance' },
        { id: 'MARTIAL_ARTS', name: 'Martial Arts' },
        { id: 'BOXING', name: 'Boxing' },
        { id: 'RUNNING', name: 'Running' },
        { id: 'GROUP_CLASSES', name: 'Group Classes' },
      ],
      genders: [
        { id: 'MALE', name: 'Male' },
        { id: 'FEMALE', name: 'Female' },
        { id: 'NON_BINARY', name: 'Non-binary' },
        { id: 'PREFER_NOT_SAY', name: 'Prefer not to say' },
      ],

      // Facility Equipment (what facilities have available)
      equipment: [
        // Cardio Equipment
        { id: 'TREADMILL', category: 'CARDIO', name: 'Treadmill', icon: '🏃' },
        {
          id: 'ELLIPTICAL',
          category: 'CARDIO',
          name: 'Elliptical',
          icon: '⚡',
        },
        {
          id: 'STATIONARY_BIKE',
          category: 'CARDIO',
          name: 'Stationary Bike',
          icon: '🚴',
        },
        {
          id: 'ROWING_MACHINE',
          category: 'CARDIO',
          name: 'Rowing Machine',
          icon: '🚣',
        },
        {
          id: 'STAIR_CLIMBER',
          category: 'CARDIO',
          name: 'Stair Climber',
          icon: '🪜',
        },

        // Strength Equipment
        {
          id: 'FREE_WEIGHTS',
          category: 'STRENGTH',
          name: 'Free Weights',
          icon: '🏋️',
        },
        {
          id: 'DUMBBELLS',
          category: 'STRENGTH',
          name: 'Dumbbells',
          icon: '💪',
        },
        { id: 'BARBELLS', category: 'STRENGTH', name: 'Barbells', icon: '🏋️' },
        {
          id: 'KETTLEBELLS',
          category: 'STRENGTH',
          name: 'Kettlebells',
          icon: '⚖️',
        },
        {
          id: 'WEIGHT_MACHINES',
          category: 'STRENGTH',
          name: 'Weight Machines',
          icon: '🏋️',
        },
        {
          id: 'SQUAT_RACK',
          category: 'STRENGTH',
          name: 'Squat Rack',
          icon: '🦵',
        },
        {
          id: 'BENCH_PRESS',
          category: 'STRENGTH',
          name: 'Bench Press',
          icon: '🛋️',
        },
        {
          id: 'CABLE_MACHINE',
          category: 'STRENGTH',
          name: 'Cable Machine',
          icon: '🔗',
        },
        {
          id: 'SMITH_MACHINE',
          category: 'STRENGTH',
          name: 'Smith Machine',
          icon: '🏗️',
        },

        // Functional Training
        {
          id: 'RESISTANCE_BANDS',
          category: 'FUNCTIONAL',
          name: 'Resistance Bands',
          icon: '🔗',
        },
        {
          id: 'TRX_SUSPENSION',
          category: 'FUNCTIONAL',
          name: 'TRX Suspension',
          icon: '🪢',
        },
        {
          id: 'MEDICINE_BALLS',
          category: 'FUNCTIONAL',
          name: 'Medicine Balls',
          icon: '⚽',
        },
        {
          id: 'STABILITY_BALLS',
          category: 'FUNCTIONAL',
          name: 'Stability Balls',
          icon: '🔵',
        },
        {
          id: 'FOAM_ROLLERS',
          category: 'FUNCTIONAL',
          name: 'Foam Rollers',
          icon: '📦',
        },
        {
          id: 'BATTLE_ROPES',
          category: 'FUNCTIONAL',
          name: 'Battle Ropes',
          icon: '🪢',
        },
        {
          id: 'PLYO_BOXES',
          category: 'FUNCTIONAL',
          name: 'Plyo Boxes',
          icon: '📦',
        },

        // Yoga & Flexibility
        { id: 'YOGA_MATS', category: 'YOGA', name: 'Yoga Mats', icon: '🧘' },
        {
          id: 'YOGA_BLOCKS',
          category: 'YOGA',
          name: 'Yoga Blocks',
          icon: '🧱',
        },
        {
          id: 'YOGA_STRAPS',
          category: 'YOGA',
          name: 'Yoga Straps',
          icon: '🔗',
        },
        {
          id: 'PILATES_REFORMER',
          category: 'YOGA',
          name: 'Pilates Reformer',
          icon: '🛋️',
        },

        // Sports & Recreation
        {
          id: 'BOXING_BAGS',
          category: 'SPORTS',
          name: 'Boxing Bags',
          icon: '🥊',
        },
        {
          id: 'BOXING_RING',
          category: 'SPORTS',
          name: 'Boxing Ring',
          icon: '🥊',
        },
        {
          id: 'BASKETBALL_COURT',
          category: 'SPORTS',
          name: 'Basketball Court',
          icon: '🏀',
        },
        {
          id: 'SWIMMING_POOL',
          category: 'SPORTS',
          name: 'Swimming Pool',
          icon: '🏊',
        },
        { id: 'SAUNA', category: 'RECOVERY', name: 'Sauna', icon: '🧖' },
        {
          id: 'STEAM_ROOM',
          category: 'RECOVERY',
          name: 'Steam Room',
          icon: '💨',
        },
      ],

      // Facility Services (what services facilities offer)
      facilityServices: [
        // Training Services
        {
          id: 'PERSONAL_TRAINING',
          category: 'TRAINING',
          name: 'Personal Training',
          icon: '👤',
          description: 'One-on-one coaching sessions',
        },
        {
          id: 'GROUP_CLASSES',
          category: 'TRAINING',
          name: 'Group Classes',
          icon: '👥',
          description: 'Group fitness classes',
        },
        {
          id: 'VIRTUAL_TRAINING',
          category: 'TRAINING',
          name: 'Virtual Training',
          icon: '💻',
          description: 'Online training sessions',
        },
        {
          id: 'NUTRITION_COACHING',
          category: 'WELLNESS',
          name: 'Nutrition Coaching',
          icon: '🥗',
          description: 'Dietary guidance and meal planning',
        },
        {
          id: 'WELLNESS_COACHING',
          category: 'WELLNESS',
          name: 'Wellness Coaching',
          icon: '🧘',
          description: 'Holistic health coaching',
        },

        // Specialized Programs
        {
          id: 'WEIGHT_LOSS_PROGRAM',
          category: 'PROGRAMS',
          name: 'Weight Loss Program',
          icon: '⚖️',
          description: 'Structured weight loss support',
        },
        {
          id: 'STRENGTH_PROGRAM',
          category: 'PROGRAMS',
          name: 'Strength Building Program',
          icon: '💪',
          description: 'Progressive strength training',
        },
        {
          id: 'ATHLETIC_TRAINING',
          category: 'PROGRAMS',
          name: 'Athletic Training',
          icon: '🏃',
          description: 'Sports performance training',
        },
        {
          id: 'SENIOR_FITNESS',
          category: 'PROGRAMS',
          name: 'Senior Fitness',
          icon: '👴',
          description: 'Age-appropriate fitness programs',
        },
        {
          id: 'YOUTH_PROGRAMS',
          category: 'PROGRAMS',
          name: 'Youth Programs',
          icon: '👶',
          description: 'Kids and teen fitness',
        },

        // Recovery & Wellness
        {
          id: 'MASSAGE_THERAPY',
          category: 'RECOVERY',
          name: 'Massage Therapy',
          icon: '💆',
          description: 'Sports and recovery massage',
        },
        {
          id: 'PHYSICAL_THERAPY',
          category: 'RECOVERY',
          name: 'Physical Therapy',
          icon: '🏥',
          description: 'Injury rehabilitation',
        },
        {
          id: 'CRYOTHERAPY',
          category: 'RECOVERY',
          name: 'Cryotherapy',
          icon: '❄️',
          description: 'Cold therapy for recovery',
        },

        // Assessments
        {
          id: 'FITNESS_ASSESSMENT',
          category: 'ASSESSMENT',
          name: 'Fitness Assessment',
          icon: '📊',
          description: 'Comprehensive fitness evaluation',
        },
        {
          id: 'BODY_COMPOSITION',
          category: 'ASSESSMENT',
          name: 'Body Composition Analysis',
          icon: '📈',
          description: 'Body fat and muscle analysis',
        },
        {
          id: 'MOVEMENT_SCREENING',
          category: 'ASSESSMENT',
          name: 'Movement Screening',
          icon: '🔍',
          description: 'Functional movement assessment',
        },
      ],
    };
  }

  /**
   * Get all countries
   * Returns list of all supported countries with metadata
   */
  @Get('countries')
  getCountries() {
    return this.locationHierarchyService.getAllCountries();
  }

  /**
   * Get provinces/states for a country
   */
  @Get('provinces')
  getProvinces(@Query('countryCode') countryCode: string) {
    return this.locationHierarchyService.getProvinces(countryCode);
  }

  /**
   * Get country by code
   */
  @Get('country')
  getCountry(@Query('code') code: string) {
    return this.locationHierarchyService.getCountry(code);
  }

  /**
   * Search locations by name
   */
  @Get('locations/search')
  searchLocations(@Query('q') query: string) {
    return this.locationHierarchyService.searchLocations(query);
  }

  /**
   * Validate address
   */
  @Get('locations/validate')
  validateAddress(
    @Query('country') country?: string,
    @Query('province') province?: string,
    @Query('county') county?: string,
    @Query('city') city?: string,
  ) {
    return this.locationHierarchyService.validateAddress({
      country,
      province,
      county,
      city,
    });
  }
}
