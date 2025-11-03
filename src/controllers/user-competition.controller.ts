// src/controllers/user-competition.controller.ts

import { Request, Response, NextFunction } from 'express';
import UserCompetitionService from '../services/user-competition.service';

class UserCompetitionController {
  /**
   * POST /api/v1/me/competitions/:competitionId/mark
   * Marcar una competición (me interesa, me inscribí, etc.)
   */
  async markCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { competitionId } = req.params;
      const { status } = req.body;

      const userCompetition = await UserCompetitionService.markCompetition(userId, {
        competitionId,
        status,
      });

      res.status(201).json({
        status: 'success',
        message: 'Competition marked successfully',
        data: userCompetition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/me/competitions/:competitionId
   * Desmarcar una competición
   */
  async unmarkCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { competitionId } = req.params;

      const result = await UserCompetitionService.unmarkCompetition(userId, competitionId);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/me/competitions/:competitionId/result
   * Añadir resultado personal a una competición
   */
  async addResult(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { competitionId } = req.params;
      const { finishTime, position, categoryPosition, notes, personalRating, completedAt } = req.body;

      const userCompetition = await UserCompetitionService.addResult(userId, {
        competitionId,
        finishTime,
        position,
        categoryPosition,
        notes,
        personalRating,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      });

      res.status(200).json({
        status: 'success',
        message: 'Result added successfully',
        data: userCompetition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/me/competitions
   * Obtener todas las competiciones del usuario
   */
  async getMyCompetitions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      const userCompetitions = await UserCompetitionService.getUserCompetitions(
        userId,
        status as any
      );

      res.status(200).json({
        status: 'success',
        data: userCompetitions,
        count: userCompetitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/me/competitions/:competitionId
   * Obtener una competición específica del usuario
   */
  async getMyCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { competitionId } = req.params;

      const userCompetition = await UserCompetitionService.getUserCompetitionById(userId, competitionId);

      if (!userCompetition) {
        return res.status(404).json({
          status: 'error',
          message: 'User competition not found',
        });
      }

      res.status(200).json({
        status: 'success',
        data: userCompetition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/me/competitions/:competitionId
   * Actualizar una competición del usuario
   */
  async updateMyCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { competitionId } = req.params;
      const updateData = req.body;

      const userCompetition = await UserCompetitionService.updateUserCompetition(
        userId,
        competitionId,
        updateData
      );

      res.status(200).json({
        status: 'success',
        message: 'Competition updated successfully',
        data: userCompetition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/me/stats
   * Obtener estadísticas personales
   */
  async getMyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const stats = await UserCompetitionService.getUserStats(userId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rankings/:type
   * Obtener rankings globales
   */
  async getGlobalRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { limit } = req.query;

      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const ranking = await UserCompetitionService.getGlobalRanking(type as any, limitNum);

      res.status(200).json({
        status: 'success',
        data: ranking,
        count: ranking.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:userId/competitions
   * Ver competiciones de otro usuario (público)
   */
  async getUserCompetitions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      // Solo mostrar completadas para privacidad
      const userCompetitions = await UserCompetitionService.getUserCompetitions(
        userId,
        (status as any) || 'COMPLETED'
      );

      res.status(200).json({
        status: 'success',
        data: userCompetitions,
        count: userCompetitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:userId/stats
   * Ver estadísticas de otro usuario (público)
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const stats = await UserCompetitionService.getUserStats(userId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserCompetitionController();
