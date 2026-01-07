import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSessionInstanceDto {
  @IsUUID()
  sessionTypeId: string;

  @IsUUID()
  locationId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instructor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
