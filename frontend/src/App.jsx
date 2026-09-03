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

// Vistas secundarias
const UserView = lazy(() => import('./components/UserView'));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
          <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Ocurrió un error inesperado. Los datos del sistema permanecen seguros.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Recargar Sistema
          </button>
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
    navigate('/admin', { replace: true });
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
              <Route path="info" element={<InfoCondominioView />} />
              <Route path="users" element={<PantallaUsuarios userRole={rol} />} />
              <Route path="security" element={<SecurityView />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<SafeNavigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}