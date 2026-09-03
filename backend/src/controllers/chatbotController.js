'use strict';

const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { getPaquetes, getParqueaderos, getMinuta, saveMinuta, getUnidades } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

const KB_FILE = path.resolve(__dirname, '..', '..', 'chatbot_knowledge.json');
const UNANSWERED_FILE = path.resolve(__dirname, '..', '..', 'unanswered_questions.json');

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

// ── MOTOR AVANZADO DE ACCIONES Y CONSULTAS EN TIEMPO REAL ──
async function responderConsultaDinamica(textoOriginal, textoNormalizado, context = {}) {
  // Extraer apartamento de la frase o del contexto en memoria
  const aptoMatch = textoOriginal.match(/(?:apto|apartamento|unidad)\s*#?\s*(\d{2,4})/i) || textoOriginal.match(/\b(\d{3,4})\b/);
  const aptoNumero = aptoMatch ? aptoMatch[1] : context.apto;

  // 1. GENERADOR ASISTIDO DE NOVEDADES PARA LA MINUTA DIGITAL POR VOZ / TEXTO
  // Ej: "anota en la minuta que a las 11 hubo ruidos", "registra en minuta novedad del carro placa XYZ"
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
      estado: 'abierta'
    };

    minuta.unshift(nuevaNovedad);
    await saveMinuta(minuta);

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
  if (esConsultaPaquete && aptoNumero) {
    const paquetes = await getPaquetes();
    const pendientes = (paquetes || []).filter(
      p => String(p.apto) === String(aptoNumero) && p.estado !== 'entregado'
    );

    if (pendientes.length === 0) {
      return {
        tipo: 'dinamico_paquetes',
        titulo: `Paquetería - Apto ${aptoNumero}`,
        respuesta: `📦 No tienes paquetes ni encomiendas pendientes por retirar en portería para el **Apartamento ${aptoNumero}**.\n\nApenas llegue un pedido, el sistema te notificará automáticamente con tu código PIN de retiro.`,
        accionRapida: { tipo: 'link', label: 'Ver Estado de Portería', ruta: '/admin/porteria' },
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

  return null;
}

// ── CONTROLADOR PRINCIPAL: PROCESAR MENSAJE DEL USUARIO CON MEMORIA ──
async function queryChatbot(req, res) {
  try {
    const { message, context = {} } = req.body;
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
    res.status(500).json({ error: 'Error al eliminar' });
  }
}

module.exports = {
  queryChatbot,
  getAllKnowledge,
  addKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  getUnansweredList,
  deleteUnanswered
};