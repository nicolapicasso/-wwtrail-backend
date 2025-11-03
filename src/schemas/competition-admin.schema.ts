// src/schemas/competition-admin.schema.ts

import { z } from 'zod';
import { CompetitionStatus } from '@prisma/client';

/**
 * Schema para aprobar competición
 */
export const approveCompetitionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    adminNotes: z.string().max(500).optional(),
  }),
});

/**
 * Schema para rechazar competición
 */
export const rejectCompetitionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  }),
});

/**
 * Schema para cambiar status
 */
export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    status: z.nativeEnum(CompetitionStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    }),
  }),
});

/**
 * Schema para obtener competiciones pendientes
 */
export const getPendingCompetitionsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
  }),
});

/**
 * Schema para obtener competiciones del organizador
 */
export const getOrganizerCompetitionsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
  }),
});

// Types exportados
export type ApproveCompetitionInput = z.infer<typeof approveCompetitionSchema>;
export type RejectCompetitionInput = z.infer<typeof rejectCompetitionSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type GetPendingCompetitionsQuery = z.infer<typeof getPendingCompetitionsSchema>;
export type GetOrganizerCompetitionsQuery = z.infer<typeof getOrganizerCompetitionsSchema>;
