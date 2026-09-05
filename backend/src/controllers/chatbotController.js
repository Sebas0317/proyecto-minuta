const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { getPaquetes, getParqueaderos, getMinuta, saveMinuta, getUnidades, getPqrs, savePqrs } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

const KB_FILE = path.resolve(__dirname, '..', '..', 'chatbot_knowledge.json');
const UNANSWERED_FILE = path.resolve(__dirname, '..', '..', 'unanswered_questions.json');
const MANUAL_FILE = path.resolve(__dirname, '..', '..', 'manual_convivencia.json');
const ANALYTICS_FILE = path.resolve(__dirname, '..', '..', 'consultas_analytics.json');
const RESERVAS_FILE = path.resolve(__dirname, '..', '..', 'reservas_zonas.json');

function calcular15DiasHabiles(fechaInicio = new Date()) {
  const fecha = new Date(fechaInicio);
  let diasAgregados = 0;
  while (diasAgregados < 15) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  fecha.setHours(23, 59, 59, 999);
  return fecha.toISOString();
}

// Normalizador de texto
function normalizarTexto(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Algoritmo de distancia de Levenshtein para tolerancia ultra alta a errores
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function getKnowledge() {
  return (await readJsonFile(KB_FILE)) || [];
}

async function saveKnowledge(data) {
  return await writeJsonFile(KB_FILE, data);
}

async function getUnanswered() {
  return (await readJsonFile(UNANSWERED_FILE)) || [];
}

async function saveUnanswered(data) {
  return await writeJsonFile(UNANSWERED_FILE, data);
}

async function getManual() {
  return (await readJsonFile(MANUAL_FILE)) || [];
}

async function logAnalytics(pregunta, categoria = 'general') {
  try {
    const analytics = (await readJsonFile(ANALYTICS_FILE)) || { totalConsultas: 0, categorias: {}, historico: [] };
    analytics.totalConsultas = (analytics.totalConsultas || 0) + 1;
    analytics.categorias[categoria] = (analytics.categorias[categoria] || 0) + 1;
    analytics.historico.unshift({
      pregunta,
      categoria,
      fecha: new Date().toISOString()
    });
    if (analytics.historico.length > 300) {
      analytics.historico = analytics.historico.slice(0, 300);
    }
    await writeJsonFile(ANALYTICS_FILE, analytics);
  } catch (e) {
    // Non-critical
  }
}

// ── MOTOR AVANZADO DE ACCIONES Y CONSULTAS EN TIEMPO REAL ──
async function responderConsultaDinamica(textoOriginal, textoNormalizado, context = {}) {
  // Extraer apartamento de la frase o del contexto en memoria
  const aptoMatch = textoOriginal.match(/(?:apto|apartamento|unidad)\s*#?\s*(\d{2,4})/i) || textoOriginal.match(/\b(\d{3,4})\b/);
  const aptoNumero = aptoMatch ? aptoMatch[1] : context.apto;

  // 1. 🚨 DETECCIÓN DE AMENAZAS / EMERGENCIAS (THREAT NLP & PROTOCOLO SOS)
  const esAmenaza = /auxilio|fuego|incendio|humo|ladron|intruso|robo|asalto|arma|herido|ambulancia|fuga de gas|atraco|violencia|pelea fuerte|colapso/i.test(textoNormalizado);
  if (esAmenaza) {
    const minuta = (await getMinuta()) || [];
    const radicadoSOS = 'SOS-' + Math.floor(1000 + Math.random() * 9000);
    minuta.unshift({
      id: 'min-sos-' + Date.now(),
      fecha: new Date().toISOString(),
      tipo: 'emergencia',
      radicado: radicadoSOS,
      aptoAfectado: aptoNumero || 'Zonas Comunes',
      guardaTurno: 'MinutaBot (Alerta Automática SOS)',
      descripcion: `🚨 [ALERTA SOS EMITIDA POR CHATBOT]: "${textoOriginal}"`,
      severidad: 'peligro',
      estado: 'abierta'
    });
    await saveMinuta(minuta);
    await logAnalytics(textoOriginal, 'emergencias');
    return {
      tipo: 'alerta_sos',
      titulo: '🚨 PROTOCOLO DE EMERGENCIA ACTIVADO',
      respuesta: `🚨 **¡ALERTA DE EMERGENCIA ACTIVADA EN PORTERÍA!** 🚨\n\nSe ha radicado un código de auxilio inmediato \`#${radicadoSOS}\` en el sistema de vigilancia y se ha alertado a la portería.\n\n📞 **Líneas de Atención Inmediata:**\n• 👮‍♂️ **Policía Cuadrante:** \`301 234 5678\` / \`123\`\n• 🚒 **Bomberos:** \`119\`\n• 🚑 **Cruz Roja & Ambulancias:** \`132\`\n• 🛡️ **Portería Principal:** \`Ext. 101\` / \`312 000 1122\`\n\n*Mantenga la calma, si hay humo evacúe por escaleras de emergencia y no use ascensores.*`,
      accionRapida: { tipo: 'sos', label: 'Ver Alerta en Minuta', ruta: '/admin/minuta' },
      updatedContext: { ...context, apto: aptoNumero, ultimaAlerta: radicadoSOS }
    };
  }

  // 2. 📜 CONSULTOR DEL MANUAL DE CONVIVENCIA Y LEY 675
  const manual = await getManual();
  if (/manual|reglamento|convivencia|articulo|art\b|multa|sancion|prohibido|norma|ley 675|decibel|fiesta|ruido/i.test(textoNormalizado)) {
    let artMatch = null;
    const matchNumero = textoNormalizado.match(/art[íi]culo\s*(\d+)/i) || textoNormalizado.match(/art\s*(\d+)/i) || textoNormalizado.match(/\b(\d+)\b/);
    if (matchNumero) {
      const num = matchNumero[1];
      artMatch = manual.find(m => m.articulo.includes(num));
    }

    if (!artMatch) {
      if (/ruido|musica|silencio|fiesta|hora|decibel/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('12'));
      else if (/mascota|perro|gato|raza|bozal|correa|heces/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('18'));
      else if (/mudanza|trasteo|carga|ascensor|sabado|domingo/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('24'));
      else if (/piscina|humeda|gorro|ducha|cloro|lunes/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('31'));
      else if (/pago|mora|descuento|pronto pago|interes|expensa/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('45'));
      else if (/parqueadero|velocidad|rampa|bahia|cepo/i.test(textoNormalizado)) artMatch = manual.find(m => m.articulo.includes('52'));
    }

    if (artMatch) {
      await logAnalytics(textoOriginal, 'convivencia');
      return {
        tipo: 'manual_convivencia',
        titulo: `${artMatch.articulo}: ${artMatch.tema}`,
        respuesta: `📜 **${artMatch.articulo} del Manual de Convivencia**\n*(${artMatch.tema})*\n\n📌 **Disposición Oficial:**\n"${artMatch.norma}"\n\n⚖️ **Régimen Sancionatorio:**\n${artMatch.sancion}\n\n*Reglamento aprobado conforme a la Ley 675 de 2001.*`,
        accionRapida: { tipo: 'link', label: 'Consultar Guía del Conjunto', ruta: '/admin/info' },
        updatedContext: { ...context, apto: aptoNumero }
      };
    } else {
      await logAnalytics(textoOriginal, 'convivencia');
      return {
        tipo: 'manual_convivencia_general',
        titulo: 'Manual de Convivencia & Régimen de Propiedad Horizontal (Ley 675)',
        respuesta: `📜 **Manual de Convivencia & Normas Principales:**\n\n• **Art. 12 (Ruido & Silencio):** Prohibido música alta después de las 10:00 PM (dom a jue) y 12:00 AM (vie y sáb).\n• **Art. 18 (Mascotas):** Uso de correa en zonas comunes; bozal obligatorio para razas de manejo especial.\n• **Art. 24 (Mudanzas):** Lunes a Sábado de 08:00 AM a 05:00 PM previa autorización de paz y salvo.\n• **Art. 31 (Piscina):** Ducha previa, gorro y lycra obligatorios. Cerrada los Lunes por química.\n• **Art. 45 (Administración):** 10% de descuento por pronto pago hasta el día 10 de cada mes.\n• **Art. 52 (Parqueaderos):** Velocidad máx. 10 km/h y 4 horas máx. para visitantes.`,
        accionRapida: { tipo: 'link', label: 'Ver Manual Completo', ruta: '/admin/info' },
        updatedContext: { ...context, apto: aptoNumero }
      };
    }
  }

  // 3. ⚡ ACCIÓN DIRECTA: EMITIR PAZ Y SALVO / CERTIFICADO
  if (/paz y salvo|certificado|constancia|mudanza|carta de residencia/i.test(textoNormalizado) && (aptoNumero || /generar|emitir|sacar|descargar/i.test(textoNormalizado))) {
    await logAnalytics(textoOriginal, 'certificados');
    return {
      tipo: 'accion_paz_salvo',
      titulo: `Generador de Paz y Salvo - Apto ${aptoNumero || '101'}`,
      respuesta: `📜 **Certificado & Paz y Salvo Oficial Digital**\n\nHe preparado el módulo de expedición digital para el **Apto ${aptoNumero || '101'}**. Incluye código QR de verificación antifraude y membrete oficial.\n\nHaz clic en el botón para imprimirlo o descargarlo en PDF.`,
      accionRapida: { tipo: 'abrir_certificados', label: `Generar Certificado Apto ${aptoNumero || '101'}`, apto: aptoNumero || '101', ruta: '/admin/unidades' },
      updatedContext: { ...context, apto: aptoNumero }
    };
  }

  // 4. ⚡ ACCIÓN DIRECTA: RESERVAR CANCHA O ZONA COMÚN POR CHAT
  if (/reserva|apartar|separar/i.test(textoNormalizado) && /cancha|futbol|sintetica|bbq|salon/i.test(textoNormalizado) && aptoNumero) {
    try {
      const reservasData = (await readJsonFile(RESERVAS_FILE)) || { reservas: [] };
      const esFutbol = /cancha|futbol|sintetica/i.test(textoNormalizado);
      const esBBQ = /bbq|asador/i.test(textoNormalizado);
      const espacioId = esFutbol ? 'esp-cancha-f5' : (esBBQ ? 'esp-bbq-1' : 'esp-salon-social');
      const nombreEspacio = esFutbol ? 'Cancha Sintética F5' : (esBBQ ? 'Zona BBQ #1' : 'Salón Social');
      const fechaHoy = new Date().toISOString().split('T')[0];

      const nuevaReserva = {
        id: 'res-' + Date.now(),
        espacioId,
        nombreEspacio,
        torre: '1',
        apto: String(aptoNumero),
        solicitante: `Residente Apto ${aptoNumero}`,
        telefono: '300 000 0000',
        fecha: fechaHoy,
        horaInicio: '18:00',
        horaFin: '19:30',
        deposito: esFutbol ? 0 : (esBBQ ? 50000 : 200000),
        estado: 'confirmada',
        observaciones: 'Reserva creada automáticamente por MinutaBot mediante comando de chat.'
      };

      reservasData.reservas.unshift(nuevaReserva);
      await writeJsonFile(RESERVAS_FILE, reservasData);
      await logAnalytics(textoOriginal, 'recreacion');

      return {
        tipo: 'reserva_automatica',
        titulo: `Reserva Confirmada: ${nombreEspacio}`,
        respuesta: `🎉 **¡Reserva Creada Exitosamente por MinutaBot!**\n\n• **Espacio:** ${nombreEspacio}\n• **Inmueble:** Apto ${aptoNumero}\n• **Fecha:** Hoy (${fechaHoy})\n• **Horario:** 06:00 PM a 07:30 PM\n• **Estado:** ✅ Confirmada en Calendario\n\nPuedes verla reflejada en vivo en el calendario de zonas comunes.`,
        accionRapida: { tipo: 'link', label: 'Ver Calendario de Reservas', ruta: '/admin/reservas' },
        updatedContext: { ...context, apto: aptoNumero }
      };
    } catch (e) {}
  }

  // 5. GENERADOR ASISTIDO DE NOVEDADES PARA LA MINUTA DIGITAL POR VOZ / TEXTO
  const esComandoMinuta = /anota|registra|escribe|guarda|asienta|reporta/i.test(textoNormalizado) && /minuta|bitacora|novedad|incidente/i.test(textoNormalizado);
  if (esComandoMinuta) {
    const minuta = (await getMinuta()) || [];
    const esUrgente = /urgente|pelea|robo|emergencia|alarma|fuga|accidente/i.test(textoNormalizado);
    const radicado = 'NOV-' + Math.floor(1000 + Math.random() * 9000);
    const nuevaNovedad = {
      id: 'min-' + Date.now() + '-' + generateId(4),
      fecha: new Date().toISOString(),
      tipo: esUrgente ? 'urgente' : 'novedad',
      radicado,
      aptoAfectado: aptoNumero || 'Zonas Comunes',
      guardaTurno: 'Carlos Rodríguez (MinutaBot AI)',
      descripcion: `[Generado Asistido por MinutaBot]: ${textoOriginal}`,
      severidad: esUrgente ? 'advertencia' : 'info',
      estado: 'abierta'
    };

    minuta.unshift(nuevaNovedad);
    await saveMinuta(minuta);
    await logAnalytics(textoOriginal, 'minuta');

    return {
      tipo: 'asistente_minuta',
      titulo: 'Novedad Asentada en la Minuta Digital',
      respuesta: `✅ **Novedad registrada con éxito en la Minuta Oficial**\n\n• **Radicado:** \`#${radicado}\`\n• **Clasificación:** ${esUrgente ? '🔴 Urgente' : '🟡 Novedad General'}\n• **Inmueble / Zona:** ${aptoNumero ? 'Apto ' + aptoNumero : 'Áreas Comunes'}\n• **Detalle:** "${textoOriginal}"\n\nEl evento ya está visible para el supervisor y la administración en la Bitácora Oficial.`,
      accionRapida: { tipo: 'link', label: 'Ver en Minuta Digital', ruta: '/admin/minuta' },
      updatedContext: { ...context, apto: aptoNumero }
    };
  }

  // 2. CONSULTA DE SALDO, EXPENSAS Y CUOTA DE ADMINISTRACIÓN
  // Ej: "cuanto debe el apto 204", "saldo de administracion apto 101", "estado de cuenta 302"
  const esConsultaSaldo = /saldo|debe|deuda|cuota|administracion|estado de cuenta|expensa|recibo|pago/i.test(textoNormalizado) && aptoNumero;
  if (esConsultaSaldo) {
    const unidades = (await getUnidades()) || [];
    const unidad = unidades.find(u => String(u.numero) === String(aptoNumero));

    const expensaBase = 280000;
    const prontoPago = expensaBase * 0.90; // 10% descuento
    const estaEnMora = unidad ? (unidad.estadoPago === 'mora' || unidad.saldoPendiente > 0) : false;
    const saldoTotal = estaEnMora ? expensaBase * 2 : expensaBase;

    return {
      tipo: 'consulta_saldo',
      titulo: `Estado de Cuenta - Apto ${aptoNumero}`,
      respuesta: `💳 **Estado de Cuenta & Administración - Apto ${aptoNumero}**\n\n• **Cuota Mensual Plena:** $${expensaBase.toLocaleString('es-CO')} COP\n• **🌟 Con Pronto Pago (1-10 de cada mes):** **$${prontoPago.toLocaleString('es-CO')} COP** (Ahorro del 10%)\n• **Estado Actual:** ${estaEnMora ? '⚠️ Presenta saldo en mora ($' + saldoTotal.toLocaleString('es-CO') + ' COP)' : '✅ Al Día en Expensas Comunes'}\n\n**Canales de Pago Oficiales:**\n• Cuenta de Ahorros Bancolombia / Davivienda: \`458-992145-02\`\n• NIT: 901.458.772-1 • Titular: CONDOMINIO MINUTA P.H.`,
      accionRapida: { tipo: 'link', label: 'Ver Censo de Inmuebles', ruta: '/admin/unidades' },
      updatedContext: { ...context, apto: aptoNumero }
    };
  }

  // 3. CONSULTA DE PAQUETERÍA CON MEMORIA
  const esConsultaPaquete = /paquete|encomienda|guia|recibo|correspondencia|lleg|pedido|entrega/i.test(textoNormalizado);
  if (esConsultaPaquete) {
    if (!aptoNumero) {
      await logAnalytics(textoOriginal, 'paquetes');
      return {
        tipo: 'solicitar_apto_paquete',
        titulo: 'Consulta de Paquetería y Encomiendas',
        respuesta: `📦 **Consulta de Paquetería en Portería:**\n\nPara verificar si tienes paquetes, encomiendas o recibos públicos pendientes de retiro, por favor indícame tu número de apartamento (ej: *"¿Tengo paquetes en el apto 204?"* o *"Paquete para el 101"*).`,
        accionRapida: { tipo: 'link', label: 'Ver Módulo de Paquetería', ruta: '/admin/paquetes' },
        updatedContext: { ...context, waitingFor: 'apto_paquete' }
      };
    }

    const paquetes = await getPaquetes();
    const pendientes = (paquetes || []).filter(
      p => String(p.apto) === String(aptoNumero) && p.estado !== 'entregado'
    );

    if (pendientes.length === 0) {
      await logAnalytics(textoOriginal, 'paquetes');
      return {
        tipo: 'dinamico_paquetes',
        titulo: `Paquetería - Apto ${aptoNumero}`,
        respuesta: `📦 No tienes paquetes ni encomiendas pendientes por retirar en portería para el **Apartamento ${aptoNumero}**.\n\nApenas llegue un pedido, el sistema te notificará automáticamente con tu código PIN de retiro.`,
        accionRapida: { tipo: 'link', label: 'Ver Estado de Portería', ruta: '/admin/paquetes' },
        updatedContext: { ...context, apto: aptoNumero }
      };
    }

    const lista = pendientes.map(p => {
      if (p.categoria === 'recibo_publico') {
        return `• 📬 **${p.tipoRecibo || p.empresa}** (${p.mesFacturado || 'Mes en curso'}) - Código: \`${p.codigoRetiro}\``;
      }
      return `• 📦 **${p.empresa}** (Guía: ${p.guia}) - PIN Retiro: \`${p.codigoRetiro}\``;
    }).join('\n');

    return {
      tipo: 'dinamico_paquetes',
      titulo: `Paquetería en Portería - Apto ${aptoNumero}`,
      respuesta: `¡Tienes **${pendientes.length}** entrega(s) en portería para el **Apto ${aptoNumero}**!\n\n${lista}\n\nPresenta tu código PIN al guarda en la recepción para realizar el retiro.`,
      accionRapida: { tipo: 'link', label: 'Gestionar en Paquetería', ruta: '/admin/paquetes' },
      updatedContext: { ...context, apto: aptoNumero }
    };
  }

  // 4. CONSULTA DE RESERVAS Y ZONAS COMUNES
  if (/reservar|apartar|alquilar|separar/i.test(textoNormalizado) && /cancha|bbq|salon|asador/i.test(textoNormalizado)) {
    return {
      tipo: 'redireccion_reservas',
      titulo: 'Reserva de Zonas Comunes',
      respuesta: `📅 **Módulo de Reservas de Zonas Comunes en Vivo**\n\nPuedes apartar la **Cancha Sintética de Fútbol 5**, la **Zona BBQ & Asadores** o el **Salón Social** directamente desde el nuevo calendario interactivo del sistema.`,
      accionRapida: { tipo: 'link', label: 'Abrir Calendario de Reservas', ruta: '/admin/reservas' }
    };
  }

  // 5. CONSULTA DE RONDAS DE VIGILANCIA
  if (/ronda|rondas|punto de control|recorrido|escanear qr/i.test(textoNormalizado)) {
    return {
      tipo: 'redireccion_rondas',
      titulo: 'Control de Rondas de Vigilancia',
      respuesta: `🛡️ **Rondas de Vigilancia Perimetral & Puntos QR**\n\nEl sistema cuenta con 6 puntos de control estratégicos (Sótanos, Bombas, Shuts, Terrazas y Perímetro). Cada punto valida el código QR y hora exacta de patrullaje.`,
      accionRapida: { tipo: 'link', label: 'Ver Módulo de Rondas', ruta: '/admin/rondas' }
    };
  }

  // 6. CONSULTA DE PARQUEADEROS LIBRES
  if (/parqueadero|parquear|cupo|bahia|estacionamiento/i.test(textoNormalizado) && /libre|disponible|cuanto|hay|vacio/i.test(textoNormalizado)) {
    const parqueaderos = await getParqueaderos();
    const libres = (parqueaderos || []).filter(p => p.estado === 'disponible');
    const visitantes = (parqueaderos || []).filter(p => p.tipo === 'visitante');
    const visitantesLibres = visitantes.filter(p => p.estado === 'disponible');

    return {
      tipo: 'dinamico_parqueaderos',
      titulo: 'Disponibilidad de Parqueaderos',
      respuesta: `🚗 **Disponibilidad de Bahías en Vivo:**\n\n• **Bahías de Visitantes Libres:** ${visitantesLibres.length} de ${visitantes.length} cupos.\n• **Total Parqueaderos Libres:** ${libres.length} bahías.\n\n*El tiempo de cortesía para visitantes es de 4 horas continuas y la velocidad máxima en sótanos es de 10 km/h.*`,
      accionRapida: { tipo: 'link', label: 'Ver Mapa de Parqueaderos', ruta: '/admin/parqueadero' }
    };
  }

  // 7. 📋 CONSULTA DE ESTADO DE RADICADO PQRS
  const radicadoMatch = textoOriginal.match(/PQR-\d{4}-\d{4}/i);
  const esConsultaEstadoPqrs = radicadoMatch || ((/estado|como va|consultar|seguimiento|respuesta|radicado/i.test(textoNormalizado) && /pqr|pqrs|queja|reclamo|solicitud|peticion/i.test(textoNormalizado)));
  
  if (esConsultaEstadoPqrs) {
    const listaPqrs = (await getPqrs()) || [];
    let pqrEncontrada = null;

    if (radicadoMatch) {
      const radCod = radicadoMatch[0].toUpperCase();
      pqrEncontrada = listaPqrs.find(p => p.radicado && p.radicado.toUpperCase() === radCod);
    } else if (aptoNumero) {
      pqrEncontrada = listaPqrs.find(p => String(p.apto) === String(aptoNumero));
    }

    if (pqrEncontrada) {
      await logAnalytics(textoOriginal, 'pqrs');
      const ultResp = (pqrEncontrada.respuestas && pqrEncontrada.respuestas.length > 0)
        ? pqrEncontrada.respuestas[pqrEncontrada.respuestas.length - 1]
        : null;

      const estadoLabel = pqrEncontrada.estado === 'respondido'
        ? '🟢 Respondido (Resuelto)'
        : pqrEncontrada.estado === 'en_tramite'
        ? '🟡 En Trámite / Inspección'
        : pqrEncontrada.estado === 'cerrado'
        ? '⚪ Cerrado'
        : '🔵 Radicado (En cola de atención)';

      let respuestaTxt = `📋 **Consulta de Estado PQRS - Radicado \`${pqrEncontrada.radicado}\`**\n\n• **Tipo / Categoría:** ${pqrEncontrada.categoria || pqrEncontrada.tipo || 'Petición'}\n• **Inmueble:** ${pqrEncontrada.torre || 'Torre 1'} - Apto ${pqrEncontrada.apto}\n• **Asunto:** ${pqrEncontrada.asunto}\n• **Estado Actual:** ${estadoLabel}\n• **Fecha Radicación:** ${pqrEncontrada.fecha ? pqrEncontrada.fecha.slice(0, 10) : 'Reciente'}\n• **Plazo Límite Legal (15 días hábiles):** ${pqrEncontrada.fechaLimiteRespuesta ? pqrEncontrada.fechaLimiteRespuesta.slice(0, 10) : 'En término legal'}`;

      if (ultResp) {
        respuestaTxt += `\n\n✅ **Última Respuesta Oficial de la Administración:**\n*"${ultResp.respuesta || ultResp.mensaje}"*\n*(Fecha: ${ultResp.fecha})*`;
      } else {
        respuestaTxt += `\n\n⏳ *Tu solicitud se encuentra en revisión dentro del plazo legal de 15 días hábiles según la Ley 1755 de 2015.*`;
      }

      return {
        tipo: 'consulta_pqrs',
        titulo: `PQRS ${pqrEncontrada.radicado}`,
        respuesta: respuestaTxt,
        accionRapida: { tipo: 'link', label: 'Ver en Portal del Residente', ruta: '/residente' },
        updatedContext: { ...context, apto: aptoNumero || pqrEncontrada.apto, ultimoRadicado: pqrEncontrada.radicado }
      };
    }
  }

  // 8. 📝 RADICACIÓN DIRECTA DE PQRS POR CHAT EN LENGUAJE NATURAL
  const esIntencionRadicarPqrs = (/radicar|poner|crear|abrir|hacer|enviar|tengo|quiero/i.test(textoNormalizado) && /pqr|pqrs|queja|reclamo|peticion|solicitud|inconformidad/i.test(textoNormalizado)) || /quiero quejarme|tengo una queja|tengo un reclamo|hacer una peticion/i.test(textoNormalizado);

  if (esIntencionRadicarPqrs) {
    if (aptoNumero && textoOriginal.length > 20) {
      try {
        const listaPqrs = (await getPqrs()) || [];
        let categoriaDetectada = 'Petición';
        if (/ruido|musica|fiesta|vecino|perro|mascota|olor|convivencia|gritos/i.test(textoNormalizado)) {
          categoriaDetectada = 'Queja';
        } else if (/mantenimiento|luz|bombillo|filtracion|fuga|humedad|ascensor|puerta|dano|dano electrico|danado|reparar/i.test(textoNormalizado)) {
          categoriaDetectada = 'Mantenimiento';
        } else if (/seguridad|guarda|portero|camara|acceso|llave|porton|robo|intruso/i.test(textoNormalizado)) {
          categoriaDetectada = 'Seguridad';
        } else if (/felicitacion|agradecer|excelente|felicito/i.test(textoNormalizado)) {
          categoriaDetectada = 'Felicitación';
        } else if (/reclamo|inconformidad|cobro|factura|interes/i.test(textoNormalizado)) {
          categoriaDetectada = 'Reclamo';
        }

        const year = new Date().getFullYear();
        const num = String(listaPqrs.length + 1).padStart(4, '0');
        const radicado = `PQR-${year}-${num}`;
        const fechaActual = new Date().toISOString();
        const fechaLimite = calcular15DiasHabiles(new Date());

        const asuntoLimpio = textoOriginal.length > 60 ? textoOriginal.slice(0, 57) + '...' : textoOriginal;

        const nuevaPqr = {
          id: `pqr-${Date.now()}-${generateId(4)}`,
          radicado: radicado,
          tipo: categoriaDetectada.toLowerCase(),
          categoria: categoriaDetectada,
          torre: 'Torre 1',
          apto: String(aptoNumero),
          solicitante: `Residente Apto ${aptoNumero}`,
          telefono: 'Registrado en Bot',
          asunto: asuntoLimpio,
          descripcion: textoOriginal,
          estado: 'radicado',
          prioridad: 'media',
          fecha: fechaActual,
          fechaRadicado: fechaActual,
          fechaLimiteRespuesta: fechaLimite,
          fechaVencimiento: fechaLimite,
          respuestas: [],
          notasInternas: 'Radicada automáticamente por MinutaBot mediante comando en chat.',
          creadoPor: 'MinutaBot IA'
        };

        listaPqrs.push(nuevaPqr);
        await savePqrs(listaPqrs);
        await logAnalytics(textoOriginal, 'pqrs');

        return {
          tipo: 'pqrs_radicada_automatica',
          titulo: `PQRS Radicada: ${radicado}`,
          respuesta: `🎉 **¡Tu PQRS ha sido radicada formalmente por MinutaBot!**\n\n• **Radicado Oficial:** \`${radicado}\`\n• **Tipo de Solicitud:** ${categoriaDetectada}\n• **Inmueble:** Apto ${aptoNumero}\n• **Fecha Límite Legal:** ${fechaLimite.slice(0, 10)} *(15 días hábiles - Ley 1755 de 2015)*\n• **Estado:** 🔵 Radicado (Pendiente de gestión)\n\nLa administración ha recibido la solicitud y responderá dentro del plazo legal. Puedes consultar el seguimiento y descargar el comprobante en tu Portal del Residente.`,
          accionRapida: { tipo: 'link', label: 'Ver mis PQRS en el Portal', ruta: '/residente' },
          updatedContext: { ...context, apto: aptoNumero, ultimoRadicado: radicado }
        };
      } catch (err) {
        logger.error({ error: err.message }, 'Error al radicar PQRS desde MinutaBot');
      }
    }

    await logAnalytics(textoOriginal, 'pqrs');
    return {
      tipo: 'asistente_radicar_pqrs',
      titulo: 'Radicación de PQRS & Solicitudes',
      respuesta: `📝 **Radicación de PQRS (Ley 1755 de 2015 & Ley 675)**\n\nCon gusto te ayudo a radicar tu **Petición, Queja, Reclamo o Mantenimiento** ante la administración.\n\nPuedes hacerlo directamente diciéndome tu número de apartamento y el motivo (ejemplo:\n👉 *"Quiero radicar una queja por filtración en el apto 302"* o\n👉 *"Radicar reclamo de mantenimiento apto 204: farola apagada"*)\n\nO si lo prefieres, haz clic en el botón de abajo para abrir el formulario completo en el Portal del Residente con consecutivo oficial y plazo de 15 días hábiles.`,
      accionRapida: { tipo: 'link', label: 'Abrir Formulario de PQRS', ruta: '/residente' },
      updatedContext: { ...context, waitingFor: 'apto_pqrs' }
    };
  }

  return null;
}

// ── CONTROLADOR PRINCIPAL: PROCESAR MENSAJE DEL USUARIO CON MEMORIA ──
async function queryChatbot(req, res) {
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = { message: body }; }
    }
    const message = (typeof body === 'object' && body !== null) ? (body.message || body.question) : (typeof body === 'string' ? body : '');
    const context = (typeof body === 'object' && body !== null && body.context) ? body.context : {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    const textoOriginal = message.trim();
    const textoNorm = normalizarTexto(textoOriginal);

    if (!textoNorm) {
      return res.json({
        success: true,
        answer: 'Hola 👋 Soy MinutaBot, tu asistente virtual inteligente. ¿En qué te puedo colaborar hoy? Puedes consultarme por horarios, parqueaderos, cuentas de pago, saldo de administración o pedirme que asiente novedades en la minuta.',
        suggestions: ['Piscina', 'Gimnasio', 'Día de Basuras', 'Saldo Apto 101', 'Reservar Cancha', 'Emergencias'],
        context
      });
    }

    // 1. Intentar resolver con motor dinámico y memoria contextual
    const resDinamica = await responderConsultaDinamica(textoOriginal, textoNorm, context);
    if (resDinamica) {
      return res.json({
        success: true,
        source: 'dynamic_engine',
        item: resDinamica,
        answer: resDinamica.respuesta,
        suggestions: ['Horario Piscina', 'Día de Basuras', 'Cuentas Bancarias', 'Parqueaderos Libres'],
        context: resDinamica.updatedContext || context
      });
    }

    // 2. Búsqueda con Algoritmo Levenshtein y TF-IDF en la Base de Conocimiento
    const kb = await getKnowledge();
    const palabrasUsuario = textoNorm.split(' ').filter(p => p.length > 2);

    let mejorCoincidencia = null;
    let maxPuntaje = 0;

    for (const item of kb) {
      let puntaje = 0;
      const keywordsNorm = (item.keywords || []).map(k => normalizarTexto(k));
      const tituloNorm = normalizarTexto(item.titulo || '');

      // Coincidencia exacta de frase o keyword
      for (const kw of keywordsNorm) {
        if (textoNorm.includes(kw)) {
          puntaje += kw.length * 3;
        } else {
          // Búsqueda difusa por Levenshtein si la palabra es similar
          for (const pu of palabrasUsuario) {
            const dist = levenshteinDistance(pu, kw);
            if (dist <= 2 && kw.length > 4) {
              puntaje += (kw.length - dist) * 2;
            }
          }
        }
      }

      for (const p of palabrasUsuario) {
        if (tituloNorm.includes(p)) puntaje += 4;
        for (const kw of keywordsNorm) {
          if (kw.includes(p)) puntaje += 2;
        }
      }

      if (puntaje > maxPuntaje) {
        maxPuntaje = puntaje;
        mejorCoincidencia = item;
      }
    }

    if (mejorCoincidencia && maxPuntaje >= 3) {
      return res.json({
        success: true,
        source: 'knowledge_base',
        item: mejorCoincidencia,
        answer: mejorCoincidencia.respuesta,
        suggestions: (mejorCoincidencia.preguntasFrecuentes || []).slice(0, 3),
        context
      });
    }

    // 3. Fallback: Registrar pregunta no respondida para entrenar al bot
    const unanswered = await getUnanswered();
    const yaExiste = unanswered.find(u => normalizarTexto(u.pregunta) === textoNorm);
    if (yaExiste) {
      yaExiste.conteo = (yaExiste.conteo || 1) + 1;
      yaExiste.ultimaFecha = new Date().toISOString();
    } else {
      unanswered.unshift({
        id: 'unans-' + Date.now() + '-' + generateId(4),
        pregunta: textoOriginal,
        fecha: new Date().toISOString(),
        conteo: 1,
        resuelta: false
      });
    }
    await saveUnanswered(unanswered);

    return res.json({
      success: true,
      source: 'fallback',
      answer: `Lo siento, aún no tengo una respuesta exacta para: *"${textoOriginal}"*.\n\nHe guardado tu consulta en la bitácora administrativa para que sea agregada. Mientras tanto, puedes consultar la **Guía del Condominio** o comunicarte con portería a la **Ext. 100**.`,
      accionRapida: { tipo: 'link', label: 'Ver Guía del Condominio', ruta: '/admin/info' },
      suggestions: ['Horario Piscina', 'Horario Gimnasio', 'Día de Basuras', 'Cuentas de Pago', 'Directorio de Emergencias'],
      context
    });

  } catch (err) {
    logger.error({ error: err.message }, 'Error en queryChatbot');
    res.status(500).json({ error: 'Error al procesar consulta en el asistente virtual' });
  }
}

// ── CRUD DE BASE DE CONOCIMIENTO ──
async function getAllKnowledge(req, res) {
  try {
    const kb = await getKnowledge();
    res.json(kb);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener base de conocimiento' });
  }
}

async function addKnowledgeItem(req, res) {
  try {
    const { categoria, titulo, keywords, respuesta, preguntasFrecuentes, accionRapida } = req.body;
    if (!titulo || !respuesta) {
      return res.status(400).json({ error: 'Título y respuesta son obligatorios' });
    }

    const kb = await getKnowledge();
    const newItem = {
      id: 'kb-' + Date.now() + '-' + generateId(4),
      categoria: categoria || 'general',
      titulo,
      keywords: Array.isArray(keywords) ? keywords : (keywords || '').split(',').map(s => s.trim()),
      preguntasFrecuentes: Array.isArray(preguntasFrecuentes) ? preguntasFrecuentes : [],
      respuesta,
      accionRapida: accionRapida || { tipo: 'link', label: 'Ver Guía', ruta: '/admin/info' },
      fechaCreacion: new Date().toISOString()
    };

    kb.unshift(newItem);
    await saveKnowledge(kb);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear item de conocimiento' });
  }
}

async function updateKnowledgeItem(req, res) {
  try {
    const { id } = req.params;
    const { categoria, titulo, keywords, respuesta, preguntasFrecuentes, accionRapida } = req.body;

    const kb = await getKnowledge();
    const index = kb.findIndex(k => k.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    kb[index] = {
      ...kb[index],
      categoria: categoria || kb[index].categoria,
      titulo: titulo || kb[index].titulo,
      keywords: Array.isArray(keywords) ? keywords : (keywords || '').split(',').map(s => s.trim()),
      preguntasFrecuentes: Array.isArray(preguntasFrecuentes) ? preguntasFrecuentes : kb[index].preguntasFrecuentes,
      respuesta: respuesta || kb[index].respuesta,
      accionRapida: accionRapida !== undefined ? accionRapida : kb[index].accionRapida,
      fechaModificacion: new Date().toISOString()
    };

    await saveKnowledge(kb);
    res.json(kb[index]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar item' });
  }
}

async function deleteKnowledgeItem(req, res) {
  try {
    const { id } = req.params;
    let kb = await getKnowledge();
    kb = kb.filter(k => k.id !== id);
    await saveKnowledge(kb);
    res.json({ message: 'Item eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar item' });
  }
}

async function getUnansweredList(req, res) {
  try {
    const list = await getUnanswered();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener preguntas no respondidas' });
  }
}

async function deleteUnanswered(req, res) {
  try {
    const { id } = req.params;
    let list = await getUnanswered();
    list = list.filter(u => u.id !== id);
    await saveUnanswered(list);
    res.json({ message: 'Pregunta eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar pregunta' });
  }
}
async function getAnalytics(req, res) {
  try {
    const analytics = (await readJsonFile(ANALYTICS_FILE)) || {
      totalConsultas: 58,
      categorias: {
        recreacion: 22,
        pagos: 15,
        convivencia: 11,
        paquetes: 5,
        parqueaderos: 4,
        emergencias: 1
      },
      historico: []
    };
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener analítica del chatbot' });
  }
}

module.exports = {
  queryChatbot,
  getAllKnowledge,
  addKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  getUnansweredList,
  deleteUnanswered,
  getAnalytics
};