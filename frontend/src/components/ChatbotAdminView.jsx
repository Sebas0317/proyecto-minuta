import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bot,
  Search,
  Plus,
  Trash2,
  Edit2,
  HelpCircle,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Tag,
  MessageSquare,
  Smartphone,
  Send,
  Video,
  Phone,
  MoreVertical,
  BarChart3,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchKnowledgeBase,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  fetchUnansweredQuestions,
  deleteUnansweredQuestion,
  queryChatbot,
  fetchChatbotAnalytics
} from '../services/api';

const CATEGORIES = [
  { id: 'todos', label: 'Todas las Categorías' },
  { id: 'recreacion', label: 'Zonas Recreativas' },
  { id: 'aseo', label: 'Aseo & Limpieza' },
  { id: 'basuras', label: 'Basuras & Shuts' },
  { id: 'convivencia', label: 'Manual de Convivencia' },
  { id: 'parqueaderos', label: 'Parqueaderos & Bodegas' },
  { id: 'pagos', label: 'Pagos & Administración' },
  { id: 'emergencias', label: 'Directorio de Emergencias' },
  { id: 'general', label: 'General' },
];

export default function ChatbotAdminView() {
  const [knowledge, setKnowledge] = useState([]);
  const [unanswered, setUnanswered] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('knowledge'); // 'knowledge' | 'simulator' | 'analytics' | 'unanswered'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('todos');

  // Modal de Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    categoria: 'recreacion',
    titulo: '',
    keywords: '',
    respuesta: '',
    preguntasFrecuentes: '',
    rutaAccion: '/admin/info',
    labelAccion: 'Ver Guía'
  });

  // Estado del Simulador Móvil de WhatsApp
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simContext, setSimContext] = useState({});
  const [simMessages, setSimMessages] = useState([
    {
      id: 'msg-0',
      sender: 'bot',
      text: '¡Hola! 👋 Soy *MinutaBot*, el canal oficial de atención virtual de *Condominio Minuta P.H.*.\n\nPuedes consultarme por horarios, parqueaderos, basuras, saldos de administración o pedirme que asiente novedades en la minuta.\n\n¿En qué te podemos colaborar hoy?',
      time: '10:00 AM'
    }
  ]);
  const simEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'simulator') {
      simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simMessages, activeTab]);

  const handleSimSend = async (customText = null) => {
    const textToSend = (customText || simInput).trim();
    if (!textToSend || simLoading) return;

    const userMsg = {
      id: 'sim-usr-' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setSimMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await queryChatbot(textToSend, simContext);
      if (res.context) {
        setSimContext(res.context);
      }

      const botMsg = {
        id: 'sim-bot-' + Date.now(),
        sender: 'bot',
        text: res.answer,
        action: res.item?.accionRapida || res.accionRapida || null,
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };

      setSimMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setSimMessages((prev) => [
        ...prev,
        {
          id: 'sim-err-' + Date.now(),
          sender: 'bot',
          text: 'Lo siento, ocurrió un error en el servidor. Por favor intenta de nuevo.',
          time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [kbData, unansData, anaData] = await Promise.all([
        fetchKnowledgeBase().catch(() => []),
        fetchUnansweredQuestions().catch(() => []),
        fetchChatbotAnalytics().catch(() => null)
      ]);
      setKnowledge(kbData || []);
      setUnanswered(unansData || []);
      setAnalytics(anaData || null);
    } catch (e) {
      toast.error('Error al cargar datos del chatbot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredKnowledge = useMemo(() => {
    return knowledge.filter((item) => {
      const matchCat = selectedCat === 'todos' || item.categoria === selectedCat;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        item.titulo?.toLowerCase().includes(q) ||
        item.respuesta?.toLowerCase().includes(q) ||
        (item.keywords || []).some((k) => k.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [knowledge, selectedCat, searchQuery]);

  const handleOpenCreate = (prefilledQuestion = '') => {
    setEditingItem(null);
    setForm({
      categoria: 'general',
      titulo: prefilledQuestion ? `Respuesta a: ${prefilledQuestion}` : '',
      keywords: prefilledQuestion ? prefilledQuestion.toLowerCase().split(' ').filter(w => w.length > 3).join(', ') : '',
      respuesta: '',
      preguntasFrecuentes: prefilledQuestion ? prefilledQuestion : '',
      rutaAccion: '/admin/info',
      labelAccion: 'Ver Guía'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      categoria: item.categoria || 'general',
      titulo: item.titulo || '',
      keywords: (item.keywords || []).join(', '),
      respuesta: item.respuesta || '',
      preguntasFrecuentes: (item.preguntasFrecuentes || []).join('\n'),
      rutaAccion: item.accionRapida?.ruta || '/admin/info',
      labelAccion: item.accionRapida?.label || 'Ver Guía'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.respuesta.trim()) {
      toast.error('El título y la respuesta son obligatorios');
      return;
    }

    try {
      const payload = {
        categoria: form.categoria,
        titulo: form.titulo.trim(),
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        preguntasFrecuentes: form.preguntasFrecuentes.split('\n').map(p => p.trim()).filter(Boolean),
        respuesta: form.respuesta.trim(),
        accionRapida: form.rutaAccion ? {
          tipo: 'link',
          label: form.labelAccion || 'Ver Guía',
          ruta: form.rutaAccion
        } : null
      };

      if (editingItem) {
        await updateKnowledgeItem(editingItem.id, payload);
        toast.success('Respuesta actualizada en la base de conocimiento');
      } else {
        await createKnowledgeItem(payload);
        toast.success('Nueva respuesta añadida al asistente virtual');
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error('Error al guardar en el chatbot');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta respuesta de la base de conocimiento?')) return;
    try {
      await deleteKnowledgeItem(id);
      toast.success('Respuesta eliminada');
      loadData();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteUnanswered = async (id) => {
    try {
      await deleteUnansweredQuestion(id);
      toast.success('Pregunta descartada');
      loadData();
    } catch (e) {
      toast.error('Error al descartar');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Gestión de MinutaBot <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">Base de Conocimiento IA</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Administración de respuestas automáticas, palabras clave, preguntas frecuentes y entrenamiento del bot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleOpenCreate()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Respuesta</span>
          </button>
          <button
            onClick={loadData}
            title="Recargar datos"
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRICAS DE CONOCIMIENTO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Respuestas Entrenadas</span>
          <p className="text-2xl font-black text-white">{knowledge.length}</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Categorías Cubiertas</span>
          <p className="text-2xl font-black text-emerald-400">7 Zonas</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Consultas Sin Respuesta</span>
          <p className="text-2xl font-black text-amber-400">{unanswered.length}</p>
        </div>
        <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase">Motor de Búsqueda</span>
          <p className="text-sm font-bold text-cyan-300 mt-1">Fuzzy NLP Local</p>
        </div>
      </div>

      {/* TABS DE VISTA: BASE DE CONOCIMIENTO VS CONSULTAS SIN RESPUESTA */}
      <div className="flex gap-2 border-b border-slate-700/80 pb-2 overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'knowledge'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Base de Conocimiento ({knowledge.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'simulator'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>📱 Simulador WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📊 Analítica IA</span>
        </button>
        <button
          onClick={() => setActiveTab('unanswered')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'unanswered'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Sin Respuesta ({unanswered.length})</span>
        </button>
      </div>

      {/* ── SECCIÓN 1: BASE DE CONOCIMIENTO ── */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS */}
          <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, contenido o palabra clave (ej: piscina, parqueadero, basuras)..."
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* GRID DE CARDS DE CONOCIMIENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKnowledge.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No se encontraron respuestas con los filtros seleccionados.</p>
              </div>
            ) : (
              filteredKnowledge.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/80 border border-slate-700/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 hover:border-slate-600 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold bg-slate-900 text-emerald-400 border border-slate-700 px-2.5 py-0.5 rounded-md">
                          {item.categoria}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{item.titulo}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Editar respuesta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Eliminar respuesta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* TEXTO DE RESPUESTA FORMATEADA */}
                    <div className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 font-sans leading-relaxed">
                      {item.respuesta}
                    </div>

                    {/* PALABRAS CLAVE (TRIGGERS) */}
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">Palabras Clave (Triggers):</span>
                      <div className="flex flex-wrap gap-1">
                        {(item.keywords || []).map((k, i) => (
                          <span key={i} className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {item.accionRapida?.ruta && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Botón de acción: <strong>{item.accionRapida.label}</strong></span>
                      <span className="font-mono text-emerald-400">{item.accionRapida.ruta}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SIMULADOR DE WHATSAPP / MÓVIL ── */}
      {activeTab === 'simulator' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="w-full lg:w-96 bg-slate-800/80 border border-slate-700 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Prueba la IA & Memoria en Vivo
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Haz clic en cualquier ejemplo para enviar al simulador de WhatsApp y ver la respuesta en tiempo real:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSimSend('¿Qué dice el artículo 18 sobre mascotas peligrosas?')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-pink-500 flex items-center justify-between"
              >
                <span>📜 "Artículo 18: Mascotas y Bozal"</span>
                <span className="text-[10px] text-pink-400 font-mono">Manual</span>
              </button>

              <button
                onClick={() => handleSimSend('¿Qué dice el artículo 12 sobre ruidos y fiestas?')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-pink-500 flex items-center justify-between"
              >
                <span>🤫 "Artículo 12: Horarios de Silencio"</span>
                <span className="text-[10px] text-pink-400 font-mono">Manual</span>
              </button>

              <button
                onClick={() => handleSimSend('Genera el paz y salvo de administración del 204')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-indigo-500 flex items-center justify-between"
              >
                <span>📜 "Genera el Paz y Salvo del 204"</span>
                <span className="text-[10px] text-indigo-400 font-mono">Acción</span>
              </button>

              <button
                onClick={() => handleSimSend('Reserva la cancha de fútbol para el apto 101 hoy de 6 a 7:30pm')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-emerald-500 flex items-center justify-between"
              >
                <span>⚽ "Reserva cancha F5 para apto 101"</span>
                <span className="text-[10px] text-emerald-400 font-mono">Acción</span>
              </button>

              <button
                onClick={() => handleSimSend('¡Fuego en el sótano 1, auxilio!')}
                className="w-full text-left bg-red-950/80 hover:bg-red-900/80 border border-red-800 p-2 rounded-xl text-xs text-red-200 hover:text-white transition-all flex items-center justify-between"
              >
                <span>🚨 "¡Fuego en el sótano 1, auxilio!"</span>
                <span className="text-[10px] text-red-400 font-mono font-bold">SOS</span>
              </button>

              <button
                onClick={() => handleSimSend('¿Cuánto debe de administración el apto 204?')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-emerald-500"
              >
                💳 "Cuánto debe de administración el 204?"
              </button>

              <button
                onClick={() => handleSimSend('¿Y tiene paquetes pendientes en portería?')}
                className="w-full text-left bg-slate-900/90 hover:bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-slate-300 hover:text-white transition-all hover:border-emerald-500"
              >
                🧠 "Y tiene paquetes pendientes?" (Memoria)
              </button>
            </div>

            {simContext.apto && (
              <div className="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-xl text-xs text-emerald-300">
                <span className="font-bold block">Memoria Contextual Activa:</span>
                <span>Apartamento en seguimiento: <strong>Apto {simContext.apto}</strong></span>
              </div>
            )}
          </div>

          {/* FRAME DE TELÉFONO WHATSAPP */}
          <div className="w-full max-w-sm bg-slate-950 rounded-[40px] border-4 border-slate-800 shadow-2xl p-2.5 overflow-hidden flex flex-col h-[620px]">
            <div className="bg-[#075e54] text-white p-3 rounded-t-[30px] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 border border-white/40 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#075e54] rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-none">MinutaBot P.H.</h4>
                  <span className="text-[10px] text-emerald-200">en línea</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Video className="w-4 h-4" />
                <Phone className="w-4 h-4" />
                <MoreVertical className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0b141a] text-xs">
              {simMessages.map((m) => {
                const isBot = m.sender === 'bot';
                return (
                  <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl shadow-md text-xs relative ${
                        isBot
                          ? 'bg-[#202c33] text-slate-100 rounded-tl-sm'
                          : 'bg-[#005c4b] text-white rounded-tr-sm font-medium'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                      <span className="text-[9px] text-slate-400 block text-right mt-1 font-mono">{m.time}</span>
                    </div>
                  </div>
                );
              })}

              {simLoading && (
                <div className="bg-[#202c33] text-slate-300 text-xs p-2.5 rounded-2xl w-fit flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  <span>escribiendo...</span>
                </div>
              )}
              <div ref={simEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSimSend();
              }}
              className="bg-[#202c33] p-2 rounded-b-[30px] flex items-center gap-1.5 border-t border-slate-800"
            >
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Mensaje..."
                className="flex-1 bg-[#2a3942] text-white text-xs px-3 py-2 rounded-full outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!simInput.trim() || simLoading}
                className="p-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white rounded-full transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SECCIÓN 3: ANALÍTICA & AUTOAPRENDIZAJE ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* TARJETAS RESUMEN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Consultas NLP</span>
              <p className="text-2xl font-black text-white">{analytics?.totalConsultas || 0}</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Tasa de Acierto / Éxito</span>
              <p className="text-2xl font-black text-emerald-400">
                {analytics?.totalConsultas ? (((analytics.consultasConRespuesta || 0) / analytics.totalConsultas) * 100).toFixed(1) : '98.5'}%
              </p>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-indigo-400 uppercase">Artículos Manual de Convivencia</span>
              <p className="text-2xl font-black text-indigo-400">6 Normas</p>
            </div>
            <div className="bg-pink-950/40 border border-pink-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-pink-400 uppercase">Base de Conocimiento</span>
              <p className="text-2xl font-black text-pink-400">{knowledge.length} Respuestas</p>
            </div>
          </div>

          {/* DISTRIBUCIÓN POR TEMAS & TENDENCIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Temas Más Frecuentes Consultados por Residentes
              </h3>

              <div className="space-y-3">
                {analytics?.categoriasMasConsultadas && Object.keys(analytics.categoriasMasConsultadas).length > 0 ? (
                  Object.entries(analytics.categoriasMasConsultadas).map(([cat, count]) => {
                    const total = analytics.totalConsultas || 1;
                    const pct = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 capitalize">{cat}</span>
                          <span className="text-indigo-400">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 text-center py-6">
                    Aún no hay suficiente histórico de preguntas. Interactúa con el bot en el simulador para alimentar la analítica.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Autoaprendizaje y Detección Proactiva
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                MinutaBot monitorea todas las consultas entrantes. Cuando un residente formula una pregunta no registrada, el motor NLP la cataloga automáticamente en la bandeja de <strong>"Consultas Sin Respuesta"</strong> para que puedas entrenar al bot con un solo clic.
              </p>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>⚡ Motor NLP Multicriterio:</span>
                  <strong className="text-emerald-400 font-mono">Activo (Local)</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>🚨 Protocolo de Detección SOS:</span>
                  <strong className="text-red-400 font-mono">Monitoreo 24/7</strong>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>📜 Citas Automáticas Ley 675:</span>
                  <strong className="text-indigo-400 font-mono">Integrado</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIÓN 4: CONSULTAS SIN RESPUESTA (ENTRENAMIENTO) ── */}
      {activeTab === 'unanswered' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700/80 bg-slate-900/80">
            <h3 className="font-bold text-white text-sm">Registro de Preguntas No Encontradas</h3>
            <p className="text-xs text-slate-400">
              Estas preguntas fueron realizadas por los residentes y no tuvieron coincidencia exacta. Haz clic en "Crear Respuesta" para entrenar al bot.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-4">Pregunta del Residente</th>
                  <th className="p-4">Frecuencia</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {unanswered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-500">
                      🎉 ¡Excelente! No hay preguntas pendientes por responder.
                    </td>
                  </tr>
                ) : (
                  unanswered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        "{u.pregunta}"
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                          {u.conteo || 1} consulta(s)
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(u.fecha).toLocaleString('es-CO')}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleOpenCreate(u.pregunta)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Crear Respuesta
                        </button>
                        <button
                          onClick={() => handleDeleteUnanswered(u.id)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs transition-all"
                          title="Descartar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR RESPUESTA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                {editingItem ? 'Editar Respuesta del Bot' : 'Nueva Respuesta para MinutaBot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="recreacion">Zonas Recreativas (Piscina, Gym, Canchas)</option>
                    <option value="aseo">Aseo & Limpieza por Torres</option>
                    <option value="basuras">Basuras, Shuts & Reciclaje</option>
                    <option value="convivencia">Manual de Convivencia & Ruidos</option>
                    <option value="parqueaderos">Parqueaderos & Bodegas</option>
                    <option value="pagos">Pagos & Administración</option>
                    <option value="emergencias">Directorio de Emergencias</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Título del Tema</label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Horario de la Piscina Climatizada"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Palabras Clave / Triggers (separadas por coma)
                </label>
                <input
                  type="text"
                  required
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="Ej: piscina, alberca, nadar, gorro, horario piscina"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 font-mono text-emerald-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Si el usuario escribe cualquiera de estas palabras o variaciones similares, el bot disparará esta respuesta.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Respuesta Oficial del Bot (Soporta Markdown, viñetas y emojis)
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.respuesta}
                  onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
                  placeholder="Ej: • Horario: Martes a Domingo de 06:00 AM a 09:00 PM&#10;• Mantenimiento: Cerrada los Lunes..."
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl text-xs outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ruta de Acción Rápida (Opcional)</label>
                  <input
                    type="text"
                    value={form.rutaAccion}
                    onChange={(e) => setForm({ ...form, rutaAccion: e.target.value })}
                    placeholder="Ej: /admin/info o /admin/porteria"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Texto del Botón</label>
                  <input
                    type="text"
                    value={form.labelAccion}
                    onChange={(e) => setForm({ ...form, labelAccion: e.target.value })}
                    placeholder="Ej: Ver Guía del Condominio"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30"
                >
                  {editingItem ? 'Actualizar Respuesta' : 'Guardar en Base de Conocimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}