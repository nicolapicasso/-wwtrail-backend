// src/services/competition-admin.service.ts

import prisma from '../config/database';
import logger from '../utils/logger';
import cache from '../config/redis';

// ============================================
// INTERFACES
// ============================================

interface GetPendingOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'startDate';
  sortOrder?: 'asc' | 'desc';
}

interface GetOrganizerOptions extends GetPendingOptions {
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
}

interface PaginatedCompetitions {
  competitions: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCompetitions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// COMPETITION ADMIN SERVICE
// ============================================

class CompetitionAdminService {
  /**
   * Obtener competiciones pendientes de aprobación (DRAFT)
   * Solo para ADMIN
   */
  async getPendingCompetitions(
    options: GetPendingOptions
  ): Promise<PaginatedCompetitions> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Construir where clause
    const where = {
      status: 'DRAFT' as const,
    };

    // Construir orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Ejecutar queries en paralelo
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
              city: true,
              organizer: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              editions: true,
            },
          },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      competitions: competitions.map((comp) => ({
        id: comp.id,
        name: comp.name,
        slug: comp.slug,
        type: comp.type,
        baseDistance: comp.baseDistance,
        baseElevation: comp.baseElevation,
        status: comp.status,
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
        event: {
          id: comp.event.id,
          name: comp.event.name,
          slug: comp.event.slug,
          country: comp.event.country,
          city: comp.event.city,
          organizer: {
            id: comp.event.organizer.id,
            email: comp.event.organizer.email,
            username: comp.event.organizer.username,
            fullName: `${comp.event.organizer.firstName || ''} ${comp.event.organizer.lastName || ''}`.trim() || comp.event.organizer.username,
          },
        },
        totalEditions: comp._count.editions,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCompetitions: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Aprobar una competición
   * Cambia status de DRAFT a PUBLISHED
   * NUEVO: Acepta adminNotes opcional
   */
  async approveCompetition(
    competitionId: string, 
    adminId: string,
    adminNotes?: string
  ) {
    // Verificar que existe y está en DRAFT
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        name: true,
        description: true,
        event: {
          select: {
            organizerId: true,
            organizer: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.status !== 'DRAFT') {
      throw new Error('Competition is not in DRAFT status');
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: 'PUBLISHED',
    };

    // Si hay adminNotes, agregarlas a description
    if (adminNotes) {
      const currentDescription = competition.description || '';
      updateData.description = currentDescription
        ? `${currentDescription}\n\n---\nNotas admin: ${adminNotes}`
        : `Notas admin: ${adminNotes}`;
    }

    // Actualizar status
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
          },
        },
      },
    });

    // Invalidar cache
    await cache.del('competitions:list');
    await cache.del(`competition:${competitionId}`);

    // Log
    logger.info(
      `Competition approved: ${competitionId} - ${competition.name} by admin ${adminId}${adminNotes ? ` with notes: ${adminNotes}` : ''}`
    );

    // TODO: Enviar notificación al organizador

    return updated;
  }

  /**
   * Rechazar una competición
   * Cambia status a CANCELLED y guarda la razón
   * MEJORADO: Ahora persiste la razón del rechazo en description
   */
  async rejectCompetition(
    competitionId: string,
    adminId: string,
    reason?: string
  ) {
    // Verificar que existe y está en DRAFT
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        name: true,
        description: true,
        event: {
          select: {
            organizerId: true,
            organizer: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.status !== 'DRAFT') {
      throw new Error('Competition is not in DRAFT status');
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: 'CANCELLED',
    };

    // Si hay razón, guardarla en description
    if (reason) {
      const currentDescription = competition.description || '';
      updateData.description = currentDescription
        ? `${currentDescription}\n\n---\n⚠️ RECHAZADA: ${reason}`
        : `⚠️ RECHAZADA: ${reason}`;
    }

    // Actualizar a CANCELLED con razón
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log
    logger.warn(
      `Competition rejected: ${competitionId} - ${competition.name} by admin ${adminId}. Reason: ${reason || 'Not provided'}`
    );

    // TODO: Enviar notificación al organizador con razón

    return updated;
  }

  /**
   * Actualizar status de una competición
   * Solo para ADMIN
   */
  async updateStatus(
    competitionId: string,
    newStatus: 'DRAFT' | 'PUBLISHED' | 'CANCELLED',
    adminId: string
  ) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: { status: newStatus },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Invalidar cache
    await cache.del('competitions:list');
    await cache.del(`competition:${competitionId}`);

    // Log
    logger.info(
      `Competition status updated: ${competitionId} - ${competition.name} from ${competition.status} to ${newStatus} by admin ${adminId}`
    );

    return updated;
  }

  /**
   * Obtener competiciones del organizador
   * Para organizadores ver sus propias competiciones
   */
  async getMyCompetitions(
    userId: string,
    userRole: string,
    options: GetOrganizerOptions
  ): Promise<PaginatedCompetitions> {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

    // Si es ORGANIZER, solo ve sus competiciones
    // Si es ADMIN, ve todas
    if (userRole !== 'ADMIN') {
      where.event = {
        organizerId: userId,
      };
    }

    if (status) {
      where.status = status;
    }

    // Construir orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Ejecutar queries en paralelo
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
              city: true,
              status: true,
            },
          },
          _count: {
            select: {
              editions: true,
            },
          },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      competitions: competitions.map((comp) => ({
        id: comp.id,
        name: comp.name,
        slug: comp.slug,
        type: comp.type,
        baseDistance: comp.baseDistance,
        baseElevation: comp.baseElevation,
        status: comp.status,
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
        event: comp.event,
        totalEditions: comp._count.editions,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCompetitions: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Obtener estadísticas de competiciones para admin
   */
  async getStats() {
    const [
      totalCompetitions,
      publishedCompetitions,
      draftCompetitions,
      cancelledCompetitions,
      competitionsByType,
    ] = await Promise.all([
      prisma.competition.count(),
      prisma.competition.count({ where: { status: 'PUBLISHED' } }),
      prisma.competition.count({ where: { status: 'DRAFT' } }),
      prisma.competition.count({ where: { status: 'CANCELLED' } }),
      prisma.competition.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalCompetitions,
      publishedCompetitions,
      draftCompetitions,
      cancelledCompetitions,
      competitionsByType: competitionsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
    };
  }
}

export default new CompetitionAdminService();
