import { IsUUID, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  membershipPlanId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string; // Defaults to now

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean; // Defaults to true
}
