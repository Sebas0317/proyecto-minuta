import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquareQuote, Search, Filter, Plus, CheckCircle, Clock,
  AlertTriangle, RefreshCw, X, Send, FileText, Download, User,
  Building2, Calendar, ShieldAlert, CheckCircle2, ChevronRight, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchPqrs, createPqrs, responderPqrs, updatePqrsEstado, deletePqrs } from '../services/api';
import { generarTicketPqrsPDF } from '../utils/pdfGenerator';

const CATEGORIAS = [
  'Petición',
  'Queja',
  'Reclamo',
  'Sugerencia',
  'Felicitación',
  'Mantenimiento',
  'Seguridad'
];

const ESTADOS = [
  { id: 'radicado', label: 'Radicado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'en_tramite', label: 'En Trámite', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'respondido', label: 'Respondido', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'cerrado', label: 'Cerrado', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

export default function PqrsAdminView() {
  const [pqrsList, setPqrsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCategoria, setFilterCategoria] = useState('todas');
  const [filterTorre, setFilterTorre] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Response Form
  const [respuestaText, setRespuestaText] = useState('');
  const [nuevoEstadoRespuesta, setNuevoEstadoRespuesta] = useState('respondido');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Create Form
  const [createForm, setCreateForm] = useState({
    categoria: 'Petición',
    asunto: '',
    descripcion: '',
    torre: 'Torre 1',
    apto: '',
    solicitante: '',
    email: '',
    telefono: '',
    prioridad: 'media'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPqrs();
      setPqrsList(data || []);
    } catch (err) {
      toast.error('Error al sincronizar módulo de PQRS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filteredTickets = useMemo(() => {
    return pqrsList.filter((ticket) => {
      if (filterEstado !== 'todos' && ticket.estado !== filterEstado) return false;
      if (filterCategoria !== 'todas' && ticket.categoria !== filterCategoria) return false;
      if (filterTorre !== 'todas' && ticket.torre !== filterTorre) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const radicado = (ticket.radicado || '').toLowerCase();
        const asunto = (ticket.asunto || '').toLowerCase();
        const desc = (ticket.descripcion || '').toLowerCase();
        const solic = (ticket.solicitante || '').toLowerCase();
        const apto = (ticket.apto || '').toLowerCase();
        return radicado.includes(term) || asunto.includes(term) || desc.includes(term) || solic.includes(term) || apto.includes(term);
      }
      return true;
    });
  }, [pqrsList, filterEstado, filterCategoria, filterTorre, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = pqrsList.length;
    const radicadas = pqrsList.filter(p => p.estado === 'radicado').length;
    const enTramite = pqrsList.filter(p => p.estado === 'en_tramite').length;
    const resueltas = pqrsList.filter(p => p.estado === 'respondido' || p.estado === 'cerrado').length;
    
    // Check overdue (>15 business days or fechaLimiteRespuesta in past)
    const now = new Date();
    const vencidas = pqrsList.filter(p => {
      if (p.estado === 'respondido' || p.estado === 'cerrado') return false;
      if (!p.fechaLimiteRespuesta) return false;
      return new Date(p.fechaLimiteRespuesta) < now;
    }).length;

    return { total, radicadas, enTramite, resueltas, vencidas };
  }, [pqrsList]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!createForm.asunto || !createForm.descripcion || !createForm.apto) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const created = await createPqrs(createForm);
      toast.success(`PQRS radicada exitosamente: ${created.radicado || ''}`);
      setShowCreateModal(false);
      setCreateForm({
        categoria: 'Petición',
        asunto: '',
        descripcion: '',
        torre: 'Torre 1',
        apto: '',
        solicitante: '',
        email: '',
        telefono: '',
        prioridad: 'media'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al radicar PQRS');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!respuestaText.trim() || !selectedTicket) {
      toast.error('Por favor escribe la respuesta oficial');
      return;
    }

    try {
      setSubmittingResponse(true);
      const updated = await responderPqrs(selectedTicket.id, {
        respuesta: respuestaText.trim(),
        respondidoPor: 'Administración EcoBosque',
        nuevoEstado: nuevoEstadoRespuesta
      });
      toast.success('Respuesta oficial registrada y notificada');
      setSelectedTicket(updated);
      setRespuestaText('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al enviar respuesta');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleUpdateEstado = async (ticketId, estado) => {
    try {
      const updated = await updatePqrsEstado(ticketId, { estado });
      toast.success(`Estado actualizado a ${estado}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(updated);
      }
      loadData();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  const exportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }
    const headers = ['Radicado', 'Fecha', 'Fecha Limite', 'Categoria', 'Prioridad', 'Torre', 'Apto', 'Solicitante', 'Estado', 'Asunto'];
    const rows = filteredTickets.map(t => [
      t.radicado || '',
      t.fecha || '',
      t.fechaLimiteRespuesta || '',
      t.categoria || '',
      t.prioridad || '',
      t.torre || '',
      t.apto || '',
      t.solicitante || '',
      t.estado || '',
      `"${(t.asunto || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PQRS_EcoBosque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte CSV descargado');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
            <MessageSquareQuote className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Gestión de PQRS <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-semibold">Término Legal 15 Días</span>
            </h1>
            <p className="text-slate-400 text-sm">Peticiones, Quejas, Reclamos y Solicitudes conforme a la Ley 1755 de 2015 y Ley 675</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2.5 rounded-xl font-medium border border-slate-600 text-sm transition-all"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl border border-slate-600 transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar PQRS</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total PQRS</span>
            <Tag className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-500 mt-1">Histórico general</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
            <span>Radicadas Nuevas</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{stats.radicadas}</p>
          <span className="text-[11px] text-slate-500 mt-1">Por asignar o revisar</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>En Trámite</span>
            <RefreshCw className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{stats.enTramite}</p>
          <span className="text-[11px] text-slate-500 mt-1">En curso o inspección</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Respondidas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.resueltas}</p>
          <span className="text-[11px] text-slate-500 mt-1">Con respuesta formal</span>
        </div>

        <div className="bg-slate-800/80 border border-rose-900/50 bg-rose-950/20 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Vencidas (&gt;15 días)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{stats.vencidas}</p>
          <span className="text-[11px] text-rose-400/70 mt-1">Atención prioritaria</span>
        </div>
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por radicado, asunto, descripción, residente o apto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="radicado">Radicado</option>
              <option value="en_tramite">En Trámite</option>
              <option value="respondido">Respondido</option>
              <option value="cerrado">Cerrado</option>
            </select>

            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="todas">Todas las Categorías</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterTorre}
              onChange={(e) => setFilterTorre(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="todas">Todas las Torres</option>
              <option value="Torre 1">Torre 1</option>
              <option value="Torre 2">Torre 2</option>
              <option value="Torre 3">Torre 3</option>
              <option value="Torre 4">Torre 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* TICKETS LIST */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          <p className="text-sm">Cargando tickets de PQRS...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-300">No se encontraron tickets</h3>
          <p className="text-sm text-slate-500 mt-1">Ajusta los filtros o radica una nueva PQRS.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const isVencida = ticket.estado !== 'respondido' && ticket.estado !== 'cerrado' && ticket.fechaLimiteRespuesta && new Date(ticket.fechaLimiteRespuesta) < new Date();
            const estadoObj = ESTADOS.find(e => e.id === ticket.estado) || ESTADOS[0];

            return (
              <div
                key={ticket.id}
                className={`bg-slate-800/90 border ${isVencida ? 'border-rose-500/50 hover:border-rose-400' : 'border-slate-700 hover:border-cyan-500/50'} rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-xl relative group`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                      {ticket.radicado}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${estadoObj.color}`}>
                      {estadoObj.label}
                    </span>
                  </div>

                  {/* Asunto & Categoria */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                        {ticket.categoria}
                      </span>
                      {ticket.prioridad === 'alta' && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          ALTA
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                      {ticket.asunto}
                    </h3>
                  </div>

                  {/* Descripcion snippet */}
                  <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed">
                    {ticket.descripcion}
                  </p>

                  {/* Solicitante & Ubicacion */}
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-2.5 space-y-1 text-xs text-slate-300 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Ubicación:
                      </span>
                      <span className="font-semibold text-white">{ticket.torre} - Apto {ticket.apto}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Solicitante:
                      </span>
                      <span className="font-medium text-slate-300 truncate max-w-[140px]">{ticket.solicitante || 'Residente'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Legal Date & Actions */}
                <div className="pt-3 border-t border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Radicado: {ticket.fecha ? ticket.fecha.slice(0, 10) : ''}
                    </span>
                    {isVencida ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> VENCIDO
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">
                        Límite: {ticket.fechaLimiteRespuesta || '15 días'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        generarTicketPqrsPDF(ticket);
                        toast.success(`Comprobante ${ticket.radicado} descargado`);
                      }}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl border border-slate-600 transition-colors"
                      title="Descargar Radicado PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-cyan-600 text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all group-hover:bg-cyan-600"
                    >
                      <span>Gestionar y Responder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DETAIL & RESPONSE */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <MessageSquareQuote className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">{selectedTicket.radicado}</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-medium">
                      {selectedTicket.categoria}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedTicket.asunto}</h2>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Inmueble</span>
                  <span className="font-semibold text-white">{selectedTicket.torre} - {selectedTicket.apto}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Solicitante</span>
                  <span className="font-semibold text-white">{selectedTicket.solicitante || 'Residente'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Fecha Radicación</span>
                  <span className="font-semibold text-white">{selectedTicket.fecha}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Fecha Límite Legal</span>
                  <span className="font-semibold text-amber-400">{selectedTicket.fechaLimiteRespuesta || '15 días hábiles'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Teléfono / Contacto</span>
                  <span className="font-semibold text-white">{selectedTicket.telefono || selectedTicket.email || 'N/D'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Estado Actual</span>
                  <select
                    value={selectedTicket.estado}
                    onChange={(e) => handleUpdateEstado(selectedTicket.id, e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-cyan-300 font-semibold focus:outline-none"
                  >
                    <option value="radicado">Radicado</option>
                    <option value="en_tramite">En Trámite</option>
                    <option value="respondido">Respondido</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>

              {/* Solicitud Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Descripción Detallada del Residente
                </h4>
                <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-2xl text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.descripcion}
                </div>
              </div>

              {/* Respuestas / Conversación */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>Historial de Respuestas Oficiales</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {selectedTicket.respuestas ? selectedTicket.respuestas.length : 0}
                  </span>
                </h4>

                {selectedTicket.respuestas && selectedTicket.respuestas.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTicket.respuestas.map((resp, i) => (
                      <div key={i} className="bg-cyan-950/30 border border-cyan-800/40 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
                          <span>{resp.respondidoPor || 'Administración EcoBosque'}</span>
                          <span className="text-slate-400 text-[11px]">{resp.fecha}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{resp.respuesta}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-900/40 border border-dashed border-slate-700 rounded-2xl text-slate-500 text-xs">
                    No hay respuestas oficiales emitidas aún.
                  </div>
                )}
              </div>

              {/* Form to submit new response */}
              <form onSubmit={handleSendResponse} className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Emitir Nueva Respuesta Formal
                </h4>
                <textarea
                  rows="3"
                  placeholder="Escribe la respuesta oficial de la administración que será notificada al residente..."
                  value={respuestaText}
                  onChange={(e) => setRespuestaText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400">Actualizar estado a:</span>
                    <select
                      value={nuevoEstadoRespuesta}
                      onChange={(e) => setNuevoEstadoRespuesta(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="respondido">Respondido (Finalizado)</option>
                      <option value="en_tramite">En Trámite (Seguimiento)</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingResponse}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-cyan-900/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingResponse ? 'Registrando...' : 'Emitir Respuesta'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 p-4 border-t border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  generarTicketPqrsPDF(selectedTicket);
                  toast.success('Radicado oficial descargado');
                }}
                className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Acta / Radicado PDF</span>
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PQRS */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Radicar Nueva PQRS</h2>
                  <p className="text-xs text-slate-400">Genera consecutivo oficial y plazo de 15 días hábiles</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Solicitud *</label>
                  <select
                    value={createForm.categoria}
                    onChange={(e) => setCreateForm({ ...createForm, categoria: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Prioridad</label>
                  <select
                    value={createForm.prioridad}
                    onChange={(e) => setCreateForm({ ...createForm, prioridad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Torre *</label>
                  <select
                    value={createForm.torre}
                    onChange={(e) => setCreateForm({ ...createForm, torre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Apartamento *</label>
                  <input
                    type="text"
                    placeholder="Ej. 302"
                    value={createForm.apto}
                    onChange={(e) => setCreateForm({ ...createForm, apto: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre Solicitante</label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    value={createForm.solicitante}
                    onChange={(e) => setCreateForm({ ...createForm, solicitante: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej. 3124567890"
                    value={createForm.telefono}
                    onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Asunto / Título de la Solicitud *</label>
                <input
                  type="text"
                  placeholder="Ej. Solicitud de revisión de luminaria pasillo piso 3"
                  value={createForm.asunto}
                  onChange={(e) => setCreateForm({ ...createForm, asunto: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descripción y Hechos *</label>
                <textarea
                  rows="4"
                  placeholder="Detalla los antecedentes, solicitud concreta o reclamo..."
                  value={createForm.descripcion}
                  onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02]"
                >
                  Radicar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
