import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
//import testRoutes from './routes/test.routes';
import meCompetitionsRoutes from './routes/me-competitions.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================
// MIDDLEWARES
// ============================================

// Seguridad
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

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

// ✅ CORREGIDO: Rate limiting con control por entorno
if (process.env.NODE_ENV === 'production') {
  app.use(apiLimiter);
  logger.info('✅ Rate limiter ACTIVADO (producción)');
} else {
  logger.info('⚠️  Rate limiter DESACTIVADO (desarrollo)');
}

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

// ✅ CRÍTICO: EVENTS V1 debe ir ANTES de userCompetitionRoutes/adminRoutes
// para evitar que middlewares de esas rutas afecten a events
app.use('/api/v1/events', eventRoutes);

app.use(`/api/${API_VERSION}`, userCompetitionRoutes);
app.use(`/api/${API_VERSION}`, adminRoutes);
app.use('/api/v1/me/competitions', meCompetitionsRoutes);

// ============================================
// API ROUTES V2 (NEW)
// ============================================

app.use('/api/v2/events', eventRoutes);

// ✅ CORREGIDO: Competitions v2 - Ruta única sin duplicación
// El competitionRoutes actual es compatible con v2
app.use('/api/v2/competitions', competitionRoutes);

app.use('/api/v2/editions', editionRoutes);
//app.use('/api/v2/test', testRoutes);

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