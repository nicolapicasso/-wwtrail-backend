import axios from 'axios';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

// Interfaz para los datos del clima
export interface EditionWeather {
  date: string;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  condition: string;
  conditionText: string;
  precipitation: number;
  wind: {
    speed: number;
    direction: number;
    directionText: string;
  };
  humidity: number;
  pressure: number;
  cloudCover: number;
  fetchedAt: string;
}

export class WeatherService {
  /**
   * Obtener datos meteorológicos históricos de Open-Meteo
   */
  static async getHistoricalWeather(params: {
    latitude: number;
    longitude: number;
    date: string; // YYYY-MM-DD
  }): Promise<EditionWeather> {
    try {
      const { latitude, longitude, date } = params;

      // API de Open-Meteo Archive (datos históricos desde 1940)
      const url = 'https://archive-api.open-meteo.com/v1/archive';

      const response = await axios.get(url, {
        params: {
          latitude,
          longitude,
          start_date: date,
          end_date: date,
          hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation',
            'surface_pressure',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
          ].join(','),
          timezone: 'auto',
        },
      });

      const data = response.data;

      if (!data.hourly) {
        throw new AppError('No weather data available for this date', 404);
      }

      // Procesar datos horarios y calcular promedios
      const hourly = data.hourly;
      const hours = hourly.time.length;

      // Calcular promedios
      const avgTemp = this.calculateAverage(hourly.temperature_2m);
      const minTemp = Math.min(...hourly.temperature_2m.filter((t: number) => t !== null));
      const maxTemp = Math.max(...hourly.temperature_2m.filter((t: number) => t !== null));
      const avgHumidity = this.calculateAverage(hourly.relative_humidity_2m);
      const totalPrecip = hourly.precipitation.reduce((sum: number, val: number) => sum + (val || 0), 0);
      const avgPressure = this.calculateAverage(hourly.surface_pressure);
      const avgCloudCover = this.calculateAverage(hourly.cloud_cover);
      const avgWindSpeed = this.calculateAverage(hourly.wind_speed_10m);
      const avgWindDirection = this.calculateAverage(hourly.wind_direction_10m);

      // Determinar condición predominante
      const condition = this.determineCondition({
        precipitation: totalPrecip,
        cloudCover: avgCloudCover,
      });

      const weather: EditionWeather = {
        date,
        temperature: {
          avg: Math.round(avgTemp * 10) / 10,
          min: Math.round(minTemp * 10) / 10,
          max: Math.round(maxTemp * 10) / 10,
        },
        condition: condition.code,
        conditionText: condition.text,
        precipitation: Math.round(totalPrecip * 10) / 10,
        wind: {
          speed: Math.round(avgWindSpeed * 10) / 10,
          direction: Math.round(avgWindDirection),
          directionText: this.getWindDirection(avgWindDirection),
        },
        humidity: Math.round(avgHumidity),
        pressure: Math.round(avgPressure),
        cloudCover: Math.round(avgCloudCover),
        fetchedAt: new Date().toISOString(),
      };

      return weather;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.response?.status === 404) {
        throw new AppError('Weather data not available for this location/date', 404);
      }

      throw new AppError(
        `Error fetching weather data: ${error.message}`,
        500
      );
    }
  }

  /**
   * Obtener clima de una edición (si existe)
   */
  static async getEditionWeather(editionId: string) {
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        year: true,
        slug: true,
        startDate: true,
        city: true,
        weather: true,
        weatherFetched: true,
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    return {
      edition: {
        id: edition.id,
        year: edition.year,
        slug: edition.slug,
        startDate: edition.startDate,
        city: edition.city || edition.competition.event.city,
        competition: edition.competition,
      },
      weather: edition.weather as EditionWeather | null,
      weatherFetched: edition.weatherFetched,
    };
  }

  /**
   * Fetch y guardar clima de una edición
   */
  static async fetchWeatherForEdition(editionId: string, force: boolean = false) {
    // Obtener edición con datos básicos
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        startDate: true,
        weatherFetched: true,
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!edition) {
      throw new AppError('Edition not found', 404);
    }

    // Verificar si ya se fetched y no es forzado
    if (edition.weatherFetched && !force) {
      throw new AppError('Weather data already fetched. Use force=true to refetch.', 400);
    }

    // Verificar que la fecha ya pasó
    const now = new Date();
    const editionDate = new Date(edition.startDate);

    if (editionDate > now) {
      throw new AppError('Cannot fetch weather for future editions', 400);
    }

    // Obtener coordenadas (primero de Edition, luego de Event)
    let latitude: number | null = null;
    let longitude: number | null = null;

    // Intentar obtener coordenadas de la edición
    try {
      const editionCoords = await prisma.$queryRawUnsafe<Array<{ lat: number; lon: number }>>(
        `SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
         FROM editions
         WHERE id::text = $1 AND location IS NOT NULL`,
        editionId
      );

      if (editionCoords.length > 0) {
        latitude = editionCoords[0].lat;
        longitude = editionCoords[0].lon;
      }
    } catch (error) {
      // Si falla, continuamos para intentar con Event
    }

    // Si no hay coordenadas en Edition, usar las del Event
    if (latitude === null || longitude === null) {
      try {
        const eventCoords = await prisma.$queryRawUnsafe<Array<{ lat: number; lon: number }>>(
          `SELECT ST_Y(e.location::geometry) as lat, ST_X(e.location::geometry) as lon
           FROM events e
           JOIN competitions c ON c."eventId" = e.id
           JOIN editions ed ON ed."competitionId" = c.id
           WHERE ed.id::text = $1 AND e.location IS NOT NULL`,
          editionId
        );

        if (eventCoords.length > 0) {
          latitude = eventCoords[0].lat;
          longitude = eventCoords[0].lon;
        }
      } catch (error) {
        // Sin coordenadas disponibles
      }
    }

    // Validar que tenemos coordenadas
    if (latitude === null || longitude === null) {
      throw new AppError('No location coordinates available for this edition', 400);
    }

    // Formatear fecha para la API
    const dateStr = editionDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Obtener datos del clima
    const weather = await this.getHistoricalWeather({
      latitude,
      longitude,
      date: dateStr,
    });

    // Guardar en la base de datos
    const updatedEdition = await prisma.edition.update({
      where: { id: editionId },
      data: {
        weather: weather as any,
        weatherFetched: true,
      },
      select: {
        id: true,
        year: true,
        slug: true,
        startDate: true,
        weather: true,
        weatherFetched: true,
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return {
      edition: updatedEdition,
      weather: updatedEdition.weather as EditionWeather,
    };
  }

  /**
   * Calcular promedio de un array (ignorando nulls)
   */
  private static calculateAverage(values: (number | null)[]): number {
    const validValues = values.filter((v) => v !== null) as number[];
    if (validValues.length === 0) return 0;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  /**
   * Determinar condición climática predominante
   */
  private static determineCondition(params: {
    precipitation: number;
    cloudCover: number;
  }): { code: string; text: string } {
    const { precipitation, cloudCover } = params;

    if (precipitation > 10) {
      return { code: 'rainy', text: 'Lluvioso' };
    } else if (precipitation > 0) {
      return { code: 'light_rain', text: 'Lluvia ligera' };
    } else if (cloudCover > 75) {
      return { code: 'cloudy', text: 'Nublado' };
    } else if (cloudCover > 30) {
      return { code: 'partly_cloudy', text: 'Parcialmente nublado' };
    } else {
      return { code: 'sunny', text: 'Soleado' };
    }
  }

  /**
   * Obtener texto de dirección del viento
   */
  private static getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }
}
