# Sistema de Gestión Hotelera EcoBosque

## Documentación Funcional

---

## 1. Descripción general del proyecto

El Sistema de Gestión Hotelera EcoBosque es una plataforma digital diseñada para administrar y automatizar las operaciones diarias de un hotel. Su propósito es centralizar en un solo lugar todos los procesos relacionados con la gestión de habitaciones, reservas, huéspedes, consumos, facturación y reportes, eliminando el uso de papel y reduciendo al mínimo los errores humanos.

El sistema permite que el personal del hotel —recepcionistas, meseros, administradores y gerentes— pueda registrar, consultar y controlar cada aspecto de la operación desde una interfaz moderna e intuitiva. Desde el momento en que un huésped reserva una habitación hasta que realiza el check-out y paga su factura, todo queda registrado digitalmente y disponible al instante.

Está diseñado tanto para hoteles pequeños como para medianos, y puede adaptarse a distintos tipos de alojamiento: habitaciones estándar, suites, cabañas y más.

---

## 2. Motivación

El proyecto nació a raíz de una experiencia personal durante una estadía en un hotel. Se observó que cada vez que un huésped solicitaba un servicio o consumía un producto —una bebida del bar, un plato del restaurante, un servicio de lavandería o una llamada telefónica— el personal registraba manualmente el consumo en una hoja de papel, anotando el número de habitación, el producto y el valor.

Este método, aunque funcional a simple vista, presentaba múltiples problemas:

- Las hojas de papel podían extraviarse o deteriorarse.
- La letra ilegible del empleado podía generar confusiones al momento de facturar.
- No existía una forma rápida de consultar cuánto había consumido un huésped hasta el momento.
- Al llegar el check-out, la recepción debía buscar y sumar manualmente todos los consumos registrados en papeles sueltos, lo que provocaba demoras y errores en la cuenta final.
- No había manera de generar reportes históricos de consumo, ocupación o ingresos sin hacer tediosos conteos manuales.

Esta experiencia evidenció la necesidad de un sistema digital que automatizara por completo este flujo de trabajo. El objetivo era claro: crear una herramienta que cualquier persona en un hotel pudiera usar sin esfuerzo, que eliminara el papel, redujera los errores y ofreciera información en tiempo real para una mejor toma de decisiones.

---

## 3. Objetivo general

Desarrollar un sistema integral de gestión hotelera que digitalice y automatice los procesos operativos y administrativos de un hotel —incluyendo reservas, check-in, check-out, registro de consumos, facturación y generación de reportes— con el fin de mejorar la eficiencia del personal, reducir errores, eliminar el uso de papel y proporcionar información actualizada y confiable para la toma de decisiones.

---

## 4. Objetivos específicos

1. **Automatizar el registro de consumos**: Permitir que el personal registre de forma rápida y centralizada los productos y servicios solicitados por los huéspedes, asociándolos automáticamente a su habitación para su posterior facturación.

2. **Facilitar los procesos de check-in y check-out**: Agilizar la entrada y salida de huéspedes mediante formularios digitales que capturen toda la información necesaria, incluyendo datos personales, método de pago y generación automática de PIN de acceso a la habitación.

3. **Centralizar la gestión de habitaciones**: Proveer un panel visual que muestre en tiempo real el estado de cada habitación (disponible, ocupada, reservada, en limpieza, en mantenimiento o fuera de servicio) para que el personal pueda tomar decisiones informadas.

4. **Automatizar la facturación**: Generar facturas detalladas que integren el valor de la habitación, los consumos realizados y los impuestos aplicables, reduciendo el tiempo y los errores del cálculo manual.

5. **Administrar usuarios y permisos**: Permitir que el gerente o administrador del hotel cree cuentas para cada empleado con roles y permisos específicos, garantizando que cada persona acceda únicamente a las funciones que necesita para su trabajo.

6. **Generar reportes operativos y financieros**: Producir reportes automáticos de ocupación, ingresos por período, consumos más frecuentes y productividad del personal, facilitando la toma de decisiones estratégicas.

7. **Mantener un historial de auditoría**: Registrar cada acción relevante realizada en el sistema (cambios de estado de habitaciones, check-ins, check-outs, pagos) para garantizar la trazabilidad y la rendición de cuentas.

---

## 5. Alcance

El sistema cubre la totalidad del ciclo operativo de un huésped dentro del hotel, desde la reserva inicial hasta el check-out final, incluyendo todos los servicios asociados a su estancia.

### Lo que el sistema incluye

- Gestión completa de habitaciones: consulta, actualización de estado, asignación a huéspedes y administración de tarifas.
- Registro y administración de reservas con validación de disponibilidad en tiempo real.
- Procesos de check-in y check-out con captura de datos del huésped, cálculo de noches y procesamiento de pagos.
- Registro de consumos de restaurante, bar y servicios durante la estancia.
- Facturación automática que consolida el cargo de la habitación más los consumos registrados.
- Administración de usuarios del sistema con roles y permisos diferenciados.
- Reportes de ocupación, ingresos, consumos y actividad del personal.
- Módulo de seguridad con autenticación, PIN de acceso a habitaciones, y registro de eventos de seguridad.

### Lo que el sistema no incluye en su versión actual

- Pasarela de pagos en línea (los pagos se procesan presencialmente en el hotel).
- Integración con plataformas de reservas externas como Booking, Airbnb o Expedia.
- Aplicación móvil nativa para huéspedes.
- Control de inventario de productos del restaurante o minibar.
- Módulo de limpieza y mantenimiento programado.
- Sincronización con cerraduras electrónicas inteligentes.

Estas funcionalidades han sido identificadas como mejoras futuras y se describen más adelante.

---

## 6. Problema identificado

En la operación tradicional del hotel —y en muchos hoteles aún hoy en día— los procesos clave se realizan de forma manual, con las siguientes consecuencias:

### Registro manual de consumos en papel
Cuando un huésped solicita un servicio (una bebida, una cena, lavandería, etc.), el empleado anota manualmente el consumo en una hoja de papel junto al número de habitación. Esta hoja se entrega a recepción al final del turno o al día siguiente.

**Problemas asociados:**

- **Pérdida de información**: Las hojas pueden extraviarse, mojarse o destruirse antes de ser registradas.
- **Errores de transcripción**: La letra ilegible puede generar que un consumo se registre en la habitación equivocada o con el valor incorrecto.
- **Retraso en la información**: La recepción no sabe en tiempo real cuánto está consumiendo un huésped, lo que impide informarle su saldo acumulado si lo solicita.
- **Doble trabajo**: Alguien debe transcribir los consumos del papel al sistema contable, duplicando esfuerzos y aumentando la probabilidad de error.

### Facturación manual
Al momento del check-out, el recepcionista debe:

1. Buscar todos los consumos registrados en papel para la habitación correspondiente.
2. Sumarlos manualmente.
3. Calcular el valor de las noches de hospedaje.
4. Aplicar impuestos manualmente.
5. Emitir una factura escrita a mano o en una hoja de cálculo.

**Problemas asociados:**

- El proceso es lento, especialmente en horas pico de salida.
- Es frecuente que se omitan consumos o se cometan errores de suma.
- Genera filas y malestar en los huéspedes que esperan para hacer check-out.

### Falta de trazabilidad
No existe un historial confiable de quién realizó cada acción, cuándo se registró un consumo o cómo cambió el estado de una habitación. Ante un reclamo o una discrepancia, es difícil —a menudo imposible— determinar qué ocurrió realmente.

### Dificultad para generar reportes
Obtener estadísticas básicas como el porcentaje de ocupación del mes, los ingresos totales del trimestre o los productos más vendidos requiere revisar y sumar manualmente montones de papeles y facturas. Esto consume horas de trabajo y los resultados suelen ser inexactos o estar desactualizados.

---

## 7. Solución propuesta

El Sistema de Gestión Hotelera EcoBosque resuelve estos problemas mediante una plataforma digital integrada que automatiza los procesos desde el primer contacto con el huésped hasta su salida. A continuación se explica cómo cada problema identificado es solucionado:

### Registro digital de consumos
En lugar de anotar en papel, cualquier empleado autorizado puede registrar los consumos directamente en el sistema desde una computadora en el bar, el restaurante o la recepción. El empleado selecciona la habitación del huésped, el producto o servicio consumido, y el sistema registra automáticamente el valor, la categoría y la fecha y hora exactas.

**Ventaja inmediata**: La información está disponible al instante en recepción. Si el huésped pregunta cuánto lleva consumido, la respuesta es inmediata y exacta.

### Facturación automatizada
Cuando el huésped solicita el check-out, el sistema calcula automáticamente:

- El valor total de las noches de hospedaje según la tarifa de la habitación.
- La suma de todos los consumos registrados durante la estancia.
- El impuesto (IVA) correspondiente.
- El total a pagar.

El recepcionista solo debe seleccionar el método de pago, registrar el valor recibido y el sistema calcula el cambio. La factura se genera y puede imprimirse en segundos.

### Panel de control en tiempo real
El sistema muestra en la pantalla principal un tablero visual donde cada habitación aparece con un color que indica su estado actual: disponible, ocupada, reservada, en limpieza, en mantenimiento o fuera de servicio. Con solo mirar la pantalla, cualquier empleado sabe qué habitaciones están libres para recibir huéspedes y cuáles están ocupadas.

### Trazabilidad completa
Cada acción relevante queda registrada automáticamente en el historial del sistema: quién realizó un check-in, quién registró un consumo, a qué hora se cambió el estado de una habitación, etc. Esto permite resolver reclamos con información verificable y auditar la operación del hotel.

### Reportes automáticos
El sistema genera reportes de ocupación, ingresos y consumos con solo unos clics. El administrador puede consultar, por ejemplo, los ingresos totales del mes, el porcentaje de ocupación promedio, los productos más vendidos o los métodos de pago más utilizados, sin necesidad de revisar papeles ni hacer cálculos manuales.

---

## 8. Módulos del sistema

El sistema está organizado en módulos funcionales que cubren cada aspecto de la operación hotelera. A continuación se describe cada uno desde la perspectiva del personal que lo utilizará.

### Dashboard (Panel principal)

Es la primera pantalla que ve el usuario al iniciar sesión. Muestra un resumen visual del estado actual del hotel:

- Número de habitaciones ocupadas, disponibles y reservadas.
- Ingresos del día y del mes en curso.
- Huéspedes que tienen check-out programado para hoy.
- Consumos recientes registrados en el hotel.
- Gráficos de ocupación y tendencias de ingresos.

**Para qué sirve:** Permite al gerente y al personal obtener una fotografía instantánea de cómo está operando el hotel sin tener que revisar módulo por módulo. Facilita la toma de decisiones rápidas, como asignar personal adicional si la ocupación es alta o preparar las habitaciones para las llegadas del día.

### Habitaciones

Este módulo permite visualizar y gestionar todas las habitaciones del hotel. Se presenta como un tablero gráfico donde cada habitación está representada por un recuadro con su número y un color que indica su estado.

**Funcionalidades principales:**

- Ver todas las habitaciones con su estado actual.
- Hacer clic en una habitación para ver su detalle completo: huésped asignado, fechas de estancia, consumos registrados y estado de pago.
- Cambiar el estado de una habitación (por ejemplo, marcarla como "en limpieza" cuando un huésped sale).
- Asignar una reserva a una habitación específica.
- Actualizar la información del huésped durante la estancia.

**Para qué sirve:** Es el centro de comando de la recepción. Con un vistazo, el recepcionista sabe qué habitaciones están libres para recibir huéspedes, cuáles están ocupadas y cuáles necesitan limpieza.

### Tipos de habitación

Permite definir y administrar las categorías de habitaciones que ofrece el hotel, como:

- Habitación estándar (individual, doble, cuádruple)
- Suite
- Cabaña
- Habitación familiar

**Funcionalidades principales:**

- Crear nuevos tipos de habitación con nombre, descripción y capacidad máxima.
- Definir la tarifa base por noche para cada tipo.
- Establecer la configuración de camas (una cama queen, dos camas individuales, etc.).
- Asignar amenidades disponibles (WiFi, aire acondicionado, televisión, balcón, etc.).

**Para qué sirve:** Permite al administrador del hotel configurar la oferta de habitaciones sin necesidad de asistencia técnica. Si el hotel renueva una categoría o cambia sus precios, puede actualizarlo directamente desde este módulo.

### Reservas

Gestiona las solicitudes de reserva que realizan los huéspedes, ya sea por teléfono, correo electrónico, redes sociales o en persona.

**Funcionalidades principales:**

- Registrar una nueva reserva con los datos del huésped, fechas de entrada y salida, tipo de habitación solicitada y número de personas.
- Consultar la disponibilidad de habitaciones para un rango de fechas.
- Ver un calendario con las reservas activas del hotel.
- Modificar o cancelar reservas existentes.
- Convertir una reserva en check-in cuando el huésped llega al hotel.
- Marcar reservas como "no show" si el huésped no se presenta.

**Ejemplo práctico:** Un huésped llama para reservar una habitación doble para el fin de semana. La recepcionista abre el módulo de reservas, ingresa las fechas y el sistema muestra automáticamente qué habitaciones están disponibles. Selecciona una, ingresa los datos del huésped y confirma la reserva. El sistema bloquea la habitación para esas fechas y la marca como "reservada" en el tablero de habitaciones.

### Huéspedes

Centraliza la información de todas las personas que se han hospedado en el hotel.

**Funcionalidades principales:**

- Registrar los datos personales del huésped: nombre completo, documento de identidad, teléfono, correo electrónico y dirección.
- Consultar el historial de estancias anteriores de un huésped (fechas, habitaciones ocupadas, consumos realizados).
- Asociar preferencias o notas especiales (por ejemplo, "huésped alérgico al polen" o "solicita habitación en pisos superiores").
- Buscar huéspedes por nombre, documento o número de habitación.

**Para qué sirve:** Agiliza el check-in de huéspedes recurrentes, ya que sus datos ya están registrados y no es necesario volver a pedirlos. Además, permite personalizar la atención al conocer sus preferencias de estancias anteriores.

### Check-In (Entrada)

Es el proceso mediante el cual se asigna una habitación a un huésped que llega al hotel.

**Funcionalidades principales:**

- Seleccionar si el huésped tiene una reserva previa o llega sin reserva (walk-in).
- Si tiene reserva, el sistema carga automáticamente los datos del huésped y las fechas.
- Registrar o confirmar los datos del huésped: nombre, documento, teléfono, correo, número de adultos y niños.
- Ingresar información adicional como si trae mascota o personas adicionales.
- Seleccionar la habitación específica entre las disponibles del tipo solicitado.
- El sistema genera automáticamente un PIN numérico de 4 dígitos para que el huésped pueda acceder a su habitación de forma segura.
- Confirmar el check-in, lo que cambia el estado de la habitación a "ocupada" en el tablero.

**Ejemplo práctico:** Un huésped llega a recepción. La recepcionista busca su reserva por nombre o documento. El sistema muestra los datos de la reserva. La recepcionista confirma la información, el sistema asigna automáticamente la habitación, genera un PIN de acceso y muestra la tarifa por noche. Con un clic, la habitación pasa a estar ocupada y el reloj de la estancia comienza a correr.

### Check-Out (Salida)

Gestiona la salida del huésped, el cálculo y cobro de la factura.

**Funcionalidades principales:**

- Consultar la habitación del huésped que desea salir.
- El sistema muestra un resumen completo de la estancia: fechas, número de noches, tarifa por noche, todos los consumos registrados (restaurante, bar, servicios) con sus valores individuales.
- Calcular automáticamente el subtotal, el IVA y el total a pagar.
- Registrar el método de pago: efectivo, tarjeta de crédito, tarjeta débito o transferencia.
- Si el pago es en efectivo, el sistema calcula el cambio a devolver.
- Al confirmar, la habitación queda liberada y cambia su estado a "disponible" o "en limpieza" según se configure.
- Generar e imprimir la factura detallada para entregar al huésped.

**Ejemplo práctico:** Un huésped se acerca a recepción para pagar su cuenta. La recepcionista ingresa el número de habitación y el sistema muestra en pantalla: 3 noches a $160,000 = $480,000, más $85,000 en consumos de restaurante y $32,000 del bar. Total: $597,000. El huésped paga con $600,000 en efectivo. La recepcionista registra el pago, el sistema calcula el cambio de $3,000 e imprime la factura. La habitación queda marcada para limpieza.

### Consumos

Permite registrar y consultar todos los productos y servicios que un huésped consume durante su estancia.

**Funcionalidades principales:**

- Registrar un consumo seleccionando la habitación, el producto o servicio, la categoría y la cantidad.
- El sistema registra automáticamente la fecha y hora exactas.
- Consultar todos los consumos de una habitación específica durante su estancia actual.
- Ver el total acumulado de consumos por habitación en tiempo real.
- Editar o eliminar un consumo en caso de error (con registro en auditoría).

**Para qué sirve:** Es el módulo que resuelve el problema principal que motivó este proyecto. Ya no se necesita papel. Un mesero puede registrar la cuenta de la cena directamente en el sistema desde el restaurante, y la recepción ve el cargo al instante.

### Productos

Administra el catálogo de productos y servicios que el hotel ofrece a los huéspedes.

**Funcionalidades principales:**

- Agregar, editar y eliminar productos (por ejemplo: "Cerveza artesanal", "Cena ejecutiva", "Lavandería", "Masaje relajante").
- Definir el precio de cada producto.
- Asignar cada producto a una categoría (restaurante, bar o servicios).
- Actualizar precios según temporada o promociones.

**Para qué sirve:** Permite al hotel mantener actualizada su oferta de productos y servicios sin depender de asistencia técnica. Si el chef agrega un nuevo plato al menú, el administrador lo registra en el sistema y ya está disponible para facturar.

### Categorías de productos

Organiza los productos y servicios en grupos para facilitar su gestión y consulta.

**Categorías incluidas:**

- **Restaurante**: platos, bebidas no alcohólicas, postres y demás alimentos.
- **Bar**: bebidas alcohólicas, cocteles y aperitivos.
- **Servicios**: lavandería, spa, llamadas telefónicas, transporte, tours.

**Para qué sirve:** Al momento de registrar un consumo, el empleado selecciona primero la categoría y luego el producto, lo que facilita la búsqueda y reduce errores. Además, al generar reportes, se pueden filtrar los consumos por categoría para identificar cuáles son los servicios más demandados.

### Facturación

Genera y administra las facturas de los huéspedes al momento del check-out.

**Funcionalidades principales:**

- Consolidar en una sola factura el cargo de habitación más todos los consumos registrados.
- Calcular automáticamente subtotales, impuestos (IVA) y total.
- Asociar el método de pago utilizado.
- Imprimir la factura o enviarla por correo electrónico al huésped.
- Consultar facturas anteriores para reimpresión o verificación.

**Para qué sirve:** Elimina por completo el proceso manual de sumar consumos y calcular impuestos. La factura se genera en segundos con total precisión, mejorando la experiencia del huésped y reduciendo el tiempo de atención en recepción.

### Pagos

Gestiona los diferentes métodos de pago que acepta el hotel y registra las transacciones.

**Funcionalidades principales:**

- Registrar pagos en efectivo, tarjeta de crédito, tarjeta débito o transferencia bancaria.
- Calcular automáticamente el cambio cuando el pago es en efectivo.
- Consultar el historial de pagos realizados por día, mes o rango de fechas.
- Ver los ingresos totales discriminados por método de pago.

**Para qué sirve:** Permite al administrador llevar un control preciso de los ingresos del hotel y conciliarlos con los reportes bancarios o el efectivo en caja al final del día.

### Empleados

Administra la información del personal que trabaja en el hotel.

**Funcionalidades principales:**

- Registrar a cada empleado con sus datos personales, cargo y fecha de ingreso.
- Asignar un usuario y rol en el sistema para que pueda acceder a las funciones que necesita.
- Consultar qué empleados están activos y cuáles han causado baja.
- Llevar un registro básico del personal para referencia del administrador.

**Para qué sirve:** Centraliza la información del equipo de trabajo del hotel y facilita la asignación de credenciales de acceso al sistema.

### Usuarios y Roles

Controla quién puede acceder al sistema y qué acciones puede realizar cada persona.

**Roles disponibles:**

- **Propietario**: acceso total al sistema, incluyendo configuración, reportes financieros y administración de otros usuarios.
- **Administrador**: acceso a la mayoría de funciones operativas y de gestión, excepto cambios críticos de configuración.
- **Recepcionista**: acceso a los módulos de habitaciones, check-in, check-out, reservas, consumos y facturación. No puede administrar usuarios ni modificar configuraciones.
- **Cliente / Huésped**: acceso limitado a un portal donde puede ver el estado de su cuenta, registrar solicitudes de check-out y consultar sus consumos.

**Para qué sirve:** Garantiza la seguridad del sistema. Un mesero puede registrar consumos pero no puede cambiar el estado de una habitación. Un recepcionista puede hacer check-in pero no puede modificar los precios de los productos. El propietario decide quién tiene acceso a cada función.

### Reportes

Genera informes automáticos para la toma de decisiones.

**Reportes disponibles:**

- **Ocupación**: porcentaje de habitaciones ocupadas por día, semana o mes.
- **Ingresos**: total de ingresos por habitaciones, consumos y métodos de pago en un período determinado.
- **Consumos**: productos y servicios más vendidos, categorías con mayor facturación.
- **Historial de actividades**: registro de todas las acciones realizadas en el sistema (check-ins, check-outs, cambios de estado, pagos).
- **Exportación a Excel**: posibilidad de descargar los reportes en formato de hoja de cálculo para su análisis en profundidad.

**Para qué sirve:** El gerente puede conocer, por ejemplo, qué meses del año tienen mayor ocupación, qué productos del restaurante son los más rentables o qué método de pago prefieren los huéspedes. Esta información es clave para tomar decisiones comerciales y operativas.

### Configuración

Permite ajustar los parámetros generales del hotel y del sistema.

**Funcionalidades principales:**

- Configurar la información del hotel: nombre, dirección, teléfono, logo, horarios de check-in y check-out.
- Definir las tarifas base por tipo de habitación.
- Establecer políticas del hotel: si se aceptan mascotas, edad mínima para reservar, número máximo de personas por habitación.
- Configurar el IVA u otros impuestos aplicables.
- Administrar las amenidades disponibles en el hotel.

**Para qué sirve:** Permite que el sistema se adapte a las necesidades específicas de cada hotel sin requerir programación. Cada hotel puede tener sus propias reglas de operación.

---

## 9. Descripción de Habitaciones

Cada habitación en el sistema almacena la siguiente información. Para efectos prácticos, cada atributo se explica en términos de su utilidad para el personal del hotel.

| Atributo | Descripción | ¿Para qué sirve? |
|---|---|---|
| **Número** | Identificador único y visible de la habitación (ejemplo: 101, 204, C-01). | Permite al personal identificar y buscar rápidamente una habitación específica. Coincide con el número en la puerta física de la habitación. |
| **Piso** | Nivel del edificio donde se encuentra la habitación (ejemplo: 1, 2, 3, o 0 para cabañas). | Ayuda a los huéspedes y al personal a ubicar la habitación dentro del hotel. También permite filtrar habitaciones por piso. |
| **Estado** | Situación actual de la habitación. Puede ser: disponible, ocupada, reservada, en limpieza, en mantenimiento o fuera de servicio. | Es el atributo más importante para la operación diaria. La recepción sabe al instante qué habitaciones se pueden asignar y cuáles no. |
| **Tipo** | Categoría de la habitación (suite, estándar, cabaña, etc.). | Permite clasificar las habitaciones y aplicar tarifas diferenciadas según el tipo. |
| **Camas** | Configuración de camas disponibles (ejemplo: 1 cama queen, 2 camas individuales, 1 cama king). | Ayuda a asignar la habitación adecuada según la composición del grupo familiar o de viajeros. |
| **Capacidad** | Número máximo de personas que pueden hospedarse en la habitación. | Evita asignar una habitación que no pueda albergar cómodamente al grupo de huéspedes. |
| **Tarifa por noche** | Precio base de la habitación por cada noche de hospedaje. | Es la base para calcular el cargo de alojamiento en la factura. |
| **Descripción** | Texto que describe las características de la habitación: vista, tamaño, decoración, servicios incluidos. | Ayuda al personal a promocionar la habitación cuando un huésped pregunta por las opciones disponibles. |
| **Amenidades** | Lista de servicios y comodidades incluidos en la habitación (WiFi, aire acondicionado, televisión, nevera, balcón, baño privado, etc.). | Permite al recepcionista informar con precisión qué incluye cada habitación y ayuda a los huéspedes a elegir según sus preferencias. |
| **Huésped asignado** | Nombre de la persona que ocupa actualmente la habitación. | Permite identificar rápidamente quién está en cada habitación sin tener que buscar en registros aparte. |
| **PIN de acceso** | Código numérico de 4 dígitos generado automáticamente al hacer check-in. | Proporciona un método seguro para que el huésped acceda a su habitación, sin necesidad de llaves físicas. El PIN es único por estancia. |
| **Fechas de estancia** | Fecha y hora de check-in y check-out del huésped actual. | Permite saber cuánto tiempo lleva el huésped en el hotel y cuándo debe desocupar la habitación. |
| **Consumos** | Lista de todos los productos y servicios consumidos por el huésped durante su estancia. | Se utiliza para generar la factura al momento del check-out sin tener que buscar en papeles. |
| **Información de pago** | Método de pago utilizado, valor total pagado, subtotal, IVA y cambio entregado (si aplica). | Queda registrado para la contabilidad del hotel y para resolver cualquier discrepancia futura. |
| **Observaciones** | Notas internas que el personal puede registrar sobre la habitación o el huésped (ejemplo: "el aire acondicionado tiene una fuga leve", "huésped solicita toallas adicionales"). | Permite la comunicación entre turnos del personal y garantiza que ningún detalle importante se pierda. |

---

## 10. Descripción de Reservas

Una reserva es una solicitud formal de un huésped para ocupar una habitación durante un período específico. El sistema maneja todo el ciclo de vida de la reserva, desde su creación hasta que se convierte en una estancia activa o se cancela.

### Información que almacena una reserva

- **Datos del huésped**: nombre completo, número de documento de identidad, teléfono de contacto, correo electrónico.
- **Fechas**: día y hora de entrada (check-in) y día y hora de salida (check-out).
- **Habitación solicitada**: tipo de habitación deseado (suite, estándar, cabaña, etc.). Opcionalmente, se puede asignar una habitación específica si el huésped la solicita.
- **Número de personas**: cantidad de adultos y niños que se hospedarán.
- **Estado de la reserva**: puede ser confirmada (activa), cancelada o no-show (el huésped no se presentó).
- **Notas especiales**: cualquier solicitud particular del huésped, como requerir una cuna para bebé, solicitar un piso silencioso o celebrar una ocasión especial.
- **Fecha de creación**: cuándo se registró la reserva en el sistema.

### Ciclo de vida de una reserva

1. **Creación**: Un huésped llama, envía un correo o se presenta en el hotel para solicitar una habitación. El recepcionista consulta la disponibilidad en el sistema para las fechas solicitadas, selecciona una habitación disponible e ingresa los datos del huésped. La habitación queda marcada como "reservada" en el tablero.

2. **Confirmación**: La reserva queda registrada y la habitación queda bloqueada para las fechas seleccionadas, de modo que ningún otro huésped pueda reservarla.

3. **Llegada (Check-In)**: Cuando el huésped llega al hotel, el recepcionista busca la reserva en el sistema, confirma los datos y realiza el check-in. La habitación pasa de "reservada" a "ocupada" y se genera el PIN de acceso.

4. **Cancelación**: Si el huésped cancela antes de llegar, el recepcionista marca la reserva como cancelada y la habitación vuelve a estar disponible para otras reservas.

5. **No-show**: Si el huésped no se presenta en la fecha de check-in, el recepcionista puede marcar la reserva como "no show" después de un tiempo determinado, liberando la habitación.

### Interacción con otros módulos

- **Habitaciones**: La reserva se asocia a una habitación específica (o a un tipo de habitación). Durante el período de la reserva, la habitación aparece como "reservada" y no puede asignarse a otro huésped.
- **Huéspedes**: Los datos del huésped quedan registrados y disponibles para futuras estancias, agilizando reservas posteriores.
- **Facturación**: Cuando la reserva se convierte en check-in, el sistema utiliza la tarifa de la habitación y la duración de la reserva como base para la facturación al momento del check-out.

---

## 11. Gestión de Consumos

La gestión de consumos es el corazón del sistema y la funcionalidad que motivó su creación. Se refiere al registro de todos los productos y servicios que un huésped solicita y consume durante su estancia en el hotel, y cómo estos se asocian automáticamente a su habitación para ser facturados al final.

### ¿Cómo funciona en la práctica?

**Escenario 1 — Consumo en el restaurante:**
Un huésped de la habitación 302 cena en el restaurante del hotel. Pide un plato fuerte ($45,000) y un jugo natural ($12,000). Al terminar, el mesero abre el módulo de consumos en el sistema, selecciona la habitación 302, busca "Plato fuerte" en la categoría Restaurante, ingresa la cantidad y hace clic en registrar. Repite el proceso con el jugo. Inmediatamente, ambos consumos aparecen asociados a la habitación 302 en el sistema.

**Escenario 2 — Consumo en el bar:**
Más tarde, el mismo huésped pide dos cervezas desde el bar. El barman registra los consumos de la misma forma. La recepción puede ver en tiempo real que la habitación 302 ya acumula $69,000 en consumos adicionales al hospedaje.

**Escenario 3 — Servicio de habitación:**
El huésped solicita servicio de lavandería ($25,000). El botones registra el consumo en el sistema. Ahora la habitación 302 acumula $94,000 en consumos.

### Asociación con la facturación

Cuando el huésped solicita el check-out, el sistema automáticamente:

1. Toma todos los consumos registrados para la habitación 302 durante su estancia.
2. Los suma y los muestra en la factura desglosados por categoría (restaurante, bar, servicios).
3. Los suma al valor del hospedaje (noches × tarifa).
4. Calcula el IVA sobre el total.
5. Presenta el total final a pagar.

### Beneficios de la gestión digital de consumos

- **Sin papel**: Se eliminan por completo las hojas sueltas con anotaciones manuales.
- **Tiempo real**: La recepción conoce al instante los consumos de cada habitación.
- **Precisión**: Se eliminan errores de suma y de transcripción entre turnos.
- **Trazabilidad**: Cada consumo queda registrado con fecha, hora y el usuario que lo registró.
- **Transparencia**: El huésped puede solicitar en cualquier momento un corte de su cuenta y recibir información exacta y actualizada.

---

## 12. Beneficios del sistema

### Eliminación del papel
Se acaban las hojas sueltas, los posits en el escritorio y los cuadernos de apuntes. Toda la información se registra digitalmente, lo que elimina el riesgo de pérdida, deterioro o extravío de documentos físicos.

### Mayor control operativo
El administrador y el gerente tienen visibilidad completa de lo que sucede en el hotel en todo momento: qué habitaciones están ocupadas, quiénes son los huéspedes, qué están consumiendo y cuánto han pagado.

### Información en tiempo real
Cualquier registro —un consumo, un check-in, un pago— se refleja instantáneamente en el sistema. No hay demoras entre que ocurre una transacción y el momento en que la información está disponible.

### Disminución de errores
Al eliminar la transcripción manual de datos y automatizar los cálculos (sumas de consumos, IVA, cambio), los errores humanos se reducen drásticamente. Las facturas son precisas y los huéspedes reciben cuentas correctas.

### Mejor experiencia para empleados y huéspedes
- **Empleados**: Realizan su trabajo de forma más rápida y con menos esfuerzo. No tienen que buscar papeles ni hacer sumas manuales. El sistema hace el trabajo pesado por ellos.
- **Huéspedes**: Reciben un servicio más ágil. El check-in y check-out son rápidos. Pueden obtener su cuenta en segundos si la solicitan. La factura es clara y detallada.

### Reportes automáticos
Con solo unos clics, el gerente puede obtener reportes de ocupación, ingresos, productos más vendidos y actividad del personal. Ya no es necesario pasar horas revisando papeles para obtener esta información.

### Facturación más sencilla
La factura se genera automáticamente consolidando habitación y consumos. El cálculo de impuestos es automático. El registro del pago es inmediato. Todo el proceso, que antes podía tomar 10 o 15 minutos, ahora se realiza en menos de un minuto.

### Trazabilidad y auditoría
Cada acción en el sistema queda registrada: quién la realizó, qué hizo y cuándo. Esto permite resolver reclamos, auditar la operación y tener un historial completo de la actividad del hotel.

### Seguridad mejorada
El acceso al sistema está controlado por usuario y contraseña. Cada empleado tiene permisos específicos según su rol. Las habitaciones ocupadas tienen un PIN único que se genera de forma segura y se destruye al finalizar la estancia.

---

## 13. Posibles mejoras futuras

El sistema ha sido diseñado con una arquitectura flexible que permite incorporar nuevas funcionalidades en el futuro. A continuación se presentan las mejoras previstas para versiones posteriores:

### Pagos en línea
Integrar una pasarela de pagos que permita a los huéspedes realizar el pago de reservas y facturas a través de internet, ya sea con tarjeta de crédito, débito o transferencia bancaria, sin necesidad de estar presentes en el hotel.

**Valor agregado**: Los huéspedes pueden confirmar su reserva con un pago anticipado, lo que reduce las cancelaciones de último momento y mejora el flujo de caja del hotel.

### Integración con cerraduras inteligentes
Conectar el sistema con cerraduras electrónicas que se programen automáticamente con el PIN generado durante el check-in. El huésped podría abrir su habitación usando el PIN directamente en la cerradura, sin necesidad de llave física ni tarjeta magnética.

**Valor agregado**: Mayor seguridad, eliminación de tarjetas magnéticas (que se pierden o desmagnetizan) y una experiencia moderna para el huésped.

### Aplicación móvil para huéspedes
Una aplicación que los huéspedes puedan instalar en su teléfono para:

- Realizar check-in remoto antes de llegar al hotel.
- Consultar el saldo de su cuenta en tiempo real.
- Solicitar servicios (room service, limpieza, toallas adicionales).
- Solicitar el check-out y recibir su factura por correo electrónico.
- Abrir la puerta de su habitación mediante el teléfono (en conjunto con cerraduras inteligentes).

**Valor agregado**: Mejora significativamente la experiencia del huésped y reduce la carga de trabajo del personal al permitir que los huéspedes realicen ciertos trámites por su cuenta.

### Código QR para servicios
Colocar códigos QR en cada habitación que, al ser escaneados con el teléfono del huésped, abran un menú digital de servicios del hotel (menú del restaurante, lista de servicios, solicitud de limpieza) y permitan registrar consumos directamente desde el teléfono.

**Valor agregado**: Reduce aún más la necesidad de intermediarios para registrar consumos y ofrece una experiencia moderna y autónoma al huésped.

### Módulo de inventario
Administrar el inventario de productos del restaurante, bar y minibar. El sistema podría alertar cuando un producto esté por agotarse y registrar automáticamente el consumo de inventario cuando se registre una venta.

**Valor agregado**: Ayuda a controlar los costos operativos y evita quedarse sin productos durante la operación del hotel.

### Programación de limpieza y mantenimiento
Permitir al personal de limpieza consultar qué habitaciones deben limpiarse (las que están por salir o las que lo solicitaron) y al personal de mantenimiento registrar y dar seguimiento a reparaciones necesarias.

**Valor agregado**: Organiza el trabajo del personal de servicios generales y garantiza que las habitaciones estén siempre en óptimas condiciones para los huéspedes.

### Notificaciones automáticas
El sistema podría enviar notificaciones automáticas por correo electrónico o mensaje de texto a los huéspedes:

- Recordatorio de la fecha de check-in.
- Recordatorio de la hora de check-out.
- Confirmación de la reserva.
- Factura electrónica al finalizar la estancia.
- Promociones y ofertas especiales.

**Valor agregado**: Mejora la comunicación con el huésped y reduce las ausencias o retrasos en el check-out.

### Integración con OTAs (Booking, Airbnb, Expedia)
Conectar el sistema con las plataformas de reservas más populares para que las reservas recibidas a través de estos canales se sincronicen automáticamente con el sistema del hotel, evitando la doble reserva de habitaciones.

**Valor agregado**: Elimina el riesgo de overbooking (reservar más huéspedes de los que caben en el hotel) y ahorra el tiempo de tener que ingresar manualmente cada reserva externa.

### Sistema de reseñas y calificaciones
Permitir a los huéspedes calificar su estancia y dejar comentarios sobre la habitación, el servicio y las instalaciones, directamente desde el portal del huésped o mediante un enlace enviado por correo electrónico después del check-out.

**Valor agregado**: Proporciona retroalimentación valiosa para mejorar la calidad del servicio y puede utilizarse como material promocional si las calificaciones son positivas.

### Múltiples idiomas
Ofrecer la interfaz del sistema en varios idiomas (inglés, francés, portugués) para atender a huéspedes internacionales y facilitar el trabajo del personal en hoteles con turismo extranjero.

**Valor agregado**: Amplía el mercado potencial del hotel y mejora la experiencia de los huéspedes internacionales.

---

## 14. Tecnologías sugeridas

> **Nota importante:** Esta sección está dirigida a personas con conocimientos técnicos. El cliente no necesita comprender estos detalles para usar el sistema; se incluyen para referencia del equipo de desarrollo y del área de tecnología.

### Frontend (Interfaz de usuario)

- **React**: Biblioteca moderna para construir interfaces de usuario interactivas y rápidas. Permite que el sistema se sienta fluido y responda al instante a las acciones del usuario.
- **Vite**: Herramienta que hace que el sistema se cargue rápidamente en el navegador y que los desarrolladores puedan hacer cambios en tiempo real sin recargar la página.
- **Tailwind CSS**: Framework de estilos que permite diseñar una interfaz limpia, moderna y profesional sin escribir código CSS complejo. Facilita que el sistema se vea bien en cualquier dispositivo (computador, tableta, teléfono).
- **React Query**: Maneja de forma inteligente la comunicación con el servidor, mostrando siempre información actualizada sin que el usuario tenga que recargar la página manualmente.

### Backend (Lógica del sistema y datos)

- **Node.js y Express**: Plataforma que ejecuta la lógica del sistema del lado del servidor. Es rápida, confiable y ampliamente utilizada en la industria.
- **Almacenamiento en archivos JSON (desarrollo) y Redis (producción)**: Durante el desarrollo, los datos se almacenan en archivos para facilitar las pruebas. En producción, se recomienda Redis, una base de datos en memoria ultrarrápida que garantiza que la información esté siempre disponible sin pérdidas.
- **JWT (JSON Web Tokens)**: Mecanismo de seguridad que permite que los usuarios inicien sesión de forma segura y que el sistema recuerde quién es cada usuario sin necesidad de estar ingresando la contraseña a cada momento.

### Seguridad

- **Helmet, CORS, rate limiting**: Conjunto de protecciones que blindan el sistema contra ataques comunes en internet, como robos de sesión, accesos no autorizados o intentos de sobrecarga.
- **bcryptjs**: Algoritmo que protege las contraseñas de los usuarios almacenándolas de forma encriptada, de modo que ni siquiera el administrador del sistema pueda verlas.
- **2FA (autenticación de dos factores)**: Capa adicional de seguridad que protege las cuentas de los administradores, requiriendo un código adicional (enviado por correo o aplicación) además de la contraseña.
- **PIN basado en criptografía**: Los códigos de acceso a las habitaciones se generan utilizando métodos criptográficos seguros, no simples números aleatorios, lo que garantiza que no puedan ser adivinados.

### Infraestructura

- **Vercel**: Plataforma de alojamiento en la nube que garantiza que el sistema esté disponible 24/7, se cargue rápidamente en cualquier parte del mundo y pueda escalar automáticamente si aumenta el número de usuarios.
- **GitHub**: Sistema de control de versiones que permite llevar un historial de todos los cambios realizados al sistema, facilitando el trabajo en equipo y la recuperación ante cualquier error.

---

*Documento generado como parte de la documentación funcional del Sistema de Gestión Hotelera EcoBosque.*

*Versión 1.0 — Julio 2026*
