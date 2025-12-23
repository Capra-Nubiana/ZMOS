import { IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QuerySessionsDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['scheduled', 'cancelled', 'completed'])
  status?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
