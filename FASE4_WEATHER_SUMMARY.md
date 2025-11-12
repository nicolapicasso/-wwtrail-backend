# ✅ FASE 4 COMPLETADA: Sistema de Meteo Automático

## 📊 Resumen General

Se ha implementado el sistema de obtención automática de datos meteorológicos históricos mediante la integración con Open-Meteo API. Permite consultar y almacenar datos climáticos de ediciones pasadas.

---

## 🗄️ Base de Datos

### Campos Agregados a Edition

**Edition:**
```prisma
weather        Json?    // Datos climáticos en formato JSON
weatherFetched Boolean  @default(false)  // Flag de si ya se obtuvieron los datos
```

**Estructura del JSON weather:**
```typescript
interface EditionWeather {
  date: string;  // Fecha en formato YYYY-MM-DD
  temperature: {
    avg: number;  // Temperatura promedio (°C)
    min: number;  // Temperatura mínima (°C)
    max: number;  // Temperatura máxima (°C)
  };
  condition: string;  // Código: sunny, cloudy, rainy, etc.
  conditionText: string;  // Texto: "Soleado", "Nublado", etc.
  precipitation: number;  // Precipitación total (mm)
  wind: {
    speed: number;  // Velocidad del viento (km/h)
    direction: number;  // Dirección en grados (0-360)
    directionText: string;  // Texto: N, NE, E, SE, S, SW, W, NW
  };
  humidity: number;  // Humedad relativa (%)
  pressure: number;  // Presión atmosférica (hPa)
  cloudCover: number;  // Cobertura nubosa (%)
  fetchedAt: string;  // Timestamp de cuándo se obtuvo
}
```

---

## 🌐 Integración con Open-Meteo API

### API Utilizada

**Open-Meteo Archive API:**
- URL: `https://archive-api.open-meteo.com/v1/archive`
- ✅ **Sin API key** (completamente gratuito)
- ✅ Datos históricos desde **1940**
- ✅ Cobertura mundial
- ✅ Datos horarios
- ✅ Sin límite de requests

### Datos Obtenidos

- Temperatura por hora (2m sobre el suelo)
- Humedad relativa
- Precipitación
- Presión atmosférica
- Cobertura nubosa
- Velocidad del viento
- Dirección del viento

**Procesamiento:**
- Promedia datos horarios del día
- Calcula min/max de temperatura
- Suma precipitación total
- Determina condición climática predominante

---

## 🎯 Endpoints Implementados (2 endpoints)

### ☁️ WEATHER

#### 1. Obtener Clima de una Edición
```
GET /api/v2/editions/:editionId/weather
Auth: No requerido (público)
```

**Response (si ya fue fetched):**
```json
{
  "status": "success",
  "data": {
    "edition": {
      "id": "uuid",
      "year": 2023,
      "slug": "utmb-171k-2023",
      "startDate": "2023-08-25T10:00:00Z",
      "competition": {
        "id": "uuid",
        "name": "UTMB 171K",
        "slug": "utmb-171k",
        "event": {
          "id": "uuid",
          "name": "UTMB Mont Blanc",
          "slug": "utmb-mont-blanc"
        }
      }
    },
    "weather": {
      "date": "2023-08-25",
      "temperature": {
        "avg": 15.3,
        "min": 8.2,
        "max": 22.7
      },
      "condition": "partly_cloudy",
      "conditionText": "Parcialmente nublado",
      "precipitation": 2.5,
      "wind": {
        "speed": 12.4,
        "direction": 225,
        "directionText": "SW"
      },
      "humidity": 65,
      "pressure": 1013,
      "cloudCover": 45,
      "fetchedAt": "2024-01-15T10:30:00Z"
    },
    "weatherFetched": true
  }
}
```

**Response (si NO fue fetched):**
```json
{
  "status": "success",
  "data": {
    "edition": {
      "id": "uuid",
      "year": 2024,
      "slug": "utmb-171k-2024",
      "startDate": "2024-08-30T10:00:00Z",
      "competition": { ... }
    },
    "weather": null,
    "weatherFetched": false
  }
}
```

#### 2. Fetch/Refetch Clima
```
POST /api/v2/editions/:editionId/weather/fetch?force=true
Auth: Requerido (ADMIN)
```

**Query Parameters:**
- `force=true` (opcional): Permite refetch aunque ya existan datos

**Response:**
```json
{
  "status": "success",
  "data": {
    "edition": {
      "id": "uuid",
      "year": 2023,
      "slug": "utmb-171k-2023",
      "startDate": "2023-08-25T10:00:00Z",
      "weather": { ... },
      "weatherFetched": true,
      "competition": { ... }
    },
    "weather": {
      "date": "2023-08-25",
      "temperature": {
        "avg": 15.3,
        "min": 8.2,
        "max": 22.7
      },
      "condition": "partly_cloudy",
      "conditionText": "Parcialmente nublado",
      "precipitation": 2.5,
      "wind": {
        "speed": 12.4,
        "direction": 225,
        "directionText": "SW"
      },
      "humidity": 65,
      "pressure": 1013,
      "cloudCover": 45,
      "fetchedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

**Validaciones:**
- ✅ La edición debe existir
- ✅ La fecha de la edición debe haber pasado
- ✅ La edición o el evento deben tener coordenadas GPS
- ✅ Si ya existe clima y `force=false`, retorna error
- ✅ Solo ADMIN puede hacer fetch

**Errores posibles:**
```json
// Edición futura
{
  "status": "error",
  "message": "Cannot fetch weather for future editions"
}

// Ya fetched sin force
{
  "status": "error",
  "message": "Weather data already fetched. Use force=true to refetch."
}

// Sin ubicación
{
  "status": "error",
  "message": "No location data available for this edition"
}

// Datos no disponibles en Open-Meteo
{
  "status": "error",
  "message": "Weather data not available for this location/date"
}
```

---

## 📝 Tipos TypeScript Exportados

```typescript
import type { EditionWeather } from '../services/weather.service';

interface EditionWeather {
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
```

---

## 📂 Archivos Creados/Modificados

### Nuevos Archivos

**Service:**
- `src/services/weather.service.ts`

**Controller:**
- `src/controllers/weather.controller.ts`

**Routes:**
- `src/routes/weather.routes.ts`

### Archivos Modificados

- `prisma/schema.prisma` - Agregados campos weather y weatherFetched
- `src/routes/edition.routes.ts` - Integradas rutas anidadas de weather

---

## 🌤️ Lógica de Condiciones Climáticas

### Determinación Automática

```typescript
if (precipitation > 10mm) → "rainy" (Lluvioso)
else if (precipitation > 0mm) → "light_rain" (Lluvia ligera)
else if (cloudCover > 75%) → "cloudy" (Nublado)
else if (cloudCover > 30%) → "partly_cloudy" (Parcialmente nublado)
else → "sunny" (Soleado)
```

### Dirección del Viento

Conversión de grados a puntos cardinales:
- 0° - 22.5° → N (Norte)
- 22.5° - 67.5° → NE (Noreste)
- 67.5° - 112.5° → E (Este)
- 112.5° - 157.5° → SE (Sureste)
- 157.5° - 202.5° → S (Sur)
- 202.5° - 247.5° → SW (Suroeste)
- 247.5° - 292.5° → W (Oeste)
- 292.5° - 337.5° → NW (Noroeste)
- 337.5° - 360° → N (Norte)

---

## 🎨 Casos de Uso

### Caso 1: Consultar Clima de Edición Pasada

```bash
# 1. Obtener datos (público)
GET /api/v2/editions/{editionId}/weather

# Si weatherFetched = false, el admin debe hacer fetch:
POST /api/v2/editions/{editionId}/weather/fetch
Authorization: Bearer {admin-token}
```

### Caso 2: Actualizar Datos (Refetch)

```bash
# Refetch con force (requiere ADMIN)
POST /api/v2/editions/{editionId}/weather/fetch?force=true
Authorization: Bearer {admin-token}
```

### Caso 3: Mostrar Clima en la Ficha de Edición

```tsx
// Frontend React
const { data } = await fetch(`/api/v2/editions/${editionId}/weather`);

if (data.weatherFetched) {
  return (
    <WeatherCard>
      <Temp>{data.weather.temperature.avg}°C</Temp>
      <Condition>{data.weather.conditionText}</Condition>
      <Wind>{data.weather.wind.speed} km/h {data.weather.wind.directionText}</Wind>
      <Rain>{data.weather.precipitation} mm</Rain>
    </WeatherCard>
  );
} else {
  return <p>Datos climáticos no disponibles</p>;
}
```

---

## 🔐 Seguridad y Validaciones

### Autorización

- **GET clima:** Público (sin autenticación)
- **POST fetch:** Solo ADMIN

### Validaciones

1. **Edición existe:** Verifica que el editionId sea válido
2. **Fecha pasada:** No permite fetch de ediciones futuras
3. **Ubicación disponible:** Requiere coordenadas GPS (Edition o Event)
4. **Datos no duplicados:** Solo permite refetch con `force=true`

---

## 🚀 Flujo de Trabajo Recomendado

### Para Administradores

**Después de una Carrera:**
1. La edición se marca como `FINISHED`
2. Admin ejecuta fetch de clima:
   ```bash
   POST /api/v2/editions/{editionId}/weather/fetch
   ```
3. Sistema obtiene y guarda datos automáticamente
4. Los datos quedan disponibles públicamente

**Trigger Automático (Opcional - Futuro):**
```typescript
// En edition.service.ts al actualizar status a FINISHED
if (newStatus === 'FINISHED' && !edition.weatherFetched) {
  await WeatherService.fetchWeatherForEdition(editionId);
}
```

---

## 📊 Ejemplo Completo de Response

```json
{
  "status": "success",
  "data": {
    "edition": {
      "id": "abc-123",
      "year": 2023,
      "slug": "utmb-171k-2023",
      "startDate": "2023-08-25T10:00:00.000Z",
      "competition": {
        "id": "def-456",
        "name": "UTMB 171K",
        "slug": "utmb-171k",
        "event": {
          "id": "ghi-789",
          "name": "UTMB Mont Blanc",
          "slug": "utmb-mont-blanc"
        }
      }
    },
    "weather": {
      "date": "2023-08-25",
      "temperature": {
        "avg": 15.3,
        "min": 8.2,
        "max": 22.7
      },
      "condition": "partly_cloudy",
      "conditionText": "Parcialmente nublado",
      "precipitation": 2.5,
      "wind": {
        "speed": 12.4,
        "direction": 225,
        "directionText": "SW"
      },
      "humidity": 65,
      "pressure": 1013,
      "cloudCover": 45,
      "fetchedAt": "2024-01-15T10:30:00.123Z"
    },
    "weatherFetched": true
  }
}
```

---

## ⚠️ Consideraciones Importantes

### Limitaciones de Open-Meteo

- Datos desde **1940** (no hay datos más antiguos)
- Resolución horaria (no minutos/segundos)
- Puede no tener datos para ubicaciones muy remotas
- Datos pueden tener pequeñas variaciones vs estaciones locales

### Performance

- Request a Open-Meteo: **~500ms - 2s**
- Se guarda en BD para evitar requests repetidas
- El clima es público (se cachea fácilmente)

### Coordenadas GPS

El sistema usa:
1. **Primero:** Coordenadas de la Edition (si existen)
2. **Fallback:** Coordenadas del Event padre

**Formato PostGIS:**
```sql
POINT(longitude latitude)
-- Ejemplo: POINT(6.869 45.8326) para Chamonix
```

---

## ✅ Checklist de Validación

- [x] Schema Prisma actualizado con campos weather
- [x] WeatherService con integración Open-Meteo
- [x] Procesamiento de datos horarios a promedios
- [x] Determinación automática de condiciones
- [x] Conversión de dirección del viento
- [x] WeatherController con 2 métodos
- [x] Rutas anidadas en editions (2 endpoints)
- [x] Integración en edition.routes.ts
- [x] Validación de fecha pasada
- [x] Validación de ubicación disponible
- [x] Autorización ADMIN para fetch
- [x] Endpoint público para consultar

---

## 📊 Estadísticas de la FASE 4

- **Endpoints creados:** 2
- **Campos agregados:** 2 (weather, weatherFetched)
- **Service nuevo:** 1
- **Controller nuevo:** 1
- **Archivo de rutas:** 1
- **API externa integrada:** Open-Meteo (gratuita, sin key)

---

## 🎉 FASE 4 COMPLETADA

El sistema de meteo automático permite:

- ✅ Obtener datos climáticos históricos de ediciones pasadas
- ✅ Integración con Open-Meteo API (gratuita, sin límites)
- ✅ Procesamiento automático de datos horarios
- ✅ Determinación de condiciones climáticas
- ✅ Almacenamiento persistente en BD (JSON)
- ✅ Endpoint público para consultar
- ✅ Endpoint admin para fetch/refetch
- ✅ Validaciones de fecha y ubicación
- ✅ Soporte para refetch manual

---

## 🏁 TODAS LAS FASES COMPLETADAS

### Resumen Final del Proyecto

**✅ FASE 1 - Ratings + Catálogos:** 22 endpoints
**✅ FASE 2 - Podios + Crónica:** 7 endpoints
**✅ FASE 3 - Galería de Fotos:** 6 endpoints
**✅ FASE 4 - Meteo Automático:** 2 endpoints

**Total:** **37 endpoints** implementados 🚀

### Características Implementadas

1. **Sistema de Ratings con 7 Criterios**
2. **Catálogos** (Competition Types, Terrain Types, Special Series)
3. **Podios** (General, Masculino, Femenino, Categorías)
4. **Crónicas** de ediciones
5. **Galería de Fotos** con procesamiento automático
6. **Meteo Histórico** con Open-Meteo API

### Tecnologías Utilizadas

- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL
- Zod para validación
- Multer para uploads
- Sharp para procesamiento de imágenes
- Axios para HTTP requests
- Open-Meteo API para clima

---

## 📝 Próximos Pasos (Opcionales)

1. **Trigger automático** de fetch de clima al marcar edición como FINISHED
2. **Caché** de respuestas de clima (Redis)
3. **Pronóstico** para ediciones futuras (usando forecast API de Open-Meteo)
4. **Gráficos** de evolución del clima por horas
5. **Migración a cloud storage** para fotos (S3/Cloudinary)
6. **Tests automatizados** para todos los endpoints
