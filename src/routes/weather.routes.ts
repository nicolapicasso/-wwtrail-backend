// src/routes/weather.routes.ts - Weather routes

import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

// ===================================
// RUTAS ANIDADAS EN EDITIONS
// Se montan en edition.routes.ts
// ===================================

// Router para weather anidado bajo editions
export const editionWeatherRouter = Router({ mergeParams: true });

/**
 * GET /api/v2/editions/:editionId/weather
 * Obtener datos climáticos de una edición
 * Público
 */
editionWeatherRouter.get('/', WeatherController.getEditionWeather);

/**
 * POST /api/v2/editions/:editionId/weather/fetch
 * Fetch/Refetch datos climáticos
 * Requiere: AUTH + ADMIN
 * Query param: ?force=true para refetch
 */
editionWeatherRouter.post(
  '/fetch',
  authenticate,
  authorize('ADMIN'),
  WeatherController.fetchWeather
);

// ============================================
// 📝 RESUMEN DE RUTAS
// ============================================
/*
✅ RUTAS PÚBLICAS (sin login):
   GET  /editions/:editionId/weather         → Obtener clima

✅ RUTAS PROTEGIDAS (requieren ADMIN):
   POST /editions/:editionId/weather/fetch   → Fetch/Refetch clima (query: ?force=true)
*/

export default editionWeatherRouter;
