
import React from 'react';
import { Megaphone } from 'lucide-react';

export default function BoletinInformativo() {
  const circulares = [
    {
      id: "cir-1",
      titulo: "Mantenimiento Preventivo de Bombas de Agua y Lavado de Tanques",
      tipo: "mantenimiento",
      fecha: "15 de Septiembre 2026",
      prioridad: "alta",
      contenido: "Se informa a la comunidad que el próximo martes 15 de septiembre se realizará el lavado y desinfección semestral de tanques de reserva de agua potable. Habrá suspensión temporal del servicio de 08:00 AM a 02:00 PM."
    },
    {
      id: "cir-2",
      titulo: "Convocatoria a Asamblea General Ordinaria de Copropietarios 2026",
      tipo: "asamblea",
      fecha: "20 de Septiembre 2026",
      prioridad: "urgente",
      contenido: "La Administración y el Consejo de Administración convocan a todos los propietarios a la Asamblea General Ordinaria en el Salón Social. Se recuerda que pueden participar y votar digitalmente mediante el módulo de votaciones del sistema."
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        <Megaphone className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-base font-bold text-white">Boletín Informativo & Circulares Oficiales</h2>
          <p className="text-xs text-slate-400">Comunicados oficiales emitidos por la Administración del Condominio</p>
        </div>
      </div>

      <div className="space-y-3">
        {circulares.map(c => (
          <div key={c.id} className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl shadow space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                {c.tipo}
              </span>
              <span className="text-xs text-slate-400">{c.fecha}</span>
            </div>
            <h3 className="text-sm font-bold text-white">{c.titulo}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{c.contenido}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
