# 🏛️ Registro de Decisiones de Arquitectura (ADR) - Proyecto Minuta

Este documento registra las decisiones arquitectónicas clave, sus justificaciones, alternativas evaluadas y compensaciones (*trade-offs*).

---

## ADR 001: Marco de Trabajo y Protocolo de Ingeniería Senior
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** Se establece un marco riguroso de desarrollo en 8 etapas (Contexto de Negocio, Revisión de Arquitectura, Seguridad Ofensiva/Defensiva, Cobertura de Tests, Code Review Autocrítico, Consistencia UX, Documentación ADR y Checkpoints de Validación).
- **Decisión:** Ningún cambio estructural o módulo nuevo se desarrollará sin previa validación del contexto de negocio, análisis de trade-offs, auditoría de inputs maliciosos y consentimiento en checkpoints.
- **Consecuencias:**
  - *Positivas:* Menor deuda técnica, alta auditabilidad, código predecible y seguro.
  - *Compensaciones (Trade-offs):* Requiere mayor interacción inicial de alineación antes de la codificación masiva.

---

## ADR 002: Persistencia Híbrida (Vercel Serverless / Upstash Redis + JSON Files)
- **Fecha:** 2026-09-03
- **Estado:** Aceptado
- **Contexto:** Despliegue en arquitectura Serverless en Vercel con necesidad de persistencia entre invocaciones en frío (cold starts) y compatibilidad offline/local.
- **Decisión:** Usar Upstash Redis en producción como capa primaria, respaldado por archivos JSON con importación estática (`BUNDLED_DATA`) y directorio `/tmp` en serverless.
- **Compensaciones (Trade-offs):**
  - *Ventajas:* Despliegue sin costo de servidor dedicado, baja latencia, desarrollo local sin dependencias externas.
  - *Limitaciones de escalabilidad:* Los archivos JSON locales no escalan a alta concurrencia de escrituras masivas simultáneas (> 1,000 req/s); en fase de hiper-escala requerirá migración completa a PostgreSQL/Supabase.

---

## ADR 003: Arquitectura y Priorización: Costo (C) > Velocidad (A) > Hiper-Escalabilidad (B)
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** El usuario final principal es el Guarda de Seguridad en garita (operando desde PC, tablet o celular) y el Residente (operando vía Web App móvil). La meta primaria es cero costo de infraestructura fija y máxima agilidad para reemplazar libros manuales de papel y prevenir intrusiones/pérdidas.
- **Decisión:**
  1. Mantener arquitectura Monolito Modular con Frontend React SPA (Vite + Tailwind CSS + Lucide Icons + PWA-ready) y Backend Express Serverless en Vercel.
  2. Implementar endpoints desacoplados por dominio (`/minuta`, `/accesos`, `/paquetes`, `/parqueaderos`, `/rondas`, `/unidades`, `/asambleas`, `/equipos`).
  3. Establecer PINs criptográficos de 4 dígitos para entrega de encomiendas y pases temporales QR para evitar intrusos.
- **Trade-offs y Cuellos de Botella identificados:**
  - *Cuello de Botella 1 (Concurrencia de Escritura):* Al operar con persistencia serverless sobre archivos JSON y locks en memoria por instancia, 50 guardas escribiendo al mismo milisegundo en distintas lambdas podrían generar carreras de sincronización sin Redis activo.
  - *Cuello de Botella 2 (Paginación en Memoria):* Endpoints de auditoría cargan colecciones completas a memoria antes de filtrar. Para > 10,000 registros históricos requerirá paginación por cursor y streams.
- **Plan de mitigación:** Validaciones estrictas con Zod, Rate Limiting distribuido y separación estricta entre lectura y mutaciones.

---

## ADR 004: Tríada Operativa Local: Garita + Portal Residente + Auditoría de Seguridad
- **Fecha:** 2026-09-04
- **Estado:** Aceptado
- **Contexto:** El cliente solicita ejecutar integralmente los tres pilares del sistema (Garita Operativa, Portal del Residente y Auditoría de Seguridad) de forma 100% local y autosuficiente (sin dependencias pagas ni infraestructura externa obligatoria).
- **Decisión:**
  1. **Pilar 1 (Garita Operativa):**
     - Teclado numérico táctil optimizado para tablets/móvil para validación de PINs de entrega en < 3 segundos.
     - Validador visual instantáneo de pases QR con un solo toque (`Aprobar Ingreso`).
     - Creación ágil de ingresos con asignación automática de bahía de visitantes.
  2. **Pilar 2 (Portal Móvil de Residentes):**
     - Generador de Pases QR con enlace directo para compartir por WhatsApp.
     - Visualizador grande de PIN de encomienda para mostrar al guarda.
     - Calendario de reservas de zonas comunes con prevención de solapamiento de horarios.
  3. **Pilar 3 (Control y Auditoría de Seguridad):**
     - Monitor en tiempo real de vehículos en bahías de visitantes con alerta visual de tiempo excedido (> 4 horas de cortesía).
     - Botón de citofonía y reubicación/liberación de bahía.
     - Exportación certificada de Minuta y Bitácora a CSV/Excel con hash de integridad.
- **Consecuencias:**
  - *Positivas:* Experiencia de usuario completa, responsive, táctil, segura y sin costos operativos.
  - *Compensaciones:* Los pases QR se validan localmente contra los IDs pre-autorizados en la persistencia local/serverless.

---
