import { z } from 'zod';

// Validación para cada criterio de rating (1-4 estrellas)
const ratingSchema = z.number().int().min(1).max(4);

// Schema para crear un rating
export const createEditionRatingSchema = z.object({
  body: z.object({
    ratingInfoBriefing: ratingSchema,
    ratingRacePack: ratingSchema,
    ratingVillage: ratingSchema,
    ratingMarking: ratingSchema,
    ratingAid: ratingSchema,
    ratingFinisher: ratingSchema,
    ratingEco: ratingSchema,
    comment: z.string().max(2000).optional(),
  }),
});

// Schema para actualizar un rating (todos los campos opcionales)
export const updateEditionRatingSchema = z.object({
  body: z.object({
    ratingInfoBriefing: ratingSchema.optional(),
    ratingRacePack: ratingSchema.optional(),
    ratingVillage: ratingSchema.optional(),
    ratingMarking: ratingSchema.optional(),
    ratingAid: ratingSchema.optional(),
    ratingFinisher: ratingSchema.optional(),
    ratingEco: ratingSchema.optional(),
    comment: z.string().max(2000).optional(),
  }),
});

// Schema para query params de paginación
export const getRatingsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

// Schema para obtener ratings recientes
export const getRecentRatingsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

// Tipos inferidos de TypeScript
export type CreateEditionRatingInput = z.infer<typeof createEditionRatingSchema>['body'];
export type UpdateEditionRatingInput = z.infer<typeof updateEditionRatingSchema>['body'];
export type GetRatingsQuery = z.infer<typeof getRatingsQuerySchema>['query'];
export type GetRecentRatingsQuery = z.infer<typeof getRecentRatingsSchema>['query'];
