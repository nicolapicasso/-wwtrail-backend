// src/controllers/competition-admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import CompetitionAdminService from '../services/competition-admin.service';

class CompetitionAdminController {
  /**
   * GET /api/v1/admin/competitions/pending
   * Obtener competiciones pendientes de aprobación
   */
  async getPendingCompetitions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;

      const result = await CompetitionAdminService.getPendingCompetitions(
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/competitions/:id/approve
   * Aprobar una competición
   */
  async approveCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { adminNotes } = req.body;

      const competition = await CompetitionAdminService.approveCompetition(
        id,
        adminId,
        { adminNotes }
      );

      res.status(200).json({
        status: 'success',
        message: 'Competition approved successfully',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/competitions/:id/reject
   * Rechazar una competición
   */
  async rejectCompetition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required',
        });
      }

      const competition = await CompetitionAdminService.rejectCompetition(
        id,
        adminId,
        { rejectionReason }
      );

      res.status(200).json({
        status: 'success',
        message: 'Competition rejected',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/competitions/:id/status
   * Cambiar status de una competición
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user!.id;

      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required',
        });
      }

      const competition = await CompetitionAdminService.updateCompetitionStatus(
        id,
        status,
        adminId
      );

      res.status(200).json({
        status: 'success',
        message: 'Competition status updated',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/stats
   * Obtener estadísticas del dashboard admin
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await CompetitionAdminService.getAdminStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/organizer/competitions
   * Obtener competiciones del organizador actual
   */
  async getMyCompetitions(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = req.user!.id;
      const { page = '1', limit = '20' } = req.query;

      const result = await CompetitionAdminService.getOrganizerCompetitions(
        organizerId,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompetitionAdminController();
