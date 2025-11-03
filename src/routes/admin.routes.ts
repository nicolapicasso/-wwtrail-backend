// src/routes/admin.routes.ts

import { Router } from 'express';
import CompetitionAdminController from '../controllers/competition-admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin, requireOrganizer } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  approveCompetitionSchema,
  rejectCompetitionSchema,
  updateStatusSchema,
  getPendingCompetitionsSchema,
  getOrganizerCompetitionsSchema,
} from '../schemas/competition-admin.schema';

const router = Router();

// ============================================
// RUTAS ADMIN - Solo ADMIN
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

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Obtener estadísticas del dashboard admin
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  requireAdmin,
  CompetitionAdminController.getStats
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
