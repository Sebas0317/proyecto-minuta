import React, { useState, useEffect, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchKnowledgeBase,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  fetchUnansweredQuestions,
  deleteUnansweredQuestion
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('knowledge'); // 'knowledge' | 'unanswered'
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [kbData, unansData] = await Promise.all([
        fetchKnowledgeBase().catch(() => []),
        fetchUnansweredQuestions().catch(() => [])
      ]);
      setKnowledge(kbData || []);
      setUnanswered(unansData || []);
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
      <div className="flex gap-2 border-b border-slate-700/80 pb-2">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'knowledge'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Base de Conocimiento ({knowledge.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('unanswered')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'unanswered'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Consultas Sin Respuesta ({unanswered.length})</span>
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

      {/* ── SECCIÓN 2: CONSULTAS SIN RESPUESTA (ENTRENAMIENTO) ── */}
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
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