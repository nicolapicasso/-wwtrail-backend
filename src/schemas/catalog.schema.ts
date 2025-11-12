import { z } from 'zod';

// Schema genérico para crear un catálogo (CompetitionType, TerrainType)
export const createCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    sortOrder: z.number().int().default(0),
  }),
});

// Schema para actualizar un catálogo
export const updateCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Schema específico para SpecialSeries (incluye logoUrl y websiteUrl)
export const createSpecialSeriesSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    logoUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional(),
    description: z.string().max(500).optional(),
    sortOrder: z.number().int().default(0),
  }),
});

// Schema para actualizar SpecialSeries
export const updateSpecialSeriesSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    logoUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional(),
    description: z.string().max(500).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Schema para query params de filtrado
export const getCatalogQuerySchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  }),
});

// Tipos inferidos de TypeScript
export type CreateCatalogInput = z.infer<typeof createCatalogSchema>['body'];
export type UpdateCatalogInput = z.infer<typeof updateCatalogSchema>['body'];
export type CreateSpecialSeriesInput = z.infer<typeof createSpecialSeriesSchema>['body'];
export type UpdateSpecialSeriesInput = z.infer<typeof updateSpecialSeriesSchema>['body'];
export type GetCatalogQuery = z.infer<typeof getCatalogQuerySchema>['query'];
