import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, Calendar, Plus, CheckCircle, XCircle, Clock, 
  RefreshCw, X, Shield, Building2, User, Phone, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTrasteos, createTrasteo, updateTrasteoEstado } from '../services/api';

export default function TrasteosView() {
  const [trasteos, setTrasteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: 'ingreso',
    torre: 'Torre 1',
    apto: '',
    solicitante: '',
    telefono: '',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    horario: '08:00 a 12:00',
    empresaMudanza: '',
    placaVehiculo: '',
    pazYSalvo: true,
    depositoGarantia: 0,
    observaciones: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTrasteos();
      setTrasteos(data || []);
    } catch (err) {
      toast.error('Error al cargar mudanzas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTrasteo(form);
      toast.success('Solicitud de mudanza registrada');
      setShowModal(false);
      setForm({
        tipo: 'ingreso',
        torre: 'Torre 1',
        apto: '',
        solicitante: '',
        telefono: '',
        fechaProgramada: new Date().toISOString().slice(0, 10),
        horario: '08:00 a 12:00',
        empresaMudanza: '',
        placaVehiculo: '',
        pazYSalvo: true,
        depositoGarantia: 0,
        observaciones: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al programar mudanza');
    }
  };

  const handleEstado = async (id, nuevoEstado) => {
    try {
      await updateTrasteoEstado(id, { estado: nuevoEstado });
      toast.success(`Mudanza ${nuevoEstado === 'aprobado' ? 'aprobada' : 'actualizada'}`);
      loadData();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Trasteos y Mudanzas <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Control de Ingresos/Salidas</span>
            </h1>
            <p className="text-slate-400 text-sm">Programación, verificación de paz y salvo y autorización de camiones de carga</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Programar Mudanza</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* LISTA DE TRASTEOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trasteos.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay mudanzas programadas.</p>
          </div>
        ) : (
          trasteos.map((t) => (
            <div key={t.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl font-bold text-xs">{t.apto}</span>
                    <h3 className="font-bold text-white text-base">{t.torre} - Apto {t.apto}</h3>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    t.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    t.estado === 'rechazado' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 text-sm">
                  <p><strong className="text-slate-400">Tipo:</strong> <span className="capitalize font-semibold text-white">{t.tipo} (Mudanza)</span></p>
                  <p><strong className="text-slate-400">Fecha:</strong> <span className="text-white font-mono">{t.fechaProgramada} ({t.horario})</span></p>
                  <p><strong className="text-slate-400">Solicita:</strong> <span className="text-white">{t.solicitante} ({t.telefono})</span></p>
                  <p><strong className="text-slate-400">Empresa:</strong> <span className="text-slate-300">{t.empresaMudanza || 'Particular'} (Placa: {t.placaVehiculo})</span></p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded font-semibold ${t.pazYSalvo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                      {t.pazYSalvo ? '✓ Paz y Salvo Aprobado' : '✗ Paz y Salvo Pendiente'}
                    </span>
                  </div>
                  {t.observaciones && (
                    <p className="text-xs text-amber-300/80 italic pt-1">{t.observaciones}</p>
                  )}
                </div>
              </div>

              {t.estado === 'pendiente_aprobacion' && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/60">
                  <button
                    onClick={() => handleEstado(t.id, 'aprobado')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button
                    onClick={() => handleEstado(t.id, 'rechazado')}
                    className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL PROGRAMAR TRASTEO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" /> Programar Mudanza / Trasteo
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Mudanza</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="ingreso">Ingreso (Trasteo de Llegada)</option>
                    <option value="salida">Salida (Trasteo de Desalojo)</option>
                    <option value="interno">Movimiento Interno</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Fecha Programada *</label>
                  <input
                    type="date"
                    required
                    value={form.fechaProgramada}
                    onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre *</label>
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
                    placeholder="101"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Horario</label>
                  <select
                    value={form.horario}
                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="08:00 a 12:00">08:00 a 12:00</option>
                    <option value="12:00 a 16:00">12:00 a 16:00</option>
                    <option value="16:00 a 19:00">16:00 a 19:00</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Solicitante *</label>
                  <input
                    type="text"
                    required
                    value={form.solicitante}
                    onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="300..."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Empresa de Mudanza</label>
                  <input
                    type="text"
                    value={form.empresaMudanza}
                    onChange={(e) => setForm({ ...form, empresaMudanza: e.target.value })}
                    placeholder="Ej: Mudanzas Bogotá"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Placa Camión</label>
                  <input
                    type="text"
                    value={form.placaVehiculo}
                    onChange={(e) => setForm({ ...form, placaVehiculo: e.target.value.toUpperCase() })}
                    placeholder="WTR123"
                    className="w-full mt-1 uppercase font-mono bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Observaciones</label>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Instrucciones sobre ascensor, protección de zonas comunes..."
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
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
                  Guardar Mudanza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}