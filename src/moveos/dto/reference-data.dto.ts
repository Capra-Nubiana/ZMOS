/**
 * Reference Data DTOs for Onboarding
 * These provide lookup data for dropdowns and multi-select inputs
 */

export interface DepartmentData {
  id: string;
  name: string;
  displayName: string;
}

export interface ShiftData {
  id: string;
  name: string;
  timeRange: string;
}

export interface ResponsibilityData {
  id: string;
  name: string;
  department?: string;
}

export interface BusinessTypeData {
  id: string;
  name: string;
  displayName: string;
}

export interface AmenityData {
  id: string;
  name: string;
  displayName: string;
}

export interface FitnessGoalData {
  id: string;
  name: string;
  displayName: string;
}

export interface ExperienceLevelData {
  id: string;
  name: string;
  description: string;
}

export interface SpecializationData {
  id: string;
  name: string;
  displayName: string;
}

export interface ActivityData {
  id: string;
  name: string;
}

export interface LanguageData {
  id: string;
  name: string;
}

export interface GenderData {
  id: string;
  name: string;
}

export interface EquipmentData {
  id: string;
  category: string;
  name: string;
  icon: string;
}

export interface FacilityServiceData {
  id: string;
  category: string;
  name: string;
  icon: string;
  description: string;
}

/**
 * Complete onboarding reference data response
 */
export class OnboardingReferenceDataDto {
  // Staff data
  departments?: DepartmentData[];
  shifts?: ShiftData[];
  responsibilities?: Record<string, ResponsibilityData[]>;

  // Owner data
  businessTypes?: BusinessTypeData[];
  amenities?: AmenityData[];

  // Trainer data
  specializations?: SpecializationData[];
  languages?: LanguageData[];

  // Client data
  fitnessGoals?: FitnessGoalData[];
  experienceLevels?: ExperienceLevelData[];
  activities?: ActivityData[];
  genders?: GenderData[];

  // Facility data (for location/gym facilities)
  equipment?: EquipmentData[];
  facilityServices?: FacilityServiceData[];
}
