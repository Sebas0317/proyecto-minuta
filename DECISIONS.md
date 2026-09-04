# 🏛️ Registro de Decisiones de Arquitectura (ADR) - Proyecto Minuta

Este documento registra las decisiones arquitectónicas clave, sus justificaciones, alternativas evaluadas y compensaciones (*trade-offs*).

---

## ADR 001: Marco de Trabajo y Protocolo de Ingeniería Senior
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** Se establece un marco riguroso de desarrollo en 8 etapas (Contexto de Negocio, Revisión de Arquitectura, Seguridad Ofensiva/Defensiva, Cobertura de Tests, Code Review Autocrítico, Consistencia UX, Documentación ADR y Checkpoints de Validación).
- **Decisión:** Ningún cambio estructural o módulo nuevo se desarrollará sin previa validación del contexto de negocio, análisis de trade-offs, auditoría de inputs maliciosos y consentimiento en checkpoints.

---

## ADR 002: Persistencia Híbrida (Vercel Serverless / Upstash Redis + JSON Files)
- **Fecha:** 2026-09-03
- **Estado:** Aceptado
- **Contexto:** Despliegue en arquitectura Serverless en Vercel con necesidad de persistencia entre invocaciones en frío (cold starts) y compatibilidad offline/local.
- **Decisión:** Usar Upstash Redis en producción como capa primaria, respaldado por archivos JSON con importación estática (`BUNDLED_DATA`) y directorio `/tmp` en serverless.

---

## ADR 003: Arquitectura y Priorización: Costo (C) > Velocidad (A) > Hiper-Escalabilidad (B)
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** El usuario final principal es el Guarda de Seguridad en garita (operando desde PC, tablet o celular) y el Residente (operando vía Web App móvil). La meta primaria es cero costo de infraestructura fija y máxima agilidad para reemplazar libros manuales de papel y prevenir intrusiones/pérdidas.

---

## ADR 004: Tríada Operativa Local: Garita + Portal Residente + Auditoría de Seguridad
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** El cliente solicita ejecutar integralmente los tres pilares del sistema (Garita Operativa, Portal del Residente y Auditoría de Seguridad) de forma 100% local y autosuficiente.

---

## ADR 005: Sanitización DTO de PII, Obligatoriedad Estricta de PINs y Unificación de Persistencia en Asambleas
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** Code Review Senior detectó fuga de PII en `GET /unidades`, bypass condicional de PIN en `entregarPaquete`, exposición de PINs en listados de paquetes y uso de `fs` síncrono en `asambleasController`.
- **Decisión:**
  1. Implementar DTO `serializeUnidad` que elimina `documento`, `telefono`, `email` y `pinAcceso` en respuestas no administrativas.
  2. Forzar validación estricta obligatoria de `codigoRetiro` en `entregarPaquete` (HTTP 400 si falta o difiere).
  3. Sanitizar `codigoRetiro` en `getPaquetesByApto` para que nunca se filtre en listados públicos.
  4. Migrar `asambleasController` a `persistence.js` (`getAsambleas`, `setAsambleas`) garantizando atomicidad y compatibilidad con Vercel Serverless `/tmp`.
- **Consecuencias:**
  - *Positivas:* Cumplimiento estricto de Habeas Data, seguridad robusta contra retiro no autorizado de encomiendas y compatibilidad total con serverless.

---

## ADR 006: Hasheo Criptográfico de PINs (bcrypt), Rate Limiting Compuesto (IP + Recurso) y Activación de Upstash Redis
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** Se provisionó la base de datos Upstash Redis en Vercel (`upstash-kv-rose-crystal`, 500k comandos/mes gratis) resolviendo la pérdida de votos y asambleas entre cold starts. Se requería cerrar la vulnerabilidad de PINs en texto plano y ataques de fuerza bruta en Serverless.
- **Decisión:**
  1. Hashear todos los PINs (`pinAcceso` y `codigoRetiro`) con `bcrypt` (factor de costo 10). Se migraron 100 unidades y 18 paquetes existentes a `pinAccesoHash` y `codigoRetiroHash`.
  2. Retornar el PIN en claro únicamente en la respuesta `201 Created` para el guarda y notificación por WhatsApp; a partir de ese momento solo existe el hash.
  3. Implementar middleware de rate limiting compuesto (`pinCompoundRateLimiter`) con ventana de 15 min y umbral de 5 intentos fallidos tanto por IP como por ID de paquete/recurso, respaldado en Upstash Redis para evitar evasión por rotación de lambdas o proxies.
  4. Purgar completamente referencias históricas del sistema hotelero y estandarizar la denominación técnica como *Minuta Residencial*.
- **Consecuencias:**
  - *Positivas:* Blindaje contra fuerza bruta distribuida y ataques de diccionario a paquetes. Los votos de asambleas persisten de forma permanente en Redis sin costo (\$0).

