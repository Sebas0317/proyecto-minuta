import React, { useState } from 'react';
import { AlertOctagon, Phone, ShieldAlert, Siren, Flame, HeartPulse, UserX, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createMinutaEntry } from '../services/api';

export default function BotonPanicoModal({ isOpen, onClose }) {
  const [activando, setActivando] = useState(false);
  const [alertaEnviada, setAlertaEnviada] = useState(null);
  const [tipoEmergencia, setTipoEmergencia] = useState('intrusion');
  const [ubicacion, setUbicacion] = useState('Portería Principal');
  const [detalles, setDetalles] = useState('');

  if (!isOpen) return null;

  const handleActivarSOS = async (e) => {
    e.preventDefault();
    setActivando(true);
    try {
      const radicado = 'SOS-' + Math.floor(1000 + Math.random() * 9000);
      await createMinutaEntry({
        tipo: 'emergencia',
        titulo: '🚨 ALERTA SOS ACTIVADA: ' + tipoEmergencia.toUpperCase(),
        descripcion: 'Ubicación: ' + ubicacion + '. ' + (detalles || 'Alerta de pánico disparada desde panel de control.'),
        severidad: 'peligro',
        radicado
      });
      setAlertaEnviada(radicado);
      toast.error('🚨 ¡ALERTA DE EMERGENCIA ASENTADA EN MINUTA OFICIAL!');
    } catch (err) {
      toast.error('Error al emitir alerta');
    } finally {
      setActivando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-600/80 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-red-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 text-red-500 border border-red-500/40 rounded-2xl animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                BOTÓN DE PÁNICO & SOS <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">EMERGENCIA</span>
              </h2>
              <p className="text-xs text-red-300">Protocolo de Asistencia Rápida y Notificación Inmediata</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <a href="tel:123" className="bg-red-950/80 hover:bg-red-900/80 border border-red-700/80 p-3 rounded-xl flex flex-col items-center text-center transition-all group">
            <ShieldAlert className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[11px] font-bold text-white">Policía / 123</span>
            <span className="text-[10px] text-red-300 font-mono">301 234 5678</span>
          </a>
          <a href="tel:119" className="bg-amber-950/80 hover:bg-amber-900/80 border border-amber-700/80 p-3 rounded-xl flex flex-col items-center text-center transition-all group">
            <Flame className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[11px] font-bold text-white">Bomberos / 119</span>
            <span className="text-[10px] text-amber-300 font-mono">Línea Directa</span>
          </a>
          <a href="tel:132" className="bg-blue-950/80 hover:bg-blue-900/80 border border-blue-700/80 p-3 rounded-xl flex flex-col items-center text-center transition-all group">
            <HeartPulse className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[11px] font-bold text-white">Ambulancia / 132</span>
            <span className="text-[10px] text-blue-300 font-mono">Cruz Roja</span>
          </a>
          <a href="tel:164" className="bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/80 p-3 rounded-xl flex flex-col items-center text-center transition-all group">
            <Siren className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[11px] font-bold text-white">Fuga Gas / 164</span>
            <span className="text-[10px] text-emerald-300 font-mono">Vanti Gas</span>
          </a>
        </div>

        {alertaEnviada ? (
          <div className="bg-emerald-950/60 border border-emerald-800 p-5 rounded-2xl text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">¡Alerta Asentada en Minuta Oficial!</h3>
            <p className="text-xs text-emerald-300">
              Radicado de Emergencia: <strong className="font-mono text-white">#{alertaEnviada}</strong>.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              Entendido / Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleActivarSOS} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Evento Crítico</label>
                <select
                  value={tipoEmergencia}
                  onChange={(e) => setTipoEmergencia(e.target.value)}
                  className="w-full bg-slate-950 border border-red-700/80 text-white px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-red-500"
                >
                  <option value="intrusion">🚨 Intrusión / Sospechoso / Robo</option>
                  <option value="incendio">🔥 Conato de Incendio / Humo</option>
                  <option value="medica">🚑 Emergencia Médica / Desmayo</option>
                  <option value="gas">⚠️ Fuga de Gas / Olor Fuerte</option>
                  <option value="pelea">⚔️ Riña / Alteración de Orden</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Ubicación del Incidente</label>
                <input
                  type="text"
                  required
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Torre 2 Piso 4 o Sótano 1"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Detalles Inmediatos (Opcional)</label>
              <textarea
                rows={2}
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                placeholder="Personas involucradas, estado de la persona o descripción de sospechosos..."
                className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={activando}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-red-950/60 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{activando ? 'Emitiendo Alerta...' : 'DISPARAR ALERTA SOS'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
