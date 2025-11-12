import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import type {
  CreateEditionRatingInput,
  UpdateEditionRatingInput,
} from '../schemas/editionRating.schema';

export class EditionRatingService {
  /**
   * Crear un nuevo rating para una edición
   */
  static async create(
    userId: string,
    editionId: string,
    data: CreateEditionRatingInput
  ) {
    // 1. Verificar que la edición existe
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    // 2. Verificar que no existe un rating previo del mismo usuario
    const existingRating = await prisma.editionRating.findUnique({
      where: {
        editionId_userId: {
          editionId,
          userId,
        },
      },
    });

    if (existingRating) {
      throw new AppError(
        'You have already rated this edition. Use update instead.',
        409
      );
    }

    // 3. Crear el rating
    const rating = await prisma.editionRating.create({
      data: {
        userId,
        editionId,
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 4. Recalcular avgRating y totalRatings de la edición
    await this.recalculateEditionRating(editionId);

    return rating;
  }

  /**
   * Actualizar un rating existente
   */
  static async update(
    ratingId: string,
    userId: string,
    data: UpdateEditionRatingInput
  ) {
    // 1. Verificar que el rating existe y pertenece al usuario
    const rating = await prisma.editionRating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    if (rating.userId !== userId) {
      throw new AppError('You can only update your own ratings', 403);
    }

    // 2. Actualizar el rating
    const updatedRating = await prisma.editionRating.update({
      where: { id: ratingId },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 3. Recalcular avgRating de la edición
    await this.recalculateEditionRating(rating.editionId);

    return updatedRating;
  }

  /**
   * Eliminar un rating
   */
  static async delete(ratingId: string, userId: string) {
    // 1. Verificar que el rating existe y pertenece al usuario
    const rating = await prisma.editionRating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    if (rating.userId !== userId) {
      throw new AppError('You can only delete your own ratings', 403);
    }

    const editionId = rating.editionId;

    // 2. Eliminar el rating
    await prisma.editionRating.delete({
      where: { id: ratingId },
    });

    // 3. Recalcular avgRating de la edición
    await this.recalculateEditionRating(editionId);

    return { message: 'Rating deleted successfully' };
  }

  /**
   * Obtener un rating por ID
   */
  static async getById(ratingId: string) {
    const rating = await prisma.editionRating.findUnique({
      where: { id: ratingId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            firstName: true,
            lastName: true,
          },
        },
        edition: {
          select: {
            id: true,
            year: true,
            slug: true,
            competition: {
              select: {
                id: true,
                name: true,
                slug: true,
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
        },
      },
    });

    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    return rating;
  }

  /**
   * Obtener ratings de una edición (paginado)
   */
  static async getByEdition(editionId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      prisma.editionRating.findMany({
        where: { editionId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.editionRating.count({
        where: { editionId },
      }),
    ]);

    return {
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener ratings recientes (para homepage)
   */
  static async getRecent(limit: number = 10) {
    const ratings = await prisma.editionRating.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            firstName: true,
            lastName: true,
          },
        },
        edition: {
          select: {
            id: true,
            year: true,
            slug: true,
            startDate: true,
            competition: {
              select: {
                id: true,
                name: true,
                slug: true,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return ratings;
  }

  /**
   * Obtener todos los ratings de un usuario
   */
  static async getByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      prisma.editionRating.findMany({
        where: { userId },
        include: {
          edition: {
            select: {
              id: true,
              year: true,
              slug: true,
              startDate: true,
              competition: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  event: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      country: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.editionRating.count({
        where: { userId },
      }),
    ]);

    return {
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recalcular avgRating y totalRatings de una edición
   */
  static async recalculateEditionRating(editionId: string) {
    // Obtener todos los ratings de la edición
    const ratings = await prisma.editionRating.findMany({
      where: { editionId },
      select: {
        ratingInfoBriefing: true,
        ratingRacePack: true,
        ratingVillage: true,
        ratingMarking: true,
        ratingAid: true,
        ratingFinisher: true,
        ratingEco: true,
      },
    });

    const totalRatings = ratings.length;

    // Si no hay ratings, establecer valores null
    if (totalRatings === 0) {
      await prisma.edition.update({
        where: { id: editionId },
        data: {
          avgRating: null,
          totalRatings: 0,
        },
      });
      return;
    }

    // Calcular el promedio de los 7 criterios
    const sumOfAverages = ratings.reduce((sum, rating) => {
      const avg =
        (rating.ratingInfoBriefing +
          rating.ratingRacePack +
          rating.ratingVillage +
          rating.ratingMarking +
          rating.ratingAid +
          rating.ratingFinisher +
          rating.ratingEco) /
        7;
      return sum + avg;
    }, 0);

    const avgRating = sumOfAverages / totalRatings;

    // Actualizar la edición
    await prisma.edition.update({
      where: { id: editionId },
      data: {
        avgRating: Math.round(avgRating * 100) / 100, // Redondear a 2 decimales
        totalRatings,
      },
    });
  }
}
