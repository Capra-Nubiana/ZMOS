import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum AccessLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export class CreateMembershipPlanDto {
  @IsString()
  @MaxLength(100)
  name: string; // e.g., "Basic", "Premium", "Platinum"

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string; // Defaults to KES

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsOptional()
  features?: string[]; // Array of feature strings

  @IsOptional()
  @IsNumber()
  sessionsPerMonth?: number; // -1 for unlimited

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
