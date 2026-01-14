/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  MaxLength,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Common profile fields for all roles
 */
export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

/**
 * Owner/Admin Profile Completion DTO
 */
export class CompleteOwnerProfileDto extends CompleteProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverPhoto?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsObject()
  businessHours?: Record<string, { openTime: string; closeTime: string }>;

  @IsOptional()
  @IsObject()
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * Trainer Profile Completion DTO
 */
export class CompleteTrainerProfileDto extends CompleteProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsArray()
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
  }>;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  trainerType?: 'freelance' | 'gym_affiliated'; // Trainer type: freelance or gym-affiliated

  @IsOptional()
  @IsString()
  affiliatedGymCode?: string; // Gym code if trainer is gym-affiliated

  @IsOptional()
  @IsObject()
  businessHours?: Record<string, Array<{ startTime: string; endTime: string }>>; // Trainer's available business hours

  @IsOptional()
  @IsObject()
  availability?: Record<string, Array<{ startTime: string; endTime: string }>>;

  @IsOptional()
  @IsObject()
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * Client/Member Profile Completion DTO
 */
export class CompleteClientProfileDto extends CompleteProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fitnessGoals?: string[];

  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredActivities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthConditions?: string[];

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsObject()
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };

  @IsOptional()
  @IsObject()
  preferences?: {
    preferredSessionTimes?: string[];
    notificationEnabled?: boolean;
    privacySettings?: {
      showProfile?: boolean;
      showProgress?: boolean;
      allowMessages?: boolean;
    };
  };
}

/**
 * Staff Profile Completion DTO
 */
export class CompleteStaffProfileDto extends CompleteProfileDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @IsOptional()
  @IsObject()
  schedule?: Record<string, Array<{ startTime: string; endTime: string }>>;
}

/**
 * Profile Completion Response DTO
 */
export class ProfileCompletionResponseDto {
  success: boolean;
  message: string;
  profileCompleteness: number; // 0-100 percentage
  member?: any; // The updated member object
}
