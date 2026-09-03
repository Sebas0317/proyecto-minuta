const fs = require('fs');

const code = `import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Key,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
  FileText,
  Lock,
  Server
} from 'lucide-react';
import { useMemo } from 'react';
import { FECHA } from '../utils/helpers';

const TYPE_CONFIG = {
  login: {
    label: 'Inicio de Sesión',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-800/80',
    icon: CheckCircle,
  },
  failed_login: {
    label: 'Intento Fallido',
    color: 'text-red-400',
    bg: 'bg-red-950/60',
    border: 'border-red-800/80',
    icon: XCircle,
  },
  account_locked: {
    label: 'Cuenta Bloqueada',
    color: 'text-orange-400',
    bg: 'bg-orange-950/60',
    border: 'border-orange-800/80',
    icon: AlertTriangle,
  },
  rate_limit: {
    label: 'Límite Excedido',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-800/80',
    icon: AlertTriangle,
  },
  ingreso_visita: {
    label: 'Acceso / Ingreso',
    color: 'text-blue-400',
    bg: 'bg-blue-950/60',
    border: 'border-blue-800/80',
    icon: UserCheck,
  },
  salida_visita: {
    label: 'Salida Registrada',
    color: 'text-purple-400',
    bg: 'bg-purple-950/60',
    border: 'border-purple-800/80',
    icon: UserCheck,
  },
  novedad_minuta: {
    label: 'Novedad Minuta',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-800/80',
    icon: FileText,
  },
};

export default function SecurityDashboard({
  events = [],
  users = [],
}) {
  const stats = useMemo(() => {
    const loginOK = events.filter((e) => e.type === 'login').length;
    const loginFailed = events.filter((e) => e.type === 'failed_login').length;
    const locked = events.filter((e) => e.type === 'account_locked').length;
    const rateLimited = events.filter((e) => e.type === 'rate_limit').length;
    const users2FA = users.filter((u) => u.twoFactorEnabled).length;
    const totalUsers = users.length;

    return {
      loginOK,
      loginFailed,
      locked,
      rateLimited,
      users2FA,
      totalUsers,
    };
  }, [events, users]);

  const STAT_CARDS = [
    {
      label: 'Inicios de Sesión Exitosos',
      value: stats.loginOK,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/60',
    },
    {
      label: 'Intentos Fallidos',
      value: stats.loginFailed,
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-800/60',
    },
    {
      label: 'Cuentas Bloqueadas',
      value: stats.locked,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-800/60',
    },
    {
      label: 'Personal con 2FA',
      value: stats.users2FA,
      icon: Key,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-800/60',
    },
    {
      label: 'Tasa de Solicitudes Bloqueadas',
      value: stats.rateLimited,
      icon: Shield,
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-800/60',
    },
    {
      label: 'Total Cuentas Registradas',
      value: stats.totalUsers,
      icon: Server,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-800/60',
    },
  ];

  return (
    <div className="space-y-6">
      {/* STATS DE CIBERSEGURIDAD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={\`\${card.bg} border \${card.border} rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-2\`}
          >
            <div className="flex items-center justify-between">
              <card.icon className={\`w-5 h-5 \${card.color}\`} />
              <span className={\`text-2xl font-black \${card.color}\`}>
                {card.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">{card.label}</p>
          </div>
        ))}
      </div>

      {/* TABLA DE AUDITORÍA EN MODO OSCURO */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              Registro de Auditoría y Eventos de Seguridad
            </h3>
          </div>
          <span className="text-xs bg-slate-900 text-slate-400 px-3 py-1 rounded-full font-mono border border-slate-700">
            {events.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold">
                <th className="px-5 py-3">Tipo de Evento</th>
                <th className="px-5 py-3">Detalle / Acción</th>
                <th className="px-5 py-3">Usuario / Identificador</th>
                <th className="px-5 py-3">Dirección IP</th>
                <th className="px-5 py-3 text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                    Sin eventos sospechosos registrados
                  </td>
                </tr>
              ) : (
                events.slice(0, 50).map((ev) => {
                  const cfg = TYPE_CONFIG[ev.type] || {
                    label: ev.type,
                    color: 'text-slate-300',
                    bg: 'bg-slate-900',
                    border: 'border-slate-700',
                    icon: Shield,
                  };
                  const Icon = cfg.icon;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span
                          className={\`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border \${cfg.bg} \${cfg.color} \${cfg.border}\`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-200 font-medium max-w-xs truncate">
                        {ev.detail || ev.action || 'Evento del sistema'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">
                        {ev.userId || 'Sistema'}
                      </td>
                      <td className="px-5 py-3.5 text-emerald-400 font-mono">
                        {ev.ip || '127.0.0.1'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 font-mono whitespace-nowrap">
                        {FECHA(ev.timestamp)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components/SecurityDashboard.jsx', code);
console.log('✓ SecurityDashboard.jsx updated to full dark mode');