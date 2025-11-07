// src/controllers/admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import AdminService from '../services/admin.service';
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
// ADMIN CONTROLLER
// ============================================

class AdminController {
  /**
   * @route   GET /api/v1/admin/stats
   * @desc    Obtener estadísticas generales del dashboard
   * @access  Admin
   */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/admin/users
   * @desc    Listar usuarios con filtros y paginación
   * @access  Admin
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        search: req.query.search as string | undefined,
        role: req.query.role as UserRole | undefined,
        isActive:
          req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
            ? false
            : undefined,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await AdminService.getUsers(filters);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/admin/users/:id
   * @desc    Obtener un usuario por ID con información detallada
   * @access  Admin
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await AdminService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * @route   PATCH /api/v1/admin/users/:id/role
   * @desc    Cambiar el rol de un usuario
   * @access  Admin
   */
  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = req.user!.id;

      const updatedUser = await AdminService.updateUserRole(
        id,
        role as UserRole,
        adminId
      );

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
        } else if (error.message === 'Cannot remove your own admin role') {
          res.status(403).json({
            success: false,
            message: 'Cannot remove your own admin role',
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  /**
   * @route   PATCH /api/v1/admin/users/:id/toggle-status
   * @desc    Activar/Desactivar un usuario
   * @access  Admin
   */
  async toggleUserStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const updatedUser = await AdminService.toggleUserStatus(id, adminId);

      res.status(200).json({
        success: true,
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
        } else if (error.message === 'Cannot deactivate your own account') {
          res.status(403).json({
            success: false,
            message: 'Cannot deactivate your own account',
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  /**
   * @route   DELETE /api/v1/admin/users/:id
   * @desc    Eliminar un usuario
   * @access  Admin
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const result = await AdminService.deleteUser(id, adminId);

      if (result.deleted) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.user,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
        } else if (error.message === 'Cannot delete your own account') {
          res.status(403).json({
            success: false,
            message: 'Cannot delete your own account',
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  /**
   * @route   GET /api/v1/admin/users/:id/stats
   * @desc    Obtener estadísticas de un usuario específico
   * @access  Admin
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const stats = await AdminService.getUserStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      } else {
        next(error);
      }
    }
  }
}

export default new AdminController();
