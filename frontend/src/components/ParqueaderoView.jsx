import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Car, Clock, Plus, LogOut, CheckCircle, AlertTriangle, 
  RefreshCw, X, Shield, Building2, Phone, ArrowRight, UserCheck, Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchParqueaderos, ocuparParqueadero, liberarParqueadero, 
  reportarInvasionParqueadero, reubicarInvasionParqueadero, liberarInvasionParqueadero,
  fetchUnidades
} from '../services/api';

export default function ParqueaderoView() {
  const [parqueaderos, setParqueaderos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('visitantes'); // 'visitantes' | 'privados' | 'invasiones'
  const [filtroTorre, setFiltroTorre] = useState('todas');
  const [horaActual, setHoraActual] = useState(new Date());

  // Actualizar reloj cada 30 segundos para cálculo de tiempo de permanencia en vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper para calcular tiempo de uso de visitantes
  const calcularTiempoUso = (horaIngreso) => {
    if (!horaIngreso) return null;
    const ingreso = new Date(horaIngreso);
    const diffMs = horaActual - ingreso;
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const horas = Math.floor(diffMins / 60);
    const minutos = diffMins % 60;
    
    // Regla de cortesía: 4 horas de cortesía en visitantes
    const excedido = horas >= 4;
    const critico = horas >= 12;

    let texto = '';
    if (horas === 0) texto = `${minutos} min`;
    else if (minutos === 0) texto = `${horas}h`;
    else texto = `${horas}h ${minutos}m`;

    return { texto, horas, minutos, diffMins, excedido, critico };
  };

  // Modales
  const [showOcuparModal, setShowOcuparModal] = useState(null);
  const [showInvasionModal, setShowInvasionModal] = useState(false);
  const [showReubicarModal, setShowReubicarModal] = useState(null);

  // Form Ocupar Visitante
  const [formOcupar, setFormOcupar] = useState({
    placa: '',
    tipo: 'carro',
    torre: 'Torre 1',
    apto: ''
  });

  // Form Invasión / Préstamo de Bahía
  const [formInvasion, setFormInvasion] = useState({
    bahiaId: '',
    placa: '',
    aptoResponsable: '',
    torreResponsable: 'Torre 1',
    nombreResponsable: '',
    telefonoResponsable: '',
    motivo: 'Permiso temporal / Falta de cupo en visitantes'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, uData] = await Promise.all([
        fetchParqueaderos(),
        fetchUnidades()
      ]);
      setParqueaderos(pData || []);
      setUnidades(uData || []);
    } catch (err) {
      toast.error('Error al cargar datos de parqueaderos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bahías de visitantes
  const bahiasVisitantes = useMemo(() => {
    return parqueaderos.filter(p => p.categoria === 'visitantes');
  }, [parqueaderos]);

  // Bahías privadas
  const bahiasPrivadas = useMemo(() => {
    return parqueaderos.filter(p => {
      if (p.categoria !== 'privado') return false;
      if (filtroTorre !== 'todas' && p.torreAsignada !== filtroTorre) return false;
      return true;
    });
  }, [parqueaderos, filtroTorre]);

  // Bahías privadas actualmente invadidas
  const invasionesActivas = useMemo(() => {
    return parqueaderos.filter(p => p.categoria === 'privado' && p.estado === 'invadido');
  }, [parqueaderos]);

  // Stats
  const stats = useMemo(() => {
    const totalVis = bahiasVisitantes.length;
    const dispVis = bahiasVisitantes.filter(p => p.estado === 'disponible').length;
    const ocupVis = totalVis - dispVis;
    const totalPriv = parqueaderos.filter(p => p.categoria === 'privado').length;
    const totalInv = invasionesActivas.length;

    return { totalVis, dispVis, ocupVis, totalPriv, totalInv };
  }, [bahiasVisitantes, parqueaderos, invasionesActivas]);

  // Handlers Visitantes
  const handleOcuparVisitante = async (e) => {
    e.preventDefault();
    if (!showOcuparModal) return;
    try {
      await ocuparParqueadero(showOcuparModal.id, formOcupar);
      toast.success(`Bahía ${showOcuparModal.id} asignada a ${formOcupar.placa}`);
      setShowOcuparModal(null);
      setFormOcupar({ placa: '', tipo: 'carro', torre: 'Torre 1', apto: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al asignar bahía');
    }
  };

  const handleLiberarVisitante = async (id, placa) => {
    try {
      await liberarParqueadero(id);
      toast.success(`Bahía ${id} liberada (${placa || ''})`);
      loadData();
    } catch (err) {
      toast.error('Error al liberar bahía');
    }
  };

  // Handlers Invasión / Préstamo
  const handleRegistrarInvasion = async (e) => {
    e.preventDefault();
    try {
      await reportarInvasionParqueadero(formInvasion);
      toast.warning(`Vehículo ${formInvasion.placa} registrado en bahía privada ${formInvasion.bahiaId}`);
      setShowInvasionModal(false);
      setFormInvasion({
        bahiaId: '',
        placa: '',
        aptoResponsable: '',
        torreResponsable: 'Torre 1',
        nombreResponsable: '',
        telefonoResponsable: '',
        motivo: 'Permiso temporal / Falta de cupo en visitantes'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar vehículo en bahía');
    }
  };

  const handleReubicarInvasion = async (bahiaPrivadaId, bahiaVisitanteDestinoId = null) => {
    try {
      const res = await reubicarInvasionParqueadero({
        bahiaPrivadaId,
        bahiaVisitanteDestinoId
      });
      toast.success(res.message || 'Vehículo reubicado con éxito a bahía de visitantes');
      setShowReubicarModal(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al reubicar vehículo');
    }
  };

  const handleLiberarInvasion = async (bahiaId) => {
    try {
      await liberarInvasionParqueadero(bahiaId);
      toast.success(`Bahía privada ${bahiaId} liberada`);
      loadData();
    } catch (err) {
      toast.error('Error al liberar bahía privada');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Gestión Integral de Parqueaderos <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">Privados & Visitantes</span>
            </h1>
            <p className="text-slate-400 text-sm">Control de cupos para visitantes y sistema de alerta por vehículos en bahías privadas ajenas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowInvasionModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02]"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Registrar en Bahía Privada</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS RÁPIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Cupos Visitantes</span>
          <p className="text-2xl font-black text-white">{stats.totalVis}</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Visitantes Libres</span>
          <p className="text-2xl font-black text-emerald-400">{stats.dispVis}</p>
        </div>
        <div className="bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-red-400 uppercase">Visitantes Ocupados</span>
          <p className="text-2xl font-black text-red-400">{stats.ocupVis}</p>
        </div>
        <div className={`p-3.5 rounded-xl border ${
          stats.totalInv > 0 ? 'bg-amber-950/50 border-amber-500 text-amber-300 animate-pulse' : 'bg-slate-800/60 border-slate-700 text-slate-400'
        }`}>
          <span className="text-[11px] font-semibold uppercase">Bahías Ajenas Ocupadas</span>
          <p className="text-2xl font-black">{stats.totalInv}</p>
        </div>
      </div>

      {/* ALERTA DE INVASIÓN EN VIVO SI HAY VEHÍCULOS EN BAHÍA AJENA */}
      {invasionesActivas.length > 0 && (
        <div className="bg-amber-950/80 border-2 border-amber-500/80 p-5 rounded-2xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-amber-700/60 pb-3">
            <h3 className="font-black text-amber-300 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              ¡ALERTA DE SEGURIDAD! ({invasionesActivas.length}) Vehículo(s) en Bahías Privadas Ajenas
            </h3>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-bold">
              Requieren atención o reubicación
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invasionesActivas.map((inv) => (
              <div key={inv.id} className="bg-slate-900/90 border border-amber-500/50 p-4 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/20 text-amber-300 font-mono font-black text-base rounded-lg border border-amber-500/40">
                      {inv.id}
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">Pertenece al:</p>
                      <p className="text-white font-bold text-sm">{inv.torreAsignada} - Apto {inv.aptoAsignado}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-white bg-slate-950 px-2.5 py-1 rounded border border-slate-700">
                    🚗 {inv.invasion?.placa}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <p><strong className="text-amber-400">Apto Responsable:</strong> {inv.invasion?.torreResponsable} - Apto {inv.invasion?.aptoResponsable}</p>
                  <p><strong className="text-slate-400">Conductor:</strong> {inv.invasion?.nombreResponsable}</p>
                  <p><strong className="text-slate-400">Teléfono:</strong> <span className="font-mono text-emerald-400 font-bold">{inv.invasion?.telefonoResponsable}</span></p>
                  <p><strong className="text-slate-400">Motivo:</strong> <em>"{inv.invasion?.motivo}"</em></p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${inv.invasion?.telefonoResponsable}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
                  >
                    <Phone className="w-3.5 h-3.5" /> Llamar a Mover
                  </a>
                  <button
                    onClick={() => handleReubicarInvasion(inv.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-950/40"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Reubicar a Visitantes
                  </button>
                  <button
                    onClick={() => handleLiberarInvasion(inv.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-bold"
                    title="Liberar bahía (Ya se fue)"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑAS PRINCIPALES */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-2 overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap">
        <button
          onClick={() => setTabActiva('visitantes')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            tabActiva === 'visitantes'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          Bahías de Visitantes ({stats.totalVis})
        </button>

        <button
          onClick={() => setTabActiva('privados')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            tabActiva === 'privados'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Parqueaderos Privados ({stats.totalPriv})
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑA: VISITANTES */}
      {tabActiva === 'visitantes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bahiasVisitantes.map((p) => {
            const isOcupado = p.estado === 'ocupado';
            const tiempoUso = isOcupado ? calcularTiempoUso(p.horaIngreso) : null;

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                  isOcupado
                    ? tiempoUso?.excedido
                      ? 'bg-slate-800/90 border-red-500 ring-1 ring-red-500/50 shadow-lg shadow-red-950/40'
                      : 'bg-slate-800/90 border-purple-500/40 shadow-lg shadow-purple-950/20'
                    : 'bg-slate-800/60 border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Car className={`w-5 h-5 ${isOcupado ? (tiempoUso?.excedido ? 'text-red-400' : 'text-purple-400') : 'text-emerald-400'}`} />
                      <span className="font-black text-lg text-white">Bahía {p.id}</span>
                    </div>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isOcupado 
                        ? tiempoUso?.excedido 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {p.tipo} • {p.estado}
                    </span>
                  </div>

                  {isOcupado ? (
                    <div className="space-y-2 pt-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-semibold">Placa:</span>
                        <span className="font-mono font-black text-white text-base bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {p.placa}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Destino:</span>
                        <span className="text-white font-bold">{p.torre} - Apto {p.apto}</span>
                      </div>

                      {/* TIEMPO DE PERMANENCIA EN VIVO */}
                      {tiempoUso && (
                        <div className={`p-2.5 rounded-xl border space-y-1 ${
                          tiempoUso.excedido 
                            ? 'bg-red-950/60 border-red-800 text-red-200' 
                            : 'bg-slate-900/90 border-slate-700 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <Timer className={`w-3.5 h-3.5 ${tiempoUso.excedido ? 'text-red-400' : 'text-purple-400'}`} />
                              Tiempo de Uso:
                            </span>
                            <span className="font-mono text-sm font-black text-white">{tiempoUso.texto}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
                            <span>Ingreso: {new Date(p.horaIngreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{tiempoUso.excedido ? '⚠️ Excedió cortesía (4h)' : 'Límite: 4h'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 text-sm">
                      <p className="font-semibold text-slate-400">Bahía Disponible</p>
                      <p className="text-xs text-slate-500 mt-1">Lista para asignar visitante</p>
                    </div>
                  )}
                </div>

                <div>
                  {isOcupado ? (
                    <button
                      onClick={() => handleLiberarVisitante(p.id, p.placa)}
                      className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Liberar Bahía
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowOcuparModal(p)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all"
                    >
                      + Asignar Vehículo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: PARQUEADEROS PRIVADOS */}
      {tabActiva === 'privados' && (
        <div className="space-y-4">
          {/* FILTRO DE TORRE PARA PRIVADOS */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Filtrar por Torre:</span>
            {['todas', 'Torre 1', 'Torre 2', 'Torre 3', 'Torre 4', 'Torre 5'].map(t => (
              <button
                key={t}
                onClick={() => setFiltroTorre(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroTorre === t
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'todas' ? 'Todas' : t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bahiasPrivadas.map((p) => {
              const isInvadido = p.estado === 'invadido';
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isInvadido
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-800/80 border-slate-700/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <span className="font-mono font-black text-base text-purple-300">{p.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isInvadido ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {isInvadido ? '⚠️ Ocupado / Prestado' : 'Asignado'}
                      </span>
                    </div>

                    <div className="pt-2 text-xs space-y-1">
                      <p><strong className="text-slate-400">Dueño:</strong> {p.torreAsignada} - Apto <strong className="text-white">{p.aptoAsignado}</strong></p>
                      
                      {isInvadido && (
                        <div className="mt-2 bg-slate-950 p-2 rounded-lg text-[11px] border border-amber-900/60 space-y-0.5">
                          <p className="text-amber-400 font-bold">🚗 Placa: {p.invasion?.placa}</p>
                          <p className="text-slate-400">Resp: Apto {p.invasion?.aptoResponsable} ({p.invasion?.nombreResponsable})</p>
                          <p className="text-slate-400">Tel: <strong className="text-emerald-400">{p.invasion?.telefonoResponsable}</strong></p>
                        </div>
                      )}
                    </div>
                  </div>

                  {isInvadido ? (
                    <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => handleReubicarInvasion(p.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-[11px] transition-all"
                      >
                        Reubicar
                      </button>
                      <button
                        onClick={() => handleLiberarInvasion(p.id)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-1.5 rounded-lg text-[11px] transition-all"
                      >
                        Liberar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setFormInvasion({ ...formInvasion, bahiaId: p.id });
                        setShowInvasionModal(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold py-1.5 rounded-lg text-[11px] border border-slate-700 transition-all"
                    >
                      + Anotar vehículo intruso/prestado
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: OCUPAR BAHÍA DE VISITANTES */}
      {showOcuparModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-purple-400" /> Asignar Bahía Visitante {showOcuparModal.id}
              </h3>
              <button onClick={() => setShowOcuparModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOcuparVisitante} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Placa del Vehículo *</label>
                <input
                  type="text"
                  required
                  value={formOcupar.placa}
                  onChange={(e) => setFormOcupar({ ...formOcupar, placa: e.target.value.toUpperCase() })}
                  placeholder="Ej: ABC123"
                  className="w-full mt-1 uppercase font-mono bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre *</label>
                  <select
                    value={formOcupar.torre}
                    onChange={(e) => setFormOcupar({ ...formOcupar, torre: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Apartamento *</label>
                  <input
                    type="text"
                    required
                    value={formOcupar.apto}
                    onChange={(e) => setFormOcupar({ ...formOcupar, apto: e.target.value })}
                    placeholder="Ej: 101"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOcuparModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/40"
                >
                  Asignar Bahía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR VEHÍCULO EN BAHÍA PRIVADA AJENA */}
      {showInvasionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Registrar Vehículo en Bahía Privada
              </h3>
              <button onClick={() => setShowInvasionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarInvasion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Bahía Privada Ocupada *</label>
                  <input
                    type="text"
                    required
                    value={formInvasion.bahiaId}
                    onChange={(e) => setFormInvasion({ ...formInvasion, bahiaId: e.target.value.toUpperCase() })}
                    placeholder="Ej: P-1101A o P-2201"
                    className="w-full mt-1 uppercase font-mono bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Placa del Vehículo Intruso *</label>
                  <input
                    type="text"
                    required
                    value={formInvasion.placa}
                    onChange={(e) => setFormInvasion({ ...formInvasion, placa: e.target.value.toUpperCase() })}
                    placeholder="Ej: QWE456"
                    className="w-full mt-1 uppercase font-mono bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre Responsable *</label>
                  <select
                    value={formInvasion.torreResponsable}
                    onChange={(e) => setFormInvasion({ ...formInvasion, torreResponsable: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Apto Responsable (Visita de...) *</label>
                  <input
                    type="text"
                    required
                    value={formInvasion.aptoResponsable}
                    onChange={(e) => setFormInvasion({ ...formInvasion, aptoResponsable: e.target.value })}
                    placeholder="Ej: 302"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Nombre del Conductor</label>
                  <input
                    type="text"
                    value={formInvasion.nombreResponsable}
                    onChange={(e) => setFormInvasion({ ...formInvasion, nombreResponsable: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Teléfono para Llamarlo *</label>
                  <input
                    type="text"
                    required
                    value={formInvasion.telefonoResponsable}
                    onChange={(e) => setFormInvasion({ ...formInvasion, telefonoResponsable: e.target.value })}
                    placeholder="310..."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Motivo de Ocupación</label>
                <input
                  type="text"
                  value={formInvasion.motivo}
                  onChange={(e) => setFormInvasion({ ...formInvasion, motivo: e.target.value })}
                  placeholder="Préstamo verbal / Falta de cupo en visitantes"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvasionModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-900/40"
                >
                  Guardar Ocupación de Bahía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}