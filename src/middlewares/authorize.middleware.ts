// src/middlewares/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './error.middleware';

/**
 * Middleware de autorización por roles
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 * 
 * @param roles - Roles permitidos para acceder al endpoint
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar que el usuario esté autenticado (debe pasar por authenticate primero)
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Verificar que el usuario tenga uno de los roles permitidos
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario es ADMIN
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * Middleware para verificar que el usuario es ORGANIZER o ADMIN
 */
export const requireOrganizer = authorize(UserRole.ORGANIZER, UserRole.ADMIN);

/**
 * Middleware para verificar que el usuario puede gestionar una competición específica
 * (es el creador O es ADMIN)
 */
export const canManageCompetition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: competitionId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Los ADMIN pueden gestionar cualquier competición
    if (userRole === UserRole.ADMIN) {
      return next();
    }

    // Verificar que el usuario es el organizador de esta competición
    const prisma = (await import('../config/database')).default;
    
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { organizerId: true },
    });

    if (!competition) {
      return next(new AppError('Competition not found', 404));
    }

    if (competition.organizerId !== userId) {
      return next(
        new AppError('You can only manage your own competitions', 403)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
