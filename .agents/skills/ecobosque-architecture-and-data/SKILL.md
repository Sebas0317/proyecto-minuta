---
name: ecobosque-architecture-and-data
description: Deep architectural reference and data modeling guide for the EcoBosque Hotel System REST API and React frontend. Use this skill when modifying endpoints, file-based data structures, custom PIN generators, collision-safe IDs, or hybrid persistence layers.
---

# EcoBosque Hotel System — Arquitectura, Datos y Seguridad

Esta habilidad (skill) proporciona el contexto técnico exhaustivo y las invariantes de arquitectura del proyecto **EcoBosque Hotel System**. Debe consultarse invariablemente cuando se realicen modificaciones en servicios backend, manejo de datos persistentes, algoritmos criptográficos del hotel o controladores HTTP.

---

## 1. Topología y Estructura del Backend (`backend/`)

El backend es una API RESTful desarrollada en **Node.js y Express** bajo el sistema de módulos **CommonJS (CJS)**.
* **REGLA DE ORO**: Nunca introducir sintaxis ESM (`import` / `export`) en el directorio `backend/`. Mantener estricto uso de `require()` y `module.exports`.

### Árbol Modular del Servidor
* `server.js`: Punto de entrada que acopla middlewares e instancia rutas. **Invariante de Testing**: La escucha del puerto (`app.listen`) debe estar obligatoriamente encapsulada en `if (process.env.NODE_ENV !== 'test')` y el archivo debe exportar la app (`module.exports = app;`) para prevenir colisiones de puerto (`EADDRINUSE`) y timeouts en Vitest.
* `src/routes/`: Enrutadores de Express divididos por dominio (`/rooms`, `/consumos`, `/auth`, `/reservas`). Deben integrar middlewares de validación antes del controlador.
* `src/controllers/`: Lógica de negocio descongestionada (p. ej., `roomController`, `consumoController`). No manipulan I/O directo de archivos; utilizan `jsonStore.js` o `persistence.js`.
* `src/data/jsonStore.js`: Capa de persistencia local y sincronización en archivos JSON con bloqueo de concurrencia e hidratación perezosa (*lazy seeding*).
* `src/middleware/`:
  * `sanitize.js`: Limpieza de cargas útiles (`req.body`, `req.query`). **Invariante Anti-Prototype Pollution**: PROHIBIDO asignar propiedades dinámicamente sobre objetos con prototipo susceptible (`req.body[key] = clean(val)`). SIEMPRE se debe usar `Object.assign` sobre un objeto limpio y bloquear de raíz las llaves de inyección (`__proto__`, `constructor`, `prototype`).
  * `authz.js` y `rateLimiter.js`: Control de roles (`admin`, `recepcionista`, `cliente`) y limitación de peticiones HTTP por IP/token.
* `src/utils/`: Herramientas puras aisladas (generadores de IDs y PINs).

---

## 2. Modelos de Datos (Persistencia Híbrida JSON/Redis)

Los datos operacionales residen localmente en archivos JSON dentro de `backend/` con soporte para caché en nube a través de **Upstash Redis**.

### 2.1. Habitaciones (`rooms.json`)
```typescript
interface Room {
  id: string;          // String seguro contra colisiones (ej: "1785961668271-5f1dba2a")
  numero: string;      // Identificador de puerta (ej: "101", "Cabaña A")
  tipo: "sencilla" | "doble" | "suite" | "cabaña";
  camas: number;       // Cantidad total de camas físicas
  capacidad: number;   // Ocupación máxima de huéspedes
  piso: number;        // Nivel o zona arquitectónica (ej: 1, 2, 3)
  estado: "disponible" | "ocupada" | "reservada" | "limpieza";
  huesped?: string;    // Nombre del titular activo
  pin: string;         // PIN criptográfico de 4 dígitos (acceso sin llave)
  checkIn?: string;    // Timestamp ISO-8601 de ingreso
  checkOut?: string;   // Timestamp ISO-8601 programado de salida
  pago?: number;       // Monto acumulado en COP
}
```

### 2.2. Consumos y Servicios (`consumos.json`)
```typescript
interface Consumo {
  id: string;          // ID único seguro
  roomId: string;      // Referencia foránea a Room.id
  descripcion: string; // Detalle (ej: "Minibar - Agua Mineral", "Desayuno Buffet")
  categoria: "restaurante" | "bar" | "servicios" | "spa";
  precio: number;      // Valor entero en Pesos Colombianos (COP) sin decimales
  fecha: string;       // Timestamp ISO-8601 del cargo
}
```

### 2.3. Reservas y Seguridad
* `reservas.json`: Gestión de fechas futuras, estado de confirmación y depósitos de garantía.
* `users.json`: Credenciales cifradas con `bcryptjs`, roles y estado de autenticación 2FA.
* `security-attempts.json` y `security-events.json`: Registro de auditoría para intentos fallidos de inicio de sesión, bloqueos temporales por fuerza bruta e infracciones de seguridad.

---

## 3. Algoritmos Core y Concurrencia

### 3.1. Generación de Identificadores (Anti-Colisión)
Los identificadores en todo el sistema no son enteros autodestruibles ni UUIDs pesados; obedecen al patrón `${Date.now()}-${randomHexString}`. Esto garantiza ordenamiento cronológico implícito y colisión prácticamente nula sin depender de librerías externas pesadas.

### 3.2. PIN de Acceso a Habitaciones (Crypto-Driven)
**PROHIBIDO** el uso de `Math.random()` para la emisión o reinicio del PIN de acceso del huésped. Siempre debe implementarse usando entropía del sistema operativo mediante el módulo nativo de Node.js: `crypto.randomFillSync()` o `crypto.randomInt()`.

### 3.3. Manejo de Locks en Archivos JSON (`jsonStore.js`)
Para evitar corrupción por lecturas/escrituras concurrentes, la capa de almacenamiento utiliza archivos temporales (`*.json.tmp`) y operaciones atómicas de renombramiento en el sistema de archivos. En entornos Windows, las advertencias de `fsync skipped on Windows` son esperables por diseño en la biblioteca de logging (`pino`) y no representan fallos de escritura.
