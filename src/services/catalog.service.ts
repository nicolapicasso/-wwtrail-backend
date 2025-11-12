import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/slugify';
import type {
  CreateCatalogInput,
  UpdateCatalogInput,
  CreateSpecialSeriesInput,
  UpdateSpecialSeriesInput,
} from '../schemas/catalog.schema';

// Tipos de catálogos disponibles
type CatalogType = 'competitionType' | 'terrainType' | 'specialSeries';

// Mapeo de nombres a modelos de Prisma
const catalogModels = {
  competitionType: prisma.competitionType,
  terrainType: prisma.terrainType,
  specialSeries: prisma.specialSeries,
} as const;

export class CatalogService {
  /**
   * Obtener todos los registros de un catálogo
   */
  static async getAll(catalogType: CatalogType, activeOnly: boolean = false) {
    const model = catalogModels[catalogType];

    const where = activeOnly ? { isActive: true } : {};

    const items = await model.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return items;
  }

  /**
   * Obtener un registro por ID
   */
  static async getById(catalogType: CatalogType, id: string) {
    const model = catalogModels[catalogType];

    const item = await model.findUnique({
      where: { id },
    });

    if (!item) {
      throw new AppError(
        `${this.getCatalogName(catalogType)} not found`,
        404
      );
    }

    return item;
  }

  /**
   * Obtener un registro por slug
   */
  static async getBySlug(catalogType: CatalogType, slug: string) {
    const model = catalogModels[catalogType];

    const item = await model.findUnique({
      where: { slug },
    });

    if (!item) {
      throw new AppError(
        `${this.getCatalogName(catalogType)} not found`,
        404
      );
    }

    return item;
  }

  /**
   * Crear un nuevo registro (CompetitionType o TerrainType)
   */
  static async create(
    catalogType: 'competitionType' | 'terrainType',
    data: CreateCatalogInput
  ) {
    const model = catalogModels[catalogType];
    const slug = slugify(data.name);

    // Verificar si ya existe un registro con el mismo nombre o slug
    const existing = await model.findFirst({
      where: {
        OR: [{ name: data.name }, { slug }],
      },
    });

    if (existing) {
      throw new AppError(
        `${this.getCatalogName(catalogType)} with this name already exists`,
        409
      );
    }

    const item = await model.create({
      data: {
        ...data,
        slug,
      },
    });

    return item;
  }

  /**
   * Crear una nueva SpecialSeries (incluye logoUrl y websiteUrl)
   */
  static async createSpecialSeries(data: CreateSpecialSeriesInput) {
    const slug = slugify(data.name);

    // Verificar si ya existe
    const existing = await prisma.specialSeries.findFirst({
      where: {
        OR: [{ name: data.name }, { slug }],
      },
    });

    if (existing) {
      throw new AppError('Special Series with this name already exists', 409);
    }

    const item = await prisma.specialSeries.create({
      data: {
        ...data,
        slug,
      },
    });

    return item;
  }

  /**
   * Actualizar un registro (CompetitionType o TerrainType)
   */
  static async update(
    catalogType: 'competitionType' | 'terrainType',
    id: string,
    data: UpdateCatalogInput
  ) {
    const model = catalogModels[catalogType];

    // Verificar que existe
    const existing = await model.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(
        `${this.getCatalogName(catalogType)} not found`,
        404
      );
    }

    // Si se actualiza el nombre, generar nuevo slug
    let updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);

      // Verificar que no exista otro registro con el mismo nombre
      const duplicate = await model.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ name: data.name }, { slug: updateData.slug }],
            },
          ],
        },
      });

      if (duplicate) {
        throw new AppError(
          `${this.getCatalogName(catalogType)} with this name already exists`,
          409
        );
      }
    }

    const item = await model.update({
      where: { id },
      data: updateData,
    });

    return item;
  }

  /**
   * Actualizar una SpecialSeries
   */
  static async updateSpecialSeries(
    id: string,
    data: UpdateSpecialSeriesInput
  ) {
    // Verificar que existe
    const existing = await prisma.specialSeries.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Special Series not found', 404);
    }

    // Si se actualiza el nombre, generar nuevo slug
    let updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);

      // Verificar que no exista otro registro con el mismo nombre
      const duplicate = await prisma.specialSeries.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ name: data.name }, { slug: updateData.slug }],
            },
          ],
        },
      });

      if (duplicate) {
        throw new AppError(
          'Special Series with this name already exists',
          409
        );
      }
    }

    const item = await prisma.specialSeries.update({
      where: { id },
      data: updateData,
    });

    return item;
  }

  /**
   * Eliminar un registro (soft delete: marcar como inactivo)
   */
  static async delete(catalogType: CatalogType, id: string) {
    const model = catalogModels[catalogType];

    // Verificar que existe
    const existing = await model.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(
        `${this.getCatalogName(catalogType)} not found`,
        404
      );
    }

    // Soft delete: marcar como inactivo
    await model.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `${this.getCatalogName(catalogType)} deleted successfully` };
  }

  /**
   * Obtener nombre legible del catálogo
   */
  private static getCatalogName(catalogType: CatalogType): string {
    const names = {
      competitionType: 'Competition Type',
      terrainType: 'Terrain Type',
      specialSeries: 'Special Series',
    };

    return names[catalogType];
  }
}
