import { z } from 'zod';
import { EditionStatus, RegistrationStatus } from '@prisma/client';

/**
 * SCHEMAS DE VALIDACIÓN PARA EDICIONES
 */

// ============================================
// CREATE EDITION
// ============================================

export const createEditionSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    year: z.number().int().min(1900).max(2100),

    // Fechas
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    registrationOpenDate: z.string().datetime().optional(),
    registrationCloseDate: z.string().datetime().optional(),
    registrationUrl: z.string().url('Invalid registration URL').optional().or(z.literal('')),

    // Datos específicos (si no se proveen, se heredan de Competition)
    distance: z.number().positive().optional(),
    elevation: z.number().int().optional(),
    maxParticipants: z.number().int().positive().optional(),
    currentParticipants: z.number().int().min(0).optional(),

    // Precios (estructura JSON)
    prices: z.object({
      early: z.number().positive().optional(),
      normal: z.number().positive().optional(),
      late: z.number().positive().optional(),
    }).optional(),

    // Ubicación
    city: z.string().optional(),

    // Imágenes
    coverImage: z.string().url('Invalid cover image URL').optional().or(z.literal('')),
    gallery: z.array(z.string().url('Invalid gallery image URL')).optional(),

    // Estado
    status: z.nativeEnum(EditionStatus).optional(),
    registrationStatus: z.nativeEnum(RegistrationStatus).optional(),
    featured: z.boolean().optional(),

    // Textos largos
    regulations: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateEditionInput = z.infer<typeof createEditionSchema>['body'];

// ============================================
// UPDATE EDITION
// ============================================

export const updateEditionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid edition ID'),
  }),
  body: z.object({
    year: z.number().int().min(1900).max(2100).optional(),

    // Fechas
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    registrationOpenDate: z.string().datetime().optional(),
    registrationCloseDate: z.string().datetime().optional(),
    registrationUrl: z.string().url('Invalid registration URL').optional().or(z.literal('')),

    // Datos específicos
    distance: z.number().positive().optional(),
    elevation: z.number().int().optional(),
    maxParticipants: z.number().int().positive().optional(),
    currentParticipants: z.number().int().min(0).optional(),

    // Precios (estructura JSON)
    prices: z.object({
      early: z.number().positive().optional(),
      normal: z.number().positive().optional(),
      late: z.number().positive().optional(),
    }).optional(),

    // Ubicación
    city: z.string().optional(),

    // Imágenes
    coverImage: z.string().url('Invalid cover image URL').optional().or(z.literal('')),
    gallery: z.array(z.string().url('Invalid gallery image URL')).optional(),

    // Estado
    status: z.nativeEnum(EditionStatus).optional(),
    registrationStatus: z.nativeEnum(RegistrationStatus).optional(),
    featured: z.boolean().optional(),

    // Textos largos
    regulations: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type UpdateEditionInput = z.infer<typeof updateEditionSchema>['body'];

// ============================================
// CREATE BULK EDITIONS
// ============================================

export const createBulkEditionsSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  body: z.object({
    years: z.array(
      z.number().int().min(1900).max(2100)
    ).min(1, 'Years array must contain at least one year'),
  }),
});

export type CreateBulkEditionsInput = z.infer<typeof createBulkEditionsSchema>['body'];

// ============================================
// GET EDITION BY ID
// ============================================

export const editionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid edition ID'),
  }),
});

// ============================================
// GET EDITION BY SLUG
// ============================================

export const editionSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});

// ============================================
// GET EDITIONS BY COMPETITION
// ============================================

export const competitionIdSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
  }),
  query: z.object({
    includeInactive: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

// ============================================
// GET EDITION BY YEAR
// ============================================

export const editionByYearSchema = z.object({
  params: z.object({
    competitionId: z.string().uuid('Invalid competition ID'),
    year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number'),
  }),
});

export type EditionByYearParams = z.infer<typeof editionByYearSchema>['params'];
