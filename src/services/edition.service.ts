import prisma from '../config/database';
import logger from '../utils/logger';
import { slugify } from '../utils/slugify';

/**
 * EditionService
 * 
 * Maneja las EDICIONES (años) de cada competición.
 * Ejemplo: UTMB 171K tiene ediciones 2023, 2024, 2025
 * 
 * Las Editions HEREDAN datos de Competition si son NULL:
 * - distance → Competition.baseDistance
 * - elevation → Competition.baseElevation
 * - maxParticipants → Competition.baseMaxParticipants
 */
export class EditionService {
  /**
   * Crear una nueva edición
   * @param competitionId - ID de la competición padre
   * @param data - Datos de la edición
   * @param userId - ID del usuario (debe ser organizador o ADMIN)
   */
  static async create(competitionId: string, data: any, userId: string) {
    // Verificar que la competición existe
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        event: {
          select: {
            organizerId: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    // Verificar permisos (organizador del evento o ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && competition.event.organizerId !== userId) {
      throw new Error('Unauthorized: Only event organizer or admin can create editions');
    }

    // Verificar que no exista ya una edición para ese año
    const existing = await prisma.edition.findFirst({
      where: {
        competitionId,
        year: data.year,
      },
    });

    if (existing) {
      throw new Error(`Edition for year ${data.year} already exists`);
    }

    // Generar slug único
    const baseSlug = `${competition.slug}-${data.year}`;
    const slug = await this.generateUniqueSlug(baseSlug);

    // Crear edición
    const edition = await prisma.edition.create({
      data: {
        competitionId,
        year: data.year,
        slug,

        // Fechas
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        registrationOpenDate: data.registrationOpenDate ? new Date(data.registrationOpenDate) : undefined,
        registrationCloseDate: data.registrationCloseDate ? new Date(data.registrationCloseDate) : undefined,
        registrationUrl: data.registrationUrl,

        // Datos específicos (heredables)
        distance: data.distance,
        elevation: data.elevation,
        maxParticipants: data.maxParticipants,
        currentParticipants: data.currentParticipants || 0,

        // Precios (JSON)
        prices: data.prices,

        // Ubicación
        city: data.city,

        // Imágenes
        coverImage: data.coverImage,
        gallery: data.gallery || [],

        // Estado
        status: data.status || 'UPCOMING',
        registrationStatus: data.registrationStatus || 'NOT_OPEN',
        featured: data.featured || false,

        // Textos
        regulations: data.regulations,
        notes: data.notes,
      },
      include: {
        competition: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    logger.info(
      `Edition created: ${competition.name} ${data.year} (${edition.id})`
    );

    return edition;
  }

  /**
   * Crear múltiples ediciones históricas
   * Útil para inicializar ediciones pasadas de una competición
   */
  static async createBulk(competitionId: string, years: number[], userId: string) {
    // Verificar competición y permisos
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        event: {
          select: {
            organizerId: true,
          },
        },
      },
    });

    if (!competition) {
      throw new Error('Competition not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && competition.event.organizerId !== userId) {
      throw new Error('Unauthorized');
    }

    // Crear ediciones en transacción
    const editions = await prisma.$transaction(
      years.map((year) =>
        prisma.edition.create({
          data: {
            competitionId,
            year,
            slug: `${competition.slug}-${year}`,
            status: year < new Date().getFullYear() ? 'FINISHED' : 'UPCOMING',
            registrationStatus: 'CLOSED',
          },
        })
      )
    );

    logger.info(
      `Bulk created ${editions.length} editions for competition ${competitionId}`
    );

    return editions;
  }

  /**
   * Obtener todas las ediciones de una competición
   */
  static async findByCompetition(competitionId: string, options: any = {}) {
    const { includeInactive = false, sortOrder = 'desc' } = options;

    const where: any = {
      competitionId,
    };


    const editions = await prisma.edition.findMany({
      where,
      orderBy: {
        year: sortOrder,
      },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    return editions;
  }

  /**
   * Obtener edición por ID
   */
  static async findById(id: string) {
    const edition = await prisma.edition.findUnique({
      where: { id },
      include: {
        competition: {
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
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!edition) {
      throw new Error('Edition not found');
    }

    return edition;
  }

  /**
   * Obtener edición por slug
   */
  static async findBySlug(slug: string) {
    const edition = await prisma.edition.findUnique({
      where: { slug },
      include: {
        competition: {
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
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!edition) {
      throw new Error('Edition not found');
    }

    return edition;
  }

  /**
   * Obtener edición de un año específico
   */
  static async findByYear(competitionId: string, year: number) {
    const edition = await prisma.edition.findFirst({
      where: {
        competitionId,
        year,
      },
      include: {
        competition: {
          include: {
            event: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!edition) {
      throw new Error(`Edition for year ${year} not found`);
    }

    return edition;
  }

  /**
   * Obtener edición CON HERENCIA de datos (por ID)
   * Si un campo es NULL en Edition, se usa el valor de Competition
   */
  static async getWithInheritance(id: string) {
    const edition = await this.findById(id);

    // Aplicar herencia de datos
    return {
      ...edition,

      // Si edition.distance es NULL, usar competition.baseDistance
      distance: edition.distance ?? edition.competition.baseDistance,

      // Si edition.elevation es NULL, usar competition.baseElevation
      elevation: edition.elevation ?? edition.competition.baseElevation,

      // Si edition.maxParticipants es NULL, usar competition.baseMaxParticipants
      maxParticipants: edition.maxParticipants ?? edition.competition.baseMaxParticipants,

      // Si edition.city es NULL, usar event.city
      city: edition.city ?? edition.competition.event.city,

      // Información adicional útil
      eventName: edition.competition.event.name,
      eventSlug: edition.competition.event.slug,
      eventCountry: edition.competition.event.country,
      competitionName: edition.competition.name,
      competitionSlug: edition.competition.slug,
      competitionType: edition.competition.type,
    };
  }

  /**
   * Obtener edición CON HERENCIA de datos (por SLUG)
   * Si un campo es NULL en Edition, se usa el valor de Competition
   */
  static async getWithInheritanceBySlug(slug: string) {
    const edition = await this.findBySlug(slug);

    // Aplicar herencia de datos
    return {
      ...edition,

      // Si edition.distance es NULL, usar competition.baseDistance
      distance: edition.distance ?? edition.competition.baseDistance,

      // Si edition.elevation es NULL, usar competition.baseElevation
      elevation: edition.elevation ?? edition.competition.baseElevation,

      // Si edition.maxParticipants es NULL, usar competition.baseMaxParticipants
      maxParticipants: edition.maxParticipants ?? edition.competition.baseMaxParticipants,

      // Si edition.city es NULL, usar event.city
      city: edition.city ?? edition.competition.event.city,

      // Información adicional útil
      eventName: edition.competition.event.name,
      eventSlug: edition.competition.event.slug,
      eventCountry: edition.competition.event.country,
      competitionName: edition.competition.name,
      competitionSlug: edition.competition.slug,
      competitionType: edition.competition.type,
    };
  }

  /**
   * Actualizar edición
   */
  static async update(id: string, data: any, userId: string) {
    // Verificar que existe
    const existing = await prisma.edition.findUnique({
      where: { id },
      include: {
        competition: {
          include: {
            event: {
              select: {
                organizerId: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Edition not found');
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && existing.competition.event.organizerId !== userId) {
      throw new Error('Unauthorized');
    }

    // Convertir fechas si existen
    const updateData: any = { ...data };
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    if (data.registrationOpenDate) {
      updateData.registrationOpenDate = new Date(data.registrationOpenDate);
    }
    if (data.registrationCloseDate) {
      updateData.registrationCloseDate = new Date(data.registrationCloseDate);
    }

    // Actualizar
    const edition = await prisma.edition.update({
      where: { id },
      data: updateData,
      include: {
        competition: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Edition updated: ${id}`);

    return edition;
  }

  /**
   * Eliminar edición
   * CUIDADO: También elimina participantes y resultados (cascade)
   */
  static async delete(id: string, userId: string) {
    // Verificar que existe
    const existing = await prisma.edition.findUnique({
      where: { id },
      include: {
        competition: {
          include: {
            event: {
              select: {
                organizerId: true,
              },
            },
          },
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Edition not found');
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && existing.competition.event.organizerId !== userId) {
      throw new Error('Unauthorized');
    }

    // Advertir si tiene datos
    const totalData = existing._count.ratings + existing._count.podiums + existing._count.photos + existing._count.userEditions + existing._count.blogPosts;
    if (totalData > 0) {
      logger.warn(
        `Deleting edition ${id} with ${existing._count.ratings} ratings, ${existing._count.podiums} podiums, ${existing._count.photos} photos, ${existing._count.userEditions} user editions, and ${existing._count.blogPosts} blog posts`
      );
    }

    // Eliminar (cascade)
    await prisma.edition.delete({
      where: { id },
    });

    logger.warn(`Edition deleted: ${id} - ${existing.competition.name} ${existing.year}`);

    return { message: 'Edition deleted successfully' };
  }

 
  /**
   * Obtener estadísticas de una edición
   */
  static async getStats(id: string) {
    const edition = await prisma.edition.findUnique({
      where: { id },
      include: {
        competition: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            podiums: true,
            photos: true,
            userEditions: true,
            blogPosts: true,
          },
        },
      },
    });

    if (!edition) {
      throw new Error('Edition not found');
    }

    return {
      id: edition.id,
      competitionName: edition.competition.name,
      year: edition.year,
      totalRatings: edition._count.ratings,
      totalPodiums: edition._count.podiums,
      totalPhotos: edition._count.photos,
      totalUserEditions: edition._count.userEditions,
      totalBlogPosts: edition._count.blogPosts,
      averageRating: edition.avgRating,
      currentParticipants: edition.currentParticipants,
      maxParticipants: edition.maxParticipants,
      status: edition.status,
      registrationStatus: edition.registrationStatus,
    };
  }

  /**
   * Generar slug único
   */
  private static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.edition.findUnique({
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
