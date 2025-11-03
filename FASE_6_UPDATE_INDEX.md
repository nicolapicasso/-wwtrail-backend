# 📝 Actualizar src/index.ts

## Añadir las rutas de UserCompetition

En el archivo `src/index.ts`, añade lo siguiente:

### 1. Importar las rutas

```typescript
// ... otras importaciones ...
import userCompetitionRoutes from './routes/user-competition.routes';
```

### 2. Usar las rutas

Añade esta línea junto con las demás rutas:

```typescript
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1', userCompetitionRoutes); // ← NUEVA LÍNEA
// ... otras rutas ...
```

**Nota:** Las rutas de userCompetition ya incluyen el prefijo completo:
- `/me/competitions/*` para rutas privadas
- `/rankings/*` para rankings públicos
- `/users/:userId/*` para perfiles públicos

Por eso se monta directamente en `/api/v1` sin prefijo adicional.

---

## Estructura final de rutas

Después de este cambio, tendrás:

### Rutas Privadas (requieren auth):
```
GET    /api/v1/me/competitions
GET    /api/v1/me/competitions/:competitionId
POST   /api/v1/me/competitions/:competitionId/mark
POST   /api/v1/me/competitions/:competitionId/result
PUT    /api/v1/me/competitions/:competitionId
DELETE /api/v1/me/competitions/:competitionId
GET    /api/v1/me/stats
```

### Rutas Públicas:
```
GET    /api/v1/rankings/:type
GET    /api/v1/users/:userId/competitions
GET    /api/v1/users/:userId/stats
```

---

## Verificar que funciona

```bash
# Reiniciar servidor
npm run dev

# Probar endpoint público
curl http://localhost:3001/api/v1/rankings/competitions

# Probar endpoint privado (requiere token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/v1/me/competitions
```
