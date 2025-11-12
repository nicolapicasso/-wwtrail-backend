import { Request, Response, NextFunction } from 'express';
import { WeatherService } from '../services/weather.service';

export class WeatherController {
  /**
   * GET /api/v2/editions/:editionId/weather
   * Obtener datos climáticos de una edición
   */
  static async getEditionWeather(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { editionId } = req.params;

      const result = await WeatherService.getEditionWeather(editionId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/editions/:editionId/weather/fetch
   * Fetch datos climáticos para una edición
   */
  static async fetchWeather(req: Request, res: Response, next: NextFunction) {
    try {
      const { editionId } = req.params;
      const force = req.query.force === 'true';

      const result = await WeatherService.fetchWeatherForEdition(
        editionId,
        force
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
