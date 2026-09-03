import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  MapPin,
  FileText,
  UserCheck,
  Package,
  Car,
  Truck,
  Building2,
  Users,
  History,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock,
  Download,
  Activity,
  ShieldCheck
} from 'lucide-react';
import {
  downloadLoginLogsCSV,
  fetchLastLogin,
  fetchLoginLogs,
} from '../services/api';

const NAV_GROUPS = [
  {
    title: 'OPERACIÓN DE PORTERÍA',
    items: [
      { key: 'porteria', label: 'Tablero Operativo', icon: LayoutDashboard, path: '/admin' },
      { key: 'mapa', label: 'Plano / Mapa Maestro', icon: MapPin, path: '/admin/mapa' },
      { key: 'minuta', label: 'Minuta Digital', icon: FileText, path: '/admin/minuta' },
    ]
  },
  {
    title: 'CONTROL DE FLUJO & ACCESOS',
    items: [
      { key: 'accesos', label: 'Accesos y Visitas', icon: UserCheck, path: '/admin/accesos' },
      { key: 'paquetes', label: 'Paquetería & PINs', icon: Package, path: '/admin/paquetes' },
      { key: 'parqueadero', label: 'Parqueaderos (4h)', icon: Car, path: '/admin/parqueadero' },
      { key: 'trasteos', label: 'Mudanzas / Trasteos', icon: Truck, path: '/admin/trasteos' },
    ]
  },
  {
    title: 'GESTIÓN & SEGURIDAD',
    items: [
      { key: 'unidades', label: 'Censo de Inmuebles', icon: Building2, path: '/admin/unidades' },
      { key: 'users', label: 'Personal y Guardas', icon: Users, path: '/admin/users' },
      { key: 'security', label: 'Ciberseguridad & Logs', icon: ShieldCheck, path: '/admin/security' },
    ]
  }
];

export default function AdminShell({ rol = 'admin', onSalir }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Estado del Sidebar (Colapsado o Expandido)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('minuta_sidebar_collapsed') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());

  // Reloj digital en vivo para portería
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('minuta_sidebar_collapsed', String(nextState));
  };

  function getViewFromPath(pathname) {
    const path = pathname.split('?')[0];
    if (path.includes('/admin/mapa')) return 'mapa';
    if (path.includes('/admin/minuta')) return 'minuta';
    if (path.includes('/admin/paquetes')) return 'paquetes';
    if (path.includes('/admin/accesos')) return 'accesos';
    if (path.includes('/admin/parqueadero')) return 'parqueadero';
    if (path.includes('/admin/trasteos')) return 'trasteos';
    if (path.includes('/admin/unidades')) return 'unidades';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/security')) return 'security';
    return 'porteria';
  }

  const activeView = getViewFromPath(location.pathname);

  const handleNavigate = useCallback(
    (view) => {
      const paths = {
        porteria: '/admin',
        mapa: '/admin/mapa',
        minuta: '/admin/minuta',
        paquetes: '/admin/paquetes',
        accesos: '/admin/accesos',
        parqueadero: '/admin/parqueadero',
        trasteos: '/admin/trasteos',
        unidades: '/admin/unidades',
        users: '/admin/users',
        security: '/admin/security',
      };
      navigate(paths[view] || '/admin');
      setMobileOpen(false);
    },
    [navigate]
  );

  const handleToggleLogs = useCallback(() => {
    const opening = !logsOpen;
    setLogsOpen(opening);
    if (opening && logs.length === 0) {
      setLogsLoading(true);
      fetchLoginLogs(50)
        .then((data) => setLogs(data || []))
        .catch(() => {})
        .finally(() => setLogsLoading(false));
    }
  }, [logsOpen, logs.length]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex">
      {/* BACKDROP MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR IZQUIERDO CON ALTURA FIJA 100vh */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 h-screen shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* HEADER DEL SIDEBAR */}
        <div className="p-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h2 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                  PROYECTO MINUTA
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  Vigilancia & Control
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title={collapsed ? 'Expandir Menú' : 'Colapsar Menú'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVEGACIÓN AGRUPADA CON SCROLL INTERNO INDEPENDIENTE */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {!collapsed ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block">
                  {group.title}
                </span>
              ) : (
                <div className="h-px bg-slate-800 my-2 mx-2" />
              )}

              {group.items.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER DEL SIDEBAR SIEMPRE VISIBLE EN LA BASE */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-2 bg-slate-900/90">
          {/* RELOJ EN VIVO OFICIAL */}
          {!collapsed ? (
            <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Hora Oficial:
                </span>
                <span className="text-emerald-400 font-mono font-black">
                  {horaActual.toLocaleTimeString('es-CO', { hour12: false })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium capitalize">
                {horaActual.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          ) : (
            <div className="text-center py-1 text-emerald-400 font-mono text-[10px] font-bold" title="Hora actual">
              {horaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          )}

          {/* PERFIL & AUDITORÍA */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleToggleLogs}
              className="flex-1 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              title="Auditoría de Inicios de Sesión"
            >
              <History className="w-4 h-4 text-emerald-400" />
              {!collapsed && <span>Auditoría</span>}
            </button>

            <button
              onClick={onSalir}
              className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="Cerrar Turno / Sesión"
            >
              <DoorOpen className="w-4 h-4" />
              {!collapsed && <span>Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL: TOPBAR FIJO Y MAIN ESCROLEABLE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* TOPBAR FLOTANTE */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Minuta</span>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold capitalize">
                {activeView === 'porteria' ? 'Tablero Operativo' :
                 activeView === 'mapa' ? 'Plano / Mapa Maestro' :
                 activeView === 'minuta' ? 'Minuta Digital' :
                 activeView === 'accesos' ? 'Accesos y Visitas' :
                 activeView === 'paquetes' ? 'Paquetería' :
                 activeView === 'parqueadero' ? 'Parqueaderos' :
                 activeView === 'trasteos' ? 'Mudanzas' :
                 activeView === 'unidades' ? 'Censo Inmuebles' :
                 activeView === 'users' ? 'Personal' : 'Ciberseguridad'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Sistema Conectado
            </span>
          </div>
        </header>

        {/* MODAL AUDITORÍA */}
        {logsOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" /> Auditoría de Inicios de Sesión
                </h4>
                <div className="flex items-center gap-2">
                  {logs.length > 0 && (
                    <button
                      onClick={() => downloadLoginLogsCSV(logs)}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                  )}
                  <button onClick={() => setLogsOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/60 text-xs">
                {logsLoading ? (
                  <div className="p-4 text-center text-slate-500">Cargando logs...</div>
                ) : logs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">Sin registros</div>
                ) : (
                  logs.map((l, idx) => (
                    <div key={idx} className="p-2.5 hover:bg-slate-700/50">
                      <div className="font-semibold text-white">{new Date(l.timestamp).toLocaleString('es-CO')}</div>
                      <div className="text-slate-400 font-mono text-[11px]">IP: {l.ip || 'Local'} • {l.country || ''}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ÁREA PRINCIPAL ESCROLEABLE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ rol, onSalir, handleNavigate }} />
          </div>
        </main>
      </div>
    </div>
  );
}