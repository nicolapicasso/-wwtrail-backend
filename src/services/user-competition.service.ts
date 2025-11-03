// src/services/user-competition.service.ts

import prisma from '../config/database';
import { logger } from '../utils/logger';
import { UserCompetitionStatus } from '@prisma/client';

export interface MarkCompetitionInput {
  competitionId: string;
  status: UserCompetitionStatus;
}

export interface AddResultInput {
  competitionId: string;
  finishTime?: string;
  position?: number;
  categoryPosition?: number;
  notes?: string;
  personalRating?: number;
  completedAt?: Date;
}

export interface UpdateUserCompetitionInput {
  status?: UserCompetitionStatus;
  finishTime?: string;
  position?: number;
  categoryPosition?: number;
  notes?: string;
  personalRating?: number;
  completedAt?: Date;
}

export interface UserStatsResponse {
  totalCompetitions: number;
  byStatus: {
    interested: number;
    registered: number;
    confirmed: number;
    completed: number;
    dnf: number;
    dns: number;
  };
  completedStats: {
    totalCompleted: number;
    totalKm: number;
    totalElevation: number;
    averageTime?: string;
    fastestRace?: {
      competitionId: string;
      name: string;
      time: string;
      timeSeconds: number;
    };
  };
}

class UserCompetitionService {
  /**
   * Marcar una competición (Me interesa / Me inscribí)
   */
  async markCompetition(userId: string, data: MarkCompetitionInput) {
    const { competitionId, status } = data;

    // Verificar que la competición existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    // Verificar si ya existe una marca
    const existing = await prisma.userCompetition.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
    });

    let userCompetition;

    if (existing) {
      // Actualizar status
      userCompetition = await prisma.userCompetition.update({
        where: { id: existing.id },
        data: { status },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
              city: true,
              country: true,
            },
          },
        },
      });

      logger.info(`User ${userId} updated competition ${competitionId} to ${status}`);
    } else {
      // Crear nueva marca
      userCompetition = await prisma.userCompetition.create({
        data: {
          userId,
          competitionId,
          status,
        },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
              city: true,
              country: true,
            },
          },
        },
      });

      logger.info(`User ${userId} marked competition ${competitionId} as ${status}`);
    }

    return userCompetition;
  }

  /**
   * Desmarcar una competición (eliminar tracking)
   */
  async unmarkCompetition(userId: string, competitionId: string) {
    const userCompetition = await prisma.userCompetition.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
    });

    if (!userCompetition) {
      throw new Error('User competition not found');
    }

    await prisma.userCompetition.delete({
      where: { id: userCompetition.id },
    });

    logger.info(`User ${userId} unmarked competition ${competitionId}`);

    return { message: 'Competition unmarked successfully' };
  }

  /**
   * Añadir o actualizar resultado personal
   */
  async addResult(userId: string, data: AddResultInput) {
    const { competitionId, finishTime, position, categoryPosition, notes, personalRating, completedAt } = data;

    // Calcular finishTimeSeconds si se proporciona finishTime
    let finishTimeSeconds: number | undefined;
    if (finishTime) {
      finishTimeSeconds = this.convertTimeToSeconds(finishTime);
    }

    // Buscar la marca existente
    const existing = await prisma.userCompetition.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
    });

    let userCompetition;

    if (existing) {
      // Actualizar con resultados
      userCompetition = await prisma.userCompetition.update({
        where: { id: existing.id },
        data: {
          status: UserCompetitionStatus.COMPLETED,
          finishTime,
          finishTimeSeconds,
          position,
          categoryPosition,
          notes,
          personalRating,
          completedAt: completedAt || new Date(),
        },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              slug: true,
              distance: true,
              elevation: true,
            },
          },
        },
      });
    } else {
      // Crear nueva marca con resultados
      userCompetition = await prisma.userCompetition.create({
        data: {
          userId,
          competitionId,
          status: UserCompetitionStatus.COMPLETED,
          finishTime,
          finishTimeSeconds,
          position,
          categoryPosition,
          notes,
          personalRating,
          completedAt: completedAt || new Date(),
        },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              slug: true,
              distance: true,
              elevation: true,
            },
          },
        },
      });
    }

    logger.info(`User ${userId} added result for competition ${competitionId}`);

    return userCompetition;
  }

  /**
   * Obtener todas las competiciones de un usuario
   */
  async getUserCompetitions(userId: string, status?: UserCompetitionStatus) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const userCompetitions = await prisma.userCompetition.findMany({
      where,
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
            startDate: true,
            endDate: true,
            city: true,
            country: true,
            distance: true,
            elevation: true,
            registrationStatus: true,
            _count: {
              select: {
                participants: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: [
        { completedAt: 'desc' },
        { markedAt: 'desc' },
      ],
    });

    return userCompetitions;
  }

  /**
   * Obtener una competición específica del usuario
   */
  async getUserCompetitionById(userId: string, competitionId: string) {
    const userCompetition = await prisma.userCompetition.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
      include: {
        competition: true,
      },
    });

    return userCompetition;
  }

  /**
   * Actualizar una competición del usuario
   */
  async updateUserCompetition(userId: string, competitionId: string, data: UpdateUserCompetitionInput) {
    const existing = await prisma.userCompetition.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId,
        },
      },
    });

    if (!existing) {
      throw new Error('User competition not found');
    }

    // Calcular finishTimeSeconds si se proporciona finishTime
    let updateData: any = { ...data };
    if (data.finishTime) {
      updateData.finishTimeSeconds = this.convertTimeToSeconds(data.finishTime);
    }

    const updated = await prisma.userCompetition.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        competition: true,
      },
    });

    logger.info(`User ${userId} updated competition ${competitionId}`);

    return updated;
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId: string): Promise<UserStatsResponse> {
    // Obtener todas las competiciones del usuario
    const userCompetitions = await prisma.userCompetition.findMany({
      where: { userId },
      include: {
        competition: {
          select: {
            name: true,
            distance: true,
            elevation: true,
          },
        },
      },
    });

    // Contar por status
    const byStatus = {
      interested: 0,
      registered: 0,
      confirmed: 0,
      completed: 0,
      dnf: 0,
      dns: 0,
    };

    userCompetitions.forEach((uc) => {
      switch (uc.status) {
        case UserCompetitionStatus.INTERESTED:
          byStatus.interested++;
          break;
        case UserCompetitionStatus.REGISTERED:
          byStatus.registered++;
          break;
        case UserCompetitionStatus.CONFIRMED:
          byStatus.confirmed++;
          break;
        case UserCompetitionStatus.COMPLETED:
          byStatus.completed++;
          break;
        case UserCompetitionStatus.DNF:
          byStatus.dnf++;
          break;
        case UserCompetitionStatus.DNS:
          byStatus.dns++;
          break;
      }
    });

    // Estadísticas de completadas
    const completed = userCompetitions.filter((uc) => uc.status === UserCompetitionStatus.COMPLETED);

    let totalKm = 0;
    let totalElevation = 0;
    let totalTimeSeconds = 0;
    let countWithTime = 0;
    let fastestRace: any = null;

    completed.forEach((uc) => {
      // Sumar kilómetros
      if (uc.competition.distance) {
        totalKm += uc.competition.distance;
      }

      // Sumar desnivel
      if (uc.competition.elevation) {
        totalElevation += uc.competition.elevation;
      }

      // Calcular tiempo promedio
      if (uc.finishTimeSeconds) {
        totalTimeSeconds += uc.finishTimeSeconds;
        countWithTime++;

        // Encontrar la carrera más rápida
        if (!fastestRace || uc.finishTimeSeconds < fastestRace.timeSeconds) {
          fastestRace = {
            competitionId: uc.competitionId,
            name: uc.competition.name,
            time: uc.finishTime!,
            timeSeconds: uc.finishTimeSeconds,
          };
        }
      }
    });

    const averageTime = countWithTime > 0 ? this.convertSecondsToTime(Math.round(totalTimeSeconds / countWithTime)) : undefined;

    return {
      totalCompetitions: userCompetitions.length,
      byStatus,
      completedStats: {
        totalCompleted: completed.length,
        totalKm: Math.round(totalKm * 10) / 10, // Redondear a 1 decimal
        totalElevation,
        averageTime,
        fastestRace,
      },
    };
  }

  /**
   * Obtener ranking global de usuarios
   */
  async getGlobalRanking(type: 'competitions' | 'km' | 'elevation', limit = 20) {
    // Esta query es compleja, se puede optimizar con Prisma raw queries
    // Por ahora, una implementación básica

    if (type === 'competitions') {
      // Ranking por más competiciones completadas
      const ranking = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          country: true,
          _count: {
            select: {
              userCompetitions: {
                where: {
                  status: UserCompetitionStatus.COMPLETED,
                },
              },
            },
          },
        },
        orderBy: {
          userCompetitions: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return ranking.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          country: user.country,
        },
        count: user._count.userCompetitions,
      }));
    }

    // Para km y elevation, necesitaríamos agregaciones más complejas
    // Se puede implementar con Prisma.$queryRaw si es necesario

    return [];
  }

  /**
   * Helpers privados
   */

  private convertTimeToSeconds(time: string): number {
    const parts = time.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  private convertSecondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export default new UserCompetitionService();
