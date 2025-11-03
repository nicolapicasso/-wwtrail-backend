<<<<<<< HEAD
# WWTRAIL Backend API

API REST completa para WWTRAIL - Plataforma mundial de competiciones de trail running.

## 🏗️ Stack Tecnológico

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + PostGIS 3.4
- **ORM**: Prisma
- **Cache**: Redis 7
- **Auth**: JWT + bcrypt
- **Validation**: Zod

## 📋 Características

- ✅ Autenticación JWT con refresh tokens
- ✅ Sistema de roles (ADMIN, ORGANIZER, ATHLETE, VIEWER)
- ✅ CRUD completo de competiciones
- ✅ Búsquedas geoespaciales con PostGIS
- ✅ Sistema multiidioma (ES, IT, EN, CA, FR, DE)
- ✅ Cache con Redis
- ✅ Rate limiting
- ✅ Logging con Winston
- ✅ Validación con Zod
- ⏳ Traducciones automáticas con IA (TODO)
- ⏳ Upload de archivos (TODO)
- ⏳ Sistema de participantes y resultados (TODO)

## 🚀 Setup Inicial

### Prerrequisitos

- Node.js 20+
- Docker y Docker Compose
- npm o pnpm

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd wwtrail-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
DATABASE_URL="postgresql://wwtrail:wwtrail_password@localhost:5432/wwtrail_db"
JWT_SECRET="tu-secreto-jwt-super-seguro"
JWT_REFRESH_SECRET="tu-secreto-refresh-super-seguro"
```

### 4. Iniciar servicios (PostgreSQL + Redis)

```bash
docker-compose up -d
```

Verifica que están corriendo:

```bash
docker-compose ps
```

### 5. Crear la base de datos y migrar

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear migraciones y aplicarlas
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver la BD
npm run prisma:studio
```

### 6. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📚 Endpoints Principales

### Health Check

```bash
GET /health
```

### Autenticación

```bash
POST /api/v1/auth/register     # Registrar usuario
POST /api/v1/auth/login        # Login
POST /api/v1/auth/refresh      # Refrescar token
POST /api/v1/auth/logout       # Logout
GET  /api/v1/auth/profile      # Perfil (requiere auth)
```

### Competiciones

```bash
GET    /api/v1/competitions              # Listar competiciones
GET    /api/v1/competitions/nearby       # Buscar cercanas (PostGIS)
GET    /api/v1/competitions/:id          # Ver competición
GET    /api/v1/competitions/slug/:slug   # Ver por slug
POST   /api/v1/competitions              # Crear (ORGANIZER/ADMIN)
PATCH  /api/v1/competitions/:id          # Actualizar (ORGANIZER/ADMIN)
DELETE /api/v1/competitions/:id          # Eliminar (ORGANIZER/ADMIN)
```

## 🧪 Ejemplos de Uso

### 1. Registrar un usuario

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User",
    "language": "ES"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### 3. Crear competición

```bash
curl -X POST http://localhost:3001/api/v1/competitions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "name": "Trail Sierra Nevada 2025",
    "description": "Competición épica en Sierra Nevada",
    "type": "TRAIL",
    "startDate": "2025-06-15T09:00:00Z",
    "country": "España",
    "city": "Granada",
    "latitude": 37.0961,
    "longitude": -3.5968,
    "distance": 42.5,
    "elevation": 3000,
    "website": "https://trailsierranevada.com"
  }'
```

### 4. Buscar competiciones cercanas (PostGIS)

```bash
curl "http://localhost:3001/api/v1/competitions/nearby?latitude=40.4168&longitude=-3.7038&radius=100"
```

### 5. Buscar competiciones con filtros

```bash
curl "http://localhost:3001/api/v1/competitions?page=1&limit=10&type=TRAIL&country=España&search=sierra"
```

## 📁 Estructura del Proyecto

```
wwtrail-backend/
├── prisma/
│   └── schema.prisma           # Esquema de base de datos
├── src/
│   ├── config/
│   │   ├── database.ts         # Cliente Prisma
│   │   └── redis.ts            # Cliente Redis
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── competition.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── error.middleware.ts # Error handling
│   │   ├── validate.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── competition.routes.ts
│   ├── schemas/
│   │   ├── auth.schema.ts      # Validación Zod
│   │   └── competition.schema.ts
│   ├── services/
│   │   ├── auth.service.ts     # Lógica de negocio
│   │   └── competition.service.ts
│   ├── utils/
│   │   ├── logger.ts           # Winston logger
│   │   └── slugify.ts
│   └── index.ts                # Entry point
├── docker-compose.yml          # PostgreSQL + Redis
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Base de Datos

### Modelos Principales

- **User**: Usuarios del sistema (con roles)
- **Competition**: Competiciones de trail
- **Category**: Categorías de una competición (distancias)
- **Participant**: Participantes registrados
- **Result**: Resultados de participantes
- **CompetitionTranslation**: Traducciones multiidioma
- **Review**: Reseñas de competiciones
- **Favorite**: Competiciones favoritas

### PostGIS

Las competiciones tienen un campo `location` de tipo `geometry(Point, 4326)` que permite:
- Buscar competiciones cercanas
- Calcular distancias
- Filtrar por radio geográfico

## 🔒 Autenticación

Sistema JWT con dos tokens:

1. **Access Token**: Expira en 7 días (configurable)
2. **Refresh Token**: Expira en 30 días (guardado en BD)

Headers de autenticación:
```
Authorization: Bearer <access-token>
```

## 🎭 Roles y Permisos

- **ADMIN**: Acceso total
- **ORGANIZER**: Crear y gestionar competiciones
- **ATHLETE**: Registrarse en competiciones, ver resultados
- **VIEWER**: Solo lectura

## 🛠️ Scripts Disponibles

```bash
npm run dev              # Desarrollo con hot reload
npm run build            # Build de producción
npm start                # Iniciar producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Crear migración
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:seed      # Seed de datos (TODO)
npm run prisma:reset     # Resetear BD
npm run lint             # ESLint
npm run format           # Prettier
npm test                 # Tests (TODO)
```

## 📝 TODO

### Funcionalidades Pendientes

- [ ] Sistema de categorías (service + controller + routes)
- [ ] Sistema de participantes (service + controller + routes)
- [ ] Sistema de resultados (service + controller + routes)
- [ ] Sistema de reseñas (service + controller + routes)
- [ ] Traducciones automáticas con IA (Anthropic/OpenAI)
- [ ] Upload de archivos (imágenes, GPX, KML)
- [ ] Sistema de notificaciones
- [ ] Paginación avanzada con cursor
- [ ] Búsqueda full-text con pg_trgm
- [ ] Exportar resultados (CSV, PDF)
- [ ] Sistema de favoritos
- [ ] Tests unitarios y E2E
- [ ] Documentación con Swagger/OpenAPI
- [ ] CI/CD
- [ ] Seed de datos de ejemplo

### Mejoras Técnicas

- [ ] Implementar caché más inteligente
- [ ] Optimizar queries con Prisma
- [ ] Añadir índices adicionales en BD
- [ ] Implementar webhooks
- [ ] Sistema de jobs con Bull/BullMQ
- [ ] Monitoreo con Prometheus
- [ ] Health checks avanzados

## 🔧 Troubleshooting

### El servidor no inicia

```bash
# Verificar que Docker esté corriendo
docker-compose ps

# Reiniciar servicios
docker-compose restart

# Ver logs
docker-compose logs -f
```

### Error de conexión a PostgreSQL

Verifica que la DATABASE_URL en `.env` sea correcta:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Error "PostGIS extension not found"

```bash
# Recrear contenedores
docker-compose down -v
docker-compose up -d

# Ejecutar init-db.sql manualmente
docker-compose exec postgres psql -U wwtrail -d wwtrail_db -f /docker-entrypoint-initdb.d/init-db.sql
```

### Prisma no encuentra el cliente

```bash
npm run prisma:generate
```

## 📊 Monitoreo

### Logs

Los logs se guardan en:
- Consola (development)
- `logs/error.log` (production)
- `logs/combined.log` (production)

### Health Check

```bash
curl http://localhost:3001/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📄 Licencia

MIT

## 👥 Equipo

WWTRAIL Development Team

---

**Estado actual**: MVP Backend en desarrollo ✅
- ✅ Setup inicial completo
- ✅ Autenticación funcionando
- ✅ CRUD de competiciones completo
- ⏳ Próximo: Frontend + funcionalidades restantes
=======
# -wwtrail-backend
Backend API para WWTRAIL - Portal de trail running con Node.js, Express, PostgreSQL y Prisma
>>>>>>> 8a4ecc0f56c52d6b68cf35f80d082cc4685ab0be
