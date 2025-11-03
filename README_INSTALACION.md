# 📦 FASE 6 BACKEND - Instrucciones de Instalación

## 📋 Contenido del paquete

Este paquete contiene todos los archivos necesarios para implementar el **Sistema de Tracking Personal de Competiciones** en el backend de WWTRAIL.

### Archivos incluidos:

1. **FASE_6_BACKEND_COMPLETO.md** - 📘 Documentación completa
2. **FASE_6_BACKEND_SCHEMA_UPDATE.md** - Actualización del schema Prisma
3. **FASE_6_UPDATE_INDEX.md** - Cómo actualizar index.ts
4. **user-competition.service.ts** - Lógica de negocio
5. **user-competition.controller.ts** - Controlador HTTP
6. **user-competition.schema.ts** - Validaciones Zod
7. **user-competition.routes.ts** - Rutas Express

---

## 🚀 Instalación Rápida

### 1. Copiar archivos al proyecto

```bash
cd tu-proyecto-backend

# Copiar service
cp user-competition.service.ts src/services/

# Copiar controller
cp user-competition.controller.ts src/controllers/

# Copiar schemas
cp user-competition.schema.ts src/schemas/

# Copiar routes
cp user-competition.routes.ts src/routes/
```

### 2. Actualizar Prisma Schema

Abre `prisma/schema.prisma` y sigue las instrucciones en:
→ **FASE_6_BACKEND_SCHEMA_UPDATE.md**

Luego ejecuta:
```bash
npx prisma migrate dev --name add_user_competitions
npx prisma generate
```

### 3. Actualizar index.ts

Abre `src/index.ts` y sigue las instrucciones en:
→ **FASE_6_UPDATE_INDEX.md**

### 4. Reiniciar servidor

```bash
npm run dev
```

### 5. Probar

```bash
# Endpoint público (debería funcionar inmediatamente)
curl http://localhost:3001/api/v1/rankings/competitions

# Endpoint privado (requiere login primero)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/v1/me/competitions
```

---

## 📖 Documentación Completa

Lee el archivo **FASE_6_BACKEND_COMPLETO.md** para:
- Descripción detallada de cada archivo
- Ejemplos de uso de todos los endpoints
- Estructura de respuestas
- Testing completo
- Troubleshooting

---

## ✅ Checklist

- [ ] Archivos copiados a las carpetas correctas
- [ ] Prisma schema actualizado
- [ ] Migración ejecutada
- [ ] index.ts actualizado
- [ ] Servidor reiniciado
- [ ] Endpoints probados

---

## 🆘 Soporte

Si encuentras algún problema:
1. Revisa que todos los archivos estén en las carpetas correctas
2. Verifica que la migración se ejecutó sin errores
3. Comprueba que no hay errores de TypeScript
4. Revisa los logs del servidor

---

## 🎯 Siguiente Paso

Una vez completado el backend, podemos continuar con:
**Fase 6 Frontend** - Interfaz de usuario para tracking de competiciones

---

**¡Buena suerte con la implementación! 🚀**
