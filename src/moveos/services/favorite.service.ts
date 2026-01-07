import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Add session type to favorites
   */
  async addFavorite(sessionTypeId: string, memberId: string) {
    // Check if session type exists
    const sessionType = await this.prisma.extended.sessionType.findUnique({
      where: { id: sessionTypeId },
    });

    if (!sessionType) {
      throw new NotFoundException('Session type not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        memberId_sessionTypeId: {
          memberId,
          sessionTypeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Session type already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        memberId,
        sessionTypeId,
        tenantId: this.prisma.tenantId!,
      },
      include: {
        sessionType: true,
      },
    });

    this.logger.log(
      `Member ${memberId} added session type ${sessionTypeId} to favorites`,
    );

    return favorite;
  }

  /**
   * Remove session type from favorites
   */
  async removeFavorite(sessionTypeId: string, memberId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        memberId_sessionTypeId: {
          memberId,
          sessionTypeId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Session type not in favorites');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    this.logger.log(
      `Member ${memberId} removed session type ${sessionTypeId} from favorites`,
    );
  }

  /**
   * Get member's favorite session types
   */
  async getFavorites(memberId: string) {
    return this.prisma.favorite.findMany({
      where: { memberId },
      include: {
        sessionType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if session type is favorited
   */
  async isFavorite(sessionTypeId: string, memberId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        memberId_sessionTypeId: {
          memberId,
          sessionTypeId,
        },
      },
    });

    return !!favorite;
  }
}
