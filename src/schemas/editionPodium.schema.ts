import { z } from 'zod';

// Regex para validar formato de tiempo HH:MM:SS
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;

// Schema para crear un podio
export const createPodiumSchema = z.object({
  body: z
    .object({
      type: z.enum(['GENERAL', 'MALE', 'FEMALE', 'CATEGORY']),
      categoryName: z.string().min(2).max(100).optional(),
      firstPlace: z.string().min(2).max(200),
      firstTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      secondPlace: z.string().min(2).max(200).optional(),
      secondTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      thirdPlace: z.string().min(2).max(200).optional(),
      thirdTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      sortOrder: z.number().int().default(0),
    })
    .refine(
      (data) => data.type !== 'CATEGORY' || !!data.categoryName,
      {
        message: 'Category name is required when type is CATEGORY',
        path: ['categoryName'],
      }
    ),
});

// Schema para actualizar un podio (todos los campos opcionales)
export const updatePodiumSchema = z.object({
  body: z
    .object({
      type: z.enum(['GENERAL', 'MALE', 'FEMALE', 'CATEGORY']).optional(),
      categoryName: z.string().min(2).max(100).optional(),
      firstPlace: z.string().min(2).max(200).optional(),
      firstTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      secondPlace: z.string().min(2).max(200).optional(),
      secondTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      thirdPlace: z.string().min(2).max(200).optional(),
      thirdTime: z.string().regex(timeRegex, {
        message: 'Time must be in format HH:MM:SS',
      }).optional(),
      sortOrder: z.number().int().optional(),
    })
    .refine(
      (data) => {
        // Si se especifica type CATEGORY, debe haber categoryName
        if (data.type === 'CATEGORY' && !data.categoryName) {
          return false;
        }
        return true;
      },
      {
        message: 'Category name is required when type is CATEGORY',
        path: ['categoryName'],
      }
    ),
});

// Schema para el endpoint de crónica
export const updateChronicleSchema = z.object({
  body: z.object({
    chronicle: z.string().min(10).max(50000),
  }),
});

// Tipos inferidos de TypeScript
export type CreatePodiumInput = z.infer<typeof createPodiumSchema>['body'];
export type UpdatePodiumInput = z.infer<typeof updatePodiumSchema>['body'];
export type UpdateChronicleInput = z.infer<typeof updateChronicleSchema>['body'];
