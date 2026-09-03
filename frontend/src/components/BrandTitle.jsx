import React from 'react';
import { ShieldCheck, Building2 } from 'lucide-react';

export default function BrandTitle({ subtitle = 'Sistema Integral de Portería y Control Residencial' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-950/60 border border-emerald-400/30 text-white">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
            MINUTA <span className="text-emerald-400 font-mono text-xl">P.H.</span>
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold">
            Seguridad & Vigilancia
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 max-w-xs">{subtitle}</p>
      )}
    </div>
  );
}