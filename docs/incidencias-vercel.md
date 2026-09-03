# Incidencias de Producción — Vercel

## Índice

1. [Pantalla en blanco tras login (ruta admin incorrecta)](#1-pantalla-en-blanco-tras-login)
2. [CORS bloqueado en producción](#2-cors-bloqueado-en-producción)
3. [FUNCTION_INVOCATION_FAILED (trust proxy + rate-limit)](#3-function_invocation_failed)
4. [API devuelve NOT_FOUND 404 (orden de middleware)](#4-api-devuelve-not_found-404)
5. [Frontend no se sirve (static files 404)](#5-frontend-no-se-sirve-static-files-404)
6. [Navegación en sub-rutas del admin hace parpadear la URL](#6-navegación-en-sub-rutas-del-admin-hace-parpadear-la-url)

---

## 1. Pantalla en blanco tras login

### Problema
Tras iniciar sesión como admin, la app navegaba a `/#/admin` pero mostraba una pantalla en blanco. El login funcionaba (API respondía ok), pero no se veía el panel admin.

### Causa
La ruta del panel admin estaba definida con `path="/login/forgot"` en vez de `path="/admin"` en `App.jsx`. Después del login, `handleRol('admin')` disparaba un `useEffect` que navegaba a `/admin`. Pero como no existía una ruta para `/admin`, el catch-all (`path="*"`) redirigía a `/`. En `/`, el `ProtectedRoute` con `allowed="guest"` veía `rol='admin'` y retornaba `null` → pantalla en blanco.

### Solución
```jsx
// ❌ Antes
<Route path="/login/forgot" element={...}>

// ✅ Después
<Route path="/admin" element={...}>
```

**Archivo:** `frontend/src/App.jsx`

---

## 2. CORS bloqueado en producción

### Problema
El frontend en `hotel-system-2c6g.vercel.app` hacía peticiones fetch a `/_/backend/v1/...` (mismo origen vía rewrite). El backend respondía con `"Not allowed by CORS"`.

### Causa
El CORS config usaba `process.env.VERCEL_URL` para construir la lista de orígenes permitidos. Pero en Vercel, `VERCEL_URL` contiene la URL del deploy específico (ej: `hotel-system-2c6g-mesw4qgjt-...vercel.app`), NO la URL de producción (`hotel-system-2c6g.vercel.app`). El `Origin` del navegador no matcheaba.

### Solución
```js
// backend/server.js
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // ✅ Permitir cualquier subdominio de vercel.app en producción
    if (process.env.VERCEL) {
      const host = origin.replace(/^https?:\/\//, '');
      if (host.endsWith('.vercel.app') || host === process.env.VERCEL_URL)
        return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
```

**Archivo:** `backend/server.js`

---

## 3. FUNCTION_INVOCATION_FAILED

### Problema
La serverless function de Vercel se desplegaba correctamente, pero al recibir el primer request crasheaba con `FUNCTION_INVOCATION_FAILED`.

### Causa
`app.set('trust proxy', true)` combinado con `express-rate-limit` v8. Express-rate-limit v8 lanza `ERR_ERL_PERMISSIVE_TRUST_PROXY` SÍNCRONAMENTE al recibir el primer request si `trust proxy` es `true` (boolean) en vez de un entero. Como la excepción es síncrona y no está capturada, crashea toda la función serverless.

### Solución
```js
// ❌ Antes
app.set('trust proxy', true);

// ✅ Después
app.set('trust proxy', 1);

// ✅ También agregar validación en rate limiters
createLimiter({ validate: { trustProxy: false } });
```

**Archivos:** `backend/server.js`, `backend/src/middleware/rateLimiters.js`

---

## 4. API devuelve NOT_FOUND 404

### Problema
La función serverless se cargaba (ya no crasheaba), pero TODAS las rutas de la API devolvían `{"error":"Recurso no encontrado"}`.

### Causa
El middleware que limpia el prefijo `/api` de `req.url` estaba registrado DESPUÉS de las rutas de health, auth y swagger. Express evalúa middleware/rutas en orden de registro. Cuando el prefijo se limpiaba (cambiando `req.url` de `/api/v1/health` a `/v1/health`), Express ya había saltado las rutas de health porque al evaluarlas `req.url` aún era `/api/v1/health`.

```
Orden ANTES del fix:
  1. authRoutes  (/v1/auth)  ← req.url = /api/v1/health → no match
  2. healthRoutes (/v1/health) ← req.url = /api/v1/health → no match
  3. Prefix stripping middleware ← req.url = /v1/health
  4. roomsRoutes (/v1/rooms) ← req.url = /v1/health → no match
  5. notFoundHandler → 404

Orden DESPUÉS del fix:
  1. Prefix stripping middleware ← req.url = /api/v1/health → /v1/health
  2. authRoutes  (/v1/auth)
  3. healthRoutes (/v1/health) ← req.url = /v1/health → MATCH ✓
```

### Solución
Mover el prefix stripping middleware ANTES de TODAS las rutas:

```js
// backend/server.js — despuès de body parsers, ANTES de cualquier ruta
if (process.env.VERCEL) {
  const PREFIXES = ['/_/backend', '/api'];
  app.use((req, _res, next) => {
    for (const prefix of PREFIXES) {
      if (req.url.startsWith(prefix)) {
        req.url = req.url.slice(prefix.length);
        break;
      }
    }
    next();
  });
}
```

**Archivo:** `backend/server.js`

---

## 5. Frontend no se sirve (static files 404)

### Problema
La API funcionaba, pero `GET /` y `GET /index.html` devolvían 404 de Vercel. El build del frontend se ejecutaba correctamente (vite build producía `frontend/dist/`) pero Vercel no servía los archivos.

### Causa
Al usar `"builds"` explícito en `vercel.json`, el builder `@vercel/static-build` monta los archivos estáticos usando un `mountpoint` que por defecto es `path.dirname(entrypoint)`. Como `entrypoint` era `frontend/package.json`, el mountpoint era `frontend/`, y los archivos se servían en `/frontend/...` en vez de `/`.

### Solución
Agregar `routePrefix: "/"` al config del `@vercel/static-build` para que el mountpoint sea `.` (raíz):

```json
{
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "routePrefix": "/"
      }
    }
  ],
  "rewrites": [
    { "source": "/_/backend/(.*)", "destination": "/api" },
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/v1/(.*)", "destination": "/api/v1/$1" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Nota:** `destination: "/api"` (sin `$1`) es correcto — Vercel preserva la URL original y la pasa a la función. La limpieza del prefijo la hace Express.

**Archivo:** `vercel.json`

---

## 6. Navegación en sub-rutas del admin hace parpadear la URL

### Problema
Al hacer clic en enlaces del sidebar (Dashboard, Habitaciones, etc.) o al hacer clic en una habitación, la URL cambiaba brevemente y luego revertía al origen, produciendo un parpadeo visual. El contenido no se actualizaba.

### Causa
Tres issues combinados:

1. **`key={location.pathname}` en `<Routes>`**: Forzaba a React Router a desmontar/remontar TODO el árbol de rutas en cada navegación. En React Router v7, esto causaba que componentes hijos se destruyeran y recrearan, disparando efectos secundarios de navegación.

2. **`AnimatePresence mode="wait"` + prop `location` manual en `<Routes>`**: El `mode="wait"` hace que AnimatePresence espere a que termine la animación de salida antes de renderizar la nueva ruta. Durante ese lapso, React Router v7 puede perder el seguimiento de la ruta activa, y componentes como `<Navigate>` (en `ProtectedRoute` o en el catch-all `SafeNavigate`) compiten por la navegación, causando que la URL rebote.

3. **Ruta admin sin `path="/admin/*"`**: Aunque el anidamiento estándar de rutas no requiere `/*` en el padre, en React Router v7 con HashRouter hay edge cases donde el catch-all (`path="*"`) intercepta la navegación a sub-rutas antes de que estas se resuelvan.

### Solución
Remover `AnimatePresence`, el `location` prop manual y la `key` de `<Routes>`:

```jsx
// ❌ Antes
import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const location = useLocation();

<AnimatePresence mode="wait" initial={false}>
  <Routes location={location} key={location.pathname}>
    ...
  </Routes>
</AnimatePresence>

// ✅ Después
import { Route, Routes, useNavigate } from 'react-router-dom';

<Routes>
  ...
</Routes>
```

**Archivo:** `frontend/src/App.jsx`
