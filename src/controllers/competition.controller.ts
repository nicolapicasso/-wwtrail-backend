import { Request, Response, NextFunction } from 'express';
import { CompetitionService } from '../services/competition.service';
import logger from '../utils/logger';

/**
 * CompetitionController v2
 * 
 * Maneja peticiones HTTP para competiciones (distancias/carreras dentro de eventos)
 */
export class CompetitionController {
  /**
   * GET /api/v2/competitions
   * Listar todas las competiciones
   * @auth No requerida
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50, sortBy = 'name' } = req.query;

      const competitions = await CompetitionService.findAll({
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
      });

      res.json({
        status: 'success',
        data: competitions,
        count: competitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/events/:eventId/competitions
   * Crear una nueva competición dentro de un evento
   * @auth Required (organizador del evento o ADMIN)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      // DEBUG: Log incoming data
      console.log('=== COMPETITION CREATE DEBUG ===');
      console.log('Full body:', JSON.stringify(data, null, 2));
      console.log('Image fields:', {
        logoUrl: data.logoUrl,
        coverImage: data.coverImage,
        gallery: data.gallery,
        status: data.status,
        featured: data.featured,
        displayOrder: data.displayOrder,
      });
      console.log('===============================');

      const competition = await CompetitionService.create(eventId, data, userId);

      res.status(201).json({
        status: 'success',
        message: 'Competition created successfully',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/events/:eventId/competitions
   * Obtener todas las competiciones de un evento
   * @auth No requerida
   */
  static async getByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      const competitions = await CompetitionService.findByEvent(eventId);

      res.json({
        status: 'success',
        data: competitions,
        count: competitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/competitions/:id
   * Obtener una competición por ID
   * @auth No requerida
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const competition = await CompetitionService.findById(id);

      res.json({
        status: 'success',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/competitions/slug/:slug
   * Obtener una competición por slug
   * @auth No requerida
   */
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const competition = await CompetitionService.findBySlug(slug);

      res.json({
        status: 'success',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/competitions/:id
   * Actualizar una competición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      // DEBUG: Log incoming data
      console.log('=== COMPETITION UPDATE DEBUG ===');
      console.log('Competition ID:', id);
      console.log('Full body:', JSON.stringify(data, null, 2));
      console.log('Image fields:', {
        logoUrl: data.logoUrl,
        coverImage: data.coverImage,
        gallery: data.gallery,
        status: data.status,
        featured: data.featured,
        displayOrder: data.displayOrder,
      });
      console.log('===============================');

      const competition = await CompetitionService.update(id, data, userId);

      res.json({
        status: 'success',
        message: 'Competition updated successfully',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/competitions/:id
   * Eliminar una competición (y todas sus editions en cascade)
   * @auth Required (organizador del evento o ADMIN)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await CompetitionService.delete(id, userId);

      res.json({
        status: 'success',
        message: 'Competition deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/events/:eventId/competitions/reorder
   * Reordenar competiciones de un evento
   * @auth Required (organizador del evento o ADMIN)
   */
  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const { order } = req.body;

      if (!Array.isArray(order)) {
        return res.status(400).json({
          status: 'error',
          message: 'Order must be an array of { id, displayOrder }',
        });
      }

      await CompetitionService.reorder(eventId, order, userId);

      res.json({
        status: 'success',
        message: 'Competitions reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v2/competitions/:id/toggle
   * Activar/desactivar una competición
   * @auth Required (organizador del evento o ADMIN)
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const competition = await CompetitionService.toggleActive(id, userId);

      res.json({
        status: 'success',
        message: `Competition ${true ? 'activated' : 'deactivated'}`,
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }
}
