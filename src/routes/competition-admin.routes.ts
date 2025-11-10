// src/routes/competition-admin.routes.ts
// NOTA: Estas rutas ya están incluidas en admin.routes.ts
// Este archivo es opcional y sirve como referencia

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
  getStatsSchema,
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
  '/pending',
  authenticate,
  requireAdmin,
  validate(getPendingCompetitionsSchema),
  CompetitionAdminController.getPendingCompetitions
);

/**
 * @route   GET /api/v1/admin/competitions/stats
 * @desc    Obtener estadísticas de competiciones
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  validate(getStatsSchema),
  CompetitionAdminController.getStats
);

/**
 * @route   POST /api/v1/admin/competitions/:id/approve
 * @desc    Aprobar una competición
 * @access  Admin
 */
router.post(
  '/:id/approve',
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
  '/:id/reject',
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
  '/:id/status',
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
 * @desc    Obtener mis competiciones como organizador
 * @access  Organizer, Admin
 */
router.get(
  '/my-competitions',
  authenticate,
  requireOrganizer,
  validate(getOrganizerCompetitionsSchema),
  CompetitionAdminController.getMyCompetitions
);

export default router;
