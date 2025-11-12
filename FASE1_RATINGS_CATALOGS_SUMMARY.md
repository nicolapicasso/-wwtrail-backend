# ✅ FASE 1 COMPLETADA: Sistema de Ratings + Catálogos

## 📊 Resumen General

Se ha implementado completamente el sistema de ratings para ediciones y los catálogos de tipos de competición, tipos de terreno y series especiales.

---

## 🗄️ Base de Datos

### Nuevas Tablas Creadas

1. **`competition_types`** - Tipos de competición
2. **`terrain_types`** - Tipos de terreno
3. **`special_series`** - Series especiales (UTMB, Golden Trail, etc.)
4. **`edition_ratings`** - Ratings de ediciones por usuarios

### Campos Actualizados

**Event:**
- `competitionTypeId` (UUID, nullable)
- `terrainTypeId` (UUID, nullable)
- `specialSeriesId` (UUID, nullable)
- `itraPoints` (Int, nullable)
- `utmbPoints` (Int, nullable)

**Edition:**
- `avgRating` (Float, nullable) - Promedio calculado de ratings
- `totalRatings` (Int, default: 0)
- Relación `ratings` → EditionRating[]

**User:**
- Relación `ratings` → EditionRating[]

### Enum Agregado

```typescript
enum PodiumType {
  GENERAL
  MALE
  FEMALE
  CATEGORY
}
```

---

## 🎯 Endpoints Implementados

### 📈 EDITION RATINGS (7 endpoints)

#### 1. Crear Rating
```
POST /api/v2/editions/:editionId/ratings
Auth: Requerido
```

**Body:**
```json
{
  "ratingInfoBriefing": 4,    // 1-4
  "ratingRacePack": 3,         // 1-4
  "ratingVillage": 4,          // 1-4
  "ratingMarking": 3,          // 1-4
  "ratingAid": 4,              // 1-4
  "ratingFinisher": 3,         // 1-4
  "ratingEco": 4,              // 1-4
  "comment": "Excelente organización y trato"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "editionId": "uuid",
    "userId": "uuid",
    "ratingInfoBriefing": 4,
    "ratingRacePack": 3,
    "ratingVillage": 4,
    "ratingMarking": 3,
    "ratingAid": 4,
    "ratingFinisher": 3,
    "ratingEco": 4,
    "comment": "Excelente organización y trato",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "uuid",
      "username": "runner123",
      "avatar": "https://...",
      "firstName": "Juan",
      "lastName": "Pérez"
    }
  }
}
```

#### 2. Obtener Ratings de una Edición
```
GET /api/v2/editions/:editionId/ratings?page=1&limit=10
Auth: No requerido (público)
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "ratingInfoBriefing": 4,
      "ratingRacePack": 3,
      "ratingVillage": 4,
      "ratingMarking": 3,
      "ratingAid": 4,
      "ratingFinisher": 3,
      "ratingEco": 4,
      "comment": "...",
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "uuid",
        "username": "runner123",
        "avatar": "https://...",
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### 3. Obtener Rating por ID
```
GET /api/v2/ratings/:id
Auth: No requerido (público)
```

**Response:** Similar al endpoint de crear, pero incluye información completa de la edición, competición y evento.

#### 4. Actualizar Rating
```
PUT /api/v2/ratings/:id
Auth: Requerido (solo el propietario)
```

**Body:** Todos los campos opcionales
```json
{
  "ratingInfoBriefing": 3,
  "comment": "Actualicé mi opinión..."
}
```

#### 5. Eliminar Rating
```
DELETE /api/v2/ratings/:id
Auth: Requerido (solo el propietario)
```

**Response:**
```json
{
  "status": "success",
  "message": "Rating deleted successfully"
}
```

#### 6. Mis Ratings
```
GET /api/v2/me/ratings?page=1&limit=10
Auth: Requerido
```

Retorna todos los ratings del usuario autenticado con información de las ediciones.

#### 7. Ratings Recientes (Homepage)
```
GET /api/v2/ratings/recent?limit=10
Auth: No requerido (público)
```

Retorna los ratings más recientes del sistema con información completa de evento/competición/edición. Ideal para mostrar en la homepage.

---

### 📚 CATÁLOGOS - ENDPOINTS PÚBLICOS (3 endpoints)

#### 1. Competition Types
```
GET /api/v2/competition-types?isActive=true
Auth: No requerido
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Sky Running",
      "slug": "sky-running",
      "description": "Carreras de montaña de alta dificultad técnica...",
      "sortOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Ultra Trail",
      "slug": "ultra-trail",
      "description": "Carreras de ultra distancia (>42km)...",
      "sortOrder": 2,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Terrain Types
```
GET /api/v2/terrain-types?isActive=true
Auth: No requerido
```

**Response:** Similar estructura a Competition Types

#### 3. Special Series
```
GET /api/v2/special-series?isActive=true
Auth: No requerido
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "UTMB World Series",
      "slug": "utmb-world-series",
      "logoUrl": "https://utmb.world/images/logo.png",
      "websiteUrl": "https://utmb.world",
      "description": "Serie mundial de ultra trails",
      "sortOrder": 2,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 🔐 CATÁLOGOS - ENDPOINTS ADMIN (15 endpoints)

Todos los endpoints admin requieren autenticación y rol ADMIN.

#### Competition Types (5 endpoints)
```
GET    /api/v2/admin/competition-types
GET    /api/v2/admin/competition-types/:id
POST   /api/v2/admin/competition-types
PUT    /api/v2/admin/competition-types/:id
DELETE /api/v2/admin/competition-types/:id (soft delete)
```

#### Terrain Types (5 endpoints)
```
GET    /api/v2/admin/terrain-types
GET    /api/v2/admin/terrain-types/:id
POST   /api/v2/admin/terrain-types
PUT    /api/v2/admin/terrain-types/:id
DELETE /api/v2/admin/terrain-types/:id (soft delete)
```

#### Special Series (5 endpoints)
```
GET    /api/v2/admin/special-series
GET    /api/v2/admin/special-series/:id
POST   /api/v2/admin/special-series
PUT    /api/v2/admin/special-series/:id
DELETE /api/v2/admin/special-series/:id (soft delete)
```

**Ejemplo POST Competition Type:**
```json
{
  "name": "Trail Nocturno",
  "description": "Carreras de trail realizadas de noche",
  "sortOrder": 7
}
```

**Ejemplo POST Special Series:**
```json
{
  "name": "Transgrancanaria",
  "logoUrl": "https://...",
  "websiteUrl": "https://transgrancanaria.net",
  "description": "Serie de carreras en Gran Canaria",
  "sortOrder": 4
}
```

---

## 📝 Tipos TypeScript Exportados

Los tipos están disponibles en los schemas para importar en el frontend:

### Edition Rating Types
```typescript
import type {
  CreateEditionRatingInput,
  UpdateEditionRatingInput,
  GetRatingsQuery,
  GetRecentRatingsQuery,
} from './schemas/editionRating.schema';
```

### Catalog Types
```typescript
import type {
  CreateCatalogInput,
  UpdateCatalogInput,
  CreateSpecialSeriesInput,
  UpdateSpecialSeriesInput,
  GetCatalogQuery,
} from './schemas/catalog.schema';
```

### Prisma Types (generados automáticamente)
```typescript
import type {
  EditionRating,
  CompetitionType,
  TerrainType,
  SpecialSeries,
} from '@prisma/client';
```

---

## 📂 Archivos Creados/Modificados

### Nuevos Archivos

**Schemas:**
- `src/schemas/editionRating.schema.ts`
- `src/schemas/catalog.schema.ts`

**Services:**
- `src/services/editionRating.service.ts`
- `src/services/catalog.service.ts`

**Controllers:**
- `src/controllers/editionRating.controller.ts`
- `src/controllers/catalog.controller.ts`

**Routes:**
- `src/routes/editionRating.routes.ts`
- `src/routes/catalog.routes.ts`

### Archivos Modificados

- `prisma/schema.prisma` - Agregadas 4 tablas y campos nuevos
- `prisma/seed.ts` - Agregados seeds de catálogos
- `src/index.ts` - Registradas nuevas rutas
- `src/routes/edition.routes.ts` - Integradas rutas anidadas de ratings

---

## 🌱 Seeds de Datos Iniciales

### Competition Types (6)
1. Sky Running
2. Ultra Trail
3. Trail Running
4. Vertical Kilometer
5. Trail sin marcar
6. Canicross

### Terrain Types (6)
1. Montaña técnica
2. Montaña media
3. Senderos boscosos
4. Desierto
5. Mixto asfalto/sendero
6. Alta montaña

### Special Series (3)
1. Golden Trail Series
2. UTMB World Series
3. Skyrunner World Series

---

## 🔄 Lógica Especial Implementada

### Recalculo Automático de avgRating

Cada vez que se crea, actualiza o elimina un rating, se recalcula automáticamente:

1. Se obtienen todos los ratings de la edición
2. Se calcula el promedio de los 7 criterios de cada rating
3. Se calcula el promedio general de todos los ratings
4. Se actualiza `Edition.avgRating` y `Edition.totalRatings`

**Fórmula:**
```
avgRatingPorUsuario = (criterio1 + criterio2 + ... + criterio7) / 7
avgRatingEdicion = sum(avgRatingPorUsuario) / totalRatings
```

### Soft Delete en Catálogos

Los endpoints DELETE de catálogos no eliminan realmente el registro, solo marcan `isActive = false`. Esto preserva las relaciones con eventos existentes.

---

## 🚀 Próximos Pasos para Ejecutar

1. **Levantar la base de datos:**
   ```bash
   docker-compose up -d
   ```

2. **Generar y ejecutar migraciones:**
   ```bash
   npx prisma migrate dev --name add_ratings_and_catalogs
   ```

3. **Ejecutar seeds:**
   ```bash
   npx prisma db seed
   ```

4. **Generar cliente Prisma:**
   ```bash
   npx prisma generate
   ```

5. **Levantar el servidor:**
   ```bash
   npm run dev
   ```

---

## ✅ Checklist de Validación

- [x] Schema Prisma actualizado con 4 nuevas tablas
- [x] Campos agregados a Event, Edition y User
- [x] Seeds creados para catálogos iniciales
- [x] Schemas Zod de validación implementados
- [x] EditionRatingService con CRUD completo
- [x] CatalogService con CRUD genérico
- [x] EditionRatingController con 7 métodos
- [x] CatalogController con 21 métodos
- [x] Rutas públicas de ratings (3 endpoints)
- [x] Rutas protegidas de ratings (4 endpoints)
- [x] Rutas públicas de catálogos (3 endpoints)
- [x] Rutas admin de catálogos (15 endpoints)
- [x] Integración en index.ts
- [x] Rutas anidadas en edition.routes.ts
- [x] Lógica de recálculo de avgRating
- [x] Validación de ownership en ratings
- [x] Soft delete en catálogos

---

## 📊 Estadísticas de la FASE 1

- **Endpoints creados:** 22
- **Tablas nuevas:** 4
- **Modelos actualizados:** 3
- **Services nuevos:** 2
- **Controllers nuevos:** 2
- **Archivos de rutas:** 2
- **Schemas Zod:** 2
- **Seeds de datos:** 15 registros iniciales

---

## 🎉 FASE 1 COMPLETADA

Todos los endpoints están listos para ser consumidos por el frontend. El sistema de ratings permite:

- ✅ Usuarios pueden valorar ediciones con 7 criterios
- ✅ Cálculo automático de ratings promedio
- ✅ Catálogos públicos disponibles para filtrado
- ✅ Admin puede gestionar catálogos
- ✅ Integración completa con el sistema de ediciones existente

**Siguiente:** FASE 2 - Sistema de Podios + Crónica
