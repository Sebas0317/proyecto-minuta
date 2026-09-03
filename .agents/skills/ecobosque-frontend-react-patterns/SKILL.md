---
name: ecobosque-frontend-react-patterns
description: Specialized guide for developing, optimizing, and extending the EcoBosque Hotel System React + Vite frontend. Use this when creating UI components, adjusting pricing/formatting in COP, handling PIN authentication gates, or refactoring state to avoid cascading renders.
---

# EcoBosque Hotel System — Patrones Frontend y Optimización React

Esta habilidad (skill) proporciona las pautas de diseño y reglas de ingeniería de la interfaz de usuario en **React + Vite** ubicada en `frontend/`. Consúltala al construir pantallas para huéspedes, paneles de administración, integración con APIs y refactorizaciones visuales.

---

## 1. Arquitectura del Cliente (`frontend/`)

El cliente es una SPA (Single Page Application) rápida construida bajo **ECMAScript Modules (ESM)**.
* **Servidor de Desarrollo y Proxy**: Al ejecutar `npm run dev`, Vite abre el puerto `5173` y redirige de forma transparente las peticiones `/rooms`, `/consumos`, `/auth`, y `/reservas` hacia el backend en el puerto `3001`. *Ambos servidores deben estar activos simultáneamente durante el desarrollo*.
* **Estructura Modular**:
  * `src/App.jsx`: Enrutador central (`React Router`), manejo de estado de sesión (`user`, `role`) y control de modales/paneles de seguridad.
  * `src/components/`: Vistas y modales activos (`PantallaLogin`, `AdminShell`, `UserCheckout`, `PinGate`, `ConfirmModal`).
  * `src/components/ui/`: Sistema de componentes reutilizables con estilos limpios (`Button`, `Dialog`, `Table`, `Alert`, `Badge`).
  * `src/services/api.js`: Cliente HTTP unificado con manejo centralizado de errores (`ApiError`) y tokenización.
  * `src/hooks/`: Custom hooks reactivos como `useRooms` y `useRoomStats`.

---

## 2. Invariantes de Optimización en React (Zero-Bloat & Performance)

### 2.1. Cero Renderizados en Cascada (Cascading Renders)
* **REGLA ESTRICTA**: NUNCA sincronizar estados derivados secundarios de la UI dentro de un hook `useEffect`.
* **Explicación**: Colocar llamadas `setState` en un `useEffect` dependiente de props o de otros estados (ej. `[room]`) obliga a React a descartar el render en curso y realizar un segundo pintado inmediato, ralentizando la experiencia del usuario y activando alertas del linter moderno.
* **Patrón Correcto**:
  * **Opción A (Estado derivado en render)**: Si una variable depende de un prop/estado, calcúlala al vuelo al renderizar sin usar `useState`.
  * **Opción B (Sincronización por eventos)**: Si el estado debe poder modificarse (como un input), inicializa el estado directamente en el manejador que causó el cambio de origen (p. ej., dentro de `onAccess={(accessedRoom) => { setRoom(accessedRoom); setDate(accessedRoom.checkOut...); }}`).

### 2.2. Feature Flags con Variables de Entorno
* **PROHIBIDO**: Usar expresiones literales constantes para apagar componentes en el JSX (p. ej., `{false && <CybersecurityPanel />}`), ya que viola la regla `no-constant-binary-expression` de ESLint.
* **Patrón Correcto (Configurabilidad SaaS)**: Utiliza condicionales basados en las variables de entorno nativas de Vite:
  ```jsx
  {import.meta.env.VITE_SHOW_CYBERSECURITY_PANEL === 'true' && <CybersecurityPanel />}
  ```

---

## 3. Dominio del Hotel: Formato de Datos y Constantes

### 3.1. Divisa y Formato Financiero
* **Divisa Oficial**: Pesos Colombianos (**COP**). Los precios se manejan en valores enteros y no deben tener decimales.
* **Formato**: Utilizar siempre la utilidad de formato `COP` de `src/utils/helpers.js` (basada en `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`) en lugar de formatear texto a mano.

### 3.2. Helpers y Utilidades del Sistema (`src/utils/helpers.js`)
* `FECHA(date)`: Estandarización visual de fechas ISO.
* `calcularTotal(consumos)`: Sumarización a prueba de fallos con validación de tipos enteros numéricos.
* `filtrarRooms(rooms, criterio)` y `agruparPorPiso(rooms)`: Utilidades centralizadas para clasificar habitaciones por nivel del edificio o estado operativo.

### 3.3. Constantes Maestras (`src/constants/index.js`)
Al construir formularios o selects para recepción, referenciar siempre este catálogo maestro en lugar de reinventar literales:
* `PRODUCTOS`: Catálogo de ítems predefinidos de minibar, restaurante y spa con precios en COP.
* `ESTADO_CFG` y `TIPO_LABEL`: Mapeo de colores de medidores (Badges) según el estado de la habitación (`ocupada` = rojo/naranja, `disponible` = verde, `limpieza` = azul, etc.).
* `METODOS_PAGO`: Tarjeta de crédito, transferencia bancaria, efectivo, o débito a habitación.

---

## 4. Gestión de Deuda Técnica y Limpieza
* **Archivos Legados Ignorados**: Dentro de `frontend/src/components/`, existen 4 archivos pertenecientes a maquetas heredadas sin uso que no deben ser modificados ni reimportados por agentes IA: `AccesoHabitacion.jsx`, `CheckIn.jsx`, `Habitacion.jsx`, y `Inicio.jsx`.
* **Importaciones Limpias**: Antes de guardar cualquier archivo JSX, verificar que todas las dependencias (como `framer-motion`, iconos de `lucide-react` o hooks) estén en uso efectivo para asegurar que `npm run lint` obtenga **0 errores**.
