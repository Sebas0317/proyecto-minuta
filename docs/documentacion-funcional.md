# Sistema de Gestión Hotelera EcoBosque — Documentación Funcional

## 1. Descripción general del proyecto

Es una plataforma digital para administrar y automatizar las operaciones diarias de un hotel. Centraliza la gestión de habitaciones, reservas, huéspedes, consumos, facturación y reportes, eliminando el papel y reduciendo errores humanos. Permite al personal registrar, consultar y controlar cada aspecto de la operación desde una interfaz moderna, desde la reserva hasta el check-out.

## 2. Motivación

El proyecto surgió al observar que en muchos hoteles los consumos de los huéspedes se registran manualmente en hojas de papel. Esto genera problemas de pérdida de información, errores de transcripción, demoras en facturación y falta de trazabilidad. Se identificó la necesidad de un sistema digital que automatizara este flujo y ofreciera información confiable en tiempo real.

## 3. Objetivo general

Desarrollar un sistema integral que digitalice y automatice los procesos operativos y administrativos del hotel —reservas, check-in, check-out, consumos, facturación y reportes— para mejorar la eficiencia, reducir errores, eliminar el papel y proporcionar información actualizada para la toma de decisiones.

## 4. Objetivos específicos

1. Automatizar el registro de consumos, asociándolos a la habitación para su facturación.
2. Agilizar check-in y check-out mediante formularios digitales y generación automática de PIN.
3. Proveer un panel visual con el estado de cada habitación en tiempo real.
4. Generar facturas detalladas que integren hospedaje, consumos e impuestos.
5. Administrar usuarios con roles y permisos diferenciados.
6. Producir reportes automáticos de ocupación, ingresos y productividad.
7. Mantener un historial de auditoría con trazabilidad de cada acción.

## 5. Alcance

El sistema cubre el ciclo operativo completo del huésped: reserva, check-in, registro de consumos, check-out y facturación. Incluye gestión de habitaciones, productos, usuarios, reportes y seguridad con PIN de acceso. Quedan fuera de esta versión los pagos en línea, integración con OTAs, app móvil, control de inventario y cerraduras inteligentes, identificados como mejoras futuras.

## 6. Problema identificado

En la operación tradicional los consumos se registran en papel, lo que causa:

- **Pérdida de información** por extravío o deterioro de las hojas.
- **Errores de transcripción** por letra ilegible.
- **Falta de información** en tiempo real sobre saldos acumulados.
- **Facturación lenta** y propensa a errores al buscar y sumar consumos manualmente.
- **Imposibilidad de generar reportes** históricos sin tediosos conteos manuales.
- **Ausencia de trazabilidad** ante reclamos o discrepancias.

## 7. Solución propuesta

- **Registro digital de consumos:** cualquier empleado registra consumos en el sistema desde el punto de venta; la recepción los ve al instante.
- **Facturación automatizada:** el sistema calcula hospedaje, consumos, IVA y total; el recepcionista solo registra el pago.
- **Panel en tiempo real:** tablero visual con colores que indican el estado de cada habitación.
- **Trazabilidad:** cada acción queda registrada con usuario, fecha y hora.
- **Reportes automáticos:** ocupación, ingresos y consumos con un clic.

## 8. Módulos del sistema

1. **Dashboard.** Panel principal con resumen visual: habitaciones ocupadas/disponibles, ingresos del día, check-outs programados y gráficos de ocupación. Permite una visión instantánea del estado del hotel.

2. **Habitaciones.** Tablero gráfico donde cada habitación se muestra con su número y color de estado. Al hacer clic se ve el detalle: huésped, fechas, consumos y pago. Permite cambiar estados y actualizar información del huésped.

3. **Tipos de habitación.** Administra categorías (suite, estándar, cabaña, etc.) con nombre, descripción, capacidad, tarifa base, configuración de camas y amenidades.

4. **Reservas.** Registra solicitudes con datos del huésped, fechas y tipo de habitación. Consulta disponibilidad, modifica o cancela reservas, y las convierte en check-in. La habitación se bloquea automáticamente para las fechas reservadas.

5. **Huéspedes.** Centraliza la información de todos los huéspedes: nombre, documento, teléfono, correo e historial de estancias. Agiliza el check-in de huéspedes recurrentes.

6. **Check-In.** Proceso de entrada: selecciona reserva existente o registra walk-in, confirma datos, asigna habitación y genera automáticamente un PIN de 4 dígitos para la puerta.

7. **Check-Out.** Proceso de salida: muestra resumen de noches, tarifas y consumos; calcula subtotal, IVA y total; registra el pago y calcula cambio; libera la habitación e imprime la factura.

8. **Consumos.** Registra productos y servicios por habitación con categoría (restaurante, bar, servicios), fecha y hora. La recepción ve el acumulado en tiempo real.

9. **Productos.** Catálogo de productos y servicios con nombre, precio y categoría. Permite actualizar la oferta sin asistencia técnica.

10. **Categorías de productos.** Agrupa productos en Restaurante, Bar y Servicios para facilitar la búsqueda y los reportes.

11. **Facturación.** Consolida habitación y consumos en una factura con impuestos calculados automáticamente. Permite imprimir o enviar por correo.

12. **Pagos.** Registra pagos en efectivo, tarjeta de crédito, débito o transferencia. Calcula el cambio automáticamente. Permite consultar ingresos por método de pago.

13. **Empleados.** Administra datos del personal: nombre, cargo, fecha de ingreso y registro de usuario en el sistema.

14. **Usuarios y roles.** Control de acceso con roles: Propietario (acceso total), Administrador (gestión operativa), Recepcionista (operaciones diarias) y Huésped (portal limitado).

15. **Reportes.** Genera informes de ocupación, ingresos, consumos y actividad. Exportación a Excel para análisis detallado.

16. **Configuración.** Ajusta datos del hotel, tarifas, políticas (mascotas, edad mínima), impuestos y amenidades.

## 9. Descripción de Habitaciones

| Atributo | Descripción y utilidad |
|---|---|
| **Número** | Identificador único visible (ej. 101, C-01). Permite buscar la habitación rápidamente. |
| **Piso** | Nivel del edificio. Ayuda a ubicar la habitación y filtrar por piso. |
| **Estado** | Situación actual: disponible, ocupada, reservada, limpieza, mantenimiento o fuera de servicio. Atributo clave para la operación diaria. |
| **Tipo** | Categoría (suite, estándar, cabaña). Clasifica habitaciones y aplica tarifas diferenciadas. |
| **Camas** | Configuración (1 cama queen, 2 individuales, etc.). Ayuda a asignar según el grupo. |
| **Capacidad** | Máximo de personas. Evita asignaciones inadecuadas. |
| **Tarifa por noche** | Precio base por noche. Base del cargo de alojamiento. |
| **Descripción** | Características: vista, tamaño, decoración, servicios. Ayuda a promocionar la habitación. |
| **Amenidades** | Servicios incluidos (WiFi, TV, nevera, balcón). Permite informar con precisión al huésped. |
| **Huésped asignado** | Nombre del ocupante actual. Identifica quién está en cada habitación. |
| **PIN de acceso** | Código de 4 dígitos generado al hacer check-in. Acceso seguro sin llave física. |
| **Fechas de estancia** | Check-in y check-out. Control de tiempos de ocupación. |
| **Consumos** | Productos y servicios consumidos durante la estancia. Base para la factura. |
| **Información de pago** | Método de pago, total, subtotal, IVA y cambio. Registro contable. |
| **Observaciones** | Notas internas (ej. "el aire acondicionado tiene fuga"). Comunicación entre turnos. |

## 10. Descripción de Reservas

Una reserva almacena los datos del huésped (nombre, documento, teléfono, correo), las fechas de entrada y salida, el tipo de habitación solicitado, el número de personas, el estado (confirmada, cancelada, no-show) y notas especiales.

**Ciclo de vida:**

1. **Creación:** el recepcionista consulta disponibilidad, selecciona habitación e ingresa datos. La habitación se marca como reservada.
2. **Confirmación:** la habitación queda bloqueada para las fechas.
3. **Llegada (Check-In):** se confirman datos y la habitación pasa a ocupada.
4. **Cancelación:** se libera la habitación.
5. **No-show:** si el huésped no se presenta, se libera la habitación tras un tiempo.

Interactúa con Habitaciones (bloqueo de disponibilidad), Huéspedes (datos reutilizables) y Facturación (tarifa base para el cálculo).

## 11. Gestión de Consumos

Los consumos son todos los productos y servicios que un huésped solicita durante su estancia. Se registran en el sistema seleccionando la habitación, el producto y la categoría. Quedan asociados automáticamente a la habitación con fecha y hora.

**Ejemplo:** Un huésped de la habitación 302 cena en el restaurante (plato fuerte $45.000 + jugo $12.000) y luego pide dos cervezas en el bar ($16.000 c/u). El mesero registra cada consumo en el sistema. Al llegar el check-out, la recepción ve acumulados $89.000 en consumos, que se suman automáticamente al hospedaje en la factura.

**Beneficios:** sin papel, información en tiempo real, precisión en sumas, trazabilidad con usuario y hora, y transparencia para el huésped que puede solicitar su corte de cuenta en cualquier momento.

## 12. Beneficios del sistema

1. **Eliminación del papel.** Toda la información se registra digitalmente. Sin hojas sueltas, sin extravíos.
2. **Mayor control operativo.** Visibilidad completa de ocupación, huéspedes, consumos y pagos en todo momento.
3. **Información en tiempo real.** Cada transacción se refleja al instante. Sin demoras entre el evento y su registro.
4. **Disminución de errores.** Cálculos automáticos eliminan errores de suma y transcripción.
5. **Mejor experiencia.** Empleados trabajan más rápido y con menos esfuerzo. Huéspedes reciben servicio ágil y facturas precisas.
6. **Reportes automáticos.** Ocupación, ingresos y consumos con un clic. Sin revisión manual de papeles.
7. **Facturación sencilla.** La factura se genera en segundos consolidando hospedaje y consumos. El proceso se reduce de 15 minutos a menos de 1.
8. **Trazabilidad.** Cada acción queda registrada con usuario, fecha y hora. Auditoría completa de la operación.
9. **Seguridad.** Acceso controlado por usuario, roles y permisos. PIN único creado criptográficamente por estancia.
