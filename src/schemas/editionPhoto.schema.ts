import { z } from 'zod';

// Schema para subir foto (multipart/form-data)
// El archivo viene en req.file (Multer)
export const uploadPhotoSchema = z.object({
  body: z.object({
    caption: z.string().max(500).optional(),
    photographer: z.string().max(200).optional(),
    sortOrder: z.string().regex(/^\d+$/).transform(Number).default('0'),
    isFeatured: z.enum(['true', 'false']).transform((val) => val === 'true').default('false'),
  }),
});

// Schema para actualizar metadata de una foto
export const updatePhotoMetadataSchema = z.object({
  body: z.object({
    caption: z.string().max(500).optional(),
    photographer: z.string().max(200).optional(),
    sortOrder: z.number().int().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

// Schema para reordenar fotos
export const reorderPhotosSchema = z.object({
  body: z.object({
    photoOrders: z.array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int(),
      })
    ),
  }),
});

// Tipos inferidos de TypeScript
export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>['body'];
export type UpdatePhotoMetadataInput = z.infer<typeof updatePhotoMetadataSchema>['body'];
export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>['body'];
