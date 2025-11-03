# 🎯 FASE 6 BACKEND - Sistema de Tracking Personal de Competiciones

**Fecha:** 2 Noviembre 2025  
**Objetivo:** Implementar sistema de tracking personal donde usuarios pueden marcar competiciones, añadir resultados y ver estadísticas

---

## 📋 RESUMEN DE CAMBIOS

### Nuevo Modelo: `UserCompetition`
- Relación entre usuarios y competiciones
- Estados: INTERESTED, REGISTERED, CONFIRMED, COMPLETED, DNF, DNS
- Campos para resultados personales
- Notas y valoraciones privadas

### Nuevos Endpoints: 10 rutas
- 7 rutas privadas (mis competiciones)
- 3 rutas públicas (rankings y perfiles)

---

## 🚀 INSTALACIÓN PASO A PASO

### PASO 1: Actualizar Prisma Schema

Editar `prisma/schema.prisma` y añadir:

#### 1.1 Nuevo Enum

```prisma
enum UserCompetitionStatus {
  INTERESTED      // "Me interesa"
  REGISTERED      // "Me he inscrito" (externamente)
  CONFIRMED       // "Inscripción confirmada"
  COMPLETED       // "He completado la carrera"
  DNF             // "No terminé" (Did Not Finish)
  DNS             // "No participé" (Did Not Start)
}
```

#### 1.2 Nuevo Modelo

```prisma
model UserCompetition {
  id                String                  @id @default(uuid()) @db.Uuid
  userId            String                  @db.Uuid
  competitionId     String                  @db.Uuid
  
  // Estado
  status            UserCompetitionStatus   @default(INTERESTED)
  
  // Resultados personales (opcionales)
  finishTime        String?                 // Formato: "HH:MM:SS"
  finishTimeSeconds Int?                    // Para cálculos
  position          Int?                    // Posición general
  categoryPosition  Int?                    // Posición en categoría
  
  // Notas y valoración personal
  notes             String?                 @db.Text
  personalRating    Int?                    // 1-5 estrellas
  
  // Fechas
  markedAt          DateTime                @default(now())
  completedAt       DateTime?               // Fecha real de participación
  updatedAt         DateTime                @updatedAt
  
  // Relaciones
  user              User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  competition       Competition             @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  
  @@unique([userId, competitionId])
  @@index([userId])
  @@index([competitionId])
  @@index([status])
  @@map("user_competitions")
}
```

#### 1.3 Actualizar modelo User

Buscar `model User` y añadir dentro:

```prisma
model User {
  // ... campos existentes ...
  
  // Añadir esta relación:
  userCompetitions  UserCompetition[]
  
  // ... resto del modelo ...
}
```

#### 1.4 Actualizar modelo Competition

Buscar `model Competition` y añadir dentro:

```prisma
model Competition {
  // ... campos existentes ...
  
  // Añadir esta relación:
  userCompetitions  UserCompetition[]
  
  // ... resto del modelo ...
}
```

#### 1.5 Aplicar migración

```bash
npx prisma migrate dev --name add_user_competitions
npx prisma generate
```

---

### PASO 2: Crear Service

Crear archivo `src/services/user-competition.service.ts`

> Ver contenido completo en archivo adjunto: `user-competition.service.ts`

**Métodos principales:**
- `markCompetition()` - Marcar competición
- `unmarkCompetition()` - Desmarcar
- `addResult()` - Añadir resultado personal
- `getUserCompetitions()` - Listar mis competiciones
- `getUserStats()` - Obtener estadísticas
- `getGlobalRanking()` - Rankings globales

---

### PASO 3: Crear Controller

Crear archivo `src/controllers/user-competition.controller.ts`

> Ver contenido completo en archivo adjunto: `user-competition.controller.ts`

**Endpoints implementados:**
- `markCompetition()` - POST /me/competitions/:id/mark
- `unmarkCompetition()` - DELETE /me/competitions/:id
- `addResult()` - POST /me/competitions/:id/result
- `getMyCompetitions()` - GET /me/competitions
- `getMyStats()` - GET /me/stats
- Y más...

---

### PASO 4: Crear Schemas de Validación

Crear archivo `src/schemas/user-competition.schema.ts`

> Ver contenido completo en archivo adjunto: `user-competition.schema.ts`

**Schemas creados:**
- `markCompetitionSchema`
- `addResultSchema`
- `updateUserCompetitionSchema`
- `getMyCompetitionsSchema`
- `globalRankingSchema`
- Y más...

---

### PASO 5: Crear Routes

Crear archivo `src/routes/user-competition.routes.ts`

> Ver contenido completo en archivo adjunto: `user-competition.routes.ts`

---

### PASO 6: Actualizar index.ts

Editar `src/index.ts`:

```typescript
// 1. Importar
import userCompetitionRoutes from './routes/user-competition.routes';

// 2. Usar (añadir junto a otras rutas)
app.use('/api/v1', userCompetitionRoutes);
```

---

## 🧪 TESTING

### 1. Verificar que el servidor inicia

```bash
npm run dev
```

### 2. Probar endpoint público

```bash
curl http://localhost:3001/api/v1/rankings/competitions
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "data": [],
  "count": 0
}
```

### 3. Probar endpoint privado (requiere login)

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword"}'

# 2. Copiar el accessToken de la respuesta

# 3. Marcar competición
curl -X POST http://localhost:3001/api/v1/me/competitions/COMPETITION_ID/mark \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"INTERESTED"}'
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "message": "Competition marked successfully",
  "data": {
    "id": "...",
    "userId": "...",
    "competitionId": "...",
    "status": "INTERESTED",
    ...
  }
}
```

---

## 📊 ENDPOINTS COMPLETOS

### Rutas Privadas (requieren `Authorization: Bearer TOKEN`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/me/competitions` | Mis competiciones |
| GET | `/api/v1/me/competitions/:id` | Detalle de mi competición |
| POST | `/api/v1/me/competitions/:id/mark` | Marcar competición |
| POST | `/api/v1/me/competitions/:id/result` | Añadir resultado |
| PUT | `/api/v1/me/competitions/:id` | Actualizar mi competición |
| DELETE | `/api/v1/me/competitions/:id` | Desmarcar |
| GET | `/api/v1/me/stats` | Mis estadísticas |

### Rutas Públicas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/rankings/:type` | Rankings globales |
| GET | `/api/v1/users/:userId/competitions` | Competiciones de usuario |
| GET | `/api/v1/users/:userId/stats` | Estadísticas de usuario |

---

## 📝 EJEMPLOS DE USO

### Marcar como "Me interesa"

```bash
POST /api/v1/me/competitions/abc-123/mark
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "status": "INTERESTED"
}
```

### Marcar como "Me inscribí"

```bash
POST /api/v1/me/competitions/abc-123/mark
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "status": "REGISTERED"
}
```

### Añadir resultado (completada)

```bash
POST /api/v1/me/competitions/abc-123/result
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "finishTime": "04:35:20",
  "position": 156,
  "categoryPosition": 23,
  "notes": "Gran experiencia, muy dura pero gratificante",
  "personalRating": 5,
  "completedAt": "2025-06-15T14:35:20Z"
}
```

### Obtener mis estadísticas

```bash
GET /api/v1/me/stats
Authorization: Bearer TOKEN
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "totalCompetitions": 15,
    "byStatus": {
      "interested": 3,
      "registered": 2,
      "confirmed": 1,
      "completed": 8,
      "dnf": 1,
      "dns": 0
    },
    "completedStats": {
      "totalCompleted": 8,
      "totalKm": 485.5,
      "totalElevation": 28500,
      "averageTime": "04:25:30",
      "fastestRace": {
        "competitionId": "...",
        "name": "Trail 21K Barcelona",
        "time": "02:15:30",
        "timeSeconds": 8130
      }
    }
  }
}
```

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Actualizado `prisma/schema.prisma` con enum y modelo
- [ ] Añadidas relaciones en User y Competition
- [ ] Ejecutado `npx prisma migrate dev --name add_user_competitions`
- [ ] Ejecutado `npx prisma generate`
- [ ] Creado `src/services/user-competition.service.ts`
- [ ] Creado `src/controllers/user-competition.controller.ts`
- [ ] Creado `src/schemas/user-competition.schema.ts`
- [ ] Creado `src/routes/user-competition.routes.ts`
- [ ] Actualizado `src/index.ts` con las nuevas rutas
- [ ] Reiniciado servidor
- [ ] Probado endpoint público `/rankings/competitions`
- [ ] Probado endpoint privado `/me/competitions` con token

---

## 🎯 SIGUIENTE PASO: FRONTEND

Una vez completado el backend, continuaremos con:

**Fase 6 Frontend:**
1. Tipos TypeScript para UserCompetition
2. API Client (service)
3. Hook useUserCompetitions
4. Componentes de UI
5. Páginas de perfil
6. Integración con páginas existentes

---

## 📁 ARCHIVOS ADJUNTOS

1. `user-competition.service.ts` - Service completo
2. `user-competition.controller.ts` - Controller completo
3. `user-competition.schema.ts` - Schemas de validación
4. `user-competition.routes.ts` - Rutas de Express

---

**✅ Una vez completado el backend, confirma para continuar con el frontend!**
