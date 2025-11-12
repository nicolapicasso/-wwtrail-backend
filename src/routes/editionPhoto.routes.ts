// src/routes/editionPhoto.routes.ts - Edition Photo routes

import { Router } from 'express';
import { EditionPhotoController } from '../controllers/editionPhoto.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadSingle } from '../config/multer';
import {
  uploadPhotoSchema,
  updatePhotoMetadataSchema,
  reorderPhotosSchema,
} from '../schemas/editionPhoto.schema';

const router = Router();

// ===================================
// RUTAS CON ID
// ===================================

/**
 * GET /api/v2/photos/:id
 * Obtener una foto por ID
 * Público
 */
router.get('/:id', EditionPhotoController.getById);

/**
 * PUT /api/v2/photos/:id
 * Actualizar metadata de una foto
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(updatePhotoMetadataSchema),
  EditionPhotoController.update
);

/**
 * DELETE /api/v2/photos/:id
 * Eliminar una foto
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  EditionPhotoController.delete
);

export default router;

// ===================================
// RUTAS ANIDADAS EN EDITIONS
// Se montan en edition.routes.ts
// ===================================

// Router para photos anidadas bajo editions
export const editionPhotosRouter = Router({ mergeParams: true });

/**
 * POST /api/v2/editions/:editionId/photos
 * Subir foto a una edición
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
editionPhotosRouter.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  uploadSingle.single('photo'),
  validate(uploadPhotoSchema),
  EditionPhotoController.upload
);

/**
 * GET /api/v2/editions/:editionId/photos
 * Obtener fotos de una edición
 * Público
 */
editionPhotosRouter.get('/', EditionPhotoController.getByEdition);

/**
 * POST /api/v2/editions/:editionId/photos/reorder
 * Reordenar fotos
 * Requiere: AUTH + ORGANIZER/ADMIN
 */
editionPhotosRouter.post(
  '/reorder',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(reorderPhotosSchema),
  EditionPhotoController.reorder
);

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login):
   GET  /photos/:id                        → Foto por ID
   GET  /editions/:editionId/photos        → Fotos de una edición

✅ RUTAS PROTEGIDAS (requieren AUTH + ORGANIZER/ADMIN):
   POST   /editions/:editionId/photos      → Subir foto (multipart/form-data)
   POST   /editions/:editionId/photos/reorder → Reordenar fotos
   PUT    /photos/:id                      → Actualizar metadata
   DELETE /photos/:id                      → Eliminar foto
*/
