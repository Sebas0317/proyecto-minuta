import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import { useSession } from './hooks/useSession';
import {
  logout as apiLogout,
  clearRoomToken,
  getAuthProfile,
  getUserInfo,
  setUserInfo,
} from './services/api';
import { clearOfflineQueue } from './services/offlineQueue';
import './App.css';

// Autenticación
const LoginScreen = lazy(() => import('./components/LoginScreen'));

// Layout y Vistas del Sistema de Portería y Minuta
const AdminShell = lazy(() => import('./components/AdminShell'));
const PorteriaDashboard = lazy(() => import('./components/PorteriaDashboard'));
const CondominioMapView = lazy(() => import('./components/CondominioMapView'));
const MinutaView = lazy(() => import('./components/MinutaView'));
const PaqueteriaView = lazy(() => import('./components/PaqueteriaView'));
const AccesosView = lazy(() => import('./components/AccesosView'));
const ParqueaderoView = lazy(() => import('./components/ParqueaderoView'));
const TrasteosView = lazy(() => import('./components/TrasteosView'));
const UnidadesView = lazy(() => import('./components/UnidadesView'));
const PantallaUsuarios = lazy(() => import('./components/PantallaUsuarios'));
const SecurityView = lazy(() => import('./components/SecurityView'));
const InfoCondominioView = lazy(() => import('./components/InfoCondominioView'));
const ChatbotAdminView = lazy(() => import('./components/ChatbotAdminView'));
const RondasView = lazy(() => import('./components/RondasView'));
const ReservasZonasView = lazy(() => import('./components/ReservasZonasView'));
const AsambleasView = lazy(() => import('./components/AsambleasView'));
const EquiposEmergenciaView = lazy(() => import('./components/EquiposEmergenciaView'));
const MascotasView = lazy(() => import('./components/MascotasView'));
const PqrsAdminView = lazy(() => import('./components/PqrsAdminView'));
const PortalResidenteView = lazy(() => import('./components/PortalResidenteView'));
import MinutaBotWidget from './components/MinutaBotWidget';


class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
    // Si es un error de carga de chunk nuevo tras un deploy de Vercel, forzar recarga limpia
    if (error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed')) {
      const reloaded = sessionStorage.getItem('chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    sessionStorage.removeItem('chunk_reload');
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleHardReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await clearOfflineQueue();
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Storage may be unavailable in restricted contexts
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-xl p-6 md:p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Recuperación del Sistema</h2>
              <p className="text-slate-400 text-xs mt-1">
                Ocurrió un contratiempo temporal en la vista. Los registros de minuta y base de datos permanecen íntegros.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left text-xs font-mono text-red-400/90 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar Carga</span>
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Caché y Reiniciar</span>
              </button>
            </div>

            <details className="text-left pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
              <summary className="cursor-pointer hover:text-slate-400">Ver detalles técnicos</summary>
              <pre className="mt-2 p-2 bg-slate-950 rounded-lg overflow-x-auto text-[10px] text-slate-400">
                {this.state.error?.stack || 'Sin stack trace'}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SafeNavigate({ to, replace = true }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium tracking-wide text-slate-400">Inicializando consola operativa...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [rol, setRol] = useState(() => {
    const userInfo = getUserInfo();
    return userInfo ? userInfo.role : null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleRol = useCallback((r) => {
    setRol(r);
  }, []);

  useEffect(() => {
    if (!rol) return;
    const guestRoutes = ['/', '/login', '/login/admin', '/login/forgot', '/forgot'];
    if (!guestRoutes.includes(location.pathname)) return;
    if (rol === 'user' || rol === 'cliente' || rol === 'residente') {
      navigate('/residente', { replace: true });
    } else {
      navigate('/admin', { replace: true });
    }
  }, [rol, location.pathname, navigate]);

  const [showSessionModal, setShowSessionModal] = useState(false);

  const handleExit = useCallback(async () => {
    setRol(null);
    await apiLogout();
    clearRoomToken();
    setShowSessionModal(false);
    navigate('/', { replace: true });
  }, [navigate]);

  // Verify stored staff session cookie on boot and react immediately to 401 on protected actions
  useEffect(() => {
    const onUnauthorized = () => {
      const current = getUserInfo();
      if (!current) return;
      setUserInfo(null);
      setRol(null);
      setShowSessionModal(false);
      toast.error('Tu sesión expiró. Inicia sesión nuevamente para guardar cambios.');
      navigate('/login/admin', { replace: true });
    };

    window.addEventListener('minuta:unauthorized', onUnauthorized);
    return () => window.removeEventListener('minuta:unauthorized', onUnauthorized);
  }, [navigate]);

  useEffect(() => {
    if (!rol || rol === 'user' || rol === 'cliente' || rol === 'residente') return;
    let cancelled = false;
    getAuthProfile()
      .then((profile) => {
        if (!cancelled && profile?.role) {
          setUserInfo(profile);
          setRol(profile.role);
        }
      })
      .catch((err) => {
        if (!cancelled && err?.status === 401) {
          setUserInfo(null);
          setRol(null);
          toast.error('Tu sesión expiró. Por favor inicia sesión nuevamente.');
          navigate('/login/admin', { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rol, navigate]);

  const { reset: resetSession } = useSession({
    timeout: 30 * 60 * 1000, // 30 min para puesto de vigilancia
    onExpire: () => setShowSessionModal(true),
    enabled: !!rol,
  });

  return (
    <ErrorBoundary>
      <div className="bg-slate-950 min-h-screen text-slate-100">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid #334155',
              padding: '12px 16px',
            },
          }}
        />

        {showSessionModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                color: '#fff',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold' }}>
                Sesión por Inactividad
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#94a3b8' }}>
                La sesión de guardia ha expirado por inactividad.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleExit}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    background: '#334155',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Salir
                </button>
                <button
                  onClick={() => {
                    setShowSessionModal(false);
                    resetSession();
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Continuar Turno
                </button>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Rutas Públicas / Login */}
            <Route
              path="/"
              element={
                <ProtectedRoute rol={rol} allowed="guest">
                  <LoginScreen onRole={handleRol} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <ProtectedRoute rol={rol} allowed="guest">
                  <LoginScreen onRole={handleRol} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login/admin"
              element={
                <ProtectedRoute rol={rol} allowed="guest">
                  <LoginScreen onRole={handleRol} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forgot"
              element={
                <ProtectedRoute rol={rol} allowed="guest">
                  <LoginScreen onRole={handleRol} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login/forgot"
              element={
                <ProtectedRoute rol={rol} allowed="guest">
                  <LoginScreen onRole={handleRol} />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Administración y Portería */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute rol={rol} allowed="admin">
                  <AdminShell rol={rol} onSalir={handleExit} />
                </ProtectedRoute>
              }
            >
              <Route index element={<PorteriaDashboard />} />
              <Route path="porteria" element={<PorteriaDashboard />} />
              <Route path="mapa" element={<CondominioMapView />} />
              <Route path="minuta" element={<MinutaView />} />
              <Route path="paquetes" element={<PaqueteriaView />} />
              <Route path="accesos" element={<AccesosView />} />
              <Route path="parqueadero" element={<ParqueaderoView />} />
              <Route path="trasteos" element={<TrasteosView />} />
              <Route path="unidades" element={<UnidadesView />} />
              <Route path="rondas" element={<RondasView />} />
              <Route path="reservas" element={<ReservasZonasView />} />
              <Route path="asambleas" element={<AsambleasView />} />
              <Route path="equipos" element={<EquiposEmergenciaView />} />
              <Route path="mascotas" element={<MascotasView />} />
              <Route path="pqrs" element={<PqrsAdminView />} />
              <Route path="info" element={<InfoCondominioView />} />
              <Route
                path="chatbot"
                element={
                  rol === 'guarda' || rol === 'operator' ? (
                    <SafeNavigate to="/admin" replace />
                  ) : (
                    <ChatbotAdminView />
                  )
                }
              />
              <Route
                path="users"
                element={
                  rol === 'guarda' || rol === 'operator' ? (
                    <SafeNavigate to="/admin" replace />
                  ) : (
                    <PantallaUsuarios userRole={rol} />
                  )
                }
              />
              <Route
                path="security"
                element={
                  rol === 'guarda' || rol === 'operator' ? (
                    <SafeNavigate to="/admin" replace />
                  ) : (
                    <SecurityView />
                  )
                }
              />
            </Route>

            {/* Portal de Residentes (Propietarios & Arrendatarios) */}
            <Route
              path="/residente"
              element={<PortalResidenteView onSalir={handleExit} />}
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<SafeNavigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* ASISTENTE VIRTUAL FLOTANTE MINUTABOT */}
        <MinutaBotWidget />
      </div>
    </ErrorBoundary>
  );
}