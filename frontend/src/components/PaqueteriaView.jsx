import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, Search, Plus, Send, Check, Clock, User, 
  Building2, Phone, Filter, RefreshCw, X, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchPaquetes, createPaquete, notificarPaquete, entregarPaquete, fetchUnidades } from '../services/api';

export default function PaqueteriaView() {
  const [paquetes, setPaquetes] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [entregaModal, setEntregaModal] = useState(null);

  const [form, setForm] = useState({
    torre: 'Torre 1',
    apto: '',
    destinatario: '',
    empresa: 'Servientrega',
    guia: '',
    descripcion: 'Paquete mediano'
  });

  const [entregaForm, setEntregaForm] = useState({
    retiradoPor: '',
    codigoRetiro: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, uData] = await Promise.all([
        fetchPaquetes({
          estado: filtroEstado || undefined,
          search: searchQuery || undefined
        }),
        fetchUnidades()
      ]);
      setPaquetes(pData || []);
      setUnidades(uData || []);
    } catch (err) {
      toast.error('Error al cargar paquetería');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPaquete(form);
      toast.success('Paquete registrado exitosamente');
      setShowModal(false);
      setForm({
        torre: 'Torre 1',
        apto: '',
        destinatario: '',
        empresa: 'Servientrega',
        guia: '',
        descripcion: 'Paquete mediano'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar paquete');
    }
  };

  const handleNotificar = (paquete) => {
    const unidad = unidades.find(u => u.torre === paquete.torre && u.numero === paquete.apto);
    const tel = unidad?.residentes?.[0]?.telefono || unidad?.propietario?.telefono;
    const msg = encodeURIComponent(`Hola, le informamos desde la Portería que ha llegado un paquete a su nombre (${paquete.empresa}, Guía: ${paquete.guia}). Código de retiro: ${paquete.codigoRetiro}. Por favor pasar a portería a reclamarlo.`);
    
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
      toast.success('Paquete entregado satisfactoriamente');
      setEntregaModal(null);
      setEntregaForm({ retiradoPor: '', codigoRetiro: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al entregar paquete');
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Recepción y Paquetería <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">Control de Encomiendas</span>
            </h1>
            <p className="text-slate-400 text-sm">Registro de paquetes recibidos, alertas por WhatsApp y entrega segura con PIN</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Recibir Paquete</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
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
            placeholder="Buscar por guía, apartamento, destinatario o transportadora..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los Estados</option>
          <option value="recibido">Recibidos en Portería</option>
          <option value="notificado">Notificados al Residente</option>
          <option value="entregado">Entregados</option>
        </select>
      </div>

      {/* GRID DE PAQUETES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paquetes.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay paquetes para mostrar con los filtros aplicados.</p>
          </div>
        ) : (
          paquetes.map((p) => (
            <div key={p.id} className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-lg hover:border-slate-600 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl font-black text-sm">
                      {p.apto}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.torre} - Apto {p.apto}</h4>
                      <p className="text-xs text-blue-400 font-medium">{p.empresa}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    p.estado === 'entregado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    p.estado === 'notificado' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}>
                    {p.estado}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 text-sm">
                  <p><strong className="text-slate-400">Destinatario:</strong> <span className="text-white font-medium">{p.destinatario}</span></p>
                  <p><strong className="text-slate-400">Guía:</strong> <span className="font-mono text-slate-300">{p.guia}</span></p>
                  <p><strong className="text-slate-400">Detalle:</strong> <span className="text-slate-300">{p.descripcion}</span></p>
                  <p className="text-xs text-amber-400">
                    PIN Retiro: <strong className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-sm">{p.codigoRetiro}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ingresó: {new Date(p.fechaIngreso).toLocaleString('es-CO')} ({p.guardaIngreso})
                  </p>
                  {p.fechaEntrega && (
                    <p className="text-[11px] text-emerald-400">
                      Entregado: {new Date(p.fechaEntrega).toLocaleString('es-CO')} a {p.retiradoPor}
                    </p>
                  )}
                </div>
              </div>

              {p.estado !== 'entregado' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => handleNotificar(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Notificar WhatsApp
                  </button>
                  <button
                    onClick={() => setEntregaModal(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/30 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Entregar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: REGISTRAR PAQUETE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Registrar Llegada de Paquete
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre</label>
                  <select
                    value={form.torre}
                    onChange={(e) => setForm({ ...form, torre: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Apartamento *</label>
                  <input
                    type="text"
                    required
                    value={form.apto}
                    onChange={(e) => setForm({ ...form, apto: e.target.value })}
                    placeholder="Ej: 101"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Destinatario / Residente *</label>
                <input
                  type="text"
                  required
                  value={form.destinatario}
                  onChange={(e) => setForm({ ...form, destinatario: e.target.value })}
                  placeholder="Nombre de quien recibe"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Empresa Transportadora</label>
                  <select
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Servientrega">Servientrega</option>
                    <option value="Coordinadora">Coordinadora</option>
                    <option value="Interrapidísimo">Interrapidísimo</option>
                    <option value="Envía">Envía</option>
                    <option value="Mercado Libre">Mercado Libre</option>
                    <option value="Amazon / DHL">Amazon / DHL</option>
                    <option value="Domicilio Particular">Domicilio Particular</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Número de Guía</label>
                  <input
                    type="text"
                    value={form.guia}
                    onChange={(e) => setForm({ ...form, guia: e.target.value })}
                    placeholder="Guía o S/N"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/40"
                >
                  Guardar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ENTREGA */}
      {entregaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" /> Confirmar Entrega de Paquete
              </h3>
              <button onClick={() => setEntregaModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl text-sm space-y-1">
              <p><strong className="text-slate-400">Destinatario:</strong> {entregaModal.destinatario}</p>
              <p><strong className="text-slate-400">Apartamento:</strong> {entregaModal.torre} - {entregaModal.apto}</p>
              <p><strong className="text-slate-400">Empresa:</strong> {entregaModal.empresa} (Guía: {entregaModal.guia})</p>
            </div>

            <form onSubmit={handleEntregar} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Nombre / Cédula de quien retira *</label>
                <input
                  type="text"
                  required
                  value={entregaForm.retiradoPor}
                  onChange={(e) => setEntregaForm({ ...entregaForm, retiradoPor: e.target.value })}
                  placeholder="Ej: Carlos Gómez (Titular)"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEntregaModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/40"
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