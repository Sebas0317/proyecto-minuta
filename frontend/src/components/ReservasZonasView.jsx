import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  Phone,
  User,
  DollarSign,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchReservasZonas, createReservaZona, updateEstadoReservaZona } from '../services/api';

const ESPACIOS = [
  { id: 'todos', nombre: 'Todas las Zonas' },
  { id: 'cancha_f5', nombre: '⚽ Cancha Sintética Fútbol 5', capacidad: '10 jugadores', deposito: 0, horario: '08:00 AM - 10:00 PM' },
  { id: 'cancha_mult', nombre: '🏀 Cancha Múltiple', capacidad: '15 personas', deposito: 0, horario: '08:00 AM - 09:00 PM' },
  { id: 'salon_social', nombre: '🎉 Salón Social de Eventos', capacidad: '120 personas', deposito: 200000, horario: '10:00 AM - 02:00 AM' },
  { id: 'bbq_1', nombre: '🍖 Zona BBQ & Asador 1', capacidad: '20 personas', deposito: 50000, horario: '11:00 AM - 09:00 PM' },
  { id: 'bbq_2', nombre: '🍖 Zona BBQ & Asador 2', capacidad: '20 personas', deposito: 50000, horario: '11:00 AM - 09:00 PM' },
];

export default function ReservasZonasView() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEspacio, setSelectedEspacio] = useState('todos');
  const [selectedFecha, setSelectedFecha] = useState(() => new Date().toISOString().split('T')[0]);

  // Modal Crear Reserva
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    espacio: '⚽ Cancha Sintética Fútbol 5',
    apto: '',
    torre: '1',
    solicitante: '',
    telefono: '',
    fechaReserva: new Date().toISOString().split('T')[0],
    horaInicio: '18:00',
    horaFin: '19:30',
    observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchReservasZonas();
      setReservas(res || []);
    } catch (e) {
      toast.error('Error al cargar reservas de zonas comunes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.apto || !form.fechaReserva || !form.horaInicio || !form.horaFin) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      await createReservaZona(form);
      toast.success('Reserva confirmada exitosamente');
      setShowModal(false);
      setForm({
        espacio: '⚽ Cancha Sintética Fútbol 5',
        apto: '',
        torre: '1',
        solicitante: '',
        telefono: '',
        fechaReserva: new Date().toISOString().split('T')[0],
        horaInicio: '18:00',
        horaFin: '19:30',
        observaciones: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al procesar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateEstadoReservaZona(id, { estado: nuevoEstado });
      toast.success(`Reserva marcada como ${nuevoEstado}`);
      loadData();
    } catch (e) {
      toast.error('Error al actualizar estado');
    }
  };

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      const matchFecha = !selectedFecha || r.fechaReserva === selectedFecha;
      const matchEspacio = selectedEspacio === 'todos' || r.espacio.includes(selectedEspacio) || selectedEspacio.includes(r.espacio);
      return matchFecha && matchEspacio;
    });
  }, [reservas, selectedFecha, selectedEspacio]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Reserva de Zonas Comunes & Recreativas
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Calendario en Vivo
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">
              Aparta la Cancha Sintética, Salón Social y Zona BBQ con validación de horarios y depósitos de garantía
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Reserva</span>
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

      {/* TARJETAS DE ESPACIOS DISPONIBLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ESPACIOS.slice(1, 5).map((esp) => (
          <div
            key={esp.id}
            className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col justify-between gap-3"
          >
            <div>
              <h3 className="font-bold text-white text-sm">{esp.nombre}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Horario: {esp.horario}</p>
              <p className="text-[11px] text-slate-400">Capacidad: {esp.capacidad}</p>
            </div>
            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Depósito:</span>
              <span className="font-bold font-mono text-emerald-400">
                {esp.deposito === 0 ? 'Gratuito (Al día)' : `$${esp.deposito.toLocaleString('es-CO')} COP`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* BARRA DE FILTROS POR FECHA Y ZONA */}
      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Fecha de Consulta:</label>
          <input
            type="date"
            value={selectedFecha}
            onChange={(e) => setSelectedFecha(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => setSelectedFecha(new Date().toISOString().split('T')[0])}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold"
          >
            Hoy
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {ESPACIOS.map((esp) => (
            <button
              key={esp.id}
              onClick={() => setSelectedEspacio(esp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedEspacio === esp.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {esp.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE RESERVAS PARA LA FECHA SELECCIONADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservasFiltradas.length === 0 ? (
          <div className="col-span-full bg-slate-800/60 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <CalendarIcon className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm font-semibold">No hay reservas programadas para el día seleccionado.</p>
            <p className="text-xs text-slate-400">Todos los espacios se encuentran 100% disponibles.</p>
          </div>
        ) : (
          reservasFiltradas.map((res) => {
            const esConfirmada = res.estado === 'confirmada';
            return (
              <div
                key={res.id}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-3">
                    <div>
                      <span className="text-xs font-black text-white">{res.espacio}</span>
                      <p className="text-xs text-emerald-400 font-bold mt-0.5">
                        Apto {res.apto} (Torre {res.torre || '1'})
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        res.estado === 'confirmada'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : res.estado === 'finalizada'
                          ? 'bg-slate-900 text-slate-400 border-slate-700'
                          : 'bg-red-950 text-red-300 border-red-800'
                      }`}
                    >
                      {res.estado}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> Horario:</span>
                      <span className="font-bold text-white font-mono">{res.horaInicio} - {res.horaFin}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" /> Solicitante:</span>
                      <span className="font-medium text-slate-200">{res.solicitante}</span>
                    </div>

                    {res.telefono && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> Celular:</span>
                        <span className="font-mono text-slate-300">{res.telefono}</span>
                      </div>
                    )}

                    {res.deposito > 0 && (
                      <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                        <span>Depósito en Garantía:</span>
                        <span className="font-bold font-mono text-emerald-400">${res.deposito.toLocaleString('es-CO')} COP</span>
                      </div>
                    )}

                    {res.observaciones && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800 mt-2">
                        "{res.observaciones}"
                      </p>
                    )}
                  </div>
                </div>

                {esConfirmada && (
                  <div className="flex gap-2 pt-2 border-t border-slate-700/80">
                    <button
                      onClick={() => handleCambiarEstado(res.id, 'finalizada')}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      Finalizar Uso
                    </button>
                    <button
                      onClick={() => handleCambiarEstado(res.id, 'cancelada')}
                      className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CREAR NUEVA RESERVA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-400" />
                Nueva Reserva de Zona Común
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Zona o Espacio</label>
                <select
                  value={form.espacio}
                  onChange={(e) => setForm({ ...form, espacio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="⚽ Cancha Sintética Fútbol 5">⚽ Cancha Sintética Fútbol 5</option>
                  <option value="🏀 Cancha Múltiple">🏀 Cancha Múltiple</option>
                  <option value="🎉 Salón Social de Eventos">🎉 Salón Social de Eventos ($200.000 COP depósito)</option>
                  <option value="🍖 Zona BBQ & Asador 1">🍖 Zona BBQ & Asador 1 ($50.000 COP depósito)</option>
                  <option value="🍖 Zona BBQ & Asador 2">🍖 Zona BBQ & Asador 2 ($50.000 COP depósito)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Apartamento</label>
                  <input
                    type="text"
                    required
                    value={form.apto}
                    onChange={(e) => setForm({ ...form, apto: e.target.value })}
                    placeholder="Ej: 101"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Torre</label>
                  <select
                    value={form.torre}
                    onChange={(e) => setForm({ ...form, torre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="1">Torre 1</option>
                    <option value="2">Torre 2</option>
                    <option value="3">Torre 3</option>
                    <option value="4">Torre 4</option>
                    <option value="5">Torre 5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nombre del Solicitante</label>
                  <input
                    type="text"
                    value={form.solicitante}
                    onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
                    placeholder="Ej: Andrés Cepeda"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Ej: 311 445 6677"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={form.fechaReserva}
                    onChange={(e) => setForm({ ...form, fechaReserva: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={form.horaFin}
                    onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observaciones / Motivo</label>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Ej: Partido amistoso entre vecinos..."
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-950/40"
                >
                  {submitting ? 'Verificando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}