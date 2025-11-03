// src/services/competition-admin.service.ts
// Servicios adicionales para gestión admin de competiciones

import prisma from '../config/database';
import { logger } from '../utils/logger';
import { CompetitionStatus } from '@prisma/client';
import { invalidateCache } from '../config/redis';

export interface ApproveCompetitionData {
  adminNotes?: string;
}

export interface RejectCompetitionData {
  rejectionReason: string;
}

class CompetitionAdminService {
  /**
   * Obtener todas las competiciones pendientes de aprobación (DRAFT)
   */
  async getPendingCompetitions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where: {
          status: CompetitionStatus.DRAFT,
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              categories: true,
              translations: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.competition.count({
        where: {
          status: CompetitionStatus.DRAFT,
        },
      }),
    ]);

    return {
      data: competitions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Aprobar una competición (cambiar a PUBLISHED)
   */
  async approveCompetition(competitionId: string, adminId: string, data?: ApproveCompetitionData) {
    // Verificar que existe y está en DRAFT
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        organizer: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.status !== CompetitionStatus.DRAFT) {
      throw new Error('Only DRAFT competitions can be approved');
    }

    // Actualizar a PUBLISHED
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        status: CompetitionStatus.PUBLISHED,
        // Guardar notas del admin si las hay
        ...(data?.adminNotes && { 
          description: competition.description + '\n\n---\nNotas admin: ' + data.adminNotes 
        }),
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Invalidar caché
    await invalidateCache(`competition:${competitionId}`);
    await invalidateCache('competitions:list');

    logger.info(
      `Competition ${competitionId} approved by admin ${adminId}. Organizer: ${competition.organizer.email}`
    );

    // TODO: Enviar notificación al organizador (email)
    // await sendEmail(competition.organizer.email, 'Competition Approved', ...)

    return updated;
  }

  /**
   * Rechazar una competición (mantener en DRAFT con razón)
   */
  async rejectCompetition(competitionId: string, adminId: string, data: RejectCompetitionData) {
    // Verificar que existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        organizer: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.status !== CompetitionStatus.DRAFT) {
      throw new Error('Only DRAFT competitions can be rejected');
    }

    // Agregar razón de rechazo al campo description (temporal)
    // En producción podrías crear un campo específico "rejectionReason"
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        description: competition.description + 
          '\n\n---\n⚠️ RECHAZADA: ' + data.rejectionReason,
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    logger.warn(
      `Competition ${competitionId} rejected by admin ${adminId}. Reason: ${data.rejectionReason}. Organizer: ${competition.organizer.email}`
    );

    // TODO: Enviar notificación al organizador
    // await sendEmail(competition.organizer.email, 'Competition Rejected', ...)

    return updated;
  }

  /**
   * Obtener competiciones de un organizador específico
   */
  async getOrganizerCompetitions(organizerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where: {
          organizerId,
        },
        include: {
          _count: {
            select: {
              categories: true,
              participants: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.competition.count({
        where: {
          organizerId,
        },
      }),
    ]);

    return {
      data: competitions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Estadísticas para el dashboard admin
   */
  async getAdminStats() {
    const [
      totalCompetitions,
      publishedCompetitions,
      draftCompetitions,
      cancelledCompetitions,
      totalOrganizers,
      totalUsers,
    ] = await Promise.all([
      prisma.competition.count(),
      prisma.competition.count({ where: { status: CompetitionStatus.PUBLISHED } }),
      prisma.competition.count({ where: { status: CompetitionStatus.DRAFT } }),
      prisma.competition.count({ where: { status: CompetitionStatus.CANCELLED } }),
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count(),
    ]);

    return {
      competitions: {
        total: totalCompetitions,
        published: publishedCompetitions,
        draft: draftCompetitions,
        cancelled: cancelledCompetitions,
      },
      users: {
        total: totalUsers,
        organizers: totalOrganizers,
      },
    };
  }

  /**
   * Cambiar status de una competición (solo ADMIN)
   */
  async updateCompetitionStatus(
    competitionId: string,
    newStatus: CompetitionStatus,
    adminId: string
  ) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: { status: newStatus },
    });

    // Invalidar caché
    await invalidateCache(`competition:${competitionId}`);
    await invalidateCache('competitions:list');

    logger.info(
      `Competition ${competitionId} status changed from ${competition.status} to ${newStatus} by admin ${adminId}`
    );

    return updated;
  }
}

export default new CompetitionAdminService();
