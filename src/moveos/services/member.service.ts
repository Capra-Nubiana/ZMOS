/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CompleteOwnerProfileDto,
  CompleteTrainerProfileDto,
  CompleteClientProfileDto,
  CompleteStaffProfileDto,
  ProfileCompletionResponseDto,
} from '../dto/complete-profile.dto';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique gym code (GYM0001, GYM0002, etc.)
   */
  private async generateGymCode(): Promise<string> {
    // Get the count of existing tenants
    const tenantCount = await this.prisma.tenant.count();
    const nextNumber = tenantCount + 1;
    const code = `GYM${nextNumber.toString().padStart(4, '0')}`;

    // Check if code already exists (unlikely but safe)
    const existing = await this.prisma.tenant.findUnique({
      where: { code },
    });

    if (existing) {
      // If exists, use timestamp to ensure uniqueness
      return `GYM${Date.now().toString().slice(-4)}`;
    }

    return code;
  }

  /**
   * Generate unique trainer code (TR0001, TR0002, etc.)
   */
  private async generateTrainerCode(): Promise<string> {
    // Get the count of existing trainers
    const trainerCount = await this.prisma.member.count({
      where: { role: 'TRAINER' },
    });
    const nextNumber = trainerCount + 1;
    const code = `TR${nextNumber.toString().padStart(4, '0')}`;

    // Check if code already exists
    const existing = await this.prisma.member.findUnique({
      where: { trainerCode: code },
    });

    if (existing) {
      // If exists, use timestamp to ensure uniqueness
      return `TR${Date.now().toString().slice(-4)}`;
    }

    return code;
  }

  /**
   * Get member profile
   */
  async getProfile(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        tenantId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  /**
   * Update member profile
   */
  async updateProfile(
    memberId: string,
    updateData: { name?: string; avatarUrl?: string },
  ) {
    const member = await this.prisma.member.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        tenantId: true,
      },
    });

    this.logger.log(`Member profile updated: ${memberId}`);

    return member;
  }

  /**
   * Get member activity statistics
   */
  async getMemberStats(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Get all bookings for the member
    const allBookings = await this.prisma.booking.findMany({
      where: {
        memberId,
      },
      include: {
        sessionInstance: {
          include: {
            sessionType: true,
          },
        },
      },
      orderBy: {
        bookedAt: 'desc',
      },
    });

    // Count total bookings
    const totalBookings = allBookings.length;

    // Count attended sessions (status = 'attended')
    const attendedBookings = allBookings.filter(
      (booking) => booking.status === 'attended',
    );
    const attendedCount = attendedBookings.length;

    // Calculate attendance rate
    const attendanceRate =
      totalBookings > 0 ? (attendedCount / totalBookings) * 100 : 0;

    // Calculate current streak (consecutive days with attended sessions)
    const currentStreak = this.calculateStreak(attendedBookings);

    // Get favorite categories (most booked session types)
    const categoryCount = new Map<string, number>();
    attendedBookings.forEach((booking) => {
      const category = booking.sessionInstance.sessionType.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const favoriteCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    // Get last activity date
    const lastActivity =
      allBookings.length > 0 ? allBookings[0].bookedAt : null;

    return {
      totalBookings,
      attendedSessions: attendedCount,
      attendanceRate: Math.round(attendanceRate),
      currentStreak,
      favoriteCategories,
      lastActivity,
      memberSince: member.createdAt,
    };
  }

  /**
   * Calculate current streak of consecutive days with attended sessions
   */
  private calculateStreak(attendedBookings: any[]): number {
    if (attendedBookings.length === 0) {
      return 0;
    }

    // Get unique dates of attended sessions (sorted descending)
    const attendedDates = attendedBookings
      .map((booking) => {
        const date = new Date(booking.bookedAt);
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).getTime();
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a);

    let streak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < attendedDates.length - 1; i++) {
      const diff = attendedDates[i] - attendedDates[i + 1];

      // If consecutive days (1 day difference)
      if (diff === oneDayMs) {
        streak++;
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }

  /**
   * Get all members (for admin/owner)
   */
  async getAllMembers(tenantId: string) {
    return this.prisma.member.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Complete owner/admin profile
   */
  async completeOwnerProfile(
    memberId: string,
    dto: CompleteOwnerProfileDto,
  ): Promise<ProfileCompletionResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Extract role-specific data for JSON field
    const {
      businessName,
      businessDescription,
      businessType,
      website,
      address,
      city,
      state,
      zipCode,
      country,
      logo,
      coverPhoto,
      amenities,
      businessHours,
      socialMedia,
      ...commonFields
    } = dto;

    const ownerProfile = {
      businessName,
      businessDescription,
      businessType,
      website,
      address,
      city,
      state,
      zipCode,
      country,
      logo,
      coverPhoto,
      amenities,
      businessHours,
      socialMedia,
    };

    // Update member with common fields and owner-specific profile
    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...commonFields,
        ownerProfile,
        profileCompleted: true,
      },
    });

    const completeness = this.calculateProfileCompleteness(updatedMember);

    this.logger.log(`Owner profile completed for member: ${memberId}`);

    return {
      success: true,
      message: 'Owner profile completed successfully',
      profileCompleteness: completeness,
      member: updatedMember,
    };
  }

  /**
   * Complete trainer profile
   */
  async completeTrainerProfile(
    memberId: string,
    dto: CompleteTrainerProfileDto,
  ): Promise<ProfileCompletionResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Generate trainer code if not already assigned
    let trainerCode = member.trainerCode;
    if (!trainerCode) {
      trainerCode = await this.generateTrainerCode();
    }

    const {
      bio,
      specializations,
      certifications,
      experience,
      hourlyRate,
      languages,
      trainerType,
      affiliatedGymCode,
      businessHours,
      availability,
      socialMedia,
      ...commonFields
    } = dto;

    const trainerProfile = {
      bio,
      specializations,
      certifications,
      experience,
      hourlyRate,
      languages,
      businessHours: businessHours || availability, // Support both businessHours and availability
      socialMedia,
      trainerType: trainerType || 'freelance', // Default to freelance
      affiliatedGymCode: affiliatedGymCode || null,
    };

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...commonFields,
        trainerCode, // Assign unique trainer code
        trainerType: trainerType || 'freelance', // Store at member level too
        trainerProfile,
        profileCompleted: true,
      },
    });

    const completeness = this.calculateProfileCompleteness(updatedMember);

    this.logger.log(
      `Trainer profile completed for member: ${memberId}, Trainer Code: ${trainerCode}, Type: ${trainerType || 'freelance'}`,
    );

    return {
      success: true,
      message: `Trainer profile completed successfully. Your trainer code is: ${trainerCode}`,
      profileCompleteness: completeness,
      member: updatedMember,
    };
  }

  /**
   * Complete client/member profile
   */
  async completeClientProfile(
    memberId: string,
    dto: CompleteClientProfileDto,
  ): Promise<ProfileCompletionResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const {
      fitnessGoals,
      experienceLevel,
      preferredActivities,
      healthConditions,
      height,
      weight,
      emergencyContact,
      preferences,
      ...commonFields
    } = dto;

    const clientProfile = {
      fitnessGoals,
      experienceLevel,
      preferredActivities,
      healthConditions,
      height,
      weight,
      emergencyContact,
      preferences,
    };

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...commonFields,
        clientProfile,
        profileCompleted: true,
      },
    });

    const completeness = this.calculateProfileCompleteness(updatedMember);

    this.logger.log(`Client profile completed for member: ${memberId}`);

    return {
      success: true,
      message: 'Client profile completed successfully',
      profileCompleteness: completeness,
      member: updatedMember,
    };
  }

  /**
   * Complete staff profile
   */
  async completeStaffProfile(
    memberId: string,
    dto: CompleteStaffProfileDto,
  ): Promise<ProfileCompletionResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const {
      department,
      position,
      shift,
      responsibilities,
      schedule,
      ...commonFields
    } = dto;

    const staffProfile = {
      department,
      position,
      shift,
      responsibilities,
      schedule,
    };

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...commonFields,
        staffProfile,
        profileCompleted: true,
      },
    });

    const completeness = this.calculateProfileCompleteness(updatedMember);

    this.logger.log(`Staff profile completed for member: ${memberId}`);

    return {
      success: true,
      message: 'Staff profile completed successfully',
      profileCompleteness: completeness,
      member: updatedMember,
    };
  }

  /**
   * Calculate profile completeness percentage
   */
  private calculateProfileCompleteness(member: any): number {
    const requiredFields = ['name', 'email', 'phoneNumber', 'profilePhoto'];
    const completedFields = requiredFields.filter((field) => member[field]);
    const baseCompleteness =
      (completedFields.length / requiredFields.length) * 50;

    // Add role-specific completeness
    let roleCompleteness = 0;
    if (member.ownerProfile && Object.keys(member.ownerProfile).length > 0) {
      roleCompleteness = 50;
    } else if (
      member.trainerProfile &&
      Object.keys(member.trainerProfile).length > 0
    ) {
      roleCompleteness = 50;
    } else if (
      member.clientProfile &&
      Object.keys(member.clientProfile).length > 0
    ) {
      roleCompleteness = 50;
    } else if (
      member.staffProfile &&
      Object.keys(member.staffProfile).length > 0
    ) {
      roleCompleteness = 50;
    }

    return Math.round(baseCompleteness + roleCompleteness);
  }
}
