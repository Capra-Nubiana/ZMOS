import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { MemberRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  inviteeEmail: string;

  @IsString()
  @IsOptional()
  inviteeName?: string;

  @IsEnum(MemberRole)
  role: MemberRole;

  @IsString()
  @IsOptional()
  message?: string;

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiresInDays?: number = 7;
}

export class AcceptInvitationDto {
  @IsString()
  invitationCode: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class DeclineInvitationDto {
  @IsString()
  invitationCode: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkInvitationDto {
  @IsOptional()
  invitations: CreateInvitationDto[];
}
