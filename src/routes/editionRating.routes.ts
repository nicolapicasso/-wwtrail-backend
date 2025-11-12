// src/routes/editionRating.routes.ts - Edition Rating routes

import { Router } from 'express';
import { EditionRatingController } from '../controllers/editionRating.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEditionRatingSchema,
  updateEditionRatingSchema,
  getRatingsQuerySchema,
  getRecentRatingsSchema,
} from '../schemas/editionRating.schema';

const router = Router();

// ===================================
// RUTAS ESPECÍFICAS PÚBLICAS
// ===================================

/**
 * GET /api/v2/ratings/recent
 * Obtener ratings recientes (para homepage)
 */
router.get(
  '/recent',
  validate(getRecentRatingsSchema),
  EditionRatingController.getRecent
);

// ===================================
// RUTAS PROTEGIDAS ESPECÍFICAS
// ===================================

/**
 * GET /api/v2/me/ratings
 * Obtener mis ratings
 * Requiere: AUTH
 */
router.get(
  '/me',
  authenticate,
  validate(getRatingsQuerySchema),
  EditionRatingController.getMyRatings
);

// ===================================
// RUTAS CON ID
// ===================================

/**
 * GET /api/v2/ratings/:id
 * Obtener un rating por ID
 * Público
 */
router.get('/:id', EditionRatingController.getById);

/**
 * PUT /api/v2/ratings/:id
 * Actualizar un rating
 * Requiere: AUTH + OWNER
 */
router.put(
  '/:id',
  authenticate,
  validate(updateEditionRatingSchema),
  EditionRatingController.update
);

/**
 * DELETE /api/v2/ratings/:id
 * Eliminar un rating
 * Requiere: AUTH + OWNER
 */
router.delete('/:id', authenticate, EditionRatingController.delete);

export default router;

// ===================================
// RUTAS ANIDADAS EN EDITIONS
// Se definen en edition.routes.ts
// ===================================
// POST   /api/v2/editions/:editionId/ratings
// GET    /api/v2/editions/:editionId/ratings

export const editionRatingsRouter = Router({ mergeParams: true });

/**
 * POST /api/v2/editions/:editionId/ratings
 * Crear rating para una edición
 * Requiere: AUTH
 */
editionRatingsRouter.post(
  '/',
  authenticate,
  validate(createEditionRatingSchema),
  EditionRatingController.create
);

/**
 * GET /api/v2/editions/:editionId/ratings
 * Obtener ratings de una edición
 * Público
 */
editionRatingsRouter.get(
  '/',
  validate(getRatingsQuerySchema),
  EditionRatingController.getByEdition
);

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login):
   GET  /ratings/recent              → Ratings recientes
   GET  /ratings/:id                 → Rating por ID
   GET  /editions/:editionId/ratings → Ratings de una edición

✅ RUTAS PROTEGIDAS (requieren AUTH):
   POST   /editions/:editionId/ratings → Crear rating
   GET    /me/ratings                  → Mis ratings
   PUT    /ratings/:id                 → Actualizar mi rating
   DELETE /ratings/:id                 → Eliminar mi rating
*/
