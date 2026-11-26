# Guía de Contribución — MinutaTech P.H.

Gracias por tu interés en contribuir a **MinutaTech P.H.**. Este documento describe el flujo de trabajo, los estándares técnicos y las verificaciones necesarias para enviar cambios al repositorio.

---

## 1. Configuración del Entorno Local

1. Haz un **Fork** del repositorio y clónalo localmente:
   ```bash
   git clone https://github.com/<tu-usuario>/proyecto-minuta.git
   cd proyecto-minuta
   ```
2. Instala las dependencias con `npm ci` para respetar las versiones exactas de `package-lock.json`:
   ```bash
   cd backend && npm ci
   cd ../frontend && npm ci
   ```
3. Copia `backend/.env.example` a `backend/.env` y define un `JWT_SECRET` local de al menos 32 caracteres.

---

## 2. Estándares de Ingeniería

### Backend (`backend/`)
- **Concurrencia segura:** Toda ruta de mutación (`POST`, `PUT`, `PATCH`, `DELETE`) sobre archivos de estado debe pasar por `mutationLock('<dominio>')`.
- **Autorización explícita:** Usa los middlewares de `backend/src/middleware/rbac.js` (`requirePermission`) y nunca confíes en roles enviados en el cuerpo de la petición.
- **Zona horaria:** Las fechas operativas de negocio (PQRS, festivos, cierres diarios) deben calcularse respecto a `America/Bogota` (`UTC-5`).

### Frontend (`frontend/`)
- **Cero advertencias de ESLint:** Todo cambio debe pasar `npx eslint . --max-warnings=0`.
- **Pureza en React 19:** Evita sincronizar estado derivado dentro de `useEffect` y evita llamadas impuras durante el renderizado.
- **Diseño sobrio y operativo:** Mantén la paleta oscura institucional (`#090d16` / `slate-900`), jerarquía de **un único botón primario por barra de acciones**, tipografía tabular (`tabular-nums`) para cifras e iconografía vectorial (`lucide-react`) en lugar de emojis decorativos.

---

## 3. Verificación Antes de Abrir un Pull Request

Ejecuta ambas suites antes de hacer `push`:

```bash
# 1. Pruebas de backend
cd backend && npm test

# 2. Linter, pruebas de UI y build de producción en frontend
cd ../frontend && npx eslint . --max-warnings=0 && npm test && npm run build
```

---

## 4. Convención de Commits

Usamos **Conventional Commits** para mantener un historial claro:
- `feat(accesos): agregar filtro por contratista en portería`
- `fix(paqueteria): validar longitud exacta de PIN antes de hash`
- `docs(readme): documentar despliegue con Upstash Redis`
- `test(rbac): cubrir permisos de operador de turno`
