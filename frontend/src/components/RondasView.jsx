import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Printer,
  Download,
  Search,
  UserCheck,
  Sparkles,
  Camera,
  X,
  Building2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchRondas, registrarPuntoRonda, createPuntoControl } from '../services/api';

export default function RondasView() {
  const [data, setData] = useState({ puntosControl: [], registrosRondas: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ronda_activa'); // 'ronda_activa' | 'codigos_qr' | 'historial'

  // Modal para validar punto
  const [selectedPunto, setSelectedPunto] = useState(null);
  const [guarda, setGuarda] = useState('Carlos Rodríguez');
  const [estadoPunto, setEstadoPunto] = useState('normal');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal crear nuevo punto
  const [showNewPuntoModal, setShowNewPuntoModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  // Filtro historial
  const [filtroTexto, setFiltroTexto] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchRondas();
      setData(res || { puntosControl: [], registrosRondas: [] });
    } catch (e) {
      toast.error('Error al cargar datos de rondas de vigilancia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular porcentaje de cobertura de la ronda actual (últimas 4 horas)
  const stats = useMemo(() => {
    const totalPuntos = data.puntosControl.length || 6;
    const ahora = Date.now();
    const hace4Horas = ahora - 4 * 3600000;

    const puntosVerificadosRecientes = new Set();
    data.registrosRondas.forEach((r) => {
      if (new Date(r.fecha).getTime() >= hace4Horas) {
        puntosVerificadosRecientes.add(r.puntoId);
      }
    });

    const verificados = puntosVerificadosRecientes.size;
    const porcentaje = totalPuntos > 0 ? Math.round((verificados / totalPuntos) * 100) : 0;

    const totalNovedades = data.registrosRondas.filter(r => r.estado === 'novedad').length;

    return { totalPuntos, verificados, porcentaje, totalNovedades };
  }, [data]);

  const handleValidarPunto = async (e) => {
    e.preventDefault();
    if (!selectedPunto) return;

    try {
      setSubmitting(true);
      await registrarPuntoRonda({
        puntoId: selectedPunto.id,
        guarda,
        estado: estadoPunto,
        observaciones: observaciones.trim() || (estadoPunto === 'novedad' ? 'Novedad detectada' : 'Punto verificado sin novedad.')
      });

      toast.success(`Punto "${selectedPunto.nombre}" verificado correctamente`);
      setSelectedPunto(null);
      setObservaciones('');
      setEstadoPunto('normal');
      loadData();
    } catch (e) {
      toast.error('Error al registrar verificación de ronda');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearPunto = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      await createPuntoControl({
        nombre: nuevoNombre.trim(),
        ubicacion: nuevaUbicacion.trim() || 'Área General'
      });
      toast.success('Nuevo punto de control creado con su código QR');
      setShowNewPuntoModal(false);
      setNuevoNombre('');
      setNuevaUbicacion('');
      loadData();
    } catch (e) {
      toast.error('Error al crear punto de control');
    }
  };

  const handleExportCSV = () => {
    if (!data.registrosRondas.length) {
      toast.info('No hay registros de rondas para exportar');
      return;
    }

    const headers = ['ID', 'Fecha y Hora', 'Punto de Control', 'Ubicación', 'Guarda', 'Estado', 'Observaciones'];
    const rows = data.registrosRondas.map(r => [
      r.id,
      new Date(r.fecha).toLocaleString('es-CO'),
      `"${r.nombrePunto}"`,
      `"${r.ubicacion || ''}"`,
      `"${r.guarda}"`,
      r.estado.toUpperCase(),
      `"${(r.observaciones || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bitacora_Rondas_Minuta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Bitácora de rondas exportada a Excel (CSV)');
  };

  const registrosFiltrados = useMemo(() => {
    return data.registrosRondas.filter((r) => {
      const q = filtroTexto.toLowerCase();
      return (
        !q ||
        r.nombrePunto?.toLowerCase().includes(q) ||
        r.guarda?.toLowerCase().includes(q) ||
        r.observaciones?.toLowerCase().includes(q)
      );
    });
  }, [data.registrosRondas, filtroTexto]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Rondas de Vigilancia & Puntos QR
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Patrullaje Activo
              </span>
            </h1>
            <p className="text-slate-400 text-sm">
              Control en tiempo real de patrullajes, escaneo de códigos QR perimetrales y bitácora de inspección
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowNewPuntoModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Punto de Control</span>
          </button>
          <button
            onClick={loadData}
            title="Recargar datos"
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRICAS Y PROGRESO DE LA RONDA ACTUAL */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Puntos de Control</span>
          <p className="text-2xl font-black text-white mt-1">{stats.totalPuntos} Puntos</p>
          <span className="text-[10px] text-slate-500">Sótanos, Shuts, Torres y Perímetro</span>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Verificados Turno Actual</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.verificados} de {stats.totalPuntos}</p>
          <span className="text-[10px] text-emerald-300/80">Últimas 4 horas</span>
        </div>

        <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase">Cumplimiento de Ronda</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-black text-cyan-400">{stats.porcentaje}%</span>
            <div className="flex-1 bg-slate-900 h-3 rounded-full overflow-hidden border border-cyan-800/50">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.porcentaje}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-cyan-300/80">Meta: 100% por turno</span>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Novedades Reportadas</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.totalNovedades}</p>
          <span className="text-[10px] text-amber-300/80">Requieren atención de mantenimiento</span>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex gap-2 border-b border-slate-700/80 pb-2 overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap">
        <button
          onClick={() => setActiveTab('ronda_activa')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'ronda_activa'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Ronda Activa ({stats.verificados}/{stats.totalPuntos})</span>
        </button>

        <button
          onClick={() => setActiveTab('codigos_qr')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'codigos_qr'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Códigos QR Imprimibles ({data.puntosControl.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'historial'
              ? 'bg-slate-700 text-white shadow-lg'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bitácora de Inspecciones ({data.registrosRondas.length})</span>
        </button>
      </div>

      {/* ── TAB 1: RONDA ACTIVA (PUNTOS A VALIDAR) ── */}
      {activeTab === 'ronda_activa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.puntosControl.map((punto, idx) => {
            // Verificar si fue validado recientemente
            const ultimoRegistro = data.registrosRondas.find(r => r.puntoId === punto.id);
            const esReciente = ultimoRegistro && (Date.now() - new Date(ultimoRegistro.fecha).getTime() < 4 * 3600000);

            return (
              <div
                key={punto.id}
                className={`bg-slate-800/80 border rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all ${
                  esReciente
                    ? 'border-emerald-500/50 shadow-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{punto.nombre}</h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" /> {punto.ubicacion}
                        </p>
                      </div>
                    </div>

                    {esReciente ? (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verificado
                      </span>
                    ) : (
                      <span className="bg-slate-900 text-amber-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>

                  {ultimoRegistro && (
                    <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Último paso:</span>
                        <span className="font-mono text-slate-300">{new Date(ultimoRegistro.fecha).toLocaleTimeString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Guarda:</span>
                        <span className="text-white font-medium">{ultimoRegistro.guarda}</span>
                      </div>
                      {ultimoRegistro.estado === 'novedad' && (
                        <div className="text-amber-400 font-semibold pt-1 border-t border-slate-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {ultimoRegistro.observaciones}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPunto(punto)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Validar Punto / Escanear QR</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: CÓDIGOS QR IMPRIMIBLES ── */}
      {activeTab === 'codigos_qr' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div>
              <h3 className="font-bold text-white text-sm">Tarjetas de Puntos QR Físicos</h3>
              <p className="text-xs text-slate-400">
                Imprime y pega estos códigos en cada punto físico del conjunto (Bombas, Shuts, Terrazas, etc.).
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Todos los QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.puntosControl.map((punto, idx) => (
              <div
                key={punto.id}
                className="bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center justify-between space-y-4"
              >
                <div className="w-full border-b-2 border-slate-900 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">PUNTO DE CONTROL #{idx + 1}</span>
                  <h3 className="font-black text-base text-slate-900 leading-tight mt-0.5">{punto.nombre}</h3>
                  <p className="text-xs text-slate-600 font-semibold">{punto.ubicacion}</p>
                </div>

                {/* QR BADGE */}
                <div className="p-4 bg-slate-100 border-2 border-dashed border-slate-400 rounded-2xl flex flex-col items-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <span className="font-mono text-[10px] font-bold text-slate-700 mt-2 bg-white px-2.5 py-1 rounded-md border border-slate-300">
                    {punto.qrToken}
                  </span>
                </div>

                <div className="w-full text-[9px] text-slate-500 pt-2 border-t border-slate-300 flex justify-between">
                  <span>CONDOMINIO MINUTA P.H.</span>
                  <span>SEGURIDAD 24/7</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: BITÁCORA DE INSPECCIONES (HISTORIAL) ── */}
      {activeTab === 'historial' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar por punto, guarda u observaciones..."
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Fecha & Hora</th>
                  <th className="p-3.5">Punto de Control</th>
                  <th className="p-3.5">Ubicación</th>
                  <th className="p-3.5">Guarda</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">
                      No hay registros de rondas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                        {new Date(r.fecha).toLocaleString('es-CO')}
                      </td>
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {r.nombrePunto}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {r.ubicacion || 'General'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300">
                        {r.guarda}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {r.estado === 'novedad' ? (
                          <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Novedad
                          </span>
                        ) : (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-md truncate">
                        {r.observaciones}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: VALIDAR PUNTO DE CONTROL */}
      {selectedPunto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Validar Punto de Ronda</h3>
                  <p className="text-xs text-slate-400">{selectedPunto.nombre}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPunto(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleValidarPunto} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Token QR del Punto:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">{selectedPunto.qrToken}</span>
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">
                  ✓ Token Válido
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Guarda Responsable</label>
                <input
                  type="text"
                  required
                  value={guarda}
                  onChange={(e) => setGuarda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Estado del Punto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstadoPunto('normal')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      estadoPunto === 'normal'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Sin Novedad
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoPunto('novedad')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      estadoPunto === 'novedad'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Hay Novedad
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Observaciones / Hallazgo (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Bombas operando con presión adecuada, sin fugas ni cables expuestos..."
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedPunto(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-950/40"
                >
                  {submitting ? 'Registrando...' : 'Confirmar Verificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVO PUNTO DE CONTROL */}
      {showNewPuntoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Nuevo Punto de Control Perimetral
              </h3>
              <button onClick={() => setShowNewPuntoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPunto} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre del Punto</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Sótano 2 - Tableros Eléctricos"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Ubicación Física</label>
                <input
                  type="text"
                  value={nuevaUbicacion}
                  onChange={(e) => setNuevaUbicacion(e.target.value)}
                  placeholder="Ej: Torre 4 - Sótano 2 Pasillo Norte"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewPuntoModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-950/40"
                >
                  Generar Punto & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}