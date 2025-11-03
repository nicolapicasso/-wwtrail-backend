// src/schemas/user-competition.schema.ts

import { z } from 'zod';
import { UserCompetitionStatus } from '@prisma/client';

/**
 * Schema para marcar una competición
 */
export const markCompetitionSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    status: z.nativeEnum(UserCompetitionStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    }),
  }),
});

/**
 * Schema para añadir resultado
 */
export const addResultSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    finishTime: z
      .string()
      .regex(/^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/, 'Invalid time format. Use HH:MM:SS')
      .optional(),
    position: z.number().int().positive().optional(),
    categoryPosition: z.number().int().positive().optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    personalRating: z.number().int().min(1).max(5).optional(),
    completedAt: z.string().datetime().optional(),
  }),
});

/**
 * Schema para actualizar competición del usuario
 */
export const updateUserCompetitionSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    status: z.nativeEnum(UserCompetitionStatus).optional(),
    finishTime: z
      .string()
      .regex(/^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/, 'Invalid time format')
      .optional(),
    position: z.number().int().positive().optional(),
    categoryPosition: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional(),
    personalRating: z.number().int().min(1).max(5).optional(),
    completedAt: z.string().datetime().optional(),
  }),
});

/**
 * Schema para obtener competiciones del usuario
 */
export const getMyCompetitionsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(UserCompetitionStatus).optional(),
  }),
});

/**
 * Schema para competitionId en params
 */
export const competitionIdParamSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
});

/**
 * Schema para ranking global
 */
export const globalRankingSchema = z.object({
  params: z.object({
    type: z.enum(['competitions', 'km', 'elevation'], {
      errorMap: () => ({ message: 'Invalid ranking type' }),
    }),
  }),
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});

/**
 * Schema para ver competiciones de otro usuario
 */
export const getUserCompetitionsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  query: z.object({
    status: z.nativeEnum(UserCompetitionStatus).optional(),
  }),
});

/**
 * Schema para ver stats de otro usuario
 */
export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

// Types exportados
export type MarkCompetitionInput = z.infer<typeof markCompetitionSchema>;
export type AddResultInput = z.infer<typeof addResultSchema>;
export type UpdateUserCompetitionInput = z.infer<typeof updateUserCompetitionSchema>;
export type GetMyCompetitionsQuery = z.infer<typeof getMyCompetitionsSchema>;
export type GlobalRankingParams = z.infer<typeof globalRankingSchema>;
export type GetUserCompetitionsParams = z.infer<typeof getUserCompetitionsSchema>;
