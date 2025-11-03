import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { CreateCompetitionInput, UpdateCompetitionInput } from '../schemas/competition.schema';
import slugify from '../utils/slugify';
import { cacheService } from '../config/redis';
import logger from '../utils/logger';

const CACHE_TTL = 300; // 5 minutos
const CACHE_TTL_LONG = 3600; // 1 hora para datos que cambian poco

export class CompetitionService {
  static async create(data: CreateCompetitionInput, organizerId: string) {
    // Generar slug único
    const slug = await this.generateUniqueSlug(data.name);

    // Preparar datos de ubicación
    let locationData = null;
    if (data.latitude && data.longitude) {
      // PostGIS: crear Point geometry
      locationData = Prisma.sql`ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`;
    }

    // Crear competición
    const competition = await prisma.competition.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        country: data.country,
        region: data.region,
        city: data.city,
        location: locationData as any,
        distance: data.distance,
        elevation: data.elevation,
        website: data.website,
        email: data.email,
        phone: data.phone,
        registrationUrl: data.registrationUrl,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : null,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : null,
        maxParticipants: data.maxParticipants,
        organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Competition created: ${competition.name} (${competition.slug}) by organizer ${organizerId}`);

    // Invalidar caché
    await cacheService.del('competitions:list');

    return competition;
  }

  static async findAll(filters: any) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      country,
      startDate,
      endDate,
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (country) where.country = country;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Buscar en caché
    const cacheKey = `competitions:${JSON.stringify({ where, skip, take, sortBy, sortOrder })}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Consulta
    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              participants: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    const result = {
      data: competitions,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };

    // Guardar en caché
    await cacheService.set(cacheKey, result, CACHE_TTL);

    return result;
  }

  static async findById(id: string) {
    const cacheKey = `competition:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        categories: true,
        translations: true,
        _count: {
          select: {
            participants: true,
            reviews: true,
          },
        },
      },
    });

    if (!competition) {
      throw new AppError('Competition not found', 404);
    }

    // Incrementar contador de vistas
    await prisma.competition.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    await cacheService.set(cacheKey, competition, CACHE_TTL);

    return competition;
  }

  static async findBySlug(slug: string) {
    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        categories: true,
        translations: true,
        _count: {
          select: {
            participants: true,
            reviews: true,
          },
        },
      },
    });

    if (!competition) {
      throw new AppError('Competition not found', 404);
    }

    // Incrementar vistas
    await prisma.competition.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return competition;
  }

  static async update(id: string, data: UpdateCompetitionInput, userId: string) {
    // Verificar que existe
    const existing = await prisma.competition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Competition not found', 404);
    }

    // Verificar permisos (solo organizador o admin)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && existing.organizerId !== userId) {
      throw new AppError('Insufficient permissions', 403);
    }

    // Actualizar
    const updated = await prisma.competition.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : undefined,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : undefined,
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Competition updated: ${updated.name} (${id}) by user ${userId}`);

    // Invalidar caché
    await cacheService.del(`competition:${id}`);
    await cacheService.del('competitions:list');

    return updated;
  }

  static async delete(id: string, userId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id },
    });

    if (!competition) {
      throw new AppError('Competition not found', 404);
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && competition.organizerId !== userId) {
      throw new AppError('Insufficient permissions', 403);
    }

    await prisma.competition.delete({ where: { id } });

    logger.warn(`Competition deleted: ${competition.name} (${id}) by user ${userId}`);

    // Invalidar caché
    await cacheService.del(`competition:${id}`);
    await cacheService.del('competitions:list');

    return { message: 'Competition deleted successfully' };
  }

  // Buscar competiciones cercanas usando PostGIS
  static async findNearby(latitude: number, longitude: number, radiusKm: number = 50) {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        city,
        country,
        "startDate",
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 as distance_km
      FROM competitions
      WHERE location IS NOT NULL
      AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusKm * 1000}
      )
      ORDER BY distance_km
      LIMIT 20
    `;

    logger.info(`Found ${(result as any[]).length} competitions within ${radiusKm}km of (${latitude}, ${longitude})`);

    return result;
  }

  // Búsqueda full-text con pg_trgm (trigram similarity)
  static async search(query: string, limit: number = 20) {
    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const cacheKey = `search:${query}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Búsqueda con pg_trgm para coincidencias similares
    const results = await prisma.$queryRaw`
      SELECT 
        id,
        slug,
        name,
        city,
        country,
        type,
        "startDate",
        distance,
        elevation,
        similarity(name, ${query}) + 
        similarity(COALESCE(city, ''), ${query}) + 
        similarity(COALESCE(description, ''), ${query}) as relevance
      FROM competitions
      WHERE 
        status = 'PUBLISHED'
        AND (
          name ILIKE ${'%' + query + '%'}
          OR city ILIKE ${'%' + query + '%'}
          OR country ILIKE ${'%' + query + '%'}
          OR description ILIKE ${'%' + query + '%'}
        )
      ORDER BY relevance DESC, "startDate" ASC
      LIMIT ${limit}
    `;

    await cacheService.set(cacheKey, results, CACHE_TTL);

    logger.info(`Search for "${query}" returned ${(results as any[]).length} results`);

    return results;
  }

  // Obtener competiciones destacadas
  static async getFeatured(limit: number = 10) {
    const cacheKey = `competitions:featured:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const competitions = await prisma.competition.findMany({
      where: {
        isHighlighted: true,
        status: 'PUBLISHED',
        startDate: {
          gte: new Date(), // Solo futuras
        },
      },
      take: limit,
      orderBy: [
        { startDate: 'asc' },
        { viewCount: 'desc' },
      ],
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            participants: true,
            reviews: true,
          },
        },
      },
    });

    await cacheService.set(cacheKey, competitions, CACHE_TTL_LONG);

    return competitions;
  }

  // Obtener próximas competiciones
  static async getUpcoming(limit: number = 20) {
    const cacheKey = `competitions:upcoming:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const competitions = await prisma.competition.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          gte: now,
        },
      },
      take: limit,
      orderBy: {
        startDate: 'asc',
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            participants: true,
            reviews: true,
          },
        },
      },
    });

    await cacheService.set(cacheKey, competitions, CACHE_TTL);

    return competitions;
  }

  // Obtener competiciones por país
  static async getByCountry(country: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const cacheKey = `competitions:country:${country}:${page}:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where: {
          country: {
            equals: country,
            mode: 'insensitive',
          },
          status: 'PUBLISHED',
        },
        skip,
        take: limit,
        orderBy: {
          startDate: 'asc',
        },
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              participants: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.competition.count({
        where: {
          country: {
            equals: country,
            mode: 'insensitive',
          },
          status: 'PUBLISHED',
        },
      }),
    ]);

    const result = {
      data: competitions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, CACHE_TTL);

    return result;
  }

  // Obtener estadísticas de una competición
  static async getStats(id: string) {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            participants: true,
            reviews: true,
            categories: true,
            results: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!competition) {
      throw new AppError('Competition not found', 404);
    }

    // Calcular rating promedio
    const avgRating =
      competition.reviews.length > 0
        ? competition.reviews.reduce((sum, r) => sum + r.rating, 0) / competition.reviews.length
        : 0;

    return {
      id: competition.id,
      name: competition.name,
      totalParticipants: competition._count.participants,
      totalReviews: competition._count.reviews,
      totalCategories: competition._count.categories,
      totalResults: competition._count.results,
      averageRating: Number(avgRating.toFixed(2)),
      viewCount: competition.viewCount,
      currentParticipants: competition.currentParticipants,
      maxParticipants: competition.maxParticipants,
      registrationStatus: competition.registrationStatus,
    };
  }

  private static async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name);
    let counter = 1;

    while (await prisma.competition.findUnique({ where: { slug } })) {
      slug = `${slugify(name)}-${counter}`;
      counter++;
    }

    return slug;
  }
}
