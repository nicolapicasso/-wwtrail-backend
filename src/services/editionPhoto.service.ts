import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import type {
  UpdatePhotoMetadataInput,
  ReorderPhotosInput,
} from '../schemas/editionPhoto.schema';

export class EditionPhotoService {
  /**
   * Procesar imagen con Sharp
   * - Redimensionar si es muy grande
   * - Generar thumbnail
   * - Optimizar calidad
   */
  static async processImage(filePath: string): Promise<{
    originalPath: string;
    thumbnailPath: string;
    width: number;
    height: number;
    fileSize: number;
  }> {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Configuración
      const maxWidth = 1920;
      const maxHeight = 1080;
      const thumbnailWidth = 400;

      // Procesar imagen original (si es muy grande, redimensionar)
      if (metadata.width && metadata.width > maxWidth) {
        await image
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(filePath + '.tmp');

        // Reemplazar original
        fs.renameSync(filePath + '.tmp', filePath);
      }

      // Generar thumbnail
      const thumbnailPath = filePath.replace(
        path.extname(filePath),
        `-thumb${path.extname(filePath)}`
      );

      await sharp(filePath)
        .resize(thumbnailWidth, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Obtener metadata actualizada
      const processedImage = sharp(filePath);
      const processedMetadata = await processedImage.metadata();
      const stats = fs.statSync(filePath);

      return {
        originalPath: filePath,
        thumbnailPath,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        fileSize: stats.size,
      };
    } catch (error) {
      throw new AppError('Error processing image', 500);
    }
  }

  /**
   * Subir foto a una edición
   */
  static async upload(
    editionId: string,
    file: Express.Multer.File,
    metadata: {
      caption?: string;
      photographer?: string;
      sortOrder?: number;
      isFeatured?: boolean;
    }
  ) {
    // Verificar que la edición existe
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    if (!edition) {
      // Eliminar archivo subido
      fs.unlinkSync(file.path);
      throw new AppError('Edition not found', 404);
    }

    // Procesar imagen
    const processed = await this.processImage(file.path);

    // Generar URLs
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${path.basename(processed.originalPath)}`;
    const thumbnail = `${baseUrl}/uploads/${path.basename(processed.thumbnailPath)}`;

    // Crear registro en DB
    const photo = await prisma.editionPhoto.create({
      data: {
        editionId,
        url,
        thumbnail,
        caption: metadata.caption,
        photographer: metadata.photographer,
        width: processed.width,
        height: processed.height,
        fileSize: processed.fileSize,
        mimeType: file.mimetype,
        sortOrder: metadata.sortOrder || 0,
        isFeatured: metadata.isFeatured || false,
      },
    });

    return photo;
  }

  /**
   * Obtener todas las fotos de una edición
   */
  static async getByEdition(editionId: string) {
    const photos = await prisma.editionPhoto.findMany({
      where: { editionId },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return photos;
  }

  /**
   * Obtener una foto por ID
   */
  static async getById(photoId: string) {
    const photo = await prisma.editionPhoto.findUnique({
      where: { id: photoId },
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

    if (!photo) {
      throw new AppError('Photo not found', 404);
    }

    return photo;
  }

  /**
   * Actualizar metadata de una foto
   */
  static async updateMetadata(photoId: string, data: UpdatePhotoMetadataInput) {
    // Verificar que la foto existe
    const existingPhoto = await prisma.editionPhoto.findUnique({
      where: { id: photoId },
    });

    if (!existingPhoto) {
      throw new AppError('Photo not found', 404);
    }

    // Actualizar metadata
    const photo = await prisma.editionPhoto.update({
      where: { id: photoId },
      data,
    });

    return photo;
  }

  /**
   * Eliminar una foto
   */
  static async delete(photoId: string) {
    // Obtener foto
    const photo = await prisma.editionPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new AppError('Photo not found', 404);
    }

    // Eliminar archivos del filesystem
    try {
      const urlPath = new URL(photo.url).pathname;
      const filePath = path.join(__dirname, '../..', urlPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (photo.thumbnail) {
        const thumbnailPath = new URL(photo.thumbnail).pathname;
        const thumbFilePath = path.join(__dirname, '../..', thumbnailPath);
        if (fs.existsSync(thumbFilePath)) {
          fs.unlinkSync(thumbFilePath);
        }
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      // Continuar aunque falle la eliminación de archivos
    }

    // Eliminar de DB
    await prisma.editionPhoto.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted successfully' };
  }

  /**
   * Reordenar fotos
   */
  static async reorder(editionId: string, data: ReorderPhotosInput) {
    // Verificar que la edición existe
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    // Actualizar orden de cada foto
    const updates = data.photoOrders.map((item) =>
      prisma.editionPhoto.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );

    await Promise.all(updates);

    // Retornar fotos ordenadas
    const photos = await this.getByEdition(editionId);
    return photos;
  }
}
