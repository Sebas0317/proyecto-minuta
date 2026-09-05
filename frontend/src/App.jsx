import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import { useSession } from './hooks/useSession';
import {
  logout as apiLogout,
  clearRoomToken,
  getUserInfo,
} from './services/api';
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

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 md:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🛡️
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Recuperación del Sistema</h2>
              <p className="text-slate-400 text-xs mt-1">
                Ocurrió un contratiempo temporal en la vista. Los registros de minuta y base de datos permanecen seguros.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs font-mono text-red-400/90 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                🔄 Reintentar Carga
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                🧹 Limpiar Caché y Reiniciar
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '16px',
        color: '#94a3b8',
        background: '#0f172a',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
        <p className="font-semibold text-slate-300">Cargando Proyecto Minuta...</p>
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
    const guestRoutes = ['/', '/login/admin', '/login/forgot', '/forgot'];
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

  const { isWarning, reset: resetSession } = useSession({
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
              path="/login/admin"
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
              <Route path="chatbot" element={<ChatbotAdminView />} />
              <Route path="users" element={<PantallaUsuarios userRole={rol} />} />
              <Route path="security" element={<SecurityView />} />
            </Route>

            {/* Portal de Residentes (Propietarios & Arrendatarios) */}
            <Route
              path="/residente"
              element={<PortalResidenteView />}
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