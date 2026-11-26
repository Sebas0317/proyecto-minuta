# Política de Seguridad (Security Policy)

La seguridad de los datos residenciales, registros de control de acceso y credenciales de personal es prioritaria en **MinutaTech P.H.**.

## Versiones Soportadas

| Versión / Rama | Soporte de Seguridad |
| :--- | :--- |
| `main` (último commit) | ✅ Activo |
| Versiones anteriores | ❌ No soportadas |

## Cómo Reportar una Vulnerabilidad

**Por favor, NO abras un Issue público para reportar vulnerabilidades de seguridad.**

1. Utiliza la pestaña **Security → Report a vulnerability** (GitHub Private Vulnerability Reporting) del repositorio si está habilitada, o contacta directamente al mantenedor a través de su perfil de GitHub ([@Sebas0317](https://github.com/Sebas0317)).
2. Incluye en tu reporte:
   - Descripción clara del vector de ataque y componente afectado (`backend/src/...` o `frontend/src/...`).
   - Pasos reproducibles o prueba de concepto mínima (PoC).
   - Impacto potencial (escalación de privilegios, exposición de PII, bypass de autenticación, etc.).

Responderemos con acuse de recibo en un plazo objetivo de **72 horas** y coordinaremos la publicación del parche antes de cualquier divulgación pública.

## Arquitectura de Controles Actuales

- Tokens de sesión emitidos en cookies `HttpOnly` con `SameSite` estricto.
- Almacenamiento criptográfico de contraseñas y códigos PIN de retiro mediante `bcrypt`.
- Verificación de segundo factor (2FA) y tokens de recuperación de un solo uso invalidados automáticamente al rotar credenciales.
- Control de acceso basado en roles y permisos granulares (`owner`, `admin`, `guarda`).
- Limitación de tasa compuesta (`IP + identificador`) contra ataques de fuerza bruta distribuidos.
