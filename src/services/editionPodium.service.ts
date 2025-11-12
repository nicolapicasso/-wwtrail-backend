import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import type {
  CreatePodiumInput,
  UpdatePodiumInput,
  UpdateChronicleInput,
} from '../schemas/editionPodium.schema';

export class EditionPodiumService {
  /**
   * Crear un nuevo podio para una edición
   */
  static async create(editionId: string, data: CreatePodiumInput) {
    // Verificar que la edición existe
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    // Crear el podio
    const podium = await prisma.editionPodium.create({
      data: {
        editionId,
        ...data,
      },
    });

    return podium;
  }

  /**
   * Obtener todos los podios de una edición
   */
  static async getByEdition(editionId: string) {
    const podiums = await prisma.editionPodium.findMany({
      where: { editionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return podiums;
  }

  /**
   * Obtener un podio por ID
   */
  static async getById(podiumId: string) {
    const podium = await prisma.editionPodium.findUnique({
      where: { id: podiumId },
      include: {
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

    if (!podium) {
      throw new AppError('Podium not found', 404);
    }

    return podium;
  }

  /**
   * Actualizar un podio existente
   */
  static async update(podiumId: string, data: UpdatePodiumInput) {
    // Verificar que el podio existe
    const existingPodium = await prisma.editionPodium.findUnique({
      where: { id: podiumId },
    });

    if (!existingPodium) {
      throw new AppError('Podium not found', 404);
    }

    // Actualizar el podio
    const podium = await prisma.editionPodium.update({
      where: { id: podiumId },
      data,
    });

    return podium;
  }

  /**
   * Eliminar un podio
   */
  static async delete(podiumId: string) {
    // Verificar que el podio existe
    const existingPodium = await prisma.editionPodium.findUnique({
      where: { id: podiumId },
    });

    if (!existingPodium) {
      throw new AppError('Podium not found', 404);
    }

    // Eliminar el podio
    await prisma.editionPodium.delete({
      where: { id: podiumId },
    });

    return { message: 'Podium deleted successfully' };
  }

  /**
   * Actualizar crónica de una edición
   */
  static async updateChronicle(
    editionId: string,
    data: UpdateChronicleInput
  ) {
    // Verificar que la edición existe
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    // Actualizar la crónica
    const updatedEdition = await prisma.edition.update({
      where: { id: editionId },
      data: {
        chronicle: data.chronicle,
      },
      select: {
        id: true,
        year: true,
        slug: true,
        chronicle: true,
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
    });

    return updatedEdition;
  }

  /**
   * Obtener crónica de una edición
   */
  static async getChronicle(editionId: string) {
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        year: true,
        slug: true,
        chronicle: true,
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
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    return edition;
  }
}
