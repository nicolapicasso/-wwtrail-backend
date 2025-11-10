// src/controllers/file.controller.ts
// Controller para gestión de archivos

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getFileUrl, deleteFile } from '../config/multer';
import logger from '../utils/logger';
import path from 'path';

const prisma = new PrismaClient();

export class FileController {
  
  /**
   * Upload single file
   * POST /api/v1/files/upload
   */
  static async uploadSingle(req: Request, res: Response) {
    try {
const files = req.files as Express.Multer.File[];
const file = files?.[0];

if (!file) {
  return res.status(400).json({
    status: 'error',
    message: 'No se proporcionó ningún archivo',
  });
}

const userId = req.user!.id;

      // Determinar subdirectorio por fieldname
      let subdir = 'others';
      if (file.fieldname.includes('logo')) subdir = 'logos';
      else if (file.fieldname.includes('cover')) subdir = 'covers';
      else if (file.fieldname.includes('gallery')) subdir = 'gallery';
      else if (file.fieldname.includes('avatar')) subdir = 'avatars';

      // Generar URL pública
      const fileUrl = getFileUrl(file.filename, subdir);

      // Guardar en BD
      const fileRecord = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          url: fileUrl,
          uploaderId: userId,
        },
      });

      logger.info(`File uploaded: ${fileRecord.id} by user ${userId}`);

      return res.status(201).json({
        status: 'success',
        message: 'Archivo subido correctamente',
        data: {
          id: fileRecord.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al subir el archivo',
      });
    }
  }

  /**
   * Upload multiple files
   * POST /api/v1/files/upload-multiple
   */
  static async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return res.status(400).json({
          status: 'error',
          message: 'No se proporcionaron archivos',
        });
      }

      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      // Procesar cada archivo
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          // Determinar subdirectorio
          let subdir = 'gallery';
          if (file.fieldname.includes('logo')) subdir = 'logos';
          else if (file.fieldname.includes('cover')) subdir = 'covers';

          const fileUrl = getFileUrl(file.filename, subdir);

          // Guardar en BD
          const fileRecord = await prisma.file.create({
            data: {
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              url: fileUrl,
              uploaderId: userId,
            },
          });

          return {
            id: fileRecord.id,
            url: fileUrl,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
          };
        })
      );

      logger.info(`${uploadedFiles.length} files uploaded by user ${userId}`);

      return res.status(201).json({
        status: 'success',
        message: `${uploadedFiles.length} archivos subidos correctamente`,
        data: uploadedFiles,
      });
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al subir los archivos',
      });
    }
  }

  /**
   * Delete file
   * DELETE /api/v1/files/:id
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Buscar archivo
      const file = await prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        return res.status(404).json({
          status: 'error',
          message: 'Archivo no encontrado',
        });
      }

      // Verificar permisos (solo el uploader o admin)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN' && file.uploaderId !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para eliminar este archivo',
        });
      }

      // Eliminar archivo físico
      deleteFile(file.path);

      // Eliminar registro de BD
      await prisma.file.delete({ where: { id } });

      logger.info(`File deleted: ${id} by user ${userId}`);

      return res.json({
        status: 'success',
        message: 'Archivo eliminado correctamente',
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar el archivo',
      });
    }
  }

  /**
   * Get user files
   * GET /api/v1/files/my-files
   */
  static async getUserFiles(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where: { uploaderId: userId },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.file.count({ where: { uploaderId: userId } }),
      ]);

      return res.json({
        status: 'success',
        data: files,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Error fetching user files:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener archivos',
      });
    }
  }

  /**
   * Get file info
   * GET /api/v1/files/:id
   */
  static async getFileInfo(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const file = await prisma.file.findUnique({
        where: { id },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!file) {
        return res.status(404).json({
          status: 'error',
          message: 'Archivo no encontrado',
        });
      }

      return res.json({
        status: 'success',
        data: file,
      });
    } catch (error) {
      logger.error('Error fetching file info:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener información del archivo',
      });
    }
  }
}

export default FileController;
