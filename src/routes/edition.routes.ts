import { Router } from 'express';
import { EditionController } from '../controllers/edition.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEditionSchema,
  updateEditionSchema,
  editionIdSchema,
  editionSlugSchema,
  competitionIdSchema,
  editionByYearSchema,
  createBulkEditionsSchema,
} from '../schemas/edition.schema';
import { editionRatingsRouter } from './editionRating.routes';
import { editionPodiumsRouter, editionChronicleRouter } from './editionPodium.routes';
import { editionPhotosRouter } from './editionPhoto.routes';
import { editionWeatherRouter } from './weather.routes';

const router = Router();
console.log('✅ Edition routes file loaded!');

// Ruta raíz para listar todas las ediciones (opcional)
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Editions API v2 - Working!',
    data: [],
    endpoints: [
      'GET /api/v2/editions/:id',
      'GET /api/v2/editions/slug/:slug',
      'GET /api/v2/editions/slug/:slug/with-inheritance',
      'GET /api/v2/editions/:id/full',
      'GET /api/v2/editions/:id/with-inheritance',
      'GET /api/v2/editions/:id/stats',
      'PUT /api/v2/editions/:id (auth)',
      'DELETE /api/v2/editions/:id (auth)',
    ],
  });
});

/**
 * RUTAS ANIDADAS BAJO COMPETICIONES
 * Montadas en: /api/v2/competitions/:competitionId/editions
 */
export const competitionEditionsRouter = Router({ mergeParams: true });

// GET /api/v2/competitions/:competitionId/editions - Listar ediciones
competitionEditionsRouter.get(
  '/',
  validate(competitionIdSchema),
  EditionController.getByCompetition
);

// POST /api/v2/competitions/:competitionId/editions - Crear edición
competitionEditionsRouter.post(
  '/',
  authenticate,
  validate(createEditionSchema),
  EditionController.create
);

// POST /api/v2/competitions/:competitionId/editions/bulk - Crear múltiples
competitionEditionsRouter.post(
  '/bulk',
  authenticate,
  validate(createBulkEditionsSchema),
  EditionController.createBulk
);

// GET /api/v2/competitions/:competitionId/editions/:year - Por año
competitionEditionsRouter.get(
  '/:year',
  validate(editionByYearSchema),
  EditionController.getByYear
);

/**
 * RUTAS DIRECTAS DE EDICIONES
 * Montadas en: /api/v2/editions
 */

// GET /api/v2/editions/slug/:slug/with-inheritance - Por slug con herencia
router.get(
  '/slug/:slug/with-inheritance',
  validate(editionSlugSchema),
  EditionController.getWithInheritanceBySlug
);

// GET /api/v2/editions/slug/:slug - Por slug (antes de /:id)
router.get(
  '/slug/:slug',
  validate(editionSlugSchema),
  EditionController.getBySlug
);

// GET /api/v2/editions/:id/full - Con herencia de datos
router.get(
  '/:id/full',
  validate(editionIdSchema),
  EditionController.getWithInheritance
);

// GET /api/v2/editions/:id/with-inheritance - Alias para frontend
router.get(
  '/:id/with-inheritance',
  validate(editionIdSchema),
  EditionController.getWithInheritance
);

// GET /api/v2/editions/:id/stats - Estadísticas
router.get(
  '/:id/stats',
  validate(editionIdSchema),
  EditionController.getStats
);

// ===================================
// RUTAS ANIDADAS - RATINGS
// ===================================
// POST /api/v2/editions/:editionId/ratings
// GET  /api/v2/editions/:editionId/ratings
router.use('/:editionId/ratings', editionRatingsRouter);

// ===================================
// RUTAS ANIDADAS - PODIUMS
// ===================================
// POST /api/v2/editions/:editionId/podiums
// GET  /api/v2/editions/:editionId/podiums
router.use('/:editionId/podiums', editionPodiumsRouter);

// ===================================
// RUTAS ANIDADAS - CHRONICLE
// ===================================
// PUT /api/v2/editions/:editionId/chronicle
// GET /api/v2/editions/:editionId/chronicle
router.use('/:editionId/chronicle', editionChronicleRouter);

// ===================================
// RUTAS ANIDADAS - PHOTOS
// ===================================
// POST /api/v2/editions/:editionId/photos
// GET  /api/v2/editions/:editionId/photos
// POST /api/v2/editions/:editionId/photos/reorder
router.use('/:editionId/photos', editionPhotosRouter);

// ===================================
// RUTAS ANIDADAS - WEATHER
// ===================================
// GET  /api/v2/editions/:editionId/weather
// POST /api/v2/editions/:editionId/weather/fetch
router.use('/:editionId/weather', editionWeatherRouter);

// GET /api/v2/editions/:id - Por ID
router.get(
  '/:id',
  validate(editionIdSchema),
  EditionController.getById
);

// PUT /api/v2/editions/:id - Actualizar
router.put(
  '/:id',
  authenticate,
  validate(updateEditionSchema),
  EditionController.update
);

// PATCH /api/v2/editions/:id - Actualizar parcial (alias)
router.patch(
  '/:id',
  authenticate,
  validate(updateEditionSchema),
  EditionController.update
);

// PATCH /api/v2/editions/:id/toggle - Activar/desactivar
router.patch(
  '/:id/toggle',
  authenticate,
  validate(editionIdSchema),
  EditionController.toggleActive
);

// DELETE /api/v2/editions/:id - Eliminar
router.delete(
  '/:id',
  authenticate,
  validate(editionIdSchema),
  EditionController.delete
);
console.log('✅ Edition router created with', router.stack?.length || 0, 'routes');

export default router;