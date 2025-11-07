// src/routes/admin.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import CompetitionAdminController from '../controllers/competition-admin.controller';
import AdminController from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin, requireOrganizer } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';

// Schemas de Competition Admin
import {
  approveCompetitionSchema,
  rejectCompetitionSchema,
  updateStatusSchema,
  getPendingCompetitionsSchema,
  getOrganizerCompetitionsSchema,
} from '../schemas/competition-admin.schema';

// Schemas de Admin General
import {
  getUsersSchema,
  getUserByIdSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema,
  deleteUserSchema,
  getUserStatsSchema,
} from '../schemas/admin.schema';

const router = Router();

// ============================================
// RUTAS ADMIN - ESTADÍSTICAS GENERALES
// ============================================

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Obtener estadísticas generales del dashboard admin
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => AdminController.getStats(req, res, next)
);

// ============================================
// RUTAS ADMIN - GESTIÓN DE USUARIOS
// ============================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Listar usuarios con filtros y paginación
 * @access  Admin
 */
router.get(
  '/admin/users',
  authenticate,
  requireAdmin,
  validate(getUsersSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.getUsers(req, res, next)
);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Obtener un usuario por ID con información detallada
 * @access  Admin
 */
router.get(
  '/admin/users/:id',
  authenticate,
  requireAdmin,
  validate(getUserByIdSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.getUserById(req, res, next)
);

/**
 * @route   GET /api/v1/admin/users/:id/stats
 * @desc    Obtener estadísticas de un usuario específico
 * @access  Admin
 */
router.get(
  '/admin/users/:id/stats',
  authenticate,
  requireAdmin,
  validate(getUserStatsSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.getUserStats(req, res, next)
);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Cambiar el rol de un usuario
 * @access  Admin
 */
router.patch(
  '/admin/users/:id/role',
  authenticate,
  requireAdmin,
  validate(updateUserRoleSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.updateUserRole(req, res, next)
);

/**
 * @route   PATCH /api/v1/admin/users/:id/toggle-status
 * @desc    Activar/Desactivar un usuario
 * @access  Admin
 */
router.patch(
  '/admin/users/:id/toggle-status',
  authenticate,
  requireAdmin,
  validate(toggleUserStatusSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.toggleUserStatus(req, res, next)
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Eliminar un usuario
 * @access  Admin
 */
router.delete(
  '/admin/users/:id',
  authenticate,
  requireAdmin,
  validate(deleteUserSchema),
  (req: Request, res: Response, next: NextFunction) => AdminController.deleteUser(req, res, next)
);

// ============================================
// RUTAS ADMIN - GESTIÓN DE COMPETICIONES
// ============================================

/**
 * @route   GET /api/v1/admin/competitions/pending
 * @desc    Obtener competiciones pendientes de aprobación
 * @access  Admin
 */
router.get(
  '/admin/competitions/pending',
  authenticate,
  requireAdmin,
  validate(getPendingCompetitionsSchema),
  CompetitionAdminController.getPendingCompetitions
);

/**
 * @route   POST /api/v1/admin/competitions/:id/approve
 * @desc    Aprobar una competición
 * @access  Admin
 */
router.post(
  '/admin/competitions/:id/approve',
  authenticate,
  requireAdmin,
  validate(approveCompetitionSchema),
  CompetitionAdminController.approveCompetition
);

/**
 * @route   POST /api/v1/admin/competitions/:id/reject
 * @desc    Rechazar una competición
 * @access  Admin
 */
router.post(
  '/admin/competitions/:id/reject',
  authenticate,
  requireAdmin,
  validate(rejectCompetitionSchema),
  CompetitionAdminController.rejectCompetition
);

/**
 * @route   PATCH /api/v1/admin/competitions/:id/status
 * @desc    Cambiar status de una competición
 * @access  Admin
 */
router.patch(
  '/admin/competitions/:id/status',
  authenticate,
  requireAdmin,
  validate(updateStatusSchema),
  CompetitionAdminController.updateStatus
);

// ============================================
// RUTAS ORGANIZADOR - ORGANIZER y ADMIN
// ============================================

/**
 * @route   GET /api/v1/organizer/competitions
 * @desc    Obtener mis competiciones (como organizador)
 * @access  Organizer, Admin
 */
router.get(
  '/organizer/competitions',
  authenticate,
  requireOrganizer,
  validate(getOrganizerCompetitionsSchema),
  CompetitionAdminController.getMyCompetitions
);

export default router;
