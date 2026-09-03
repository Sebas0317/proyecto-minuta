
import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Plus, Search, RefreshCw, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchEquipos, createEquipo } from '../services/api';

export default function EquiposEmergenciaView() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTorre, setFiltroTorre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: 'extintor',
    nombre: '',
    ubicacion: '',
    torre: '1',
    piso: 1,
    capacidad: '20 Lbs',
    agente: 'Polvo Químico Seco (PQS)',
    fechaRecarga: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
    observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchEquipos();
      setEquipos(data || []);
    } catch (e) {
      toast.error('Error al cargar inventario de equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calcularDias = (fechaVenc) => {
    if (!fechaVenc) return 365;
    const diff = new Date(fechaVenc) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredEquipos = useMemo(() => {
    return equipos.filter((e) => {
      const matchTipo = !filtroTipo || e.tipo === filtroTipo;
      const matchTorre = !filtroTorre || String(e.torre) === String(filtroTorre);
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || e.nombre.toLowerCase().includes(q) || e.ubicacion.toLowerCase().includes(q) || (e.agente || '').toLowerCase().includes(q);
      return matchTipo && matchTorre && matchSearch;
    });
  }, [equipos, filtroTipo, filtroTorre, searchQuery]);

  const porVencerCount = equipos.filter(e => calcularDias(e.fechaVencimiento) <= 30).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEquipo(form);
      toast.success('Equipo de emergencia registrado en inventario');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error('Error al registrar equipo');
    }
  };

  const handleExportCSV = () => {
    if (!equipos.length) return toast.info('No hay equipos para exportar');
    const headers = ['ID', 'Tipo', 'Nombre', 'Ubicación', 'Torre', 'Piso', 'Capacidad', 'Agente', 'Última Recarga', 'Vencimiento', 'Días Restantes'];
    const rows = equipos.map(e => [
      e.id,
      e.tipo,
      '"' + e.nombre + '"',
      '"' + e.ubicacion + '"',
      e.torre,
      e.piso,
      e.capacidad,
      '"' + (e.agente || '') + '"',
      e.fechaRecarga,
      e.fechaVencimiento,
      calcularDias(e.fechaVencimiento)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'Inventario_Equipos_Emergencia_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    toast.success('Inventario exportado a CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Equipos de Emergencia & Extintores
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Gestión de Riesgos
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Semáforo de Vencimiento y Distribución de Seguridad por Torres y Sótanos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-red-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Equipo</span>
          </button>
          <button onClick={loadData} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all">
            <RefreshCw className={'w-5 h-5 ' + (loading ? 'animate-spin text-red-400' : '')} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Activos Registrados</span>
          <p className="text-2xl font-black text-white">{equipos.length}</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Extintores Operativos</span>
          <p className="text-2xl font-black text-emerald-400">{equipos.filter(e => e.tipo === 'extintor' && calcularDias(e.fechaVencimiento) > 30).length}</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Vencen en &le; 30 Días</span>
          <p className="text-2xl font-black text-amber-400">{porVencerCount}</p>
        </div>
        <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-blue-400 uppercase">Bombas & Planta Eléctrica</span>
          <p className="text-2xl font-black text-blue-400">{equipos.filter(e => e.tipo === 'bomba' || e.tipo === 'planta').length}</p>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por extintor, ubicación o agente químico..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-red-500"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
        >
          <option value="">Todos los Tipos</option>
          <option value="extintor">Extintores</option>
          <option value="bomba">Bombas Hidráulicas</option>
          <option value="planta">Planta Eléctrica</option>
          <option value="botiquin">Botiquines de Emergencia</option>
        </select>
        <select
          value={filtroTorre}
          onChange={(e) => setFiltroTorre(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
        >
          <option value="">Todas las Torres / Áreas</option>
          <option value="1">Torre 1</option>
          <option value="2">Torre 2</option>
          <option value="3">Torre 3</option>
          <option value="Sótano 1">Sótano 1</option>
          <option value="Sótano 2">Sótano 2</option>
          <option value="Portería">Portería</option>
        </select>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-4">Equipo / Tipo</th>
                <th className="p-4">Ubicación Fisiológica</th>
                <th className="p-4">Agente & Capacidad</th>
                <th className="p-4">Última Recarga</th>
                <th className="p-4">Vencimiento</th>
                <th className="p-4 text-center">Semáforo de Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredEquipos.map((eq) => {
                const dias = calcularDias(eq.fechaVencimiento);
                const esVencido = dias <= 0;
                const esPorVencer = dias > 0 && dias <= 30;

                return (
                  <tr key={eq.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={'p-2 rounded-lg ' + (
                          eq.tipo === 'extintor' ? 'bg-red-500/20 text-red-400' :
                          eq.tipo === 'bomba' ? 'bg-blue-500/20 text-blue-400' :
                          eq.tipo === 'planta' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        )}>
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-white block">{eq.nombre}</strong>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{eq.tipo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {eq.ubicacion} (Piso {eq.piso})
                    </td>
                    <td className="p-4">
                      <span className="text-slate-200 font-medium">{eq.agente}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">Cap: {eq.capacidad}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{eq.fechaRecarga}</td>
                    <td className="p-4 font-mono font-bold text-white">{eq.fechaVencimiento}</td>
                    <td className="p-4 text-center">
                      <span className={'px-3 py-1 rounded-full text-[10px] font-bold inline-block ' + (
                        esVencido ? 'bg-red-600 text-white animate-pulse' :
                        esPorVencer ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      )}>
                        {esVencido ? '🔴 VENCIDO' : esPorVencer ? ('🟡 Vence en ' + dias + ' días') : '🟢 OPERATIVO'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Registrar Equipo de Emergencia</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Tipo de Activo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  >
                    <option value="extintor">Extintor</option>
                    <option value="bomba">Bomba Hidráulica</option>
                    <option value="planta">Planta Eléctrica</option>
                    <option value="botiquin">Botiquín</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Torre / Zona</label>
                  <input
                    type="text"
                    required
                    value={form.torre}
                    onChange={(e) => setForm({ ...form, torre: e.target.value })}
                    placeholder="Ej: 1, Sótano 2..."
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Extintor PQS 20 Lbs"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Ubicación Exacta</label>
                <input
                  type="text"
                  required
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder="Ej: Torre 1 - Piso 3 Hall frente a ascensor"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Fecha Recarga</label>
                  <input
                    type="date"
                    required
                    value={form.fechaRecarga}
                    onChange={(e) => setForm({ ...form, fechaRecarga: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={form.fechaVencimiento}
                    onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold">Guardar en Inventario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
