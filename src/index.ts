import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path'; // ✅ AGREGAR AQUÍ

import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import logger from './utils/logger';

// Importar rutas
import authRoutes from './routes/auth.routes';
import competitionRoutes from './routes/competition.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import participantRoutes from './routes/participant.routes';
import resultRoutes from './routes/result.routes';
import reviewRoutes from './routes/review.routes';
import translationRoutes from './routes/translation.routes';
import userCompetitionRoutes from './routes/user-competition.routes';
import adminRoutes from './routes/admin.routes';
import eventRoutes from './routes/event.routes';
import editionRoutes from './routes/edition.routes';
import meCompetitionsRoutes from './routes/me-competitions.routes';
import fileRoutes from './routes/file.routes'; // ✅ AGREGAR AQUÍ
import editionRatingRoutes from './routes/editionRating.routes';
import catalogRoutes from './routes/catalog.routes';
import editionPodiumRoutes from './routes/editionPodium.routes';
import editionPhotoRoutes from './routes/editionPhoto.routes';

dotenv.config();

const app: Application = express(); // ✅ SOLO UNA DECLARACIÓN
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// MIDDLEWARES
// ============================================

// ✅ DESPUÉS - Permitir imágenes cross-origin:
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },  // ← CLAVE
  })
);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// ✅ CORS específico para archivos estáticos
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');  // ← IMPORTANTE
  next();
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Parseo de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión
app.use(compression());
// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  app.use(apiLimiter);
  logger.info('✅ Rate limiter ACTIVADO (producción)');
} else {
  logger.info('⚠️  Rate limiter DESACTIVADO (desarrollo)');
}

// ✅ SERVIR ARCHIVOS ESTÁTICOS
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES V1
// ============================================

const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/competitions', competitionRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/participants', participantRoutes);
apiRouter.use('/results', resultRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/translations', translationRoutes);

app.use(`/api/${API_VERSION}`, apiRouter);

app.use('/api/v1/events', eventRoutes);
app.use(`/api/${API_VERSION}`, userCompetitionRoutes);
app.use(`/api/${API_VERSION}`, adminRoutes);
app.use('/api/v1/me/competitions', meCompetitionsRoutes);

// ✅ RUTAS DE FILES
app.use('/api/v1/files', fileRoutes);

// ============================================
// API ROUTES V2 (NEW)
// ============================================

app.use('/api/v2/events', eventRoutes);
app.use('/api/v2/competitions', competitionRoutes);
app.use('/api/v2/editions', editionRoutes);
app.use('/api/v2/ratings', editionRatingRoutes);
app.use('/api/v2/me/ratings', editionRatingRoutes);
app.use('/api/v2/podiums', editionPodiumRoutes);
app.use('/api/v2/photos', editionPhotoRoutes);
app.use('/api/v2', catalogRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🔍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API v1: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`🔗 API v2: http://localhost:${PORT}/api/v2`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;