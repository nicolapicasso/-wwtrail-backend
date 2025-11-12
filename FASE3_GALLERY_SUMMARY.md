# ✅ FASE 3 COMPLETADA: Sistema de Galería de Fotos

## 📊 Resumen General

Se ha implementado el sistema completo de galería de fotos para ediciones con procesamiento automático de imágenes, generación de thumbnails y optimización mediante Sharp.

---

## 🗄️ Base de Datos

### Nueva Tabla Creada

**`edition_photos`** - Fotos de ediciones

```prisma
model EditionPhoto {
  id           String   @id @default(uuid())
  editionId    String
  edition      Edition  @relation("EditionPhotos", fields: [editionId], references: [id], onDelete: Cascade)

  url          String   // URL de la imagen original
  thumbnail    String?  // URL del thumbnail
  caption      String?  // Descripción de la foto
  photographer String?  // Nombre del fotógrafo

  width        Int?     // Ancho en píxeles
  height       Int?     // Alto en píxeles
  fileSize     Int?     // Tamaño en bytes
  mimeType     String?  // Tipo MIME (image/jpeg, etc.)

  sortOrder    Int      @default(0)
  isFeatured   Boolean  @default(false)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([editionId])
  @@index([isFeatured])
  @@map("edition_photos")
}
```

### Campo Agregado a Edition

**Edition:**
- Relación `photos` → EditionPhoto[]

---

## 📦 Dependencias Agregadas

**package.json:**
```json
{
  "dependencies": {
    "sharp": "^0.33.5"  // ← NUEVO
  }
}
```

**Instalación requerida:**
```bash
npm install sharp@^0.33.5
```

---

## 🎯 Endpoints Implementados (6 endpoints)

### 📸 PHOTOS

#### 1. Subir Foto
```
POST /api/v2/editions/:editionId/photos
Auth: Requerido (ORGANIZER/ADMIN)
Content-Type: multipart/form-data
```

**Form Data:**
```
photo: [File]  // Campo de archivo (requerido)
caption: "Vista del Mont Blanc desde el km 42"  // Opcional
photographer: "John Doe"  // Opcional
sortOrder: 0  // Opcional (default: 0)
isFeatured: false  // Opcional (default: false)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "editionId": "uuid",
    "url": "http://localhost:3001/uploads/image-1234567890.jpg",
    "thumbnail": "http://localhost:3001/uploads/image-1234567890-thumb.jpg",
    "caption": "Vista del Mont Blanc desde el km 42",
    "photographer": "John Doe",
    "width": 1920,
    "height": 1080,
    "fileSize": 256789,
    "mimeType": "image/jpeg",
    "sortOrder": 0,
    "isFeatured": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Procesamiento automático:**
- ✅ Redimensiona si > 1920x1080px (mantiene aspect ratio)
- ✅ Genera thumbnail de 400px de ancho
- ✅ Optimiza calidad JPEG (85% original, 80% thumbnail)
- ✅ Extrae metadata (dimensiones, peso, MIME type)

#### 2. Obtener Fotos de una Edición
```
GET /api/v2/editions/:editionId/photos
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
      "url": "http://localhost:3001/uploads/image1.jpg",
      "thumbnail": "http://localhost:3001/uploads/image1-thumb.jpg",
      "caption": "Salida en Chamonix",
      "photographer": "Jane Smith",
      "width": 1920,
      "height": 1080,
      "fileSize": 256789,
      "mimeType": "image/jpeg",
      "sortOrder": 0,
      "isFeatured": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "editionId": "uuid",
      "url": "http://localhost:3001/uploads/image2.jpg",
      "thumbnail": "http://localhost:3001/uploads/image2-thumb.jpg",
      "caption": "Paso de montaña",
      "photographer": "John Doe",
      "width": 1800,
      "height": 1200,
      "fileSize": 312456,
      "mimeType": "image/jpeg",
      "sortOrder": 1,
      "isFeatured": false,
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Orden:**
1. Fotos destacadas primero (`isFeatured: true`)
2. Luego por `sortOrder` ascendente
3. Finalmente por fecha de creación

#### 3. Obtener Foto por ID
```
GET /api/v2/photos/:id
Auth: No requerido (público)
```

**Response:** Similar al de subir, pero incluye información completa de la edición, competición y evento.

#### 4. Actualizar Metadata
```
PUT /api/v2/photos/:id
Auth: Requerido (ORGANIZER/ADMIN)
```

**Body:**
```json
{
  "caption": "Nueva descripción",
  "photographer": "Fotógrafo actualizado",
  "sortOrder": 5,
  "isFeatured": true
}
```

**Nota:** NO se puede cambiar la imagen en sí, solo metadata. Para cambiar la imagen, eliminar y subir nueva.

#### 5. Eliminar Foto
```
DELETE /api/v2/photos/:id
Auth: Requerido (ORGANIZER/ADMIN)
```

**Response:**
```json
{
  "status": "success",
  "message": "Photo deleted successfully"
}
```

**Proceso:**
1. Elimina archivo original del filesystem
2. Elimina thumbnail del filesystem
3. Elimina registro de la base de datos

#### 6. Reordenar Fotos
```
POST /api/v2/editions/:editionId/photos/reorder
Auth: Requerido (ORGANIZER/ADMIN)
```

**Body:**
```json
{
  "photoOrders": [
    { "id": "photo-uuid-1", "sortOrder": 0 },
    { "id": "photo-uuid-2", "sortOrder": 1 },
    { "id": "photo-uuid-3", "sortOrder": 2 }
  ]
}
```

**Response:** Array de fotos ordenadas según el nuevo orden.

---

## 📝 Tipos TypeScript Exportados

```typescript
import type {
  UploadPhotoInput,
  UpdatePhotoMetadataInput,
  ReorderPhotosInput,
} from './schemas/editionPhoto.schema';

import type {
  EditionPhoto,
} from '@prisma/client';
```

---

## 📂 Archivos Creados/Modificados

### Nuevos Archivos

**Schema:**
- `src/schemas/editionPhoto.schema.ts`

**Service:**
- `src/services/editionPhoto.service.ts`

**Controller:**
- `src/controllers/editionPhoto.controller.ts`

**Routes:**
- `src/routes/editionPhoto.routes.ts`

### Archivos Modificados

- `prisma/schema.prisma` - Agregada tabla EditionPhoto y relación en Edition
- `package.json` - Agregada dependencia sharp
- `src/index.ts` - Registradas rutas de photos
- `src/routes/edition.routes.ts` - Integradas rutas anidadas de photos

---

## 🖼️ Procesamiento de Imágenes con Sharp

### Configuración Automática

**Imagen Original:**
- Max width: 1920px
- Max height: 1080px
- Calidad JPEG: 85%
- Fit: `inside` (mantiene aspect ratio sin recortar)

**Thumbnail:**
- Width: 400px (altura proporcional)
- Calidad JPEG: 80%
- Fit: `inside`

### Ejemplo de Procesamiento

```typescript
// Entrada: imagen de 4000x3000px, 8MB
//
// Proceso:
// 1. Redimensiona a 1920x1440px (mantiene ratio 4:3)
// 2. Optimiza a calidad 85% → ~800KB
// 3. Genera thumbnail 400x300px → ~45KB
//
// Salida:
// - Original: 1920x1440px, 800KB
// - Thumbnail: 400x300px, 45KB
```

### Formatos Soportados

- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ SVG

**Validación:** Implementada en Multer (línea 66-81 de `src/config/multer.ts`)

---

## 🗂️ Estructura de Archivos

**Directorio de uploads:**
```
/uploads/
  ├── image-1234567890-abc123.jpg       ← Original procesada
  ├── image-1234567890-abc123-thumb.jpg ← Thumbnail
  ├── photo-9876543210-xyz789.jpg
  └── photo-9876543210-xyz789-thumb.jpg
```

**Convención de nombres:**
```
{basename}-{timestamp}-{random}.{ext}
```

Ejemplo: `mont-blanc-1705315800-789456123.jpg`

---

## 🎨 Casos de Uso

### Caso 1: Galería de Carrera Completa

```bash
# 1. Subir múltiples fotos
POST /api/v2/editions/{editionId}/photos
FormData: photo=salida.jpg, caption="Salida en Chamonix"

POST /api/v2/editions/{editionId}/photos
FormData: photo=montana.jpg, caption="Paso de montaña"

POST /api/v2/editions/{editionId}/photos
FormData: photo=llegada.jpg, caption="Meta en Chamonix"

# 2. Marcar foto principal como destacada
PUT /api/v2/photos/{photoId}
{ "isFeatured": true }

# 3. Reordenar para timeline cronológico
POST /api/v2/editions/{editionId}/photos/reorder
{
  "photoOrders": [
    { "id": "salida-id", "sortOrder": 0 },
    { "id": "montana-id", "sortOrder": 1 },
    { "id": "llegada-id", "sortOrder": 2 }
  ]
}
```

### Caso 2: Foto Destacada del Evento

```bash
# Subir y marcar como destacada directamente
POST /api/v2/editions/{editionId}/photos
FormData:
  photo=hero-image.jpg
  caption="UTMB 2024 - Edición histórica"
  photographer="Official Photographer"
  isFeatured=true
  sortOrder=0
```

---

## 🔐 Seguridad y Validaciones

### Validaciones de Multer

1. **Tipo de archivo:** Solo imágenes permitidas
2. **Tamaño máximo:** 5MB por archivo
3. **Límite de archivos:** 10 fotos simultáneas (en `uploadMultiple`)

### Validaciones de Zod

1. **Caption:** Max 500 caracteres
2. **Photographer:** Max 200 caracteres
3. **SortOrder:** Debe ser número entero
4. **IsFeatured:** Debe ser booleano

### Autorización

- **Subir/Actualizar/Eliminar:** Requiere rol ORGANIZER o ADMIN
- **Ver fotos:** Público (sin autenticación)

---

## 🚀 Flujo de Trabajo Recomendado

### Para Organizadores

1. **Durante/Después de la Carrera:**
   - Subir fotos de momentos destacados
   - Agregar captions descriptivos
   - Acreditar fotógrafos

2. **Organizar Galería:**
   - Marcar 1-3 fotos como destacadas
   - Reordenar cronológicamente
   - Eliminar fotos duplicadas o de mala calidad

3. **Optimización:**
   - El sistema automáticamente:
     - Redimensiona imágenes grandes
     - Genera thumbnails
     - Optimiza peso de archivos

---

## ⚠️ Consideraciones Importantes

### Almacenamiento

- Cada foto genera **2 archivos** (original + thumbnail)
- Cálculo aproximado: **~1MB por foto** (800KB original + 200KB thumb)
- Para 100 fotos: **~100MB de espacio**

### Performance

- **Sharp** procesa imágenes muy rápido (~100-200ms por imagen)
- Procesamiento síncrono (puede ser async si crece el volumen)
- Thumbnails mejoran carga en listados

### Migración Futura a Cloud

El código está preparado para migrar a S3/Cloudinary:

```typescript
// Actualmente: filesystem local
url: "http://localhost:3001/uploads/image.jpg"

// Futuro: cloud storage
url: "https://cloudinary.com/wwtrail/image.jpg"
```

Solo cambiar el path de guardado en `EditionPhotoService.upload()`

---

## ✅ Checklist de Validación

- [x] Schema Prisma actualizado con EditionPhoto
- [x] Relación photos agregada a Edition
- [x] Dependencia sharp agregada al package.json
- [x] Schema Zod con validaciones de upload
- [x] EditionPhotoService con procesamiento Sharp
- [x] Generación automática de thumbnails
- [x] EditionPhotoController con 6 métodos
- [x] Rutas directas de photos (3 endpoints)
- [x] Rutas anidadas en editions (3 endpoints)
- [x] Integración en index.ts
- [x] Integración en edition.routes.ts
- [x] Autorización ORGANIZER/ADMIN para modificar
- [x] Endpoints públicos para leer
- [x] Eliminación de archivos del filesystem

---

## 📊 Estadísticas de la FASE 3

- **Endpoints creados:** 6
- **Tabla nueva:** 1 (EditionPhoto)
- **Dependencias agregadas:** 1 (sharp)
- **Service nuevo:** 1
- **Controller nuevo:** 1
- **Archivo de rutas:** 1
- **Schema Zod:** 1

---

## 🎉 FASE 3 COMPLETADA

El sistema de galería de fotos permite:

- ✅ Upload de imágenes con procesamiento automático
- ✅ Generación automática de thumbnails
- ✅ Optimización de peso y dimensiones
- ✅ Metadata (caption, fotógrafo, orden)
- ✅ Fotos destacadas (isFeatured)
- ✅ Reordenamiento flexible
- ✅ Eliminación completa (DB + filesystem)
- ✅ Endpoints públicos para galería
- ✅ Control de acceso para ORGANIZER/ADMIN

**Siguiente:** FASE 4 - Meteo Automático

---

## 📝 Instrucciones de Instalación

**IMPORTANTE:** Antes de ejecutar, instalar Sharp:

```bash
npm install sharp@^0.33.5
```

Luego ejecutar migración:

```bash
npx prisma migrate dev --name add_edition_photos
```
