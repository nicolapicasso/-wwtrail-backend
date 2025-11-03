import { Request, Response, NextFunction } from 'express';
import { CompetitionService } from '../services/competition.service';
import { CreateCompetitionInput, UpdateCompetitionInput } from '../schemas/competition.schema';

export class CompetitionController {
  // CRUD Básico
  
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateCompetitionInput = req.body;
      const organizerId = req.user!.id;

      const competition = await CompetitionService.create(data, organizerId);

      res.status(201).json({
        status: 'success',
        message: 'Competition created successfully',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompetitionService.findAll(req.query);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const competition = await CompetitionService.findById(id);

      res.status(200).json({
        status: 'success',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const competition = await CompetitionService.findBySlug(slug);

      res.status(200).json({
        status: 'success',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateCompetitionInput = req.body;
      const userId = req.user!.id;

      const competition = await CompetitionService.update(id, data, userId);

      res.status(200).json({
        status: 'success',
        message: 'Competition updated successfully',
        data: competition,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await CompetitionService.delete(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Competition deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Búsquedas Avanzadas

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Search query (q) is required',
        });
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      const results = await CompetitionService.search(q, limitNum);

      res.status(200).json({
        status: 'success',
        data: results,
        count: (results as any[]).length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lon, radius } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          status: 'error',
          message: 'Latitude (lat) and longitude (lon) are required',
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      const radiusKm = radius ? parseFloat(radius as string) : 50;

      // Validar rangos
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          status: 'error',
          message: 'Latitude must be between -90 and 90',
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          status: 'error',
          message: 'Longitude must be between -180 and 180',
        });
      }

      const competitions = await CompetitionService.findNearby(
        latitude,
        longitude,
        radiusKm
      );

      res.status(200).json({
        status: 'success',
        data: competitions,
        count: (competitions as any[]).length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 10;

      const competitions = await CompetitionService.getFeatured(limitNum);

      res.status(200).json({
        status: 'success',
        data: competitions,
        count: competitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const competitions = await CompetitionService.getUpcoming(limitNum);

      res.status(200).json({
        status: 'success',
        data: competitions,
        count: competitions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const { country } = req.params;
      const { page, limit } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await CompetitionService.getByCountry(country, {
        page: pageNum,
        limit: limitNum,
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await CompetitionService.getStats(id);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
