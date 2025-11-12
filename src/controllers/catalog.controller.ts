import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service';

export class CatalogController {
  // =====================================
  // ENDPOINTS PÚBLICOS
  // =====================================

  /**
   * GET /api/v2/competition-types
   */
  static async getCompetitionTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { isActive } = req.query;
      const activeOnly = isActive === 'true';

      const items = await CatalogService.getAll('competitionType', activeOnly);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/terrain-types
   */
  static async getTerrainTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { isActive } = req.query;
      const activeOnly = isActive === 'true';

      const items = await CatalogService.getAll('terrainType', activeOnly);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/special-series
   */
  static async getSpecialSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { isActive } = req.query;
      const activeOnly = isActive === 'true';

      const items = await CatalogService.getAll('specialSeries', activeOnly);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================
  // ENDPOINTS ADMIN - COMPETITION TYPES
  // =====================================

  /**
   * GET /api/v2/admin/competition-types
   */
  static async adminGetAllCompetitionTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const items = await CatalogService.getAll('competitionType', false);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/admin/competition-types/:id
   */
  static async adminGetCompetitionTypeById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const item = await CatalogService.getById('competitionType', id);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/admin/competition-types
   */
  static async adminCreateCompetitionType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = req.body;

      const item = await CatalogService.create('competitionType', data);

      res.status(201).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/admin/competition-types/:id
   */
  static async adminUpdateCompetitionType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = req.body;

      const item = await CatalogService.update('competitionType', id, data);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/admin/competition-types/:id
   */
  static async adminDeleteCompetitionType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const result = await CatalogService.delete('competitionType', id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================
  // ENDPOINTS ADMIN - TERRAIN TYPES
  // =====================================

  /**
   * GET /api/v2/admin/terrain-types
   */
  static async adminGetAllTerrainTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const items = await CatalogService.getAll('terrainType', false);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/admin/terrain-types/:id
   */
  static async adminGetTerrainTypeById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const item = await CatalogService.getById('terrainType', id);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/admin/terrain-types
   */
  static async adminCreateTerrainType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = req.body;

      const item = await CatalogService.create('terrainType', data);

      res.status(201).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/admin/terrain-types/:id
   */
  static async adminUpdateTerrainType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = req.body;

      const item = await CatalogService.update('terrainType', id, data);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/admin/terrain-types/:id
   */
  static async adminDeleteTerrainType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const result = await CatalogService.delete('terrainType', id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================
  // ENDPOINTS ADMIN - SPECIAL SERIES
  // =====================================

  /**
   * GET /api/v2/admin/special-series
   */
  static async adminGetAllSpecialSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const items = await CatalogService.getAll('specialSeries', false);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/admin/special-series/:id
   */
  static async adminGetSpecialSeriesById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const item = await CatalogService.getById('specialSeries', id);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/admin/special-series
   */
  static async adminCreateSpecialSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = req.body;

      const item = await CatalogService.createSpecialSeries(data);

      res.status(201).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v2/admin/special-series/:id
   */
  static async adminUpdateSpecialSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = req.body;

      const item = await CatalogService.updateSpecialSeries(id, data);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v2/admin/special-series/:id
   */
  static async adminDeleteSpecialSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      const result = await CatalogService.delete('specialSeries', id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
