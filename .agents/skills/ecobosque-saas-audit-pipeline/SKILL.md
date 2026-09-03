---
name: ecobosque-saas-audit-pipeline
description: Automated QA, SAST vulnerability scanning, dead code detection, and AI code review workflows for EcoBosque Hotel System. Use this skill before committing code or when auditing the system for SaaS production readiness.
---

# EcoBosque Hotel System — Pipeline de Auditoría SaaS y Calidad de Código

Esta habilidad (skill) es la guía ejecutiva de calidad para verificar, depurar y validar el estado "SaaS-ready" del proyecto. Combina 5 herramientas profesionales integradas en el ecosistema del repositorio y en GitHub Actions.

---

## 1. El Flujo de Trabajo para Resolución de Bugs (5 Pasos)

Cualquier agente IA que depure o implemente nuevas funcionalidades debe acatarse al siguiente protocolo secuencial de verificación:

1. **Diagnóstico y Análisis**: Ejecutar `npx ai-review-pipeline --file <target> --full --lang es` para obtener una evaluación por inteligencia artificial sobre posibles errores o anti-patrones en el archivo involucrado.
2. **Implementación del Parche**: Corregir el código en el IDE aplicando las reglas de seguridad e ingeniería del hotel.
3. **Verificación Local del Parche**: Re-ejecutar `npx ai-review-pipeline --file <target> --full --lang es` y verificar que las alertas previas se hayan disipado.
4. **Comprobación Estática y Testing**:
   * Pruebas del Backend: `cd backend && npm test` (debe alcanzar 100% de aprobación en Vitest).
   * Linter del Frontend: `cd frontend && npm run lint` (0 errores permitidos).
   * Pruebas del Frontend: `cd frontend && npx vitest run` (100% éxito).
5. **Comprobación Pre-Commit (Staging)**: Añadir cambios con `git add .` y ejecutar `npx ai-review-pipeline --staged --lang es` como compuerta final antes de proponer el cambio.

---

## 2. Las 5 Herramientas de Auditoría SaaS Integradas

### 2.1. `ai-review-pipeline` (Herramienta Principal) ✅
* **Estado**: Funcional. Utiliza el modelo gratuito incorporado (SiliconFlow/Qwen3-8B), sin requerir clave de API externa.
* **Configuración**: `/.ai-pipeline.json` en la raíz (incluye 20 reglas personalizadas para el proyecto).
* **Comandos Clave**:
  ```sh
  # Revisar cambios en el área de preparación (staged)
  npx ai-review-pipeline --staged --lang es

  # Revisar un archivo específico de principio a fin
  npx ai-review-pipeline --file <ruta/al/archivo> --full --lang es

  # Comparar rama actual contra main (ideal para PRs)
  npx ai-review-pipeline --branch main --lang es

  # Modo de autoficción iterativa (hasta 3 rondas)
  npx ai-review-pipeline --fix --max-rounds 3 --lang es
  ```

### 2.2. `semgrep` — SAST Bug Hunting (Seguridad y Análisis Estático) ✅
* **Estado**: Funcional y súper rápido (`pip install semgrep`). Más de 2000 reglas de comunidad para detectar vulnerabilidades en Node/Express y React.
* **Exclusiones Oficiales**: Controladas a través del archivo raíz `.semgrepignore`.
* **Comandos Clave**:
  ```sh
  # Escaneo SAST de seguridad completo en el repositorio
  semgrep --config=auto . --exclude="oi_env|node_modules|.opencode|dist|ai|scripts|backend/*.json.tmp|backend/users.json|docs/reports" --skip-unknown-extensions

  # Escaneo puntual a un archivo sospechoso
  semgrep --config=auto backend/src/middleware/sanitize.js
  ```

### 2.3. `knip` — Detección de Código Muerto y Dependencias Zombie ✅
* **Estado**: Instalado globally. Supervisa que no crezcan librerías no utilizadas, exportaciones abandonadas o manifiestos inconsistentes.
* **Configuración**: `knip.json` en la raíz, sincronizado con `"main": "backend/server.js"` de `package.json`.
* **Comando Clave**:
  ```sh
  npx knip --no-gitignore
  ```

### 2.4. `ocr` (Alibaba Open Code Review) ⚠️
* **Estado**: Configurado para SiliconFlow pero requiere inyección de clave API opcional para auditorías avanzadas de revisión de código. Integrado al hook Git pre-commit en `.git/hooks/pre-commit`.
* **Comandos Clave**:
  ```sh
  ocr review --audience agent --format json # Revisión staged JSON
  ocr review --preview                        # Listar archivos a auditar sin gastar tokens
  ```

### 2.5. `api-contract-sentinel` (Opencode Skill) 🧠
* **Estado**: Instalado en `.opencode/skills/api-contract-sentinel/` con invocación implícita permitida (`allow_implicit_invocation: true`).
* **Uso**: Se auto-activa o se invoca cuando se modifican rutas HTTP en `backend/src/routes/` para auditar que el contrato de la API y los esquemas en el cliente HTTP (`frontend/src/services/api.js`) no sufran desviaciones incompatibles (Drifting).

---

## 3. Matriz de Integración Continua (GitHub Actions: `.github/workflows/ci.yml`)

El pipeline CI en GitHub ejecuta en paralelo los 5 jobs que garantizan que el producto SaaS se mantenga infranqueable ante cada pull request o commit en `main`:
1. `backend`: Verifica dependencias, corre `npm test` (Vitest) y comprueba integridad modular de `jsonStore`, `idGenerator` y `pinGenerator`.
2. `frontend`: Corre linter de ESLint (`npm run lint`), suite Vitest de interfaz (`npx vitest run`) y valida compilación exitosa de producción (`npm run build`).
3. `semgrep`: Auditoría de vulnerabilidades y seguridad anti-inyección SAST en Node/React.
4. `knip`: Inspección de código muerto y coherencia en el punto de entrada.
5. `ai-review`: Auditoría automática sobre Pull Requests (`--branch main --lang es`).
