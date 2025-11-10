// src/config/multer.ts
// Configuración de Multer para upload de archivos

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Subdirectorios por tipo
const createSubdir = (subdir: string) => {
  const dir = path.join(uploadDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// ============================================
// STORAGE CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Organizar por tipo de archivo
    let subdir = 'others';
    
    // ✅ FIX: Soportar variaciones de nombres
    if (file.fieldname === 'logo' || file.fieldname === 'logoUrl') {
      subdir = 'logos';
    } else if (file.fieldname === 'cover' || file.fieldname === 'coverImage' || file.fieldname === 'coverImageUrl') {
      subdir = 'covers';
    } else if (file.fieldname === 'gallery') {
      subdir = 'gallery';
    } else if (file.fieldname === 'avatar') {
      subdir = 'avatars';
    }
    
    const destination = createSubdir(subdir);
    cb(null, destination);
  },
  
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generar nombre único: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50); // Limitar longitud
    
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// ============================================
// FILE FILTER (Solo imágenes)
// ============================================

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes (JPG, PNG, GIF, WebP, SVG).`));
  }
};

// ============================================
// MULTER INSTANCES
// ============================================

// Para un solo archivo
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Para múltiples archivos (galería)
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 10, // Máximo 10 archivos a la vez
  },
});

// ============================================
// FIELD CONFIGURATIONS
// ============================================

// Para formularios con múltiples campos de imagen
export const uploadFields = uploadMultiple.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoUrl', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'avatar', maxCount: 1 },
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Genera la URL pública del archivo
 */
export const getFileUrl = (filename: string, subdir: string = ''): string => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  const path = subdir ? `${subdir}/${filename}` : filename;
  return `${baseUrl}/uploads/${path}`;
};

/**
 * Elimina un archivo del filesystem
 */
export const deleteFile = (filepath: string): void => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Elimina archivos antiguos de un modelo
 */
export const deleteOldFiles = (oldUrls: string | string[]): void => {
  const urls = Array.isArray(oldUrls) ? oldUrls : [oldUrls];
  
  urls.forEach(url => {
    if (!url) return;
    
    // Extraer filepath de la URL
    // Ejemplo: http://localhost:3001/uploads/logos/image.jpg → /uploads/logos/image.jpg
    const urlPath = new URL(url).pathname;
    const filepath = path.join(__dirname, '../..', urlPath);
    
    deleteFile(filepath);
  });
};

// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'Archivo demasiado grande. Máximo 5MB.',
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Demasiados archivos. Máximo 10 archivos.',
      });
    }
    
    return res.status(400).json({
      status: 'error',
      message: `Error de upload: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Error al subir archivo',
    });
  }
  
  next();
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  getFileUrl,
  deleteFile,
  deleteOldFiles,
  handleMulterError,
};