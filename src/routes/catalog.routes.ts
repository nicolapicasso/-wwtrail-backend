// src/routes/catalog.routes.ts - Catalog routes (CompetitionType, TerrainType, SpecialSeries)

import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCatalogSchema,
  updateCatalogSchema,
  createSpecialSeriesSchema,
  updateSpecialSeriesSchema,
  getCatalogQuerySchema,
} from '../schemas/catalog.schema';

const router = Router();

// ===================================
// RUTAS PÚBLICAS - CATÁLOGOS
// ===================================

/**
 * GET /api/v2/competition-types
 * Obtener tipos de competición (solo activos por defecto)
 */
router.get(
  '/competition-types',
  validate(getCatalogQuerySchema),
  CatalogController.getCompetitionTypes
);

/**
 * GET /api/v2/terrain-types
 * Obtener tipos de terreno (solo activos por defecto)
 */
router.get(
  '/terrain-types',
  validate(getCatalogQuerySchema),
  CatalogController.getTerrainTypes
);

/**
 * GET /api/v2/special-series
 * Obtener series especiales (solo activas por defecto)
 */
router.get(
  '/special-series',
  validate(getCatalogQuerySchema),
  CatalogController.getSpecialSeries
);

// ===================================
// RUTAS ADMIN - COMPETITION TYPES
// ===================================

/**
 * GET /api/v2/admin/competition-types
 * Obtener todos los tipos de competición (incluye inactivos)
 * Requiere: ADMIN
 */
router.get(
  '/admin/competition-types',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetAllCompetitionTypes
);

/**
 * GET /api/v2/admin/competition-types/:id
 * Obtener tipo de competición por ID
 * Requiere: ADMIN
 */
router.get(
  '/admin/competition-types/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetCompetitionTypeById
);

/**
 * POST /api/v2/admin/competition-types
 * Crear tipo de competición
 * Requiere: ADMIN
 */
router.post(
  '/admin/competition-types',
  authenticate,
  authorize('ADMIN'),
  validate(createCatalogSchema),
  CatalogController.adminCreateCompetitionType
);

/**
 * PUT /api/v2/admin/competition-types/:id
 * Actualizar tipo de competición
 * Requiere: ADMIN
 */
router.put(
  '/admin/competition-types/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCatalogSchema),
  CatalogController.adminUpdateCompetitionType
);

/**
 * DELETE /api/v2/admin/competition-types/:id
 * Eliminar tipo de competición (soft delete)
 * Requiere: ADMIN
 */
router.delete(
  '/admin/competition-types/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminDeleteCompetitionType
);

// ===================================
// RUTAS ADMIN - TERRAIN TYPES
// ===================================

/**
 * GET /api/v2/admin/terrain-types
 * Obtener todos los tipos de terreno (incluye inactivos)
 * Requiere: ADMIN
 */
router.get(
  '/admin/terrain-types',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetAllTerrainTypes
);

/**
 * GET /api/v2/admin/terrain-types/:id
 * Obtener tipo de terreno por ID
 * Requiere: ADMIN
 */
router.get(
  '/admin/terrain-types/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetTerrainTypeById
);

/**
 * POST /api/v2/admin/terrain-types
 * Crear tipo de terreno
 * Requiere: ADMIN
 */
router.post(
  '/admin/terrain-types',
  authenticate,
  authorize('ADMIN'),
  validate(createCatalogSchema),
  CatalogController.adminCreateTerrainType
);

/**
 * PUT /api/v2/admin/terrain-types/:id
 * Actualizar tipo de terreno
 * Requiere: ADMIN
 */
router.put(
  '/admin/terrain-types/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCatalogSchema),
  CatalogController.adminUpdateTerrainType
);

/**
 * DELETE /api/v2/admin/terrain-types/:id
 * Eliminar tipo de terreno (soft delete)
 * Requiere: ADMIN
 */
router.delete(
  '/admin/terrain-types/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminDeleteTerrainType
);

// ===================================
// RUTAS ADMIN - SPECIAL SERIES
// ===================================

/**
 * GET /api/v2/admin/special-series
 * Obtener todas las series especiales (incluye inactivas)
 * Requiere: ADMIN
 */
router.get(
  '/admin/special-series',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetAllSpecialSeries
);

/**
 * GET /api/v2/admin/special-series/:id
 * Obtener serie especial por ID
 * Requiere: ADMIN
 */
router.get(
  '/admin/special-series/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminGetSpecialSeriesById
);

/**
 * POST /api/v2/admin/special-series
 * Crear serie especial
 * Requiere: ADMIN
 */
router.post(
  '/admin/special-series',
  authenticate,
  authorize('ADMIN'),
  validate(createSpecialSeriesSchema),
  CatalogController.adminCreateSpecialSeries
);

/**
 * PUT /api/v2/admin/special-series/:id
 * Actualizar serie especial
 * Requiere: ADMIN
 */
router.put(
  '/admin/special-series/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateSpecialSeriesSchema),
  CatalogController.adminUpdateSpecialSeries
);

/**
 * DELETE /api/v2/admin/special-series/:id
 * Eliminar serie especial (soft delete)
 * Requiere: ADMIN
 */
router.delete(
  '/admin/special-series/:id',
  authenticate,
  authorize('ADMIN'),
  CatalogController.adminDeleteSpecialSeries
);

export default router;

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login):
   GET  /competition-types?isActive=true  → Tipos de competición activos
   GET  /terrain-types?isActive=true      → Tipos de terreno activos
   GET  /special-series?isActive=true     → Series especiales activas

✅ RUTAS ADMIN (requieren ADMIN):
   === COMPETITION TYPES ===
   GET    /admin/competition-types        → Todos los tipos (incluye inactivos)
   GET    /admin/competition-types/:id    → Obtener por ID
   POST   /admin/competition-types        → Crear
   PUT    /admin/competition-types/:id    → Actualizar
   DELETE /admin/competition-types/:id    → Eliminar (soft delete)

   === TERRAIN TYPES ===
   GET    /admin/terrain-types            → Todos los tipos (incluye inactivos)
   GET    /admin/terrain-types/:id        → Obtener por ID
   POST   /admin/terrain-types            → Crear
   PUT    /admin/terrain-types/:id        → Actualizar
   DELETE /admin/terrain-types/:id        → Eliminar (soft delete)

   === SPECIAL SERIES ===
   GET    /admin/special-series           → Todas las series (incluye inactivas)
   GET    /admin/special-series/:id       → Obtener por ID
   POST   /admin/special-series           → Crear
   PUT    /admin/special-series/:id       → Actualizar
   DELETE /admin/special-series/:id       → Eliminar (soft delete)
*/
