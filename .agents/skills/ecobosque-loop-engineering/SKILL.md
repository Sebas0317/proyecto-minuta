---
name: ecobosque-loop-engineering
description: Guide and CLI cheat-sheet for running Loop Engineering tools (loop-init, loop-audit, loop-cost) inside the EcoBosque Hotel System. Use this skill when managing agent states, cost budgets, or performing automated health checks.
---

# EcoBosque Hotel System — Loop Engineering Guide

Esta habilidad (skill) proporciona la guía de uso de las herramientas de **Loop Engineering** localizadas en `scripts/loop/` para orquestar agentes autónomos, auditar el estado del repositorio y estimar y controlar el presupuesto financiero de tokens en USD.

---

## 1. Inicialización del Entorno (`loop-init.js`)
Prepara las variables de estado y la configuración presupuestaria de tokens. Crea `loop-state.json` y `loop-budget.json` en la raíz del proyecto.
* **Comando para Ejecutar**:
  ```sh
  node scripts/loop/loop-init.js
  ```
* **Efecto**:
  * Crea `loop-state.json` con el estado inicial de la sesión, última auditoría y fecha.
  * Crea `loop-budget.json` definiendo un límite de `$5.00 USD` por sesión y `$100.00 USD` mensuales, además del tarifario de precios por millón de tokens de entrada/salida de Gemini.

---

## 2. Auditoría de Preparación de Agentes (`loop-audit.js`)
Evalúa el repositorio analizando si cumple con los requisitos del hotel para permitir que los agentes AI programen con autonomía de forma segura y exitosa.
* **Comando para Ejecutar**:
  ```sh
  node scripts/loop/loop-audit.js
  ```
* **Criterios de Puntuación (100 Puntos Máximo)**:
  * **20 pts**: Guarda condicional activa en `backend/server.js` (previene puertos ocupados en test runners).
  * **20 pts**: Hardening anti-Prototype Pollution en `backend/src/middleware/sanitize.js`.
  * **20 pts**: Integración del workflow GitHub Actions con Semgrep y AI Review.
  * **20 pts**: Presencia de un archivo `.semgrepignore` optimizado en la raíz.
  * **20 pts**: Detección de habilidades personalizadas activas en la carpeta `.agents/skills/`.

---

## 3. Observabilidad Presupuestaria y Costos (`loop-cost.js`)
Estima y acumula el gasto financiero del uso de APIs por parte de los agentes. Te avisa si has superado el límite de presupuesto para evitar cobros sorpresa.
* **Comando para Ejecutar**:
  ```sh
  # Sintaxis: node scripts/loop/loop-cost.js <tokens_entrada> <tokens_salida> <modelo>
  node scripts/loop/loop-cost.js 150000 25000 gemini-3.5-flash
  ```
* **Variables Soportadas**:
  * `gemini-1.5-pro`
  * `gemini-1.5-flash`
  * `gemini-3.5-flash`
  * `gemini-2.0-flash`
