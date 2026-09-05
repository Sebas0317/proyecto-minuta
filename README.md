# 🏢 Proyecto Minuta • Sistema Integral de Portería, Seguridad & Gestión Residencial

> **Desarrollado y firmado por:** `sn2_f_`  
> **Versión:** 1.0.0 • Monorepo (Node.js / Express + React 19 / Vite)

---

## 📌 ¿Qué es esto?

**Proyecto Minuta** (también conocido como *EcoBosque Residencial*) es una plataforma web integral diseñada para digitalizar por completo la operación diaria de conjuntos residenciales, edificios y condominios bajo el régimen de propiedad horizontal.

Reemplaza los viejos libros de actas y cuadernos de papel de la portería por un sistema interactivo en tiempo real donde conviven tres perfiles clave:
1. **Los Guardas de Seguridad:** Registran minutas, visitas, rondas por puntos QR y entregan paquetes con validación de PIN.
2. **La Administración y el Consejo:** Controlan asambleas con votaciones y quórum en vivo, responden PQRS en los plazos de ley, gestionan cobros, emiten paz y salvos oficiales con QR y auditan toda la actividad del condominio.
3. **Los Residentes:** Cuentan con un portal de autogestión donde ven sus paquetes con código de retiro, reservan canchas y zonas comunes, radican quejas y votan en asambleas desde su celular o computador.

---

## 🎯 ¿Para qué es esto?

En la mayoría de copropiedades y edificios existen dolores de cabeza diarios:
* **Pérdida o confusión de encomiendas:** Paquetes que se pierden o se entregan a la persona equivocada porque solo se anotaban en una libreta.
* **Falta de trazabilidad en portería:** Novedades e incidentes que no quedan registrados formalmente o cuyos apuntes se borran/extravían en el cambio de turno.
* **Asambleas eternas y desorganizadas:** Votaciones a mano alzada donde calcular coeficientes y quórum toma horas y genera desconfianza.
* **PQRS sin respuesta oportuna:** Residentes inconformes porque sus derechos de petición o quejas de convivencia se pierden sin seguimiento a los 15 días hábiles legales (Ley 1755).
* **Falta de comunicación:** Canales informales como chats de WhatsApp que se saturan y desinforman.

**Proyecto Minuta resuelve todo esto** centralizando la información en una base de datos segura con persistencia híbrida (Upstash Redis + fallback local protegido), autenticación robusta y diseño responsive para tablets de portería y teléfonos móviles.

---

## 👥 ¿Para quiénes es esto?

* 🏢 **Administradores de Propiedad Horizontal:** Que buscan profesionalizar la gestión, agilizar trámites y cumplir con las normativas vigentes (Ley 675 de 2001 y Ley 1755 de 2015 en Colombia).
* 🛡️ **Empresas y Supervisores de Seguridad Privada:** Que necesitan supervisar a los guardas en tiempo real, monitorear rondas perimetrales y tener una minuta digital inmutable frente a auditorías o incidentes legales.
* 👮 **Guardas de Vigilancia:** Que requieren una interfaz limpia, rápida y clara para operar en tablets táctiles o PCs de garita sin enredos técnicos.
* 🏠 **Copropietarios y Residentes:** Que quieren transparencia, seguridad en sus entregas y facilidad para realizar trámites sin tener que ir físicamente a la oficina de administración.

---

## 🔄 Flexibilidad y Capacidad de Conversión a otros tipos de Proyectos

Una de las mayores ventajas de este sistema es su **arquitectura modular orientada a eventos, turnos y control de flujo**. 

Este proyecto nació originalmente de una plataforma de gestión hotelera y hospitalidad (*PMS hotelero*). Para adaptarlo al mundo residencial, se transformó la lógica de forma directa y elegante:
* *Habitaciones / Huéspedes* ➡️ **Unidades / Apartamentos y Residentes**.
* *Check-in / Check-out* ➡️ **Control de Accesos, Visitantes y Mudanzas**.
* *Consumos / Minibar* ➡️ **Expensas Comunes y Parqueaderos de Visitantes**.
* *Recepción 24/7* ➡️ **Garita de Portería y Minuta de Vigilancia**.

Gracias a esa misma base desacoplada y modular, este código se puede adaptar en cuestión de días a otros sectores:

| Sector Objetivo | ¿Cómo se adapta la lógica? | Casos de uso inmediatos |
| :--- | :--- | :--- |
| **Edificios Corporativos & Coworking** | *Apartamentos* pasan a ser *Oficinas o Empresas*. *Residentes* pasan a ser *Empleados o Miembros*. | Registro de visitantes a pisos, control de salas de juntas (zonas comunes) y recepción de paquetería empresarial. |
| **Centros Logísticos & Bodegas** | *Torres/Aptos* pasan a ser *Módulos/Bodegas*. *Accesos* pasan a ser *Entrada/Salida de Camiones y Carga*. | Minuta de pesaje y despacho, control de conductores, rondas QR a patios y reporte de daños en montacargas. |
| **Clínicas & Centros Médicos** | *Unidades* pasan a ser *Consultorios/Pabellones*. *Zonas Comunes* a *Salas de Cirugía/Equipos*. | Control de visitantes por paciente, inventario y calibración de extintores/equipos médicos, PQRS de pacientes. |
| **Colegios & Universidades** | *Apartamentos* pasan a ser *Salones o Facultades*. *Mascotas* a *Inventario de Equipos*. | Registro de padres de familia, control de acceso vehicular en horas pico y reporte de novedades de celaduría. |
| **Clubes Deportivos & Campestres** | *Copropietarios* pasan a ser *Socios/Afiliados*. | Reserva de canchas de tenis/fútbol, cobro de cuotas mensuales, control de invitados en portería. |

---

## ⚡ Módulos y Funcionalidades Incluidas

* 📋 **Minuta Digital de Vigilancia:** Registro oficial de novedades con niveles de severidad (Informativa, Advertencia, Peligro), radicado único y autoría del guarda.
* 📦 **Paquetería con PIN Hash y Rate Limit:** Al registrar un paquete o recibo público se genera un PIN de 4 dígitos (hasheado con bcrypt en backend); se entrega únicamente al validar el PIN con protección contra fuerza bruta en Redis.
* 🗳️ **Asambleas Digitales (Ley 675):** Registro de asistencia, cálculo automático de quórum por coeficiente y votaciones secretas en tiempo real con gráficas de barras interactivas.
* 📝 **Módulo de PQRS & Términos Legales (Ley 1755):** Radicación de quejas, peticiones y mantenimientos con cálculo exacto de **15 días hábiles** de vencimiento, respuestas oficiales de la administración y exportación en PDF.
* 🤖 **MinutaBot IA:** Asistente conversacional con NLP local, base de conocimiento del Manual de Convivencia, detección de emergencias (Alerta SOS en portería), generación de paz y salvos y radicación de PQRS en lenguaje natural.
* 📅 **Reserva de Zonas Comunes:** Calendario en vivo para apartar canchas sintéticas, zonas BBQ y salones sociales con control de horarios y depósitos.
* 🚗 **Control de Parqueaderos:** Mapa de bahías con tiempo de cortesía (4 horas) para visitantes, alertas de permanencia y cálculo de cupos libres.
* 🚶 **Control de Accesos & Visitas:** Registro ágil de peatones, contratistas y vehículos con hora de entrada, salida y cálculo de tiempo de permanencia.
* 🐶 **Censo de Mascotas:** Registro de perros/gatos por apartamento con carné de vacunación antirrábica y validación de razas de manejo especial (Ley 746 / 1801).
* 🧯 **Equipos de Emergencia:** Auditoría e inventario de extintores, gabinetes contra incendios, detectores de humo y motobombas con semáforo de vencimiento.
* 📄 **Generador de Certificados & Paz y Salvos en PDF:** Emisión digital de paz y salvo de administración con membrete, firma y código QR antifraude para verificar autenticidad.
* 🛡️ **Módulo de Ciberseguridad:** Auditoría de IPs de inicio de sesión, bloqueo de fuerza bruta, exportación en CSV y logs centralizados con Pino.

---

## 🛠️ Requisitos Técnicos & Dependencias

### Entorno necesario:
* **Node.js:** Versión 18.0.0 o superior (Recomendado Node.js 20 LTS o 22 LTS).
* **npm:** Versión 9.0 o superior (o pnpm / yarn).
* **Git:** Para clonar el repositorio.

*(Puedes consultar el archivo [`requirements.txt`](./requirements.txt) para ver el listado detallado de librerías y versiones).*

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos sencillos pasos para tener el sistema corriendo en tu máquina en menos de 3 minutos:

### 1. Clonar el repositorio
```bash
git clone https://github.com/Sebas0317/proyecto-minuta.git
cd proyecto-minuta
```

### 2. Instalar dependencias del Monorepo
Instala las dependencias del backend y del frontend:
```bash
# Dependencias de la raíz y backend
npm install
cd backend && npm install && cd ..

# Dependencias del frontend
cd frontend && npm install && cd ..
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` dentro de la carpeta `backend/` (o usa los valores por defecto para desarrollo local):

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_super_segura_de_minimo_32_caracteres

# Opcional (Upstash Redis para producción serverless / Vercel KV)
# UPSTASH_REDIS_REST_URL=https://tu-db.upstash.io
# UPSTASH_REDIS_REST_TOKEN=tu_token_upstash

# Orígenes permitidos para CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### 4. Iniciar en Modo Desarrollo

Abre dos terminales (una para el servidor y otra para la interfaz):

**Terminal 1 (Backend - API REST en puerto 3001):**
```bash
npm run dev:backend
# O directamente: cd backend && npm run dev
```

**Terminal 2 (Frontend - Vite en puerto 5173):**
```bash
npm run dev:frontend
# O directamente: cd frontend && npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto cuenta con una suite completa de pruebas unitarias y de integración que validan endpoints, tokens JWT, rate limiting y reglas de negocio:

```bash
cd backend
npm test
```

Para ver la cobertura de código:
```bash
cd backend
npm run test:coverage
```

---

## 📦 Compilación para Producción

Para compilar el frontend optimizado con compresión Gzip/Brotli:
```bash
npm run build
```
Los archivos estáticos se generarán en `frontend/dist/`.

---

## 📂 Estructura del Monorepo

```text
proyecto-minuta/
├── backend/                  # API REST Express & Motor de Datos
│   ├── src/
│   │   ├── controllers/      # Controladores (Paquetes, PQRS, Minuta, Chatbot, etc.)
│   │   ├── middleware/       # JWT Auth, Rate Limiters, Sanitización, Helmet
│   │   ├── routes/           # Definición de rutas v1
│   │   ├── utils/            # Generadores de ID, Hasheo Bcrypt, Logger Pino
│   │   └── data/             # Persistencia híbrida (Redis + JSON Store)
│   ├── tests/                # Suite de pruebas con Vitest y Supertest
│   └── server.js             # Entrada principal del servidor
├── frontend/                 # Aplicación SPA React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # MinutaBotWidget, AdminShell, Modales
│   │   ├── views/            # Vistas (Portería, Asambleas, PQRS, Residente, etc.)
│   │   ├── services/         # Cliente API con manejo de Axios/Fetch y caché
│   │   └── utils/            # Generador PDF con jsPDF, formateadores COP
│   └── index.html
├── requirements.txt          # Requerimientos de dependencias del sistema
├── DECISIONS.md              # Registro de decisiones de arquitectura
└── README.md                 # Documentación principal
```

---

## ✍️ Autoría, Créditos y Licencia

Este proyecto fue diseñado, desarrollado y optimizado por **`sn2_f_`**.

* **Desarrollador Principal:** `sn2_f_`
* **Licencia:** Distribuido bajo licencia libre para uso en proyectos comunitarios, educativos y de seguridad privada con atribución obligatoria al autor.
* **Firma Digital en Código:** `sn2_f_`

---
*EcoBosque PH • Innovación y Seguridad en Propiedad Horizontal.*
