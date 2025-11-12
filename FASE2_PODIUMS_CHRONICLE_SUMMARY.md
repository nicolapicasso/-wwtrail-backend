# ✅ FASE 2 COMPLETADA: Sistema de Podios + Crónica

## 📊 Resumen General

Se ha implementado el sistema completo de podios para ediciones y la funcionalidad de crónica. Permite a organizadores y administradores registrar los ganadores de cada edición en diferentes categorías y escribir una crónica/reseña de la carrera.

---

## 🗄️ Base de Datos

### Nueva Tabla Creada

**`edition_podiums`** - Podios de ediciones

```prisma
model EditionPodium {
  id           String     @id @default(uuid())
  editionId    String
  edition      Edition    @relation("EditionPodiums", fields: [editionId], references: [id], onDelete: Cascade)

  type         PodiumType  // GENERAL, MALE, FEMALE, CATEGORY
  categoryName String?     // Requerido si type = CATEGORY

  firstPlace   String      // Nombre del ganador
  firstTime    String?     // Tiempo en formato HH:MM:SS

  secondPlace  String?
  secondTime   String?

  thirdPlace   String?
  thirdTime    String?

  sortOrder    Int        @default(0)

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([editionId])
  @@index([type])
  @@map("edition_podiums")
}
```

### Campo Agregado a Edition

**Edition:**
- `chronicle` (Text, nullable) - Crónica/reseña de la edición
- Relación `podiums` → EditionPodium[]

### Enum Utilizado (ya existía desde FASE 1)

```typescript
enum PodiumType {
  GENERAL   // Clasificación general absoluta
  MALE      // Clasificación masculina
  FEMALE    // Clasificación femenina
  CATEGORY  // Clasificación por categoría específica
}
```

---

## 🎯 Endpoints Implementados (7 endpoints)

### 📊 PODIUMS

#### 1. Crear Podio
```
POST /api/v2/editions/:editionId/podiums
Auth: Requerido (ORGANIZER/ADMIN)
```

**Body:**
```json
{
  "type": "GENERAL",
  "firstPlace": "Kilian Jornet",
  "firstTime": "20:45:32",
  "secondPlace": "Jim Walmsley",
  "secondTime": "21:03:15",
  "thirdPlace": "Zach Miller",
  "thirdTime": "21:28:47",
  "sortOrder": 0
}
```

**Body (categoría específica):**
```json
{
  "type": "CATEGORY",
  "categoryName": "Veteranos A (40-49 años)",
  "firstPlace": "Carlos García",
  "firstTime": "22:15:30",
  "secondPlace": "Miguel Ángel Pérez",
  "secondTime": "22:45:12",
  "thirdPlace": "Juan López",
  "thirdTime": "23:10:05",
  "sortOrder": 3
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "editionId": "uuid",
    "type": "GENERAL",
    "categoryName": null,
    "firstPlace": "Kilian Jornet",
    "firstTime": "20:45:32",
    "secondPlace": "Jim Walmsley",
    "secondTime": "21:03:15",
    "thirdPlace": "Zach Miller",
    "thirdTime": "21:28:47",
    "sortOrder": 0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Obtener Podios de una Edición
```
GET /api/v2/editions/:editionId/podiums
Auth: No requerido (público)
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "editionId": "uuid",
      "type": "GENERAL",
      "categoryName": null,
      "firstPlace": "Kilian Jornet",
      "firstTime": "20:45:32",
      "secondPlace": "Jim Walmsley",
      "secondTime": "21:03:15",
      "thirdPlace": "Zach Miller",
      "thirdTime": "21:28:47",
      "sortOrder": 0,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "editionId": "uuid",
      "type": "FEMALE",
      "categoryName": null,
      "firstPlace": "Courtney Dauwalter",
      "firstTime": "23:12:45",
      "secondPlace": "Camille Herron",
      "secondTime": "23:45:30",
      "thirdPlace": "Clare Gallagher",
      "thirdTime": "24:15:20",
      "sortOrder": 1,
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### 3. Obtener Podio por ID
```
GET /api/v2/podiums/:id
Auth: No requerido (público)
```

**Response:** Similar al de crear, pero incluye información completa de la edición, competición y evento.

#### 4. Actualizar Podio
```
PUT /api/v2/podiums/:id
Auth: Requerido (ORGANIZER/ADMIN)
```

**Body:** Todos los campos opcionales
```json
{
  "firstTime": "20:42:15",
  "secondTime": "21:01:30"
}
```

#### 5. Eliminar Podio
```
DELETE /api/v2/podiums/:id
Auth: Requerido (ORGANIZER/ADMIN)
```

**Response:**
```json
{
  "status": "success",
  "message": "Podium deleted successfully"
}
```

---

### 📝 CRÓNICA

#### 6. Actualizar Crónica
```
PUT /api/v2/editions/:editionId/chronicle
Auth: Requerido (ORGANIZER/ADMIN)
```

**Body:**
```json
{
  "chronicle": "La edición 2024 del UTMB fue histórica. Con más de 10,000 corredores de 100 países, las condiciones meteorológicas fueron perfectas. Kilian Jornet dominó la carrera desde el inicio, marcando un nuevo récord del recorrido. La participación femenina batió récords con Courtney Dauwalter logrando un tiempo espectacular. Los avituallamientos fueron elogiados por todos los participantes, y la organización cumplió con los más altos estándares de sostenibilidad..."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "year": 2024,
    "slug": "utmb-171k-2024",
    "chronicle": "La edición 2024 del UTMB fue histórica...",
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
  }
}
```

#### 7. Obtener Crónica
```
GET /api/v2/editions/:editionId/chronicle
Auth: No requerido (público)
```

**Response:** Mismo formato que actualizar crónica.

---

## 📝 Tipos TypeScript Exportados

```typescript
import type {
  CreatePodiumInput,
  UpdatePodiumInput,
  UpdateChronicleInput,
} from './schemas/editionPodium.schema';

import type {
  EditionPodium,
  PodiumType,
} from '@prisma/client';
```

---

## 📂 Archivos Creados/Modificados

### Nuevos Archivos

**Schema:**
- `src/schemas/editionPodium.schema.ts`

**Service:**
- `src/services/editionPodium.service.ts`

**Controller:**
- `src/controllers/editionPodium.controller.ts`

**Routes:**
- `src/routes/editionPodium.routes.ts`

### Archivos Modificados

- `prisma/schema.prisma` - Agregada tabla EditionPodium y campo chronicle
- `src/index.ts` - Registradas rutas de podiums
- `src/routes/edition.routes.ts` - Integradas rutas anidadas de podiums y chronicle

---

## 🔄 Validaciones Especiales

### Validación de Tiempo

Los tiempos deben estar en formato `HH:MM:SS`:
- ✅ Válido: `"20:45:32"`, `"08:15:00"`, `"23:59:59"`
- ❌ Inválido: `"20:45"`, `"25:00:00"`, `"invalid"`

### Validación de Categoría

Cuando `type = "CATEGORY"`, el campo `categoryName` es obligatorio:
```json
{
  "type": "CATEGORY",
  "categoryName": "Veteranos A (40-49 años)",  // ← Requerido
  "firstPlace": "Carlos García"
}
```

---

## 🎨 Casos de Uso

### Caso 1: Podio General
```json
{
  "type": "GENERAL",
  "firstPlace": "Kilian Jornet",
  "firstTime": "20:45:32",
  "secondPlace": "Jim Walmsley",
  "secondTime": "21:03:15",
  "thirdPlace": "Zach Miller",
  "thirdTime": "21:28:47"
}
```

### Caso 2: Podio Femenino
```json
{
  "type": "FEMALE",
  "firstPlace": "Courtney Dauwalter",
  "firstTime": "23:12:45",
  "secondPlace": "Camille Herron",
  "secondTime": "23:45:30"
}
```

### Caso 3: Podio por Categoría
```json
{
  "type": "CATEGORY",
  "categoryName": "Veteranos B (50-59 años)",
  "firstPlace": "José María Fernández",
  "firstTime": "24:30:15"
}
```

### Caso 4: Podio sin Tiempos
```json
{
  "type": "MALE",
  "firstPlace": "Marc Pinsach",
  "secondPlace": "Oriol Cardona",
  "thirdPlace": "Pau Capell"
}
```

---

## 🚀 Flujo de Trabajo Recomendado

### Para Organizadores

1. **Finalizar Edición:**
   - Esperar a que termine la carrera
   - Validar tiempos oficiales

2. **Registrar Podios:**
   - Crear podio general (GENERAL)
   - Crear podio masculino (MALE)
   - Crear podio femenino (FEMALE)
   - Crear podios por categorías (CATEGORY)

3. **Escribir Crónica:**
   - Redactar crónica con highlights
   - Incluir anécdotas y momentos destacados
   - Agregar datos estadísticos

### Ejemplo de Secuencia

```bash
# 1. Crear podio general
POST /api/v2/editions/{editionId}/podiums
{ "type": "GENERAL", "firstPlace": "...", ... }

# 2. Crear podio femenino
POST /api/v2/editions/{editionId}/podiums
{ "type": "FEMALE", "firstPlace": "...", ... }

# 3. Crear podios por categorías
POST /api/v2/editions/{editionId}/podiums
{ "type": "CATEGORY", "categoryName": "Veteranos A", ... }

# 4. Escribir crónica
PUT /api/v2/editions/{editionId}/chronicle
{ "chronicle": "La edición 2024 fue..." }
```

---

## ✅ Checklist de Validación

- [x] Schema Prisma actualizado con EditionPodium
- [x] Campo chronicle agregado a Edition
- [x] Schema Zod con validación de tiempos HH:MM:SS
- [x] Schema Zod con validación de categoryName
- [x] EditionPodiumService con 6 métodos
- [x] EditionPodiumController con 7 endpoints
- [x] Rutas directas de podiums (3 endpoints)
- [x] Rutas anidadas en editions (4 endpoints)
- [x] Integración en index.ts
- [x] Integración en edition.routes.ts
- [x] Autorización ORGANIZER/ADMIN para crear/editar
- [x] Endpoints públicos para leer

---

## 📊 Estadísticas de la FASE 2

- **Endpoints creados:** 7
- **Tabla nueva:** 1 (EditionPodium)
- **Campos agregados:** 1 (chronicle)
- **Service nuevo:** 1
- **Controller nuevo:** 1
- **Archivo de rutas:** 1
- **Schema Zod:** 1

---

## 🎉 FASE 2 COMPLETADA

El sistema de podios y crónica permite:

- ✅ Registrar ganadores por clasificación (general, masculino, femenino, categorías)
- ✅ Tiempos opcionales en formato estándar HH:MM:SS
- ✅ Ordenamiento personalizado de podios (sortOrder)
- ✅ Crónicas extensas para cada edición
- ✅ Endpoints públicos para consultar
- ✅ Control de acceso para ORGANIZER/ADMIN

**Siguiente:** FASE 3 - Galería de Fotos
