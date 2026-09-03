const fs = require('fs');

const controllerCode = `'use strict';

const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { getPaquetes, getParqueaderos, getMinuta, getUnidades } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

const KB_FILE = path.resolve(__dirname, '..', '..', 'chatbot_knowledge.json');
const UNANSWERED_FILE = path.resolve(__dirname, '..', '..', 'unanswered_questions.json');

// Normalizador de texto (quita tildes, signos y pasa a minúsculas)
function normalizarTexto(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

// Obtener base de conocimiento
async function getKnowledge() {
  return (await readJsonFile(KB_FILE)) || [];
}

async function saveKnowledge(data) {
  return await writeJsonFile(KB_FILE, data);
}

// Obtener preguntas sin respuesta
async function getUnanswered() {
  return (await readJsonFile(UNANSWERED_FILE)) || [];
}

async function saveUnanswered(data) {
  return await writeJsonFile(UNANSWERED_FILE, data);
}

// ── MOTOR DE INTENCIONES DINÁMICAS EN VIVO ──
async function responderConsultaDinamica(textoOriginal, textoNormalizado) {
  // 1. Consulta de paquetes por número de apartamento (ej: "tengo paquete apto 101", "paquete para 201")
  const aptoMatch = textoOriginal.match(/(?:apto|apartamento|unidad)\\s*#?\\s*(\\d{2,4})/i) || textoOriginal.match(/\\b(\\d{3,4})\\b/);
  const esConsultaPaquete = /paquete|encomienda|guia|recibo|correspondencia|lleg[oó]|pedido|entrega/i.test(textoNormalizado);

  if (esConsultaPaquete && aptoMatch) {
    const aptoNumero = aptoMatch[1];
    const paquetes = await getPaquetes();
    const pendientes = (paquetes || []).filter(
      p => String(p.apto) === String(aptoNumero) && p.estado !== 'entregado'
    );

    if (pendientes.length === 0) {
      return {
        tipo: 'dinamico_paquetes',
        titulo: \`Consulta de Paquetería - Apto \${aptoNumero}\`,
        respuesta: \`📦 No tienes paquetes ni recibos pendientes por retirar en portería para el **Apartamento \${aptoNumero}**.\\n\\nSi esperas una encomienda, te notificaremos por WhatsApp con el código PIN apenas sea recibida.\`,
        accionRapida: { tipo: 'link', label: 'Ver Estado de Portería', ruta: '/admin/porteria' }
      };
    }

    const lista = pendientes.map(p => {
      if (p.categoria === 'recibo_publico') {
        return \`• 📬 **\${p.tipoRecibo || p.empresa}** (\${p.mesFacturado || 'Mes en curso'}) - Código: \`\`\${p.codigoRetiro}\`\`\`;
      }
      return \`• 📦 **\${p.empresa}** (Guía: \${p.guia}) - PIN Retiro: \`\`\${p.codigoRetiro}\`\`\`;
    }).join('\\n');

    return {
      tipo: 'dinamico_paquetes',
      titulo: \`Paquetería en Portería - Apto \${aptoNumero}\`,
      respuesta: \`¡Tienes **\${pendientes.length}** entrega(s) pendiente(s) en portería para el **Apto \${aptoNumero}**!\\n\\n\${lista}\\n\\nRecuerda presentar el código PIN en la recepción de portería para que el guarda de turno realice la entrega.\`,
      accionRapida: { tipo: 'link', label: 'Gestionar en Paquetería', ruta: '/admin/paquetes' }
    };
  }

  // 2. Consulta de cupos de parqueadero libres (ej: "hay parqueaderos libres?", "cupos disponibles")
  if (/parqueadero|parquear|cupo|bahia|estacionamiento/i.test(textoNormalizado) && /libre|disponible|cuanto|hay|vacio/i.test(textoNormalizado)) {
    const parqueaderos = await getParqueaderos();
    const libres = (parqueaderos || []).filter(p => p.estado === 'disponible');
    const visitantes = (parqueaderos || []).filter(p => p.tipo === 'visitante');
    const visitantesLibres = visitantes.filter(p => p.estado === 'disponible');

    return {
      tipo: 'dinamico_parqueaderos',
      titulo: 'Disponibilidad de Parqueaderos',
      respuesta: \`🚗 **Disponibilidad de Bahías en Vivo:**\\n\\n• **Bahías de Visitantes Libres:** \${visitantesLibres.length} de \${visitantes.length} cupos.\\n• **Total Parqueaderos Disponibles:** \${libres.length} bahías.\\n\\n*Recuerda que el tiempo de cortesía para visitantes es de 4 horas continuas y la velocidad máxima en sótanos es de 10 km/h.*\`,
      accionRapida: { tipo: 'link', label: 'Ver Mapa de Parqueaderos', ruta: '/admin/parqueadero' }
    };
  }

  // 3. Consulta de horario de silencio o ruidos
  if (/ruido|musica|fiesta|silencio|bulla|volumen|fiestas/i.test(textoNormalizado)) {
    return {
      tipo: 'convivencia',
      titulo: 'Normativa de Silencio y Control de Ruido',
      respuesta: \`🔇 **Horario de Silencio Oficial (Ley 675 / 2001):**\\n\\n• **Horario:** Todos los días de 10:00 PM a 07:00 AM.\\n• **Nivel sonoro:** Máximo 45 dB en horas nocturnas.\\n\\nSi experimentas ruidos excesivos o música fuera de horario, puedes reportarlo inmediatamente a portería por citófono a la **Ext. 100 / 101**.\`,
      accionRapida: { tipo: 'link', label: 'Ver Manual de Convivencia', ruta: '/admin/info' }
    };
  }

  return null;
}

// ── CONTROLADOR PRINCIPAL: PROCESAR MENSAJE DEL USUARIO ──
async function queryChatbot(req, res) {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    const textoOriginal = message.trim();
    const textoNorm = normalizarTexto(textoOriginal);

    if (!textoNorm) {
      return res.json({
        success: true,
        answer: 'Hola 👋 Soy MinutaBot, el asistente inteligente del condominio. ¿En qué te puedo colaborar hoy? Puedes preguntarme por horarios de piscina, gimnasio, basuras, parqueaderos, cuentas de pago o consultar si tienes paquetes pendientes.',
        suggestions: ['Piscina', 'Gimnasio', 'Día de Basuras', 'Cuentas de Pago', 'Tengo paquete?', 'Emergencias']
      });
    }

    // 1. Intentar resolver con motor dinámico en vivo
    const resDinamica = await responderConsultaDinamica(textoOriginal, textoNorm);
    if (resDinamica) {
      return res.json({
        success: true,
        source: 'dynamic_engine',
        item: resDinamica,
        answer: resDinamica.respuesta,
        suggestions: ['Horario Piscina', 'Día de Basuras', 'Cuentas Bancarias', 'Parqueaderos']
      });
    }

    // 2. Búsqueda por palabras clave y similitud en la Base de Conocimiento
    const kb = await getKnowledge();
    const palabrasUsuario = textoNorm.split(' ').filter(p => p.length > 2);

    let mejorCoincidencia = null;
    let maxPuntaje = 0;

    for (const item of kb) {
      let puntaje = 0;
      const keywordsNorm = (item.keywords || []).map(k => normalizarTexto(k));
      const tituloNorm = normalizarTexto(item.titulo || '');

      // Coincidencia exacta de frase
      for (const kw of keywordsNorm) {
        if (textoNorm.includes(kw)) {
          puntaje += kw.length * 3;
        }
      }

      // Coincidencia por palabras individuales
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

    // Si encontramos una respuesta relevante con puntaje suficiente
    if (mejorCoincidencia && maxPuntaje >= 3) {
      return res.json({
        success: true,
        source: 'knowledge_base',
        item: mejorCoincidencia,
        answer: mejorCoincidencia.respuesta,
        suggestions: (mejorCoincidencia.preguntasFrecuentes || []).slice(0, 3)
      });
    }

    // 3. Fallback: Registrar pregunta no respondida para retroalimentación
    const unanswered = await getUnanswered();
    const yaExiste = unanswered.find(u => normalizarTexto(u.pregunta) === textoNorm);
    if (yaExiste) {
      yaExiste.conteo = (yaExiste.conteo || 1) + 1;
      yaExiste.ultimaFecha = new Date().toISOString();
    } else {
      unanswered.unshift({
        id: `unans-${Date.now()}-${generateId(4)}`,
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
      answer: \`Lo siento, aún no tengo una respuesta exacta para: *"\\${textoOriginal}"*.\\n\\nHe guardado tu consulta en la bitácora administrativa para que sea agregada. Mientras tanto, puedes consultar la **Guía del Condominio** o comunicarte directamente con portería a la **Ext. 100**.\`,
      accionRapida: { tipo: 'link', label: 'Ver Guía del Condominio', ruta: '/admin/info' },
      suggestions: ['Horario Piscina', 'Horario Gimnasio', 'Día de Basuras', 'Cuentas de Pago', 'Directorio de Emergencias']
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
      id: `kb-${Date.now()}-${generateId(4)}`,
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

// ── PREGUNTAS NO RESPONDIDAS ──
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
`;

const routesCode = `'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbotController');

// Endpoint público para interactuar con el bot
router.post('/query', controller.queryChatbot);

// Endpoints administrativos para gestionar la base de conocimiento
router.get('/knowledge', controller.getAllKnowledge);
router.post('/knowledge', controller.addKnowledgeItem);
router.put('/knowledge/:id', controller.updateKnowledgeItem);
router.delete('/knowledge/:id', controller.deleteKnowledgeItem);

// Endpoints de preguntas sin respuesta
router.get('/unanswered', controller.getUnansweredList);
router.delete('/unanswered/:id', controller.deleteUnanswered);

module.exports = router;
`;

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/src/controllers/chatbotController.js', controllerCode);
fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/src/routes/chatbot.js', routesCode);
console.log('✓ chatbotController.js and routes/chatbot.js written successfully');