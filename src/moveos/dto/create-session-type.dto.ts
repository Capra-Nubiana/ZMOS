import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  Min,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateSessionTypeDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(1)
  durationMin: number;

  @IsString()
  @IsIn(['class', 'pt', 'group', 'workshop'])
  category: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
