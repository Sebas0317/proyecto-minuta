import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function BrandTitle({ subtitle = 'Plataforma de Control de Accesos y Gestión de Propiedad Horizontal' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2.5 mb-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2 leading-none">
            <h1 className="text-xl font-bold tracking-tight text-white">
              MINUTATECH
            </h1>
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
              P.H.
            </span>
          </div>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold mt-1">
            Seguridad Física &amp; Operaciones
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
