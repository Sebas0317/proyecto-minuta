import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Shield, Search, UserCheck, Package, Car, AlertTriangle, Receipt, FileText, Droplets, Zap, Flame, Wifi, 
  Plus, CheckCircle, Clock, Send, Phone, User, Users,
  Home, Building2, ArrowRight, ArrowLeft, LogOut, Check, X, RefreshCw, FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchUnidades, fetchAccesos, fetchPaquetes, fetchMinuta, fetchParqueaderos,
  registrarIngreso, registrarSalida, createPaquete, notificarPaquete, entregarPaquete,
  createMinutaEntry, ocuparParqueadero, liberarParqueadero
} from '../services/api';
import CertificadosModal from './CertificadosModal';

export default function PorteriaDashboard() {
  const [unidades, setUnidades] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [minuta, setMinuta] = useState([]);
  const [parqueaderos, setParqueaderos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState(null);

  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showPaqueteModal, setShowPaqueteModal] = useState(false);
  const [showMinutaModal, setShowMinutaModal] = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(null);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [showCertificados, setShowCertificados] = useState(false);
  const [tabVisitas, setTabVisitas] = useState('activos');

  const [reciboForm, setReciboForm] = useState({
    torre: 'Torre 1',
    apto: '',
    tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
    empresa: 'Empresa de Acueducto',
    mesFacturado: 'Septiembre 2026',
    valorFactura: '',
    destinatario: 'Titular Inmueble'
  }); // 'activos' | 'salidas'

  const [ingresoForm, setIngresoForm] = useState({
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

  const [paqueteForm, setPaqueteForm] = useState({
    torre: 'Torre 1',
    apto: '',
    destinatario: '',
    empresa: 'Servientrega',
    guia: '',
    descripcion: 'Paquete mediano'
  });

  const [minutaForm, setMinutaForm] = useState({
    tipo: 'general',
    titulo: '',
    descripcion: '',
    severidad: 'info'
  });

  const [entregaForm, setEntregaForm] = useState({
    retiradoPor: '',
    codigoRetiro: ''
  });
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uData, aData, pData, mData, prqData] = await Promise.all([
        fetchUnidades().catch(() => []),
        fetchAccesos().catch(() => []),
        fetchPaquetes().catch(() => []),
        fetchMinuta().catch(() => []),
        fetchParqueaderos().catch(() => [])
      ]);
      setUnidades(uData || []);
      setAccesos(aData || []);
      setPaquetes(pData || []);
      setMinuta(mData || []);
      setParqueaderos(prqData || []);
    } catch (err) {
      toast.error('Error al cargar datos de portería');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const calcularDiasCasillero = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const diffMs = Date.now() - new Date(fechaIngreso).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const encomiendasPendientes = useMemo(() => {
    return (paquetes || []).filter(p => p.categoria !== 'recibo_publico' && p.estado !== 'entregado');
  }, [paquetes]);

  const recibosPendientes = useMemo(() => {
    return (paquetes || []).filter(p => p.categoria === 'recibo_publico' && p.estado !== 'entregado');
  }, [paquetes]);

  const stats = useMemo(() => {
    const enConjunto = (accesos || []).filter(a => a.estado === 'en_conjunto');
    const cuposLibres = (parqueaderos || []).filter(p => p.estado === 'disponible').length;
    const novedadesHoy = (minuta || []).filter(m => m.fecha && m.fecha.startsWith(new Date().toISOString().slice(0, 10))).length;
    const recibosCriticos = recibosPendientes.filter(r => calcularDiasCasillero(r.fechaIngreso) > 30).length;

    return {
      visitantesActivos: enConjunto.length,
      paquetesPendientes: encomiendasPendientes.length,
      recibosPendientes: recibosPendientes.length,
      recibosCriticos,
      cuposLibres,
      novedadesHoy
    };
  }, [accesos, encomiendasPendientes, recibosPendientes, parqueaderos, minuta]);

  const filteredUnidades = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return (unidades || []).filter(u => 
      u.numero?.toLowerCase().includes(q) ||
      u.torre?.toLowerCase().includes(q) ||
      u.propietario?.nombre?.toLowerCase().includes(q) ||
      u.residentes?.some(r => r.nombre.toLowerCase().includes(q) || r.documento?.includes(q)) ||
      u.vehiculos?.some(v => v.placa?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [unidades, searchQuery]);

  const handleRegistrarIngreso = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tipo: ingresoForm.tipo,
        nombre: ingresoForm.nombre,
        documento: ingresoForm.documento,
        torre: ingresoForm.torre,
        apto: ingresoForm.apto,
        motivo: ingresoForm.motivo,
        autorizadoPor: ingresoForm.autorizadoPor,
        vehiculo: ingresoForm.vehiculoPlaca ? {
          placa: ingresoForm.vehiculoPlaca.toUpperCase(),
          tipo: ingresoForm.vehiculoTipo
        } : null,
        parqueaderoAsignado: ingresoForm.parqueaderoAsignado || null
      };

      await registrarIngreso(payload);
      toast.success(`Ingreso de ${ingresoForm.nombre} registrado correctamente`);
      setShowIngresoModal(false);
      setIngresoForm({
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

  const calcularPermanencia = (ingreso, salida) => {
    if (!ingreso) return '—';
    const start = new Date(ingreso);
    const end = salida ? new Date(salida) : new Date();
    const diffMs = Math.max(0, end - start);
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins} min`;
  };

  const handleSalida = async (accesoId, nombre) => {
    try {
      await registrarSalida(accesoId);
      toast.success(`Salida de ${nombre} registrada y asentada en la minuta`);
      loadData();
    } catch (err) {
      toast.error('Error al registrar salida');
    }
  };

  const handleRegistrarRecibo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoria: 'recibo_publico',
        tipoRecibo: reciboForm.tipoRecibo,
        empresa: reciboForm.empresa,
        mesFacturado: reciboForm.mesFacturado,
        valorFactura: Number(reciboForm.valorFactura) || 0,
        torre: reciboForm.torre,
        apto: String(reciboForm.apto),
        destinatario: reciboForm.destinatario || `Titular Inmueble ${reciboForm.apto}`,
        guia: `REC-${reciboForm.apto}-${Date.now().toString().slice(-4)}`,
        descripcion: `Factura de ${reciboForm.tipoRecibo} - ${reciboForm.mesFacturado}`,
        codigoRetiro: `REC-${reciboForm.apto}`
      };
      await createPaquete(payload);
      toast.success(`Recibo de ${reciboForm.tipoRecibo} para ${reciboForm.torre} Apto ${reciboForm.apto} registrado en casillero`);
      setShowReciboModal(false);
      setReciboForm({
        torre: 'Torre 1',
        apto: '',
        tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
        empresa: 'Empresa de Acueducto',
        mesFacturado: 'Septiembre 2026',
        valorFactura: '',
        destinatario: 'Titular Inmueble'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar recibo público');
    }
  };

  const handleEntregarReciboDirecto = async (recibo) => {
    const quien = window.prompt(`Entregar recibo de ${recibo.tipoRecibo || recibo.empresa} para ${recibo.torre} Apto ${recibo.apto}.\n\n¿Quién retira la factura?:`, 'Residente');
    if (!quien) return;
    try {
      await entregarPaquete(recibo.id, { retiradoPor: quien, codigoRetiro: recibo.codigoRetiro });
      toast.success(`Recibo entregado a ${quien}`);
      loadData();
    } catch (err) {
      toast.error('Error al entregar recibo');
    }
  };

  const handleRegistrarPaquete = async (e) => {
    e.preventDefault();
    try {
      await createPaquete(paqueteForm);
      toast.success(`Paquete para ${paqueteForm.torre} - Apto ${paqueteForm.apto} registrado`);
      setShowPaqueteModal(false);
      setPaqueteForm({
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

  const handleNotificarWhatsApp = (paquete) => {
    const unidad = unidades.find(u => u.torre === paquete.torre && u.numero === paquete.apto);
    const tel = unidad?.residentes?.[0]?.telefono || unidad?.propietario?.telefono;
    const msg = encodeURIComponent(`Hola, le informamos desde la Portería que ha llegado un paquete a su nombre (${paquete.empresa}, Guía: ${paquete.guia}). Código de retiro: ${paquete.codigoRetiro}. Por favor pasar a reclamarlo.`);
    
    if (tel) {
      window.open(`https://wa.me/57${tel.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
      notificarPaquete(paquete.id).then(() => loadData());
    } else {
      toast.info(`Código de retiro: ${paquete.codigoRetiro}`);
    }
  };

  const handleEntregarPaquete = async (e) => {
    e.preventDefault();
    if (!showEntregaModal) return;
    try {
      await entregarPaquete(showEntregaModal.id, entregaForm);
      toast.success('Paquete entregado satisfactoriamente');
      setShowEntregaModal(null);
      setEntregaForm({ retiradoPor: '', codigoRetiro: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al entregar paquete');
    }
  };

  const handleRegistrarMinuta = async (e) => {
    e.preventDefault();
    try {
      await createMinutaEntry(minutaForm);
      toast.success('Novedad asentada en la minuta digital');
      setShowMinutaModal(false);
      setMinutaForm({
        tipo: 'general',
        titulo: '',
        descripcion: '',
        severidad: 'info'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar en minuta');
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-800/90 backdrop-blur border border-slate-700/80 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Portería Principal
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Turno Activo
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Control Operativo de Accesos, Paquetería y Minuta</p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowIngresoModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Nuevo Ingreso</span>
          </button>
          <button
            onClick={() => setShowPaqueteModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>+ Llegó Paquete</span>
          </button>
          <button
            onClick={() => setShowReciboModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Factura / Recibo</span>
          </button>
          <button
            onClick={() => setShowCertificados(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-purple-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>+ Paz y Salvo</span>
          </button>
          <button
            onClick={() => setShowMinutaModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Minuta</span>
          </button>
          <button
            onClick={loadData}
            title="Refrescar datos"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Visitas Activas</p>
            <h3 className="text-xl font-black text-white">{stats.visitantesActivos}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Paquetería</p>
            <h3 className="text-xl font-black text-white">{stats.paquetesPendientes} <span className="text-[10px] text-slate-400 font-normal">encomiendas</span></h3>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl flex items-center gap-3 border ${
          stats.recibosCriticos > 0
            ? 'bg-amber-950/40 border-amber-800/80'
            : 'bg-slate-800/60 border-slate-700/80'
        }`}>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Recibos Casillero</p>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-black text-white">{stats.recibosPendientes}</h3>
              {stats.recibosCriticos > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-bold animate-pulse">
                  {stats.recibosCriticos} &gt;30d
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Parqueaderos</p>
            <h3 className="text-xl font-black text-white">{stats.cuposLibres} <span className="text-[10px] text-slate-400 font-normal">libres</span></h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Novedades Hoy</p>
            <h3 className="text-xl font-black text-white">{stats.novedadesHoy}</h3>
          </div>
        </div>
      </div>
      {/* BUSCADOR UNIVERSAL PREDICTIVO */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Apartamento (ej: 101, 201), Nombre de Residente, Documento o Placa de Vehículo..."
            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 text-white pl-12 pr-4 py-3.5 rounded-2xl text-base outline-none transition-all placeholder:text-slate-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* RESULTADOS DE BÚSQUEDA FLOTANTES */}
        {filteredUnidades.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-700/60">
            {filteredUnidades.map((u) => (
              <div 
                key={u.id}
                onClick={() => { setSelectedUnidad(u); setSearchQuery(''); }}
                className="p-4 hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold">
                    {u.numero}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {u.torre} - Apto {u.numero}
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md capitalize">{u.estado}</span>
                    </h4>
                    <p className="text-sm text-slate-400">
                      {u.residentes?.map(r => r.nombre).join(', ') || u.propietario?.nombre || 'Sin residentes asignados'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {u.vehiculos?.length > 0 && (
                    <span className="bg-slate-700 text-emerald-400 px-2 py-1 rounded-md mr-2">
                      🚗 {u.vehiculos.map(v => v.placa).join(', ')}
                    </span>
                  )}
                  <span className="text-emerald-400 font-medium">Ver Ficha →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETALLE DE UNIDAD SELECCIONADA */}
      {selectedUnidad && (
        <div className="bg-slate-800/90 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setSelectedUnidad(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl font-black text-xl">
                  {selectedUnidad.numero}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedUnidad.torre} - Apto {selectedUnidad.numero}</h2>
                  <p className="text-sm text-slate-400">Piso {selectedUnidad.piso} • Estado: <span className="capitalize text-emerald-400">{selectedUnidad.estado}</span></p>
                </div>
              </div>

              {/* RESIDENTES Y ARRIENDO */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Ocupantes ({selectedUnidad.tipoOcupacion === 'arrendatario' ? 'Arrendado' : 'Propietario'})
                  </h4>
                  {selectedUnidad.tipoOcupacion === 'arrendatario' && selectedUnidad.contratoArriendo?.fechaFin && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold">
                      Vence contrato: {selectedUnidad.contratoArriendo.fechaFin}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedUnidad.residentes?.length > 0 ? (
                    selectedUnidad.residentes.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-800/60 last:border-0">
                        <span className="text-white font-medium">{r.nombre} ({r.parentesco || 'Residente'})</span>
                        <div className="flex items-center gap-3 text-slate-400 text-xs">
                          <span>CC: {r.documento}</span>
                          {r.telefono && (
                            <a href={`tel:${r.telefono}`} className="text-emerald-400 hover:underline flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5" /> {r.telefono}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay residentes registrados (Inmueble desocupado).</p>
                  )}
                </div>
              </div>

              {/* ESTADO FINANCIERO Y MORA */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Administración:</span>
                  {selectedUnidad.estadoFinanciero?.administracion?.alDia ? (
                    <span className="text-emerald-400 font-bold">✓ Paz y Salvo</span>
                  ) : (
                    <span className="text-red-400 font-bold">
                      ⚠️ En Mora ({selectedUnidad.estadoFinanciero?.administracion?.mesesMora} meses: ${Number(selectedUnidad.estadoFinanciero?.administracion?.saldoPendiente).toLocaleString('es-CO')})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Servicios Públicos:</span>
                  <span className="text-slate-300">{selectedUnidad.estadoFinanciero?.recibosPublicos?.alertas || 'Al día'}</span>
                </div>
              </div>
            </div>

            {/* VEHICULOS Y NOTAS */}
            <div className="w-full md:w-80 space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-400" /> Parqueaderos y Vehículos
                </h4>
                <div className="text-xs mb-2">
                  <span className="text-slate-400">Bahías Privadas: </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {selectedUnidad.parqueaderosPrivados?.length > 0 ? selectedUnidad.parqueaderosPrivados.join(', ') : 'Sin Bahía Comprada'}
                  </span>
                </div>
                {selectedUnidad.vehiculos?.length > 0 ? (
                  selectedUnidad.vehiculos.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-t border-slate-800">
                      <span className="font-bold text-purple-400">{v.placa}</span>
                      <span className="text-xs text-slate-400">{v.marca}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Sin vehículos propios asignados.</p>
                )}
              </div>

              {selectedUnidad.observaciones && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Nota de Seguridad
                  </h4>
                  <p className="text-xs text-amber-200">{selectedUnidad.observaciones}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setIngresoForm(prev => ({ ...prev, torre: selectedUnidad.torre, apto: selectedUnidad.numero }));
                  setShowIngresoModal(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                + Registrar Visita a este Apto
              </button>
            </div>
          </div>
        </div>
      )}
      {/* GRID DE MONITOREO PRINCIPAL: ACCESOS ACTIVOS & PAQUETES PENDIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL DE VISITAS ACTIVAS & SALIDAS EN CONJUNTO */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Visitantes y Domicilios</h3>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setTabVisitas('activos')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tabVisitas === 'activos'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 Activos ({accesos.filter(a => a.estado === 'en_conjunto').length})
              </button>
              <button
                onClick={() => setTabVisitas('salidas')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tabVisitas === 'salidas'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📜 Salidas Recientes ({accesos.filter(a => a.estado === 'finalizado').length})
              </button>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {tabVisitas === 'activos' ? (
              accesos.filter(a => a.estado === 'en_conjunto').length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay visitantes activos en este momento.</p>
                </div>
              ) : (
                accesos.filter(a => a.estado === 'en_conjunto').map((a) => (
                  <div key={a.id} className="bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl font-bold text-xs">
                        {a.apto}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                          {a.nombre}
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full capitalize border border-slate-700">{a.tipo}</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Destino: <strong className="text-slate-300">{a.torre} - {a.apto}</strong> • Motivo: {a.motivo}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                            ⏳ {calcularPermanencia(a.fechaIngreso, null)}
                          </span>
                          {a.vehiculo?.placa && (
                            <span className="text-[11px] text-purple-400 font-mono font-bold bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded-md">
                              🚗 {a.vehiculo.placa} ({a.parqueaderoAsignado || 'Sin bahía'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSalida(a.id, a.nombre)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Registrar salida de portería"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Registrar Salida
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              accesos.filter(a => a.estado === 'finalizado').slice(0, 10).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay registro de salidas recientes aún.</p>
                </div>
              ) : (
                accesos.filter(a => a.estado === 'finalizado').slice(0, 10).map((a) => (
                  <div key={a.id} className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 text-slate-400 rounded-lg font-mono font-bold text-xs">
                        {a.apto}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{a.nombre} <span className="text-slate-400 font-normal">({a.tipo})</span></h4>
                        <p className="text-slate-400 text-[11px]">
                          {a.torre} - {a.apto} • Salida: <strong className="text-slate-300">{new Date(a.fechaSalida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono font-bold block">
                        ⏱️ {calcularPermanencia(a.fechaIngreso, a.fechaSalida)}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        Finalizado
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* PANEL DE PAQUETERÍA & ENCOMIENDAS FÍSICAS (EXCLUSIVO) */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-white">Paquetería & Encomiendas</h3>
                <p className="text-[11px] text-slate-400">MercadoLibre, Amazon, Servientrega, etc.</p>
              </div>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold">
              {encomiendasPendientes.length} por retirar
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {encomiendasPendientes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay encomiendas pendientes por entregar.</p>
              </div>
            ) : (
              encomiendasPendientes.map((p) => (
                <div key={p.id} className="bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl font-bold text-xs">
                      {p.apto}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                        {p.destinatario}
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">{p.empresa}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {p.torre} - Apto {p.apto} • Guía: <strong className="text-slate-300">{p.guia}</strong>
                      </p>
                      <p className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">
                        PIN Retiro: <strong className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">{p.codigoRetiro}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNotificarWhatsApp(p)}
                      title="Enviar WhatsApp con PIN de retiro"
                      className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-xl text-xs transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowEntregaModal(p)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Entregar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN EXCLUSIVA DEDICADA: CASILLERO DE RECIBOS PÚBLICOS SIN RECOGER */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Casillero de Recibos Públicos & Facturas Sin Recoger
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {recibosPendientes.length} en espera
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                Control de facturas físicas (Agua, Energía, Gas, Telecomunicaciones, Predial) con alerta de días acumulados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReciboModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + Ingresar Recibo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recibosPendientes.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay recibos públicos pendientes en el casillero.</p>
            </div>
          ) : (
            recibosPendientes.map((r) => {
              const dias = calcularDiasCasillero(r.fechaIngreso);
              const esCritico = dias > 30;
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    esCritico
                      ? 'bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/30'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-xs font-mono font-bold">
                        {r.torre} - {r.apto}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        esCritico
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {dias} días acumulados
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs">{r.tipoRecibo || r.empresa}</h4>
                      <p className="text-[11px] text-slate-400">Mes: <strong className="text-slate-300">{r.mesFacturado || 'Mes en curso'}</strong></p>
                      {r.valorFactura > 0 && (
                        <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          ${Number(r.valorFactura).toLocaleString('es-CO')} COP
                        </p>
                      )}
                    </div>

                    {esCritico && (
                      <p className="text-[10px] text-red-400 font-semibold bg-red-950/80 p-1.5 rounded border border-red-900/60">
                        ⚠️ ALERTA: Más de 1 mes sin retirar. Riesgo de corte de servicio.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleEntregarReciboDirecto(r)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar Entregado
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* MODAL: REGISTRO DE RECIBO PÚBLICO */}
      {showReciboModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" /> Registrar Llegada de Recibo Público
              </h3>
              <button onClick={() => setShowReciboModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarRecibo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Torre</label>
                  <select
                    value={reciboForm.torre}
                    onChange={(e) => setReciboForm({ ...reciboForm, torre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Apartamento</label>
                  <input
                    type="text"
                    required
                    value={reciboForm.apto}
                    onChange={(e) => setReciboForm({ ...reciboForm, apto: e.target.value })}
                    placeholder="Ej: 203"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Servicio Público</label>
                <select
                  value={reciboForm.tipoRecibo}
                  onChange={(e) => setReciboForm({ ...reciboForm, tipoRecibo: e.target.value, empresa: e.target.value.split(' ')[0] })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                >
                  <option value="Acueducto y Alcantarillado (Agua)">💧 Acueducto y Alcantarillado (Agua)</option>
                  <option value="Energía Eléctrica (Luz)">⚡ Energía Eléctrica (Luz)</option>
                  <option value="Gas Natural Domiciliario">🔥 Gas Natural Domiciliario</option>
                  <option value="Telecomunicaciones (Internet/TV)">📶 Telecomunicaciones (Internet/TV)</option>
                  <option value="Impuesto Predial Unificado">🏛️ Impuesto Predial Unificado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mes Facturado</label>
                  <input
                    type="text"
                    value={reciboForm.mesFacturado}
                    onChange={(e) => setReciboForm({ ...reciboForm, mesFacturado: e.target.value })}
                    placeholder="Ej: Septiembre 2026"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Valor Factura (COP)</label>
                  <input
                    type="number"
                    value={reciboForm.valorFactura}
                    onChange={(e) => setReciboForm({ ...reciboForm, valorFactura: e.target.value })}
                    placeholder="Ej: 85400"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowReciboModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30"
                >
                  Guardar en Casillero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: REGISTRO DE INGRESO */}
      {showIngresoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Registro de Ingreso en Portería
              </h3>
              <button onClick={() => setShowIngresoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarIngreso} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Acceso</label>
                  <select
                    value={ingresoForm.tipo}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="visitante">Visitante</option>
                    <option value="domicilio">Domiciliario (Rappi, etc.)</option>
                    <option value="contratista">Contratista / Técnico</option>
                    <option value="servicio">Servicio General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={ingresoForm.nombre}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, nombre: e.target.value })}
                    placeholder="Ej: Juan David López"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Cédula / Doc</label>
                  <input
                    type="text"
                    value={ingresoForm.documento}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, documento: e.target.value })}
                    placeholder="C.C."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre *</label>
                  <select
                    value={ingresoForm.torre}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, torre: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Apto Destino *</label>
                  <input
                    type="text"
                    required
                    value={ingresoForm.apto}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, apto: e.target.value })}
                    placeholder="Ej: 201"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Autorizado Por</label>
                  <input
                    type="text"
                    value={ingresoForm.autorizadoPor}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, autorizadoPor: e.target.value })}
                    placeholder="Nombre del residente o citófono"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Motivo</label>
                  <input
                    type="text"
                    value={ingresoForm.motivo}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, motivo: e.target.value })}
                    placeholder="Visita familiar, entrega, etc."
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* VEHICULO Y PARQUEADERO */}
              <div className="p-3 bg-slate-900/60 border border-slate-700/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300 uppercase">Vehículo Visitante (Opcional)</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Placa</label>
                    <input
                      type="text"
                      value={ingresoForm.vehiculoPlaca}
                      onChange={(e) => setIngresoForm({ ...ingresoForm, vehiculoPlaca: e.target.value })}
                      placeholder="ABC123"
                      className="w-full mt-1 uppercase bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Tipo</label>
                    <select
                      value={ingresoForm.vehiculoTipo}
                      onChange={(e) => setIngresoForm({ ...ingresoForm, vehiculoTipo: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Asignar Bahía</label>
                    <select
                      value={ingresoForm.parqueaderoAsignado}
                      onChange={(e) => setIngresoForm({ ...ingresoForm, parqueaderoAsignado: e.target.value })}
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
                  onClick={() => setShowIngresoModal(false)}
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

      {/* MODAL: LLEGADA DE PAQUETE */}
      {showPaqueteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Registrar Llegada de Paquete
              </h3>
              <button onClick={() => setShowPaqueteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarPaquete} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre</label>
                  <select
                    value={paqueteForm.torre}
                    onChange={(e) => setPaqueteForm({ ...paqueteForm, torre: e.target.value })}
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
                    value={paqueteForm.apto}
                    onChange={(e) => setPaqueteForm({ ...paqueteForm, apto: e.target.value })}
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
                  value={paqueteForm.destinatario}
                  onChange={(e) => setPaqueteForm({ ...paqueteForm, destinatario: e.target.value })}
                  placeholder="Nombre de quien recibe"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Empresa Transportadora</label>
                  <select
                    value={paqueteForm.empresa}
                    onChange={(e) => setPaqueteForm({ ...paqueteForm, empresa: e.target.value })}
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
                    value={paqueteForm.guia}
                    onChange={(e) => setPaqueteForm({ ...paqueteForm, guia: e.target.value })}
                    placeholder="Guía o S/N"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaqueteModal(false)}
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

      {/* MODAL: ENTREGA DE PAQUETE */}
      {showEntregaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" /> Confirmar Entrega de Paquete
              </h3>
              <button onClick={() => setShowEntregaModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl text-sm space-y-1">
              <p><strong className="text-slate-400">Destinatario:</strong> {showEntregaModal.destinatario}</p>
              <p><strong className="text-slate-400">Apartamento:</strong> {showEntregaModal.torre} - {showEntregaModal.apto}</p>
              <p><strong className="text-slate-400">Empresa:</strong> {showEntregaModal.empresa} (Guía: {showEntregaModal.guia})</p>
            </div>

            <form onSubmit={handleEntregarPaquete} className="space-y-4">
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
                  onClick={() => setShowEntregaModal(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/40"
                >
                  Marcar Entregado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR EN MINUTA */}
      {showMinutaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Asentar Novedad en Minuta Digital
              </h3>
              <button onClick={() => setShowMinutaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMinuta} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Entrada</label>
                  <select
                    value={minutaForm.tipo}
                    onChange={(e) => setMinutaForm({ ...minutaForm, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="general">Novedad General</option>
                    <option value="cambio_turno">Cambio de Turno / Puesto</option>
                    <option value="ronda">Ronda de Seguridad</option>
                    <option value="incidente">Incidente / Alarma</option>
                    <option value="mantenimiento">Mantenimiento / Daño</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Severidad</label>
                  <select
                    value={minutaForm.severidad}
                    onChange={(e) => setMinutaForm({ ...minutaForm, severidad: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="info">Informativa (Normal)</option>
                    <option value="advertencia">Advertencia</option>
                    <option value="peligro">Crítica / Emergencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Título Breve</label>
                <input
                  type="text"
                  value={minutaForm.titulo}
                  onChange={(e) => setMinutaForm({ ...minutaForm, titulo: e.target.value })}
                  placeholder="Ej: Novedad de parqueadero o Ronda completada"
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Descripción Detallada de la Novedad *</label>
                <textarea
                  required
                  rows={4}
                  value={minutaForm.descripcion}
                  onChange={(e) => setMinutaForm({ ...minutaForm, descripcion: e.target.value })}
                  placeholder="Escriba los hechos, personas involucradas, medidas tomadas y estado final..."
                  className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMinutaModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-900/40"
                >
                  Guardar en Minuta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GENERADOR DE PAZ Y SALVO & CERTIFICADOS */}
      <CertificadosModal
        isOpen={showCertificados}
        onClose={() => setShowCertificados(false)}
        aptoInicial={selectedUnidad?.numero || '101'}
        torreInicial={selectedUnidad?.torre || '1'}
      />
    </div>
  );
}