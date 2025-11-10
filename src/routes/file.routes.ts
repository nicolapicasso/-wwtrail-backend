// src/routes/file.routes.ts
// Rutas para gestión de archivos

import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadSingle, uploadMultiple, handleMulterError } from '../config/multer';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (Servir archivos estáticos)
// ============================================
// Estas se configuran en index.ts:
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================

/**
 * Upload single file
 * POST /api/v1/files/upload
 * Body: FormData con campo 'file'
 * Headers: Authorization: Bearer <token>
 */
router.post(
  '/upload',
  authenticate,
  uploadSingle.any(),  // ← Acepta cualquier fieldname
  handleMulterError,
  FileController.uploadSingle
);

/**
 * Upload multiple files (gallery)
 * POST /api/v1/files/upload-multiple
 * Body: FormData con campo 'files[]' (múltiple)
 * Headers: Authorization: Bearer <token>
 */
router.post(
  '/upload-multiple',
  authenticate,
  uploadMultiple.any(), // Máximo 10 archivos
  handleMulterError,
  FileController.uploadMultiple
);

/**
 * Get user's uploaded files
 * GET /api/v1/files/my-files?page=1&limit=20
 */
router.get(
  '/my-files',
  authenticate,
  FileController.getUserFiles
);

/**
 * Get file info by ID
 * GET /api/v1/files/:id
 */
router.get(
  '/:id',
  authenticate,
  FileController.getFileInfo
);

/**
 * Delete file by ID
 * DELETE /api/v1/files/:id
 */
router.delete(
  '/:id',
  authenticate,
  FileController.deleteFile
);

export default router;
