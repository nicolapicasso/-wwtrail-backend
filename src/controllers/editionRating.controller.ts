import { Request, Response, NextFunction } from 'express';
import { EditionRatingService } from '../services/editionRating.service';

export class EditionRatingController {
  /**
   * POST /api/v2/editions/:editionId/ratings
   * Crear un nuevo rating para una edición
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;
      const userId = req.user!.id; // El middleware authenticate ya verifica que existe
      const data = req.body;

      const rating = await EditionRatingService.create(userId, editionId, data);

      res.status(201).json({
        status: 'success',
        data: rating,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:editionId/ratings
   * Obtener ratings de una edición (paginado)
   */
  static async getByEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await EditionRatingService.getByEdition(
        editionId,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        data: result.ratings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/ratings/:id
   * Obtener un rating por ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const rating = await EditionRatingService.getById(id);

      res.status(200).json({
        status: 'success',
        data: rating,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/ratings/:id
   * Actualizar un rating existente
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      const rating = await EditionRatingService.update(id, userId, data);

      res.status(200).json({
        status: 'success',
        data: rating,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/ratings/:id
   * Eliminar un rating
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await EditionRatingService.delete(id, userId);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/me/ratings
   * Obtener ratings del usuario autenticado
   */
  static async getMyRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await EditionRatingService.getByUser(
        userId,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        data: result.ratings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/ratings/recent
   * Obtener ratings recientes (para homepage)
   */
  static async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 10 } = req.query;

      const ratings = await EditionRatingService.getRecent(Number(limit));

      res.status(200).json({
        status: 'success',
        data: ratings,
      });
    } catch (error) {
      next(error);
    }
  }
}
