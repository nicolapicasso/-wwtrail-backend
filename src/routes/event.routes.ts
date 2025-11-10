// src/routes/event.routes.ts - Event routes with proper public/protected separation

import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { checkEventOwnership } from '../middlewares/ownership.middleware';

import {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
  eventIdSchema,
  eventSlugSchema,
  searchEventsSchema,
  nearbyEventsSchema,
  featuredEventsSchema,
  eventsByCountrySchema,
} from '../schemas/event.schema';
import { eventCompetitionsRouter } from './competition.routes';

const router = Router();

// ============================================
// ⚠️ ORDEN CRÍTICO DE LAS RUTAS
// ============================================
// 1. Rutas literales específicas (/search, /nearby, etc.)
// 2. Rutas protegidas específicas (/my-events, /stats, /pending)
// 3. Rutas con parámetros (/slug/:slug, /:id)
// 4. Ruta raíz (/) AL FINAL
// ============================================

// ===================================
// PASO 1: RUTAS PÚBLICAS ESPECÍFICAS
// (Sin authenticate - accesibles sin login)
// ===================================

router.get(
  '/search',
  validate(searchEventsSchema),
  EventController.search
);

router.get(
  '/nearby',
  validate(nearbyEventsSchema),
  EventController.getNearby
);

router.get(
  '/featured',
  validate(featuredEventsSchema),
  EventController.getFeatured
);

router.get(
  '/country/:country',
  validate(eventsByCountrySchema),
  EventController.getByCountry
);

// ===================================
// PASO 2: RUTAS PROTEGIDAS ESPECÍFICAS
// (Con authenticate - requieren login)
// ⚠️ DEBEN IR ANTES DE /check-slug Y /slug
// ===================================

router.get(
  '/my-events',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  EventController.getMyEvents
);

router.get(
  '/stats',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  EventController.getMyStats
);

router.get(
  '/pending',
  authenticate,
  authorize('ADMIN'),
  EventController.getPendingEvents
);

// ===================================
// PASO 3: RUTAS CON PARÁMETROS SLUG
// (Públicas - accesibles sin login)
// ===================================

router.get('/check-slug/:slug', EventController.checkSlug);

router.get(
  '/slug/:slug',
  validate(eventSlugSchema),
  EventController.getBySlug
);

// ===================================
// PASO 4: RUTAS CON ID + ACCIONES
// ===================================

// Acciones de admin (protegidas)
router.post(
  '/:id/approve',
  authenticate,
  authorize('ADMIN'),
  EventController.approveEvent
);

router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  EventController.rejectEvent
);

// Estadísticas de evento (público)
router.get(
  '/:id/stats',
  validate(eventIdSchema),
  EventController.getStats
);

// Actualizar evento (protegido)
router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(updateEventSchema),
  checkEventOwnership,
  EventController.update
);

router.patch(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(updateEventSchema),
  checkEventOwnership,
  EventController.update
);

// Eliminar evento (protegido - solo ADMIN)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(eventIdSchema),
  EventController.delete
);

// Obtener evento por ID (público)
router.get(
  '/:id',
  validate(eventIdSchema),
  EventController.getById
);

// ===================================
// PASO 5: RUTAS ANIDADAS (COMPETITIONS)
// ===================================

router.use('/:eventId/competitions', eventCompetitionsRouter);

// ===================================
// PASO 6: RUTA RAÍZ - DEBE IR AL FINAL
// ===================================

// GET / - Lista de eventos (PÚBLICO - sin authenticate)
router.get(
  '/',
  validate(getEventsSchema),
  EventController.getAll
);

// POST / - Crear evento (PROTEGIDO)
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  validate(createEventSchema),
  EventController.create
);

export default router;

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login requerido):
   GET  /events                    → Lista paginada
   GET  /events/search             → Búsqueda
   GET  /events/nearby             → Eventos cercanos
   GET  /events/featured           → Eventos destacados
   GET  /events/country/:country   → Eventos por país
   GET  /events/slug/:slug         → Evento por slug
   GET  /events/:id                → Evento por ID
   GET  /events/:id/stats          → Estadísticas del evento
   GET  /events/check-slug/:slug   → Verificar disponibilidad de slug

✅ RUTAS PROTEGIDAS (requieren login):
   POST   /events                  → Crear evento (ORGANIZER/ADMIN)
   PUT    /events/:id              → Actualizar evento (ORGANIZER/ADMIN + ownership)
   PATCH  /events/:id              → Actualizar parcial (ORGANIZER/ADMIN + ownership)
   DELETE /events/:id              → Eliminar evento (ADMIN)
   GET    /events/my-events        → Mis eventos (ORGANIZER/ADMIN)
   GET    /events/stats            → Mis estadísticas (ORGANIZER/ADMIN)
   GET    /events/pending          → Eventos pendientes (ADMIN)
   POST   /events/:id/approve      → Aprobar evento (ADMIN)
   POST   /events/:id/reject       → Rechazar evento (ADMIN)

✅ RUTAS ANIDADAS:
   /events/:eventId/competitions/* → Competiciones de un evento

Esta configuración permite:
- ✅ Usuarios no registrados pueden explorar eventos
- ✅ SEO puede indexar eventos públicos
- ✅ Usuarios registrados pueden gestionar sus eventos
- ✅ Admins tienen control total sobre aprobaciones
*/