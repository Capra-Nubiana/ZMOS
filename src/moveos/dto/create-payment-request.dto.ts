import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export enum PaymentType {
  TRAINER_SESSION = 'trainer_session',
  GYM_MEMBERSHIP = 'gym_membership',
  PERSONAL_TRAINING = 'personal_training',
  EQUIPMENT_RENTAL = 'equipment_rental',
}

export class CreatePaymentRequestDto {
  @IsOptional()
  @IsUUID()
  fromMemberId?: string; // If not provided, will use current member

  @IsUUID()
  toMemberId: string; // Who should pay

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string; // Defaults to KES

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  metadata?: Record<string, any>; // For session IDs, booking references, etc.
}
