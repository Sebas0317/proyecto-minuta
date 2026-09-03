import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, Search, Plus, Send, Check, Clock, User, 
  Building2, Phone, Filter, RefreshCw, X, CheckCircle,
  FileText, AlertTriangle, Calendar, Layers, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchPaquetes, createPaquete, notificarPaquete, entregarPaquete, fetchUnidades } from '../services/api';

export default function PaqueteriaView() {
  const [paquetes, setPaquetes] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('paquetes'); // 'paquetes' | 'recibos' | 'historial'
  const [filtroTorre, setFiltroTorre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [showPaqueteModal, setShowPaqueteModal] = useState(false);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [entregaModal, setEntregaModal] = useState(null);

  // Form Paquete
  const [formPaquete, setFormPaquete] = useState({
    categoria: 'encomienda',
    torre: 'Torre 1',
    apto: '',
    destinatario: '',
    empresa: 'Servientrega',
    guia: '',
    descripcion: 'Paquete mediano'
  });

  // Form Recibo Público
  const [formRecibo, setFormRecibo] = useState({
    categoria: 'recibo_publico',
    torre: 'Torre 1',
    apto: '',
    tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
    empresa: 'Empresa de Acueducto',
    mesFacturado: 'Agosto 2026',
    observacion: 'Factura del mes'
  });

  // Form Entrega
  const [entregaForm, setEntregaForm] = useState({
    retiradoPor: '',
    codigoRetiro: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, uData] = await Promise.all([
        fetchPaquetes({
          search: searchQuery || undefined
        }),
        fetchUnidades()
      ]);
      setPaquetes(pData || []);
      setUnidades(uData || []);
    } catch (err) {
      toast.error('Error al cargar correspondencia');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper para calcular días acumulados en portería
  const calcularDiasEnPorteria = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffMs = hoy - ingreso;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Filtrados por categorías
  const encomiendasPendientes = useMemo(() => {
    return paquetes.filter(p => {
      if (p.categoria === 'recibo_publico') return false;
      if (p.estado === 'entregado') return false;
      if (filtroTorre && p.torre !== filtroTorre) return false;
      return true;
    });
  }, [paquetes, filtroTorre]);

  const recibosPublicos = useMemo(() => {
    return paquetes.filter(p => {
      if (p.categoria !== 'recibo_publico') return false;
      if (p.estado === 'entregado') return false;
      if (filtroTorre && p.torre !== filtroTorre) return false;
      return true;
    });
  }, [paquetes, filtroTorre]);

  const historialEntregas = useMemo(() => {
    return paquetes.filter(p => {
      if (p.estado !== 'entregado') return false;
      if (filtroTorre && p.torre !== filtroTorre) return false;
      return true;
    });
  }, [paquetes, filtroTorre]);

  // Handlers
  const handleCreatePaquete = async (e) => {
    e.preventDefault();
    try {
      await createPaquete({ ...formPaquete, categoria: 'encomienda' });
      toast.success('Encomienda registrada con PIN de retiro');
      setShowPaqueteModal(false);
      setFormPaquete({
        categoria: 'encomienda',
        torre: 'Torre 1',
        apto: '',
        destinatario: '',
        empresa: 'Servientrega',
        guia: '',
        descripcion: 'Paquete mediano'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar encomienda');
    }
  };

  const handleCreateRecibo = async (e) => {
    e.preventDefault();
    try {
      await createPaquete({
        ...formRecibo,
        categoria: 'recibo_publico',
        descripcion: `Recibo de ${formRecibo.tipoRecibo} (${formRecibo.mesFacturado})`,
        destinatario: `Titular Apto ${formRecibo.apto}`,
        guia: `REC-${formRecibo.apto}`
      });
      toast.success(`Recibo de ${formRecibo.tipoRecibo} registrado para Apto ${formRecibo.apto}`);
      setShowReciboModal(false);
      setFormRecibo({
        categoria: 'recibo_publico',
        torre: 'Torre 1',
        apto: '',
        tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
        empresa: 'Empresa de Acueducto',
        mesFacturado: 'Agosto 2026',
        observacion: 'Factura del mes'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar recibo público');
    }
  };

  const handleNotificar = (paquete) => {
    const unidad = unidades.find(u => u.torre === paquete.torre && u.numero === paquete.apto);
    const tel = unidad?.residentes?.[0]?.telefono || unidad?.propietario?.telefono;
    const msg = encodeURIComponent(`Hola, le informamos desde la Portería que tiene correspondencia pendiente (${paquete.empresa || paquete.tipoRecibo}). Código de retiro: ${paquete.codigoRetiro || 'En casillero'}. Por favor pasar a reclamarlo.`);
    
    if (tel) {
      window.open(`https://wa.me/57${tel.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
      notificarPaquete(paquete.id).then(() => loadData());
    } else {
      toast.info(`Código de retiro: ${paquete.codigoRetiro}`);
    }
  };

  const handleEntregar = async (e) => {
    e.preventDefault();
    if (!entregaModal) return;
    try {
      await entregarPaquete(entregaModal.id, entregaForm);
      toast.success('Correspondencia entregada con éxito');
      setEntregaModal(null);
      setEntregaForm({ retiradoPor: '', codigoRetiro: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al entregar correspondencia');
    }
  };
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Paquetería & Recibos Públicos <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">Casillero de Portería</span>
            </h1>
            <p className="text-slate-400 text-sm">Control de encomiendas con PIN de 4 dígitos y seguimiento de facturas públicas acumuladas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowReciboModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4" />
            <span>+ Ingresar Recibo Público</span>
          </button>
          <button
            onClick={() => setShowPaqueteModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Encomienda</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS RÁPIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Paquetes por Retirar</span>
          <p className="text-2xl font-black text-white">{encomiendasPendientes.length}</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Recibos Públicos en Custodia</span>
          <p className="text-2xl font-black text-amber-400">{recibosPublicos.length}</p>
        </div>
        <div className="bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-red-400 uppercase">Recibos &gt; 30 Días sin Reclamar</span>
          <p className="text-2xl font-black text-red-400">
            {recibosPublicos.filter(r => calcularDiasEnPorteria(r.fechaIngreso) >= 30).length}
          </p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Entregados este Mes</span>
          <p className="text-2xl font-black text-emerald-400">{historialEntregas.length}</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-2">
        <button
          onClick={() => setTabActiva('paquetes')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            tabActiva === 'paquetes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Encomiendas Pendientes ({encomiendasPendientes.length})
        </button>

        <button
          onClick={() => setTabActiva('recibos')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            tabActiva === 'recibos'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Recibos Públicos en Casillero ({recibosPublicos.length})
        </button>

        <button
          onClick={() => setTabActiva('historial')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            tabActiva === 'historial'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Historial de Entregas ({historialEntregas.length})
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por apartamento (ej: 101), destinatario, empresa o guía..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filtroTorre}
          onChange={(e) => setFiltroTorre(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold outline-none"
        >
          <option value="">Todas las Torres</option>
          <option value="Torre 1">Torre 1</option>
          <option value="Torre 2">Torre 2</option>
          <option value="Torre 3">Torre 3</option>
          <option value="Torre 4">Torre 4</option>
          <option value="Torre 5">Torre 5</option>
        </select>
      </div>

      {/* TAB 1: PAQUETES Y ENCOMIENDAS */}
      {tabActiva === 'paquetes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {encomiendasPendientes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30 text-blue-400" />
              <p>No hay paquetes pendientes por retirar en este momento.</p>
            </div>
          ) : (
            encomiendasPendientes.map((p) => (
              <div key={p.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-500 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl font-black text-sm">
                        {p.apto}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{p.torre} - Apto {p.apto}</h3>
                        <p className="text-[11px] text-slate-400">{p.empresa}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                      PIN: {p.codigoRetiro}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-3 text-xs">
                    <p><strong className="text-slate-400">Destinatario:</strong> <span className="text-white font-bold">{p.destinatario}</span></p>
                    <p><strong className="text-slate-400">Descripción:</strong> <span className="text-slate-300">{p.descripcion}</span></p>
                    <p><strong className="text-slate-400">Guía / Tracking:</strong> <span className="font-mono text-slate-300">{p.guia || 'Sin guía'}</span></p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Ingresó: {new Date(p.fechaIngreso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => handleNotificar(p)}
                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => setEntregaModal(p)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40"
                  >
                    Entregar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: RECIBOS PÚBLICOS EN CUSTODIA */}
      {tabActiva === 'recibos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recibosPublicos.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30 text-amber-400" />
              <p>No hay recibos públicos acumulados en portería.</p>
            </div>
          ) : (
            recibosPublicos.map((r) => {
              const dias = calcularDiasEnPorteria(r.fechaIngreso);
              const isCritico = dias >= 30;

              return (
                <div 
                  key={r.id} 
                  className={`bg-slate-800/90 border-2 ${
                    isCritico ? 'border-red-500 ring-1 ring-red-500/40 shadow-xl shadow-red-950/20' : 'border-amber-500/40'
                  } p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl font-black text-sm">
                          {r.apto}
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-sm">{r.torre} - Apto {r.apto}</h3>
                          <p className="text-[11px] text-amber-400 font-semibold">{r.tipoRecibo}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCritico ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {dias} días acumulados
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-3 text-xs">
                      <p><strong className="text-slate-400">Empresa / Emisor:</strong> <span className="text-white">{r.empresa}</span></p>
                      <p><strong className="text-slate-400">Periodo Facturado:</strong> <span className="text-white font-bold">{r.mesFacturado || 'Mes Actual'}</span></p>
                      {r.valorFactura && (
                        <p><strong className="text-slate-400">Valor Factura:</strong> <span className="text-emerald-400 font-mono font-bold">${Number(r.valorFactura).toLocaleString('es-CO')} COP</span></p>
                      )}
                      {r.observacion && (
                        <p className="text-amber-300/90 italic bg-slate-950 p-2 rounded-lg border border-amber-900/60 mt-1">
                          {r.observacion}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 pt-1">
                        Recibido en portería: {new Date(r.fechaIngreso).toLocaleDateString('es-CO')} ({dias} días sin retirar)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={() => handleNotificar(r)}
                      className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => setEntregaModal(r)}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-950/40"
                    >
                      Entregar Recibo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: HISTORIAL DE ENTREGAS COMPLETADAS */}
      {tabActiva === 'historial' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> Registro Oficial de Correspondencia Entregada
            </h3>
            <span className="text-xs text-slate-400">{historialEntregas.length} registros archivados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="px-5 py-3">Inmueble</th>
                  <th className="px-5 py-3">Tipo / Descripción</th>
                  <th className="px-5 py-3">Entregado a</th>
                  <th className="px-5 py-3">Fecha Ingreso</th>
                  <th className="px-5 py-3">Fecha Entrega</th>
                  <th className="px-5 py-3 text-right">Guarda Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {historialEntregas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Sin entregas registradas en el historial
                    </td>
                  </tr>
                ) : (
                  historialEntregas.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">
                        {h.torre} - Apto {h.apto}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                          h.categoria === 'recibo_publico' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {h.categoria === 'recibo_publico' ? 'Recibo' : 'Encomienda'}
                        </span>
                        {h.empresa || h.tipoRecibo} ({h.descripcion})
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-400">
                        {h.retiradoPor || 'Residente titular'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">
                        {new Date(h.fechaIngreso).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono font-semibold">
                        {new Date(h.fechaEntrega || h.fechaIngreso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 font-mono">
                        {h.guardaEntrega || 'Guarda de Turno'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ENCOMIENDA */}
      {showPaqueteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Registrar Encomienda
              </h3>
              <button onClick={() => setShowPaqueteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaquete} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Torre *</label>
                  <select
                    value={formPaquete.torre}
                    onChange={(e) => setFormPaquete({ ...formPaquete, torre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Apartamento *</label>
                  <input
                    type="text"
                    required
                    value={formPaquete.apto}
                    onChange={(e) => setFormPaquete({ ...formPaquete, apto: e.target.value })}
                    placeholder="Ej: 101"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Destinatario *</label>
                <input
                  type="text"
                  required
                  value={formPaquete.destinatario}
                  onChange={(e) => setFormPaquete({ ...formPaquete, destinatario: e.target.value })}
                  placeholder="Nombre de quien recibe"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Empresa Transportadora</label>
                  <select
                    value={formPaquete.empresa}
                    onChange={(e) => setFormPaquete({ ...formPaquete, empresa: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Servientrega">Servientrega</option>
                    <option value="Coordinadora">Coordinadora</option>
                    <option value="Mercado Libre">Mercado Libre</option>
                    <option value="Inter Rapidísimo">Inter Rapidísimo</option>
                    <option value="Amazon / DHL">Amazon / DHL</option>
                    <option value="Deprisa">Deprisa</option>
                    <option value="Particular / Otro">Particular / Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Número de Guía</label>
                  <input
                    type="text"
                    value={formPaquete.guia}
                    onChange={(e) => setFormPaquete({ ...formPaquete, guia: e.target.value })}
                    placeholder="Opcional"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descripción del Paquete</label>
                <input
                  type="text"
                  value={formPaquete.descripcion}
                  onChange={(e) => setFormPaquete({ ...formPaquete, descripcion: e.target.value })}
                  placeholder="Caja mediana, sobre, etc."
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaqueteModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/40"
                >
                  Guardar y Generar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO RECIBO PÚBLICO */}
      {showReciboModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Ingresar Recibo Público
              </h3>
              <button onClick={() => setShowReciboModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecibo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Torre *</label>
                  <select
                    value={formRecibo.torre}
                    onChange={(e) => setFormRecibo({ ...formRecibo, torre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Apartamento *</label>
                  <input
                    type="text"
                    required
                    value={formRecibo.apto}
                    onChange={(e) => setFormRecibo({ ...formRecibo, apto: e.target.value })}
                    placeholder="Ej: 203"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tipo de Servicio Público *</label>
                <select
                  value={formRecibo.tipoRecibo}
                  onChange={(e) => {
                    const val = e.target.value;
                    let emp = 'Empresa de Acueducto';
                    if (val.includes('Energía')) emp = 'Enel / Codensa';
                    if (val.includes('Gas')) emp = 'Vanti Gas Natural';
                    if (val.includes('Internet')) emp = 'Claro / Movistar';
                    if (val.includes('Predial')) emp = 'Alcaldía Municipal';
                    setFormRecibo({ ...formRecibo, tipoRecibo: val, empresa: emp });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                >
                  <option value="Acueducto y Alcantarillado (Agua)">Acueducto y Alcantarillado (Agua)</option>
                  <option value="Energía Eléctrica (Luz)">Energía Eléctrica (Luz)</option>
                  <option value="Gas Natural">Gas Natural</option>
                  <option value="Internet / Telecomunicaciones">Internet / Telecomunicaciones</option>
                  <option value="Impuesto Predial">Impuesto Predial</option>
                  <option value="Circular de Administración">Circular de Administración</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Empresa Emisora</label>
                  <input
                    type="text"
                    value={formRecibo.empresa}
                    onChange={(e) => setFormRecibo({ ...formRecibo, empresa: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mes Facturado</label>
                  <input
                    type="text"
                    value={formRecibo.mesFacturado}
                    onChange={(e) => setFormRecibo({ ...formRecibo, mesFacturado: e.target.value })}
                    placeholder="Agosto 2026"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observación</label>
                <input
                  type="text"
                  value={formRecibo.observacion}
                  onChange={(e) => setFormRecibo({ ...formRecibo, observacion: e.target.value })}
                  placeholder="Factura en casillero"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReciboModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-900/40"
                >
                  Ingresar a Casillero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTREGAR CORRESPONDENCIA */}
      {entregaModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Registrar Entrega
              </h3>
              <button onClick={() => setEntregaModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
              <p><strong className="text-slate-400">Destino:</strong> <span className="text-white font-bold">{entregaModal.torre} - Apto {entregaModal.apto}</span></p>
              <p><strong className="text-slate-400">Item:</strong> <span className="text-emerald-400 font-bold">{entregaModal.empresa || entregaModal.tipoRecibo} ({entregaModal.descripcion})</span></p>
            </div>

            <form onSubmit={handleEntregar} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre y Cédula de Quien Retira *</label>
                <input
                  type="text"
                  required
                  value={entregaForm.retiradoPor}
                  onChange={(e) => setEntregaForm({ ...entregaForm, retiradoPor: e.target.value })}
                  placeholder="Ej: Carlos Gómez (C.C. 10203040)"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {entregaModal.categoria !== 'recibo_publico' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">PIN de Retiro (4 dígitos)</label>
                  <input
                    type="text"
                    value={entregaForm.codigoRetiro}
                    onChange={(e) => setEntregaForm({ ...entregaForm, codigoRetiro: e.target.value })}
                    placeholder="Ingresado por el residente"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl text-sm font-mono outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEntregaModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40"
                >
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}