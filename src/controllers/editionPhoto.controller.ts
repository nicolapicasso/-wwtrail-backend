import { Request, Response, NextFunction } from 'express';
import { EditionPhotoService } from '../services/editionPhoto.service';
import { AppError } from '../utils/errors';

export class EditionPhotoController {
  /**
   * POST /api/v2/editions/:editionId/photos
   * Subir foto a una edición
   */
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const metadata = {
        caption: req.body.caption,
        photographer: req.body.photographer,
        sortOrder: req.body.sortOrder ? Number(req.body.sortOrder) : 0,
        isFeatured: req.body.isFeatured === 'true',
      };

      const photo = await EditionPhotoService.upload(
        editionId,
        req.file,
        metadata
      );

      res.status(201).json({
        status: 'success',
        data: photo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:editionId/photos
   * Obtener fotos de una edición
   */
  static async getByEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;

      const photos = await EditionPhotoService.getByEdition(editionId);

      res.status(200).json({
        status: 'success',
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/photos/:id
   * Obtener una foto por ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const photo = await EditionPhotoService.getById(id);

      res.status(200).json({
        status: 'success',
        data: photo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/photos/:id
   * Actualizar metadata de una foto
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const photo = await EditionPhotoService.updateMetadata(id, data);

      res.status(200).json({
        status: 'success',
        data: photo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/photos/:id
   * Eliminar una foto
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await EditionPhotoService.delete(id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/editions/:editionId/photos/reorder
   * Reordenar fotos
   */
  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;
      const data = req.body;

      const photos = await EditionPhotoService.reorder(editionId, data);

      res.status(200).json({
        status: 'success',
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  }
}
