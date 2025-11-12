// src/routes/editionPodium.routes.ts - Edition Podium routes

import { Router } from 'express';
import { EditionPodiumController } from '../controllers/editionPodium.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPodiumSchema,
  updatePodiumSchema,
  updateChronicleSchema,
} from '../schemas/editionPodium.schema';

const router = Router();

// ===================================
// RUTAS CON ID
// ===================================

/**
 * GET /api/v2/podiums/:id
 * Obtener un podio por ID
 * Público
 */
router.get('/:id', EditionPodiumController.getById);

/**
 * PUT /api/v2/podiums/:id
 * Actualizar un podio
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(updatePodiumSchema),
  EditionPodiumController.update
);

/**
 * DELETE /api/v2/podiums/:id
 * Eliminar un podio
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  EditionPodiumController.delete
);

export default router;

// ===================================
// RUTAS ANIDADAS EN EDITIONS
// Se montan en edition.routes.ts
// ===================================

// Router para podiums anidados bajo editions
export const editionPodiumsRouter = Router({ mergeParams: true });

/**
 * POST /api/v2/editions/:editionId/podiums
 * Crear podio para una edición
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
editionPodiumsRouter.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(createPodiumSchema),
  EditionPodiumController.create
);

/**
 * GET /api/v2/editions/:editionId/podiums
 * Obtener podios de una edición
 * Público
 */
editionPodiumsRouter.get('/', EditionPodiumController.getByEdition);

// Router para chronicle anidado bajo editions
export const editionChronicleRouter = Router({ mergeParams: true });

/**
 * PUT /api/v2/editions/:editionId/chronicle
 * Actualizar crónica de una edición
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
editionChronicleRouter.put(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(updateChronicleSchema),
  EditionPodiumController.updateChronicle
);

/**
 * GET /api/v2/editions/:editionId/chronicle
 * Obtener crónica de una edición
 * Público
 */
editionChronicleRouter.get('/', EditionPodiumController.getChronicle);

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login):
   GET  /podiums/:id                     → Podio por ID
   GET  /editions/:editionId/podiums     → Podios de una edición
   GET  /editions/:editionId/chronicle   → Crónica de una edición

✅ RUTAS PROTEGIDAS (requieren AUTH + ORGANIZER/ADMIN):
   POST   /editions/:editionId/podiums   → Crear podio
   PUT    /podiums/:id                   → Actualizar podio
   DELETE /podiums/:id                   → Eliminar podio
   PUT    /editions/:editionId/chronicle → Actualizar crónica
*/
