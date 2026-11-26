import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Clock, Plus, Search, FileText, Download, User, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { createMinutaEntry, downloadSafeCSV, getLocalDateISO } from '../services/api';
import { useMinutaQuery } from '../hooks/useCondominioQueries';
import { queryKeys } from '../hooks/useQueryKeys';

const PAGE_LIMIT = 20;

export default function MinutaView() {
  const queryClient = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: 'general',
    titulo: '',
    descripcion: '',
    severidad: 'info',
    unidadId: ''
  });

  const queryParams = useMemo(
    () => ({
      tipo: filtroTipo || undefined,
      severidad: filtroSeveridad || undefined,
      search: searchQuery || undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    [filtroTipo, filtroSeveridad, searchQuery, page]
  );

  const minutaQ = useMinutaQuery(queryParams);
  const loading = minutaQ.isLoading || minutaQ.isFetching;

  const { minuta, pagination } = useMemo(() => {
    const raw = minutaQ.data;
    if (Array.isArray(raw)) {
      return {
        minuta: raw,
        pagination: { page: 1, total: raw.length, totalPages: 1, hasMore: false },
      };
    }
    return {
      minuta: Array.isArray(raw?.data) ? raw.data : [],
      pagination: raw?.pagination || { page: 1, total: 0, totalPages: 1, hasMore: false },
    };
  }, [minutaQ.data]);

  const loadMinuta = () => {
    queryClient.invalidateQueries({ queryKey: ['minuta'] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await createMinutaEntry(form);
      if (filtroTipo && created?.tipo && filtroTipo !== created.tipo) setFiltroTipo('');
      if (filtroSeveridad && created?.severidad && filtroSeveridad !== created.severidad) setFiltroSeveridad('');
      setPage(1);

      if (created?.id) {
        queryClient.setQueryData(queryKeys.minuta({ ...queryParams, page: 1 }), (old) => {
          if (Array.isArray(old)) {
            return [created, ...old.filter((m) => m.id !== created.id)];
          }
          const prevData = Array.isArray(old?.data) ? old.data : [];
          return {
            data: [created, ...prevData.filter((m) => m.id !== created.id)],
            pagination: {
              ...(old?.pagination || { page: 1, limit: PAGE_LIMIT, totalPages: 1, hasMore: false }),
              total: (old?.pagination?.total || prevData.length) + 1,
            },
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['minuta'] });

      toast.success(
        created?.offlinePending
          ? 'Novedad guardada en cola offline (se sincronizará al reconectar)'
          : 'Novedad registrada en la minuta oficial'
      );
      setShowModal(false);
      setForm({
        tipo: 'general',
        titulo: '',
        descripcion: '',
        severidad: 'info',
        unidadId: ''
      });
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
      recorrido: '🚶 Recorrido Perimetral',
      incidente: '🚨 Incidente / Alarma',
      emergencia: '🚨 Emergencia / SOS',
      urgente: '🔴 Novedad Urgente',
      acceso: '🪪 Control de Acceso',
      mantenimiento: '🔧 Mantenimiento / Daño',
      novedad: '📝 Novedad',
      general: '📝 Novedad General'
    };
    return tipos[tipo] || tipo || '📝 Novedad';
  };

  const handleExportCSV = () => {
    if (!minuta.length) {
      toast.info('No hay entradas en la minuta para exportar');
      return;
    }
    const headers = ['ID', 'Fecha y Hora', 'Tipo', 'Título', 'Severidad', 'Guardia', 'Descripción'];
    const rows = minuta.map(m => [
      m.id,
      m.fecha || m.timestamp ? new Date(m.fecha || m.timestamp).toLocaleString('es-CO') : '',
      getTipoLabel(m.tipo),
      m.titulo || getTipoLabel(m.tipo),
      m.severidad || 'info',
      m.guarda || m.guardaTurno || m.guardiaNombre || 'Guarda de Turno',
      m.descripcion || ''
    ]);
    downloadSafeCSV(`Minuta_Digital_Oficial_${getLocalDateISO()}.csv`, headers, rows);
    toast.success('Minuta exportada a Excel (CSV)');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Minuta Digital de Vigilancia <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Libro Oficial ({pagination.total})</span>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar en la minuta por palabra clave, guardia o apartamento..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
          >
            <option value="">Todos los Tipos</option>
            <option value="cambio_turno">Cambios de Turno</option>
            <option value="ronda">Rondas</option>
            <option value="recorrido">Recorridos Perimetrales</option>
            <option value="acceso">Control de Accesos</option>
            <option value="incidente">Incidentes</option>
            <option value="emergencia">Emergencias / SOS</option>
            <option value="urgente">Urgentes</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="novedad">Novedad</option>
            <option value="general">General</option>
          </select>
          <select
            value={filtroSeveridad}
            onChange={(e) => {
              setFiltroSeveridad(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
          >
            <option value="">Cualquier Severidad</option>
            <option value="info">Informativa</option>
            <option value="advertencia">Advertencia</option>
            <option value="peligro">Crítica</option>
          </select>
        </div>
      </div>

      {/* TIMELINE DE NOVEDADES */}
      <div className="space-y-4">
        {minuta.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron registros en la minuta oficial.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-700 ml-4 space-y-6 pb-4">
            {minuta.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-950 ${
                  item.severidad === 'peligro' ? 'bg-red-500' :
                  item.severidad === 'advertencia' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="bg-slate-900/80 border border-slate-700/80 p-5 rounded-2xl shadow-md hover:border-slate-600 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                        {getTipoLabel(item.tipo)}
                      </span>
                      <h3 className="font-bold text-white text-base">{item.titulo || getTipoLabel(item.tipo)}</h3>
                      {item.offlinePending && (
                        <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                          ⏳ En cola offline
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getSeveridadBadge(item.severidad)}
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {item.fecha ? new Date(item.fecha).toLocaleString('es-CO') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.descripcion}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Guarda Responsable: <strong className="text-slate-200">{item.guarda || item.guardaTurno || 'Guarda de Turno'}</strong>
                    </span>
                    <span className="font-mono text-[11px]">ID: {item.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-800/70 border border-slate-700 px-4 py-3 rounded-2xl text-xs">
            <span className="text-slate-400">
              Página <strong className="text-white">{pagination.page}</strong> de{' '}
              <strong className="text-white">{pagination.totalPages}</strong> • {pagination.total} registros totales
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 disabled:opacity-40 flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="button"
                disabled={!pagination.hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 disabled:opacity-40 flex items-center gap-1 font-semibold"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ASENTAR NOVEDAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
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
