import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  BulkInvitationDto,
} from '../dto/invitation.dto';
import { MemberRole } from '@prisma/client';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate a unique invitation code
   */
  private generateInvitationCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create a single invitation
   */
  async create(
    dto: CreateInvitationDto,
    tenantId: string,
    invitedById: string,
  ) {
    const { inviteeEmail, inviteeName, role, message, expiresInDays = 7 } = dto;

    // Check if member already exists in this tenant
    const existingMember = await this.prisma.member.findFirst({
      where: { email: inviteeEmail, tenantId },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this gym');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitationCode = this.generateInvitationCode();

    const invitation = await this.prisma.extended.invitation.create({
      data: {
        tenantId,
        invitedById,
        inviteeEmail,
        inviteeName,
        role,
        message,
        invitationCode,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        tenant: true,
        invitedBy: {
          select: { name: true },
        },
      },
    });

    this.logger.log(
      `Created invitation for ${inviteeEmail} (Code: ${invitationCode})`,
    );
    return invitation;
  }

  /**
   * Create bulk invitations
   */
  async bulkCreate(
    dto: BulkInvitationDto,
    tenantId: string,
    invitedById: string,
  ) {
    const results: { successful: any[]; failed: any[] } = {
      successful: [],
      failed: [],
    };

    for (const inviteDto of dto.invitations) {
      try {
        const inv = await this.create(inviteDto, tenantId, invitedById);
        results.successful.push(inv);
      } catch (error) {
        results.failed.push({
          email: inviteDto.inviteeEmail,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Accept invitation
   */
  async accept(dto: AcceptInvitationDto) {
    const { invitationCode, name } = dto;

    const invitation = await this.prisma.extended.invitation.findUnique({
      where: { invitationCode },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation is already ${invitation.status}`,
      );
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.extended.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Default password for invited members (they should change it on first login or use SSO)
    const defaultPassword = 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create or Update Member
      const member = await tx.member.upsert({
        where: {
          email_tenantId: {
            email: invitation.inviteeEmail,
            tenantId: invitation.tenantId,
          },
        },
        update: {
          name: name || invitation.inviteeName,
          role: invitation.role,
        },
        create: {
          email: invitation.inviteeEmail,
          name:
            name ||
            invitation.inviteeName ||
            invitation.inviteeEmail.split('@')[0],
          tenantId: invitation.tenantId,
          role: invitation.role,
          passwordHash,
        },
      });

      // 2. Update Invitation status
      const updatedInvitation = await (tx as any).invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // 3. Generate token
      const payload = {
        sub: member.id,
        email: member.email,
        tenantId: member.tenantId,
        role: member.role,
      };
      const token = this.jwtService.sign(payload);

      return {
        member,
        tenant: invitation.tenant,
        invitation: updatedInvitation,
        token,
      };
    });
  }

  /**
   * Decline invitation
   */
  async decline(dto: DeclineInvitationDto) {
    const { invitationCode } = dto;

    const invitation = await this.prisma.extended.invitation.findUnique({
      where: { invitationCode },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation is already ${invitation.status}`,
      );
    }

    return this.prisma.extended.invitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });
  }

  /**
   * Cancel invitation (Admin only)
   */
  async cancel(id: string, tenantId: string) {
    const invitation = await this.prisma.extended.invitation.findFirst({
      where: { id, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.extended.invitation.update({
      where: { id: invitation.id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get invitation summary
   */
  async getSummary(tenantId: string) {
    const invitations = await this.prisma.extended.invitation.findMany({
      where: { tenantId },
    });

    return {
      totalSent: invitations.length,
      pending: invitations.filter((i) => i.status === 'PENDING').length,
      accepted: invitations.filter((i) => i.status === 'ACCEPTED').length,
      declined: invitations.filter((i) => i.status === 'DECLINED').length,
      expired: invitations.filter((i) => i.status === 'EXPIRED').length,
      cancelled: invitations.filter((i) => i.status === 'CANCELLED').length,
    };
  }

  /**
   * List all invitations for a tenant
   */
  async findAll(tenantId: string) {
    return this.prisma.extended.invitation.findMany({
      where: { tenantId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find one invitation by ID
   */
  async findOne(id: string, tenantId: string) {
    const invitation = await this.prisma.extended.invitation.findFirst({
      where: { id, tenantId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
        tenant: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }
}
