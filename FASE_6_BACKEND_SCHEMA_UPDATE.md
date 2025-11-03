# 📝 FASE 6 - Actualización de Prisma Schema

## Añadir al archivo `prisma/schema.prisma`

### 1. Nuevo Enum UserCompetitionStatus

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

### 2. Nuevo Modelo UserCompetition

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

### 3. Actualizar Modelo User

Añadir la relación:

```prisma
model User {
  // ... campos existentes ...
  
  // Añadir esta línea:
  userCompetitions  UserCompetition[]
  
  // ... resto de relaciones ...
}
```

### 4. Actualizar Modelo Competition

Añadir la relación:

```prisma
model Competition {
  // ... campos existentes ...
  
  // Añadir esta línea:
  userCompetitions  UserCompetition[]
  
  // ... resto de relaciones ...
}
```

---

## 🔄 Comandos para aplicar cambios

```bash
# 1. Generar migración
npx prisma migrate dev --name add_user_competitions

# 2. Regenerar Prisma Client
npx prisma generate

# 3. (Opcional) Ver en Prisma Studio
npx prisma studio
```

---

## ✅ Verificación

Después de aplicar la migración, verifica que la tabla se creó:

```sql
-- Conectar a PostgreSQL
psql -U wwtrail -d wwtrail_dev

-- Ver la tabla
\d user_competitions

-- Debería mostrar todas las columnas definidas
```

---

## 📊 Estructura Final

Tras estos cambios tendrás:

- ✅ Enum `UserCompetitionStatus` con 6 estados
- ✅ Tabla `user_competitions` con todos los campos
- ✅ Relación `User` → `UserCompetition` (1:N)
- ✅ Relación `Competition` → `UserCompetition` (1:N)
- ✅ Índices en userId, competitionId y status
- ✅ Unique constraint en (userId + competitionId)

---

**Siguiente paso:** Crear el Service para UserCompetition
