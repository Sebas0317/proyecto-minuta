import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserCheck, Search, Plus, LogOut, Clock, Car, Filter, 
  RefreshCw, X, Shield, Calendar, User, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchAccesos, registrarIngreso, registrarSalida, fetchParqueaderos } from '../services/api';

export default function AccesosView() {
  const [accesos, setAccesos] = useState([]);
  const [parqueaderos, setParqueaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('en_conjunto');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: 'visitante',
    nombre: '',
    documento: '',
    torre: 'Torre 1',
    apto: '',
    motivo: '',
    vehiculoPlaca: '',
    vehiculoTipo: 'carro',
    parqueaderoAsignado: '',
    autorizadoPor: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [aData, prqData] = await Promise.all([
        fetchAccesos({
          estado: filtroEstado || undefined,
          tipo: filtroTipo || undefined,
          search: searchQuery || undefined
        }),
        fetchParqueaderos()
      ]);
      setAccesos(aData || []);
      setParqueaderos(prqData || []);
    } catch (err) {
      toast.error('Error al cargar accesos');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tipo: form.tipo,
        nombre: form.nombre,
        documento: form.documento,
        torre: form.torre,
        apto: form.apto,
        motivo: form.motivo,
        autorizadoPor: form.autorizadoPor,
        vehiculo: form.vehiculoPlaca ? {
          placa: form.vehiculoPlaca.toUpperCase(),
          tipo: form.vehiculoTipo
        } : null,
        parqueaderoAsignado: form.parqueaderoAsignado || null
      };

      await registrarIngreso(payload);
      toast.success(`Ingreso de ${form.nombre} registrado`);
      setShowModal(false);
      setForm({
        tipo: 'visitante',
        nombre: '',
        documento: '',
        torre: 'Torre 1',
        apto: '',
        motivo: '',
        vehiculoPlaca: '',
        vehiculoTipo: 'carro',
        parqueaderoAsignado: '',
        autorizadoPor: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar ingreso');
    }
  };

  const handleSalida = async (accesoId, nombre) => {
    try {
      await registrarSalida(accesoId);
      toast.success(`Salida de ${nombre} registrada`);
      loadData();
    } catch (err) {
      toast.error('Error al registrar salida');
    }
  };

  const calcularTiempo = (ingreso, salida) => {
    if (!ingreso) return '—';
    const start = new Date(ingreso);
    const end = salida ? new Date(salida) : new Date();
    const diffMs = Math.max(0, end - start);
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins} min`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Control de Accesos y Visitas
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Registro de Portería
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Registro en tiempo real de visitantes, domiciliarios, contratistas, permanencia y salidas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Ingreso</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
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
            placeholder="Buscar por nombre, documento, placa o apartamento..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
          >
            <option value="en_conjunto">Activos en Conjunto</option>
            <option value="preautorizado">🟣 Visitas Pre-autorizadas (Pases QR)</option>
            <option value="finalizado">Historial de Salidas</option>
            <option value="">Todos los Registros</option>
          </select>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
          >
            <option value="">Todos los Tipos</option>
            <option value="visitante">Visitantes</option>
            <option value="familiar">Familiares</option>
            <option value="domicilio">Domicilios</option>
            <option value="contratista">Contratistas</option>
            <option value="servicio">Servicio General</option>
          </select>
        </div>
      </div>

      {/* TABLA DE ACCESOS */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-4">Destino</th>
                <th className="p-4">Persona / Motivo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Vehículo</th>
                <th className="p-4">Ingreso</th>
                <th className="p-4">Permanencia</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {accesos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No hay registros de accesos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                accesos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-mono font-bold">{a.apto}</span>
                        <span>{a.torre}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{a.nombre}</span>
                        {a.paseQR && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                            {a.paseQR}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">CC: {a.documento} • {a.motivo}</div>
                      <div className="text-[11px] text-slate-500 pt-0.5">Autoriza: {a.autorizadoPor || 'Propietario'}</div>
                    </td>
                    <td className="p-4 capitalize">
                      <span className="bg-slate-900 px-2.5 py-1 rounded-full text-[11px] text-slate-300 font-bold border border-slate-700">
                        {a.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      {a.vehiculo?.placa ? (
                        <div>
                          <span className="font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded text-xs">{a.vehiculo.placa}</span>
                          <span className="text-[11px] text-slate-400 block pt-0.5">{a.vehiculo.tipo} ({a.parqueaderoAsignado || 'Sin bahía'})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Peatonal</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono text-xs">
                      {a.fechaIngreso ? (
                        <>
                          <div className="text-white font-bold">{new Date(a.fechaIngreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[11px] text-slate-500">{new Date(a.fechaIngreso).toLocaleDateString('es-CO')}</div>
                        </>
                      ) : (
                        <span className="text-purple-400 font-semibold">Esperado: {a.fechaEsperada || 'Hoy'}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono text-xs font-bold text-emerald-400">
                      {a.fechaIngreso ? calcularTiempo(a.fechaIngreso, a.fechaSalida) : '—'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {a.estado === 'en_conjunto' || a.estado === 'activo' ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] px-2.5 py-1 rounded-full font-bold animate-pulse">
                          🟢 En Conjunto
                        </span>
                      ) : a.estado === 'preautorizado' ? (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] px-2.5 py-1 rounded-full font-bold">
                          🟣 Pre-autorizado
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[11px] px-2.5 py-1 rounded-full font-semibold">
                          Finalizado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {a.estado === 'en_conjunto' || a.estado === 'activo' ? (
                        <button
                          onClick={() => handleSalida(a.id, a.nombre)}
                          className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Registrar Salida
                        </button>
                      ) : a.estado === 'preautorizado' ? (
                        <button
                          onClick={async () => {
                            try {
                              const { aprobarAccesoPreautorizado } = await import('../services/api');
                              await aprobarAccesoPreautorizado(a.id);
                              toast.success(`Ingreso de ${a.nombre} validado en portería`);
                              loadData();
                            } catch (e) {
                              toast.error(e.message || 'Error al validar ingreso');
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 shadow-lg shadow-purple-950/40"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Dar Ingreso (Validar)
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          Salida: {a.fechaSalida ? new Date(a.fechaSalida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRO DE INGRESO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Registro de Ingreso
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Acceso</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="visitante">Visitante</option>
                    <option value="domicilio">Domiciliario</option>
                    <option value="contratista">Contratista</option>
                    <option value="servicio">Servicio General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre y Apellido"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Cédula</label>
                  <input
                    type="text"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value })}
                    placeholder="C.C."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
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
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Autorizado Por</label>
                  <input
                    type="text"
                    value={form.autorizadoPor}
                    onChange={(e) => setForm({ ...form, autorizadoPor: e.target.value })}
                    placeholder="Nombre o citófono"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Motivo</label>
                  <input
                    type="text"
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                    placeholder="Visita, entrega, etc."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-700/80 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-purple-300 uppercase">Vehículo Visitante (Opcional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Placa</label>
                    <input
                      type="text"
                      value={form.vehiculoPlaca}
                      onChange={(e) => setForm({ ...form, vehiculoPlaca: e.target.value })}
                      placeholder="Placa"
                      className="w-full mt-1 uppercase bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Tipo</label>
                    <select
                      value={form.vehiculoTipo}
                      onChange={(e) => setForm({ ...form, vehiculoTipo: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Asignar Bahía</label>
                    <select
                      value={form.parqueaderoAsignado}
                      onChange={(e) => setForm({ ...form, parqueaderoAsignado: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <option value="">Sin parqueadero</option>
                      {parqueaderos.filter(p => p.estado === 'disponible').map(p => (
                        <option key={p.id} value={p.id}>{p.id} ({p.tipo})</option>
                      ))}
                    </select>
                  </div>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/40"
                >
                  Confirmar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}