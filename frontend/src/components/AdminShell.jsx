import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
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
  ShieldCheck,
  BookOpen,
  Bot,
  Calendar,
  QrCode,
  Flame,
  Vote,
  Heart,
  MessageSquareQuote,
  AlertOctagon,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  API_BASE,
  downloadLoginLogsCSV,
  fetchLoginLogs,
} from '../services/api';
import { flushOfflineQueue, getOfflineQueue } from '../services/offlineQueue';
import BotonPanicoModal from './BotonPanicoModal';

const ADMIN_ONLY_KEYS = new Set(['users', 'security', 'chatbot']);

const NAV_GROUPS = [
  {
    title: 'OPERACIÓN DE PORTERÍA',
    items: [
      { key: 'porteria', label: 'Tablero Operativo', icon: LayoutDashboard, path: '/admin' },
      { key: 'mapa', label: 'Plano / Mapa Maestro', icon: MapPin, path: '/admin/mapa' },
      { key: 'minuta', label: 'Minuta Digital', icon: FileText, path: '/admin/minuta' },
      { key: 'rondas', label: 'Rondas & Puntos QR', icon: QrCode, path: '/admin/rondas' },
    ]
  },
  {
    title: 'CONTROL DE FLUJO & ACCESOS',
    items: [
      { key: 'accesos', label: 'Accesos y Visitas', icon: UserCheck, path: '/admin/accesos' },
      { key: 'paquetes', label: 'Paquetería & PINs', icon: Package, path: '/admin/paquetes' },
      { key: 'parqueadero', label: 'Parqueaderos (4h)', icon: Car, path: '/admin/parqueadero' },
      { key: 'trasteos', label: 'Mudanzas / Trasteos', icon: Truck, path: '/admin/trasteos' },
      { key: 'reservas', label: 'Reserva Zonas Comunes', icon: Calendar, path: '/admin/reservas' },
    ]
  },
  {
    title: 'GESTIÓN & SEGURIDAD',
    items: [
      { key: 'asambleas', label: 'Asambleas & Votos', icon: Vote, path: '/admin/asambleas' },
      { key: 'pqrs', label: 'PQRS & Radicados', icon: MessageSquareQuote, path: '/admin/pqrs' },
      { key: 'equipos', label: 'Extintores & Equipos', icon: Flame, path: '/admin/equipos' },
      { key: 'mascotas', label: 'Censo de Mascotas', icon: Heart, path: '/admin/mascotas' },
      { key: 'unidades', label: 'Censo de Inmuebles', icon: Building2, path: '/admin/unidades' },
      { key: 'info', label: 'Guía & Zonas Comunes', icon: BookOpen, path: '/admin/info' },
      { key: 'chatbot', label: 'MinutaBot IA & Q&A', icon: Bot, path: '/admin/chatbot' },
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
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const queryClient = useQueryClient();

  const isGuardRole = rol === 'guarda' || rol === 'operator';
  const visibleNavGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !(isGuardRole && ADMIN_ONLY_KEYS.has(item.key))),
  })).filter((g) => g.items.length > 0);

  const triggerOfflineSync = useCallback(() => {
    flushOfflineQueue(API_BASE)
      .then(({ synced, dropped }) => {
        if (synced > 0) {
          toast.success(`${synced} registro(s) offline sincronizados con el servidor`);
        }
        if (dropped > 0) {
          toast.error(`${dropped} registro(s) offline fueron rechazados por validación del servidor`);
        }
      })
      .catch(() => {});
  }, []);

  // Reloj digital en vivo para portería
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitoreo de red y sincronización automática de cola offline en IndexedDB
  useEffect(() => {
    getOfflineQueue().then((items) => setOfflineCount(items.length)).catch(() => {});

    const handleOnline = () => {
      setIsOnline(true);
      triggerOfflineSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo Contingencia Offline activo: los registros de garita se guardarán localmente en IndexedDB');
    };
    const handleQueueUpdate = (e) => {
      if (typeof e.detail?.count === 'number') setOfflineCount(e.detail.count);
      if (typeof e.detail?.syncing === 'boolean') setSyncingOffline(e.detail.syncing);
    };
    const handleOfflineSynced = () => {
      queryClient.invalidateQueries({ queryKey: ['minuta'] });
      queryClient.invalidateQueries({ queryKey: ['accesos'] });
      queryClient.invalidateQueries({ queryKey: ['parqueaderos'] });
      queryClient.invalidateQueries({ queryKey: ['rondas'] });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('minuta:offline-queue', handleQueueUpdate);
    window.addEventListener('minuta:offline-synced', handleOfflineSynced);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('minuta:offline-queue', handleQueueUpdate);
      window.removeEventListener('minuta:offline-synced', handleOfflineSynced);
    };
  }, [queryClient, triggerOfflineSync]);

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
    if (path.includes('/admin/rondas')) return 'rondas';
    if (path.includes('/admin/reservas')) return 'reservas';
    if (path.includes('/admin/asambleas')) return 'asambleas';
    if (path.includes('/admin/pqrs')) return 'pqrs';
    if (path.includes('/admin/equipos')) return 'equipos';
    if (path.includes('/admin/mascotas')) return 'mascotas';
    if (path.includes('/admin/info')) return 'info';
    if (path.includes('/admin/chatbot')) return 'chatbot';
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
        rondas: '/admin/rondas',
        accesos: '/admin/accesos',
        paquetes: '/admin/paquetes',
        parqueadero: '/admin/parqueadero',
        trasteos: '/admin/trasteos',
        reservas: '/admin/reservas',
        asambleas: '/admin/asambleas',
        pqrs: '/admin/pqrs',
        equipos: '/admin/equipos',
        mascotas: '/admin/mascotas',
        unidades: '/admin/unidades',
        info: '/admin/info',
        chatbot: '/admin/chatbot',
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
        .then((data) => setLogs(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLogsLoading(false));
    }
  }, [logsOpen, logs.length]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 flex">
      {/* BACKDROP MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR IZQUIERDO CON ALTURA FIJA 100vh */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 h-screen shrink-0 flex flex-col bg-[#0b101b] border-r border-slate-800/90 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* HEADER DEL SIDEBAR */}
        <div className="px-4 py-3.5 border-b border-slate-800/90 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-sm tracking-tight text-white">
                    MINUTATECH
                  </h2>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    P.H.
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                  Consola Operativa
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expandir Menú' : 'Colapsar Menú'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* BOTÓN CERRAR DRAWER EN MÓVIL */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Cerrar Menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGACIÓN AGRUPADA CON SCROLL INTERNO INDEPENDIENTE */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {visibleNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed ? (
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 px-3 pb-1 block">
                  {group.title}
                </span>
              ) : (
                <div className="h-px bg-slate-800/80 my-2 mx-2" />
              )}

              {group.items.map((item) => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors border ${
                      isActive
                        ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25 font-semibold'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER DEL SIDEBAR SIEMPRE VISIBLE EN LA BASE */}
        <div className="p-3 border-t border-slate-800/90 shrink-0 space-y-2 bg-[#090d16]/80">
          {/* RELOJ EN VIVO OFICIAL */}
          {!collapsed ? (
            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg space-y-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Hora Oficial
                </span>
                <span className="text-slate-100 font-mono font-semibold tabular-nums">
                  {horaActual.toLocaleTimeString('es-CO', { hour12: false })}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium capitalize">
                {horaActual.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          ) : (
            <div className="text-center py-1 text-slate-300 font-mono text-[10px] font-semibold tabular-nums" title="Hora actual">
              {horaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          )}

          {/* PERFIL & AUDITORÍA */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              onClick={handleToggleLogs}
              className="flex-1 py-2 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Auditoría de Inicios de Sesión"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              {!collapsed && <span>Auditoría</span>}
            </button>

            <button
              onClick={onSalir}
              className="py-2 px-2.5 bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800/70 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              title="Cerrar Turno / Sesión"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              {!collapsed && <span>Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL: TOPBAR FIJO Y MAIN ESCROLEABLE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* TOPBAR FLOTANTE */}
        <header className="bg-[#0b101b]/95 backdrop-blur-md border-b border-slate-800/90 shrink-0 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white shrink-0"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs truncate">
              <span className="text-slate-500 font-medium hidden sm:inline">Operaciones</span>
              <span className="text-slate-700 hidden sm:inline">/</span>
              <span className="text-slate-100 font-semibold truncate">
                {activeView === 'porteria' ? 'Tablero Operativo' :
                 activeView === 'mapa' ? 'Plano / Mapa Maestro' :
                 activeView === 'minuta' ? 'Minuta Digital' :
                 activeView === 'rondas' ? 'Rondas & Puntos QR' :
                 activeView === 'accesos' ? 'Accesos y Visitas' :
                 activeView === 'paquetes' ? 'Paquetería' :
                 activeView === 'parqueadero' ? 'Parqueaderos' :
                 activeView === 'trasteos' ? 'Mudanzas' :
                 activeView === 'reservas' ? 'Reserva de Zonas' :
                 activeView === 'asambleas' ? 'Asambleas & Votaciones' :
                 activeView === 'pqrs' ? 'PQRS & Radicados' :
                 activeView === 'equipos' ? 'Extintores & Equipos' :
                 activeView === 'mascotas' ? 'Censo de Mascotas' :
                 activeView === 'unidades' ? 'Censo Inmuebles' :
                 activeView === 'info' ? 'Guía & Zonas Comunes' :
                 activeView === 'chatbot' ? 'MinutaBot IA' :
                 activeView === 'users' ? 'Personal' : 'Ciberseguridad'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/residente')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Portal Residentes</span>
            </button>

            <button
              onClick={() => setShowPanicModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-800/80 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="hidden sm:inline">SOS Emergencia</span>
              <span className="sm:hidden">SOS</span>
            </button>

            {!isOnline || offlineCount > 0 ? (
              <button
                type="button"
                onClick={triggerOfflineSync}
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-950/60 border border-amber-700/60 px-2.5 py-1.5 rounded-lg cursor-pointer"
                title="Sincronizar cola offline de IndexedDB"
              >
                {syncingOffline ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {!isOnline ? 'Contingencia Offline' : 'Sincronizar'}
                  {offlineCount > 0 ? ` (${offlineCount})` : ''}
                </span>
              </button>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>En línea</span>
              </span>
            )}
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet context={{ rol, onSalir, handleNavigate }} />
          </div>
        </main>
      </div>

      {/* MODAL SOS DE PÁNICO Y EMERGENCIA */}
      <BotonPanicoModal
        isOpen={showPanicModal}
        onClose={() => setShowPanicModal(false)}
      />
    </div>
  );
}