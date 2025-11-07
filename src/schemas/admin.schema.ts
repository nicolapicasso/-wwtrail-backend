// src/schemas/admin.schema.ts

import { z } from 'zod';
import { UserRole } from '@prisma/client';

// ============================================
// SCHEMAS PARA ESTADÍSTICAS
// ============================================

/**
 * Schema para obtener estadísticas del dashboard admin
 * No requiere parámetros (GET /api/v1/admin/stats)
 */
export const getStatsSchema = z.object({
  query: z.object({}).optional(),
});

// ============================================
// SCHEMAS PARA GESTIÓN DE USUARIOS
// ============================================

/**
 * Schema para listar usuarios con filtros y paginación
 * GET /api/v1/admin/users
 */
export const getUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    search: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    sortBy: z
      .enum(['createdAt', 'name', 'email', 'role'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * Schema para obtener un usuario por ID
 * GET /api/v1/admin/users/:id
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

/**
 * Schema para cambiar el rol de un usuario
 * PATCH /api/v1/admin/users/:id/role
 */
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z.object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({
        message: 'Role must be one of: ADMIN, ORGANIZER, ATHLETE, VIEWER',
      }),
    }),
  }),
});

/**
 * Schema para activar/desactivar un usuario
 * PATCH /api/v1/admin/users/:id/toggle-status
 */
export const toggleUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

/**
 * Schema para eliminar un usuario
 * DELETE /api/v1/admin/users/:id
 */
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
  body: z
    .object({
      confirm: z.boolean().refine((val) => val === true, {
        message: 'You must confirm the deletion',
      }),
    })
    .optional(),
});

/**
 * Schema para obtener estadísticas de un usuario específico
 * GET /api/v1/admin/users/:id/stats
 */
export const getUserStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid user ID format' }),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type GetUserStatsInput = z.infer<typeof getUserStatsSchema>;
