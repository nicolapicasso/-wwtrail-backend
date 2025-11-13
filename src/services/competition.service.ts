import { PrismaClient, EventStatus } from '@prisma/client';
import logger from '../utils/logger';
import { slugify } from '../utils/slugify';

const prisma = new PrismaClient();

/**
 * CompetitionService v2
 * 
 * Maneja las COMPETICIONES (distancias/carreras) dentro de un evento.
 * Ejemplo: UTMB 171K, CCC 101K, OCC 56K son competitions del evento UTMB Mont Blanc
 * 
 * Competition tiene datos BASE que heredan las Editions:
 * - baseDistance, baseElevation, baseMaxParticipants
 */
export class CompetitionService {
  /**
   * Listar todas las competiciones
   */
  static async findAll(options: any = {}) {
    const { limit = 50, sortBy = 'name' } = options;

    const competitions = await prisma.competition.findMany({
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
            typicalMonth: true,
          },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    // Ordenar según el campo
    if (sortBy === 'startDate' || sortBy === 'typicalMonth') {
      // Ordenar por mes del evento
      competitions.sort((a, b) => {
        const monthA = a.event.typicalMonth || 99;
        const monthB = b.event.typicalMonth || 99;
        return monthA - monthB;
      });
    } else if (sortBy === 'name') {
      // Ordenar por nombre
      competitions.sort((a, b) => a.name.localeCompare(b.name));
    }

    return competitions;
  }

  /**
   * Crear una nueva competición dentro de un evento
   */
  static async create(eventId: string, data: any, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true, slug: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && event.organizerId !== userId) {
      throw new Error('Unauthorized: Only event organizer or admin can create competitions');
    }

    const baseSlug = `${event.slug}-${slugify(data.name)}`;
    const slug = await this.generateUniqueSlug(baseSlug);

    const competition = await prisma.competition.create({
      data: {
        eventId,
        name: data.name,
        slug,
        description: data.description,
        type: data.type,
        baseDistance: data.baseDistance,
        baseElevation: data.baseElevation,
        baseMaxParticipants: data.baseMaxParticipants,
        organizerId: userId,
        status: EventStatus.PUBLISHED,
      },
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
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    logger.info(`Competition created: ${competition.id} - ${competition.name}`);
    return competition;
  }

  /**
   * Obtener todas las competiciones de un evento
   */
  static async findByEvent(eventId: string) {
    const competitions = await prisma.competition.findMany({
      where: {
        eventId,
        status: EventStatus.PUBLISHED,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
      orderBy: {
        baseDistance: 'asc',
      },
    });

    return competitions;
  }

  /**
   * Obtener una competición por ID
   */
  static async findById(id: string) {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
            organizerId: true,
            logoUrl: true,
          },
        },
        editions: {
          orderBy: { year: 'desc' },
          take: 10,
          select: {
            id: true,
            year: true,
            slug: true,
            startDate: true,
            status: true,
            registrationStatus: true,
          },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    // Extraer coordenadas PostGIS del Event
    try {
      const coordinates = await prisma.$queryRawUnsafe<Array<{ lat: number; lon: number }>>(
        `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
         FROM events
         WHERE id::text = $1 AND location IS NOT NULL`,
        competition.event.id
      );

      if (coordinates.length > 0) {
        // Añadir coordenadas al objeto event
        (competition.event as any).latitude = coordinates[0].lat;
        (competition.event as any).longitude = coordinates[0].lon;
      }
    } catch (error) {
      // Si falla, continuar sin coordenadas
    }

    return competition;
  }

  /**
   * Obtener una competición por slug
   */
  static async findBySlug(slug: string) {
    const competition = await prisma.competition.findFirst({
      where: { slug },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
            organizerId: true,
            logoUrl: true,
          },
        },
        editions: {
          orderBy: { year: 'desc' },
          take: 10,
          select: {
            id: true,
            year: true,
            slug: true,
            startDate: true,
            status: true,
            registrationStatus: true,
          },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    // Extraer coordenadas PostGIS del Event
    try {
      const coordinates = await prisma.$queryRawUnsafe<Array<{ lat: number; lon: number }>>(
        `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
         FROM events
         WHERE id::text = $1 AND location IS NOT NULL`,
        competition.event.id
      );

      if (coordinates.length > 0) {
        // Añadir coordenadas al objeto event
        (competition.event as any).latitude = coordinates[0].lat;
        (competition.event as any).longitude = coordinates[0].lon;
      }
    } catch (error) {
      // Si falla, continuar sin coordenadas
    }

    return competition;
  }

  /**
   * Actualizar una competición
   */
  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.competition.findUnique({
      where: { id },
      include: {
        event: {
          select: { organizerId: true },
        },
      },
    });

    if (!existing) {
      throw new Error('Competition not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && existing.event.organizerId !== userId) {
      throw new Error('Unauthorized');
    }

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        baseDistance: data.baseDistance,
        baseElevation: data.baseElevation,
        baseMaxParticipants: data.baseMaxParticipants,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    logger.info(`Competition updated: ${id}`);
    return competition;
  }

  /**
   * Eliminar una competición
   */
  static async delete(id: string, userId: string) {
    const existing = await prisma.competition.findUnique({
      where: { id },
      include: {
        event: {
          select: { organizerId: true },
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Competition not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && existing.event.organizerId !== userId) {
      throw new Error('Unauthorized');
    }

    if (existing._count.editions > 0) {
      logger.warn(`Deleting competition ${id} with ${existing._count.editions} editions`);
    }

    await prisma.competition.delete({
      where: { id },
    });

    logger.warn(`Competition deleted: ${id}`);
    return { message: 'Competition deleted successfully' };
  }

  /**
   * Generar slug único
   */
  private static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.competition.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}