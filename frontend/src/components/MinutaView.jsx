import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, Shield, Clock, Plus, Filter, Search, 
  CheckCircle, FileText, Download, User, Calendar, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchMinuta, createMinutaEntry } from '../services/api';

export default function MinutaView() {
  const [minuta, setMinuta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: 'general',
    titulo: '',
    descripcion: '',
    severidad: 'info',
    unidadId: ''
  });

  const loadMinuta = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMinuta({
        tipo: filtroTipo || undefined,
        severidad: filtroSeveridad || undefined,
        search: searchQuery || undefined
      });
      setMinuta(data || []);
    } catch (err) {
      toast.error('Error al cargar minuta de novedades');
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroSeveridad, searchQuery]);

  useEffect(() => {
    loadMinuta();
  }, [loadMinuta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMinutaEntry(form);
      toast.success('Novedad registrada en la minuta oficial');
      setShowModal(false);
      setForm({
        tipo: 'general',
        titulo: '',
        descripcion: '',
        severidad: 'info',
        unidadId: ''
      });
      loadMinuta();
    } catch (err) {
      toast.error(err.message || 'Error al guardar novedad');
    }
  };

  const getSeveridadBadge = (sev) => {
    switch (sev) {
      case 'peligro':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs px-2.5 py-1 rounded-full font-bold">Crítica</span>;
      case 'advertencia':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-bold">Advertencia</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs px-2.5 py-1 rounded-full font-bold">Informativa</span>;
    }
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      cambio_turno: '🔄 Cambio de Turno',
      ronda: '🚶 Ronda de Seguridad',
      incidente: '🚨 Incidente / Alarma',
      mantenimiento: '🔧 Mantenimiento / Daño',
      general: '📝 Novedad General'
    };
    return tipos[tipo] || tipo;
  };
  const handleExportCSV = () => {
    if (!minuta.length) {
      toast.info('No hay entradas en la minuta para exportar');
      return;
    }
    const headers = ['ID', 'Fecha y Hora', 'Tipo', 'Título', 'Severidad', 'Guardia', 'Descripción'];
    const rows = minuta.map(m => [
      m.id,
      new Date(m.fecha || m.timestamp).toLocaleString('es-CO'),
      `"${getTipoLabel(m.tipo)}"`,
      `"${(m.titulo || '').replace(/"/g, '""')}"`,
      m.severidad || 'info',
      `"${m.guarda || m.guardiaNombre || 'Guardia'}"`,
      `"${(m.descripcion || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Minuta_Digital_Oficial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Minuta exportada a Excel (CSV)');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Minuta Digital de Vigilancia <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Libro Oficial</span>
            </h1>
            <p className="text-slate-400 text-sm">Registro cronológico inmutable de novedades, rondas y cambios de guardia</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all"
            title="Exportar a Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Asentar Novedad</span>
          </button>
          <button
            onClick={loadMinuta}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palabras clave, guardia o contenido..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
          >
            <option value="">Todos los Tipos</option>
            <option value="cambio_turno">Cambio de Turno</option>
            <option value="ronda">Rondas</option>
            <option value="incidente">Incidentes</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="general">General</option>
          </select>
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
          >
            <option value="">Toda Severidad</option>
            <option value="info">Informativa</option>
            <option value="advertencia">Advertencia</option>
            <option value="peligro">Crítica</option>
          </select>
        </div>
      </div>

      {/* TIMELINE DE MINUTA */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        {minuta.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay registros en la minuta con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-6">
            {minuta.map((item) => (
              <div key={item.id} className="relative group">
                {/* Dot */}
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  item.severidad === 'peligro' ? 'bg-red-500' :
                  item.severidad === 'advertencia' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="bg-slate-900/80 border border-slate-700/80 p-5 rounded-2xl shadow-md hover:border-slate-600 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                        {getTipoLabel(item.tipo)}
                      </span>
                      <h3 className="font-bold text-white text-base">{item.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {getSeveridadBadge(item.severidad)}
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.fecha).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.descripcion}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Guarda Responsable: <strong className="text-slate-200">{item.guarda}</strong>
                    </span>
                    <span className="font-mono text-[11px]">ID: {item.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ASENTAR NOVEDAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Asentar Novedad en Minuta
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Novedad</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="general">Novedad General</option>
                    <option value="cambio_turno">Cambio de Turno</option>
                    <option value="ronda">Ronda de Vigilancia</option>
                    <option value="incidente">Incidente / Alarma</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Severidad</label>
                  <select
                    value={form.severidad}
                    onChange={(e) => setForm({ ...form, severidad: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="info">Informativa</option>
                    <option value="advertencia">Advertencia</option>
                    <option value="peligro">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Título breve del suceso"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Descripción Completa *</label>
                <textarea
                  required
                  rows={4}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles precisos de la novedad..."
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-900/40"
                >
                  Guardar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}