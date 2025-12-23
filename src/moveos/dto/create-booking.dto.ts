import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  sessionInstanceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
