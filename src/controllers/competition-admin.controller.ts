// src/controllers/competition-admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import CompetitionAdminService from '../services/competition-admin.service';
import { UserRole } from '@prisma/client';

// ============================================
// INTERFACES
// ============================================

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ============================================
// COMPETITION ADMIN CONTROLLER
// ============================================

class CompetitionAdminController {
  /**
   * @route   GET /api/v1/admin/competitions/pending
   * @desc    Obtener competiciones pendientes de aprobación
   * @access  Admin
   */
  async getPendingCompetitions(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await CompetitionAdminService.getPendingCompetitions(options);

      res.status(200).json({
        success: true,
        data: result.competitions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/admin/competitions/:id/approve
   * @desc    Aprobar una competición
   * @access  Admin
   * MEJORADO: Ahora acepta adminNotes opcional del body
   */
  async approveCompetition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body; // ← NUEVO: Extraer adminNotes del body
      const adminId = req.user!.id;

      const competition = await CompetitionAdminService.approveCompetition(
        id, 
        adminId,
        adminNotes // ← NUEVO: Pasar adminNotes al service (tercer parámetro opcional)
      );

      res.status(200).json({
        success: true,
        message: 'Competition approved successfully',
        data: competition,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Competition not found') {
          res.status(404).json({
            success: false,
            message: 'Competition not found',
          });
          return;
        }
        if (error.message === 'Competition is not in DRAFT status') {
          res.status(400).json({
            success: false,
            message: 'Competition is not in DRAFT status',
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/admin/competitions/:id/reject
   * @desc    Rechazar una competición
   * @access  Admin
   */
  async rejectCompetition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      const competition = await CompetitionAdminService.rejectCompetition(
        id,
        adminId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Competition rejected successfully',
        data: competition,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Competition not found') {
          res.status(404).json({
            success: false,
            message: 'Competition not found',
          });
          return;
        }
        if (error.message === 'Competition is not in DRAFT status') {
          res.status(400).json({
            success: false,
            message: 'Competition is not in DRAFT status',
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * @route   PATCH /api/v1/admin/competitions/:id/status
   * @desc    Cambiar status de una competición
   * @access  Admin
   */
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user!.id;

      const competition = await CompetitionAdminService.updateStatus(
        id,
        status,
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'Competition status updated successfully',
        data: competition,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Competition not found') {
        res.status(404).json({
          success: false,
          message: 'Competition not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/organizer/competitions
   * @desc    Obtener mis competiciones como organizador
   * @access  Organizer, Admin
   */
  async getMyCompetitions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const options = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await CompetitionAdminService.getMyCompetitions(
        userId,
        userRole,
        options
      );

      res.status(200).json({
        success: true,
        data: result.competitions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/admin/competitions/stats
   * @desc    Obtener estadísticas de competiciones
   * @access  Admin
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await CompetitionAdminService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompetitionAdminController();
