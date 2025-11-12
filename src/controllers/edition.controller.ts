import { Request, Response, NextFunction } from 'express';
import { EditionService } from '../services/edition.service';
import logger from '../utils/logger';

/**
 * EditionController
 * 
 * Maneja peticiones HTTP para ediciones (años de competiciones)
 */
export class EditionController {
  /**
   * POST /api/v2/competitions/:competitionId/editions
   * Crear una nueva edición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { competitionId } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      const edition = await EditionService.create(competitionId, data, userId);

      res.status(201).json({
        status: 'success',
        message: 'Edition created successfully',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/competitions/:competitionId/editions/bulk
   * Crear múltiples ediciones históricas
   * @auth Required (organizador del evento o ADMIN)
   */
  static async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { competitionId } = req.params;
      const userId = req.user!.id;
      const { years } = req.body;

      if (!Array.isArray(years) || years.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Years must be a non-empty array',
        });
      }

      const editions = await EditionService.createBulk(competitionId, years, userId);

      res.status(201).json({
        status: 'success',
        message: `${editions.length} editions created successfully`,
        data: editions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/competitions/:competitionId/editions
   * Obtener todas las ediciones de una competición
   * @auth No requerida
   */
  static async getByCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const { competitionId } = req.params;
      const { includeInactive, sortOrder } = req.query;

      const editions = await EditionService.findByCompetition(competitionId, {
        includeInactive: includeInactive === 'true',
        sortOrder: sortOrder || 'desc',
      });

      res.json({
        status: 'success',
        data: editions,
        count: editions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:id
   * Obtener una edición por ID
   * @auth No requerida
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const edition = await EditionService.findById(id);

      res.json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/slug/:slug
   * Obtener una edición por slug
   * @auth No requerida
   */
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const edition = await EditionService.findBySlug(slug);

      res.json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/competitions/:competitionId/editions/:year
   * Obtener edición por año
   * @auth No requerida
   */
  static async getByYear(req: Request, res: Response, next: NextFunction) {
    try {
      const { competitionId, year } = req.params;
      const yearNum = parseInt(year, 10);

      if (isNaN(yearNum)) {
        return res.status(400).json({
          status: 'error',
          message: 'Year must be a valid number',
        });
      }

      const edition = await EditionService.findByYear(competitionId, yearNum);

      res.json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:id/full
   * GET /api/v2/editions/:id/with-inheritance
   * Obtener edición con herencia de datos (por ID)
   * @auth No requerida
   */
  static async getWithInheritance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const edition = await EditionService.getWithInheritance(id);

      res.json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/slug/:slug/with-inheritance
   * Obtener edición con herencia de datos (por SLUG)
   * @auth No requerida
   */
  static async getWithInheritanceBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const edition = await EditionService.getWithInheritanceBySlug(slug);

      res.json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:id/stats
   * Obtener estadísticas de una edición
   * @auth No requerida
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const stats = await EditionService.getStats(id);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/editions/:id
   * Actualizar una edición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      const edition = await EditionService.update(id, data, userId);

      res.json({
        status: 'success',
        message: 'Edition updated successfully',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/editions/:id
   * Eliminar una edición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await EditionService.delete(id, userId);

      res.json({
        status: 'success',
        message: 'Edition deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v2/editions/:id/toggle
   * Activar/desactivar una edición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const edition = await EditionService.toggleActive(id, userId);

      res.json({
        status: 'success',
        message: `Edition ${true ? 'activated' : 'deactivated'}`,
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }
}
