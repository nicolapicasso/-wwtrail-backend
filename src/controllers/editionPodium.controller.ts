import { Request, Response, NextFunction } from 'express';
import { EditionPodiumService } from '../services/editionPodium.service';

export class EditionPodiumController {
  /**
   * POST /api/v2/editions/:editionId/podiums
   * Crear un nuevo podio para una edición
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;
      const data = req.body;

      const podium = await EditionPodiumService.create(editionId, data);

      res.status(201).json({
        status: 'success',
        data: podium,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:editionId/podiums
   * Obtener todos los podios de una edición
   */
  static async getByEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;

      const podiums = await EditionPodiumService.getByEdition(editionId);

      res.status(200).json({
        status: 'success',
        data: podiums,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/podiums/:id
   * Obtener un podio por ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const podium = await EditionPodiumService.getById(id);

      res.status(200).json({
        status: 'success',
        data: podium,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/podiums/:id
   * Actualizar un podio existente
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const podium = await EditionPodiumService.update(id, data);

      res.status(200).json({
        status: 'success',
        data: podium,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/podiums/:id
   * Eliminar un podio
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await EditionPodiumService.delete(id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/editions/:editionId/chronicle
   * Actualizar crónica de una edición
   */
  static async updateChronicle(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { editionId } = req.params;
      const data = req.body;

      const edition = await EditionPodiumService.updateChronicle(
        editionId,
        data
      );

      res.status(200).json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/editions/:editionId/chronicle
   * Obtener crónica de una edición
   */
  static async getChronicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;

      const edition = await EditionPodiumService.getChronicle(editionId);

      res.status(200).json({
        status: 'success',
        data: edition,
      });
    } catch (error) {
      next(error);
    }
  }
}
