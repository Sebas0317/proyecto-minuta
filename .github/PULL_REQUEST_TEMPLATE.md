## Resumen del Cambio

Describe de forma concisa qué problema resuelve o qué funcionalidad introduce este Pull Request.

## Tipo de Cambio

- [ ] `feat`: Nueva funcionalidad operativa
- [ ] `fix`: Corrección de error o vulnerabilidad
- [ ] `perf` / `refactor`: Mejora de rendimiento o arquitectura interna
- [ ] `docs` / `chore`: Documentación, CI o mantenimiento

## Lista de Verificación

- [ ] `cd backend && npm test` pasa al 100%
- [ ] `cd frontend && npx eslint . --max-warnings=0` pasa con 0 errores y 0 advertencias
- [ ] `cd frontend && npm test && npm run build` finaliza correctamente
- [ ] Si se agregaron rutas de escritura en backend, cuentan con `requirePermission` y `mutationLock`
