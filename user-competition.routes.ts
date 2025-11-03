// src/routes/user-competition.routes.ts

import { Router } from 'express';
import UserCompetitionController from '../controllers/user-competition.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  markCompetitionSchema,
  addResultSchema,
  updateUserCompetitionSchema,
  getMyCompetitionsSchema,
  competitionIdParamSchema,
  globalRankingSchema,
  getUserCompetitionsSchema,
  userIdParamSchema,
} from '../schemas/user-competition.schema';

const router = Router();

// ============================================
// RUTAS AUTENTICADAS - Mis Competiciones
// ============================================

/**
 * @route   GET /api/v1/me/competitions
 * @desc    Obtener todas mis competiciones
 * @access  Private
 */
router.get(
  '/me/competitions',
  authenticate,
  validate(getMyCompetitionsSchema),
  UserCompetitionController.getMyCompetitions
);

/**
 * @route   GET /api/v1/me/competitions/:competitionId
 * @desc    Obtener una competición específica mía
 * @access  Private
 */
router.get(
  '/me/competitions/:competitionId',
  authenticate,
  validate(competitionIdParamSchema),
  UserCompetitionController.getMyCompetition
);

/**
 * @route   POST /api/v1/me/competitions/:competitionId/mark
 * @desc    Marcar una competición (me interesa, me inscribí, etc.)
 * @access  Private
 */
router.post(
  '/me/competitions/:competitionId/mark',
  authenticate,
  validate(markCompetitionSchema),
  UserCompetitionController.markCompetition
);

/**
 * @route   POST /api/v1/me/competitions/:competitionId/result
 * @desc    Añadir resultado personal a una competición
 * @access  Private
 */
router.post(
  '/me/competitions/:competitionId/result',
  authenticate,
  validate(addResultSchema),
  UserCompetitionController.addResult
);

/**
 * @route   PUT /api/v1/me/competitions/:competitionId
 * @desc    Actualizar una competición mía
 * @access  Private
 */
router.put(
  '/me/competitions/:competitionId',
  authenticate,
  validate(updateUserCompetitionSchema),
  UserCompetitionController.updateMyCompetition
);

/**
 * @route   DELETE /api/v1/me/competitions/:competitionId
 * @desc    Desmarcar una competición
 * @access  Private
 */
router.delete(
  '/me/competitions/:competitionId',
  authenticate,
  validate(competitionIdParamSchema),
  UserCompetitionController.unmarkCompetition
);

/**
 * @route   GET /api/v1/me/stats
 * @desc    Obtener mis estadísticas personales
 * @access  Private
 */
router.get('/me/stats', authenticate, UserCompetitionController.getMyStats);

// ============================================
// RUTAS PÚBLICAS - Rankings y Perfiles
// ============================================

/**
 * @route   GET /api/v1/rankings/:type
 * @desc    Obtener rankings globales (competitions, km, elevation)
 * @access  Public
 */
router.get(
  '/rankings/:type',
  validate(globalRankingSchema),
  UserCompetitionController.getGlobalRanking
);

/**
 * @route   GET /api/v1/users/:userId/competitions
 * @desc    Ver competiciones de otro usuario (público, solo completadas)
 * @access  Public
 */
router.get(
  '/users/:userId/competitions',
  validate(getUserCompetitionsSchema),
  UserCompetitionController.getUserCompetitions
);

/**
 * @route   GET /api/v1/users/:userId/stats
 * @desc    Ver estadísticas de otro usuario
 * @access  Public
 */
router.get(
  '/users/:userId/stats',
  validate(userIdParamSchema),
  UserCompetitionController.getUserStats
);

export default router;
