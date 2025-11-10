// src/schemas/competition-admin.schema.ts

import { z } from 'zod';
import { CompetitionStatus } from '@prisma/client';

// ============================================
// SCHEMAS PARA ADMIN - APROBACIÓN DE COMPETICIONES
// ============================================

/**
 * Schema para aprobar una competición
 * NUEVO: Ahora acepta adminNotes opcional en el body
 */
export const approveCompetitionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid competition ID format' }),
  }),
  body: z.object({
    adminNotes: z
      .string()
      .max(500, { message: 'Admin notes must not exceed 500 characters' })
      .optional(),
  }).optional(),
});

export type ApproveCompetitionParams = z.infer<typeof approveCompetitionSchema>['params'];
export type ApproveCompetitionInput = z.infer<typeof approveCompetitionSchema>['body'];

/**
 * Schema para rechazar una competición
 */
export const rejectCompetitionSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid competition ID format' }),
  }),
  body: z.object({
    reason: z
      .string()
      .min(10, { message: 'Reason must be at least 10 characters' })
      .max(500, { message: 'Reason must not exceed 500 characters' })
      .optional(),
  }),
});

export type RejectCompetitionParams = z.infer<typeof rejectCompetitionSchema>['params'];
export type RejectCompetitionInput = z.infer<typeof rejectCompetitionSchema>['body'];

/**
 * Schema para cambiar el status de una competición
 * MEJORADO: Usa nativeEnum de Prisma para mayor seguridad de tipos
 */
export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid competition ID format' }),
  }),
  body: z.object({
    status: z.nativeEnum(CompetitionStatus, {
      errorMap: () => ({ message: 'Invalid competition status' }),
    }),
  }),
});

export type UpdateStatusParams = z.infer<typeof updateStatusSchema>['params'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];

/**
 * Schema para obtener competiciones pendientes de aprobación
 */
export const getPendingCompetitionsSchema = z.object({
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
      .default('20')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    sortBy: z
      .enum(['createdAt', 'name', 'startDate'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  }),
});

export type GetPendingCompetitionsQuery = z.infer<typeof getPendingCompetitionsSchema>['query'];

/**
 * Schema para obtener competiciones del organizador
 */
export const getOrganizerCompetitionsSchema = z.object({
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
      .default('20')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    status: z.nativeEnum(CompetitionStatus).optional(),
    sortBy: z
      .enum(['createdAt', 'name', 'startDate'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  }),
});

export type GetOrganizerCompetitionsQuery = z.infer<typeof getOrganizerCompetitionsSchema>['query'];

/**
 * Schema para obtener estadísticas de competiciones admin
 */
export const getStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type GetStatsQuery = z.infer<typeof getStatsSchema>['query'];
