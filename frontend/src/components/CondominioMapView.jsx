import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Home, MapPin, Search, Filter, AlertTriangle, 
  CheckCircle, Clock, User, Phone, Car, DollarSign, Calendar, 
  X, RefreshCw, Layers, Shield, ArrowUpRight, Copy, Check, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchUnidades } from '../services/api';
import { generarPazYSalvoPDF } from '../utils/pdfGenerator';

export default function CondominioMapView() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [torreSeleccionada, setTorreSeleccionada] = useState('Torre 1');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMora, setFiltroMora] = useState(false);
  const [filtroParqueadero, setFiltroParqueadero] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [copiedTel, setCopiedTel] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUnidades();
      setUnidades(data || []);
    } catch (err) {
      toast.error('Error al cargar censo de apartamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lista única de torres
  const torres = useMemo(() => {
    const set = new Set(unidades.map(u => u.torre));
    return Array.from(set).sort();
  }, [unidades]);

  // Estadísticas globales del condominio
  const stats = useMemo(() => {
    const total = unidades.length;
    const propietarios = unidades.filter(u => u.tipoOcupacion === 'propietario' && u.estadoComercial === 'habitado').length;
    const arrendados = unidades.filter(u => u.tipoOcupacion === 'arrendatario').length;
    const dispArriendo = unidades.filter(u => u.estadoComercial === 'disponible_arriendo').length;
    const dispVenta = unidades.filter(u => u.estadoComercial === 'disponible_venta').length;
    const vacios = unidades.filter(u => u.estadoComercial === 'vacio').length;
    const enMora = unidades.filter(u => u.estadoFinanciero?.administracion?.alDia === false).length;
    const sinParqueadero = unidades.filter(u => !u.parqueaderosPrivados || u.parqueaderosPrivados.length === 0).length;

    return { total, propietarios, arrendados, dispArriendo, dispVenta, vacios, enMora, sinParqueadero };
  }, [unidades]);

  // Filtrado de apartamentos
  const unidadesFiltradas = useMemo(() => {
    return unidades.filter(u => {
      // Filtro Torre
      if (torreSeleccionada !== 'todas' && u.torre !== torreSeleccionada) return false;

      // Filtro Estado Comercial
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'propietario' && (u.tipoOcupacion !== 'propietario' || u.estadoComercial !== 'habitado')) return false;
        if (filtroEstado === 'arrendatario' && u.tipoOcupacion !== 'arrendatario') return false;
        if (filtroEstado === 'disponible_arriendo' && u.estadoComercial !== 'disponible_arriendo') return false;
        if (filtroEstado === 'disponible_venta' && u.estadoComercial !== 'disponible_venta') return false;
        if (filtroEstado === 'vacio' && u.estadoComercial !== 'vacio') return false;
      }

      // Filtro Mora
      if (filtroMora && u.estadoFinanciero?.administracion?.alDia !== false) return false;

      // Filtro Parqueadero
      if (filtroParqueadero === 'sin_parqueadero' && (u.parqueaderosPrivados && u.parqueaderosPrivados.length > 0)) return false;
      if (filtroParqueadero === 'un_parqueadero' && (!u.parqueaderosPrivados || u.parqueaderosPrivados.length !== 1)) return false;
      if (filtroParqueadero === 'dos_parqueaderos' && (!u.parqueaderosPrivados || u.parqueaderosPrivados.length < 2)) return false;

      // Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = u.numero.toLowerCase().includes(q);
        const matchProp = u.propietario?.nombre?.toLowerCase().includes(q);
        const matchInq = u.contratoArriendo?.inquilinoNombre?.toLowerCase().includes(q);
        const matchPlaca = u.vehiculos?.some(v => v.placa?.toLowerCase().includes(q));
        if (!matchNum && !matchProp && !matchInq && !matchPlaca) return false;
      }

      return true;
    });
  }, [unidades, torreSeleccionada, filtroEstado, filtroMora, filtroParqueadero, searchQuery]);

  // Agrupación por pisos (Piso 5 al 1)
  const pisosAgrupados = useMemo(() => {
    const pisos = {};
    for (let p = 5; p >= 1; p--) {
      pisos[p] = unidadesFiltradas.filter(u => u.piso === p).sort((a, b) => a.numero.localeCompare(b.numero));
    }
    return pisos;
  }, [unidadesFiltradas]);

  // Helper para tiempo restante de arriendo
  const calcularTiempoRestante = (fechaFin) => {
    if (!fechaFin) return null;
    const fin = new Date(fechaFin);
    const hoy = new Date();
    const diffMs = fin - hoy;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) return { texto: 'Contrato vencido', urgente: true };
    const meses = Math.floor(diffDias / 30);
    const dias = diffDias % 30;

    if (meses === 0) return { texto: `${dias} días restantes`, urgente: true };
    return { texto: `${meses}m ${dias > 0 ? `${dias}d` : ''} restantes`, urgente: meses <= 2 };
  };

  const handleCopyTel = (tel) => {
    if (!tel) return;
    navigator.clipboard.writeText(tel);
    setCopiedTel(true);
    toast.success('Teléfono copiado al portapapeles');
    setTimeout(() => setCopiedTel(false), 2000);
  };
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Mapa Interactivo del Condominio <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Master Plan</span>
            </h1>
            <p className="text-slate-400 text-sm">Visualización arquitectónica de torres, contratos de arriendo, parqueaderos y estado de mora</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          title="Recargar datos"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* STATS RÁPIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Inmuebles</span>
          <p className="text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Propietarios</span>
          <p className="text-xl font-black text-emerald-400">{stats.propietarios}</p>
        </div>
        <div className="bg-blue-950/40 border border-blue-800/50 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-blue-400 uppercase">Arrendados</span>
          <p className="text-xl font-black text-blue-400">{stats.arrendados}</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Para Arriendo</span>
          <p className="text-xl font-black text-amber-400">{stats.dispArriendo}</p>
        </div>
        <div className="bg-orange-950/40 border border-orange-800/50 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-orange-400 uppercase">Para Venta</span>
          <p className="text-xl font-black text-orange-400">{stats.dispVenta}</p>
        </div>
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Vacíos / Desoc.</span>
          <p className="text-xl font-black text-slate-300">{stats.vacios}</p>
        </div>
        <div className="bg-red-950/50 border border-red-800/60 p-3 rounded-xl">
          <span className="text-[11px] font-semibold text-red-400 uppercase">En Mora Admón</span>
          <p className="text-xl font-black text-red-400">{stats.enMora}</p>
        </div>
      </div>

      {/* NAVEGADOR DE TORRES Y FILTROS */}
      <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl space-y-4">
        {/* SELECTOR DE TORRES TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {torres.map((t) => (
            <button
              key={t}
              onClick={() => setTorreSeleccionada(t)}
              className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                torreSeleccionada === t
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-105'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              {t}
            </button>
          ))}
          <button
            onClick={() => setTorreSeleccionada('todas')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              torreSeleccionada === 'todas'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            Vista Todas las Torres
          </button>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-700/60">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por apartamento (ej: 101, 502), propietario, inquilino o placa..."
              className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="propietario">Propietario Residente</option>
              <option value="arrendatario">Arrendado</option>
              <option value="disponible_arriendo">Disponible Arriendo</option>
              <option value="disponible_venta">Disponible Venta</option>
              <option value="vacio">Vacío / Desocupado</option>
            </select>

            <select
              value={filtroParqueadero}
              onChange={(e) => setFiltroParqueadero(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los Parqueaderos</option>
              <option value="dos_parqueaderos">2 Parqueaderos</option>
              <option value="un_parqueadero">1 Parqueadero</option>
              <option value="sin_parqueadero">Sin Parqueadero</option>
            </select>

            <button
              onClick={() => setFiltroMora(!filtroMora)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                filtroMora
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filtroMora ? 'text-white' : 'text-red-400'}`} />
              Solo con Mora
            </button>
          </div>
        </div>

        {/* LEYENDA VISUAL */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-2 text-slate-300">
          <span className="font-bold text-slate-400">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Propietario</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Arrendado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Disp. Arriendo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Disp. Venta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600" />
            <span>Vacío</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-red-500 bg-red-950/40" />
            <span className="text-red-300 font-bold">En Mora</span>
          </div>
        </div>
      </div>

      {/* PLANO / MATRIZ ARQUITECTÓNICA POR PISOS */}
      <div className="space-y-6">
        {[5, 4, 3, 2, 1].map((numPiso) => {
          const aptosPiso = pisosAgrupados[numPiso] || [];
          if (aptosPiso.length === 0) return null;

          return (
            <div key={numPiso} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Piso {numPiso}
                </h3>
                <span className="text-xs text-slate-400">{aptosPiso.length} apartamentos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {aptosPiso.map((u) => {
                  const tiempoRestante = calcularTiempoRestante(u.contratoArriendo?.fechaFin);
                  const tieneMora = u.estadoFinanciero?.administracion?.alDia === false;
                  
                  // Estilos por estado
                  let cardBorder = 'border-slate-700 hover:border-slate-500';
                  let headerBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                  let badgeText = 'Propietario';

                  if (u.tipoOcupacion === 'arrendatario') {
                    headerBadge = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                    badgeText = 'Arrendado';
                  } else if (u.estadoComercial === 'disponible_arriendo') {
                    headerBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                    badgeText = 'En Arriendo';
                  } else if (u.estadoComercial === 'disponible_venta') {
                    headerBadge = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                    badgeText = 'En Venta';
                  } else if (u.estadoComercial === 'vacio') {
                    headerBadge = 'bg-slate-700 text-slate-300 border-slate-600';
                    badgeText = 'Vacío';
                  }

                  if (tieneMora) {
                    cardBorder = 'border-red-500/80 ring-1 ring-red-500/50 shadow-lg shadow-red-950/20';
                  }

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUnidad(u)}
                      className={`cursor-pointer bg-slate-900/90 border-2 ${cardBorder} p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between space-y-3 group`}
                    >
                      <div>
                        {/* HEADER APTO */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                              {u.numero}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">({u.torre})</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${headerBadge}`}>
                            {badgeText}
                          </span>
                        </div>

                        {/* DETALLE PRINCIPAL */}
                        <div className="space-y-1.5 pt-2.5 text-xs">
                          {u.tipoOcupacion === 'arrendatario' ? (
                            <div>
                              <p className="text-slate-400 text-[11px]">Inquilino:</p>
                              <p className="text-white font-bold truncate">{u.contratoArriendo?.inquilinoNombre}</p>
                              {tiempoRestante && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                                  tiempoRestante.urgente ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                }`}>
                                  ⏳ {tiempoRestante.texto}
                                </span>
                              )}
                            </div>
                          ) : u.tipoOcupacion === 'propietario' && u.estadoComercial === 'habitado' ? (
                            <div>
                              <p className="text-slate-400 text-[11px]">Propietario:</p>
                              <p className="text-white font-bold truncate">{u.propietario?.nombre}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Tel: {u.propietario?.telefono}</p>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-slate-500 text-xs italic">
                              Inmueble desocupado
                            </div>
                          )}
                        </div>
                      </div>

                      {/* FOOTER: PARQUEADEROS & MORA */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 font-mono">
                          <Car className="w-3.5 h-3.5 text-purple-400" />
                          {u.parqueaderosPrivados?.length > 0 ? (
                            <span className="text-purple-300 font-bold">{u.parqueaderosPrivados.join(', ')}</span>
                          ) : (
                            <span className="text-slate-500">Sin Bahía</span>
                          )}
                        </div>

                        {tieneMora ? (
                          <span className="text-red-400 font-bold flex items-center gap-0.5 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Mora
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-semibold">✓ Al Día</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DETALLADO DE FICHA TÉCNICA DEL APARTAMENTO */}
      {selectedUnidad && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-2xl">
                  {selectedUnidad.numero}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    {selectedUnidad.torre} - Apto {selectedUnidad.numero}
                  </h2>
                  <p className="text-xs text-slate-400">Piso {selectedUnidad.piso} • PIN Citofonía: <strong className="text-emerald-400 font-mono">{selectedUnidad.pinAcceso}</strong></p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUnidad(null)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECCIÓN PROPIETARIO & INQUILINO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FICHA PROPIETARIO */}
              <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Propietario del Inmueble
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{selectedUnidad.propietario?.nombre || 'No registrado'}</h4>
                <p className="text-xs text-slate-400">C.C. {selectedUnidad.propietario?.documento || 'S/N'}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300 font-mono">{selectedUnidad.propietario?.telefono || 'Sin tel'}</span>
                  {selectedUnidad.propietario?.telefono && (
                    <button
                      onClick={() => handleCopyTel(selectedUnidad.propietario.telefono)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-600 flex items-center gap-1"
                    >
                      {copiedTel ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copiar
                    </button>
                  )}
                </div>
              </div>

              {/* FICHA ARRENDATARIO / ESTADO */}
              <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Ocupación / Contrato
                </span>
                {selectedUnidad.tipoOcupacion === 'arrendatario' ? (
                  <div className="space-y-1 text-xs">
                    <p className="text-white font-bold">{selectedUnidad.contratoArriendo?.inquilinoNombre}</p>
                    <p className="text-slate-400">Tel Inquilino: <strong className="text-slate-200">{selectedUnidad.contratoArriendo?.inquilinoTel}</strong></p>
                    <p className="text-slate-400">Vigencia: {selectedUnidad.contratoArriendo?.fechaInicio} al <strong className="text-white">{selectedUnidad.contratoArriendo?.fechaFin}</strong></p>
                    <p className="text-slate-400">Inmobiliaria: {selectedUnidad.contratoArriendo?.inmobiliaria}</p>
                    {calcularTiempoRestante(selectedUnidad.contratoArriendo?.fechaFin) && (
                      <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold mt-1">
                        ⏳ {calcularTiempoRestante(selectedUnidad.contratoArriendo?.fechaFin).texto}
                      </span>
                    )}
                  </div>
                ) : selectedUnidad.tipoOcupacion === 'propietario' && selectedUnidad.estadoComercial === 'habitado' ? (
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-slate-400">Tipo de Ocupación:</strong> <span className="text-emerald-400 font-bold">Propietario Residente</span></p>
                    <p className="text-slate-400">Habitado permanentemente por el dueño y su grupo familiar.</p>
                  </div>
                ) : selectedUnidad.estadoComercial === 'disponible_arriendo' ? (
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-amber-400 font-bold">🟡 Disponible para Arriendo</strong></p>
                    <p className="text-slate-400">Inmueble desocupado en oferta de alquiler. Contactar al propietario para visitas o llaves en portería.</p>
                  </div>
                ) : selectedUnidad.estadoComercial === 'disponible_venta' ? (
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-orange-400 font-bold">🟠 Disponible para Venta</strong></p>
                    <p className="text-slate-400">Inmueble en venta. Contactar al propietario para autorización de visitas comerciales.</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-slate-300 font-bold">⚪ Inmueble Vacío</strong></p>
                    <p className="text-slate-400">Inmueble actualmente desocupado / en remodelación.</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN PARQUEADEROS, BODEGAS & BICICLETAS */}
            <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Car className="w-4 h-4" /> Parqueaderos, Bodegas y Bicicleteros Asignados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400">Bahías Privadas:</p>
                  {selectedUnidad.parqueaderosPrivados?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedUnidad.parqueaderosPrivados.map(b => (
                        <span key={b} className="bg-purple-950/60 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-lg font-mono font-bold">
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-400 font-semibold mt-1">❌ Sin parqueadero</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400">Bodega / Depósito:</p>
                  {selectedUnidad.bodega ? (
                    <span className="inline-block mt-1 bg-amber-950/60 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                      📦 {selectedUnidad.bodega}
                    </span>
                  ) : (
                    <p className="text-slate-500 mt-1">Sin cuarto útil</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400">Cupo Bicicletero:</p>
                  {selectedUnidad.bicicletero ? (
                    <span className="inline-block mt-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                      🚲 {selectedUnidad.bicicletero}
                    </span>
                  ) : (
                    <p className="text-slate-500 mt-1">Sin cupo asignado</p>
                  )}
                </div>
              </div>

              {selectedUnidad.vehiculos?.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <p className="text-slate-400 font-semibold">Vehículos Registrados:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedUnidad.vehiculos.map((v, i) => (
                      <span key={i} className="bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg text-white font-mono font-bold">
                        🚗 {v.placa} ({v.marca}) • Bahía: {v.parqueaderoAsignado}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN ESTADO FINANCIERO Y SERVICIOS PÚBLICOS */}
            <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Estado de Cuenta y Servicios Públicos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* ADMON */}
                <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Cuota Administración:</span>
                    <span className="text-white font-bold font-mono">
                      ${Number(selectedUnidad.estadoFinanciero?.administracion?.cuotaMensual || 220000).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Estado de Pago:</span>
                    {selectedUnidad.estadoFinanciero?.administracion?.alDia ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        ✓ Al Día (Paz y Salvo)
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold bg-red-950 px-2 py-0.5 rounded border border-red-800">
                        ⚠️ En Mora ({selectedUnidad.estadoFinanciero?.administracion?.mesesMora} meses: ${Number(selectedUnidad.estadoFinanciero?.administracion?.saldoPendiente).toLocaleString('es-CO')})
                      </span>
                    )}
                  </div>
                </div>

                {/* RECIBOS */}
                <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                  <span className="text-slate-400 font-semibold">Servicios Públicos:</span>
                  <p className="text-white pt-1">{selectedUnidad.estadoFinanciero?.recibosPublicos?.alertas || 'Todos los servicios al día'}</p>
                </div>
              </div>
            </div>

            {/* FOOTER MODAL */}
            <div className="flex justify-end items-center gap-3 pt-2">
              {selectedUnidad.estadoFinanciero?.administracion?.alDia && (
                <button
                  onClick={() => {
                    generarPazYSalvoPDF(selectedUnidad);
                    toast.success('Paz y Salvo Oficial generado y descargado en PDF');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Paz y Salvo (PDF)</span>
                </button>
              )}
              <button
                onClick={() => setSelectedUnidad(null)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}