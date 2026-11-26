import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Loader,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  loginAdmin,
  registerUser,
  normalizeErrorMessage as safeErrorMessage,
  setUserInfo,
} from '../services/api';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import BrandTitle from './BrandTitle';

// ── Architectural Background ──

function ArchitecturalBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#090d16]">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.04) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,rgba(16,185,129,0.11),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090d16] to-transparent" />
    </div>
  );
}

// ── Enterprise Panel ──

function SurfaceCard({ children, className = '' }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-md shadow-2xl shadow-black/60 ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />
      {children}
    </Motion.div>
  );
}

// ── Form Input ──

function FormInput({
  icon: Icon,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  placeholder,
  label,
  rightElement,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              focused ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full bg-slate-950/90 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-10 py-2.5 ${
            focused
              ? 'border-emerald-500 ring-1 ring-emerald-500/25'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        />
        {rightElement}
      </div>
    </div>
  );
}

// ── Primary Button ──

function PrimaryButton({ onClick, disabled, loading, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
        disabled
          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
      }`}
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

// ── Subtle Text Link ──

function TextLink({ onClick, icon: Icon, children, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
        accent
          ? 'text-emerald-400 hover:text-emerald-300'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </button>
  );
}

// ── Error Banner ──

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 text-xs text-red-200 bg-red-950/60 border border-red-800/70 rounded-lg p-3 mt-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  );
}

// ── Access Module Selector ──

function RoleCards({ onSelectAdmin, onSelectUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <ArchitecturalBackground />

      <div className="max-w-[500px] w-full">
        <SurfaceCard className="p-6 sm:p-8">
          <BrandTitle />

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Seleccione módulo de acceso
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onSelectAdmin}
              className="group w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-900"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      Administración y Puesto de Portería
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Consola para guardas y administradores: minuta digital, control de ingresos, correspondencia con PIN, parqueaderos, rondas QR y auditoría.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={onSelectUser}
              className="group w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left transition-all hover:border-slate-600 hover:bg-slate-900"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-semibold text-white group-hover:text-slate-100 transition-colors">
                      Portal de Residentes y Propietarios
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Autogestión por unidad residencial: estado de cuenta, paz y salvo PDF, pases QR de visitantes, casillero, reservas de zonas, PQRS y asambleas.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cumplimiento Ley 675 de 2001</span>
            <span className="font-mono text-slate-400">Operación 24/7 • PWA Offline</span>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function AdminLogin({ onBack, onRole }) {
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim()) return setError('Ingresa tu usuario o correo');
    if (!password.trim()) return setError('Ingresa tu contraseña');
    setLoading(true);
    setError('');
    try {
      const result = await loginAdmin(identifier, password);
      if (result.usuario) {
        setUserInfo(result.usuario);
        onRole(result.usuario.role || 'admin');
      } else {
        onRole('admin');
      }
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) return setError('Ingresa un nombre de usuario');
    if (!email.trim()) return setError('Ingresa tu correo');
    if (!password.trim()) return setError('Ingresa una contraseña');
    if (password.length < 8)
      return setError('La contraseña debe tener al menos 8 caracteres');
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    )
      return setError(
        'La contraseña debe incluir mayúscula, minúscula, número y carácter especial'
      );
    if (password !== confirmPassword)
      return setError('Las contraseñas no coinciden');

    setLoading(true);
    setError('');
    try {
      await registerUser({ username, email, password, firstName, lastName });
      setRegistered(true);
      setRegisteredEmail(email);
    } catch (e) {
      setError(safeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ArchitecturalBackground />
        <div className="max-w-[440px] w-full">
          <SurfaceCard className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Cuenta registrada
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Se ha enviado un código de verificación a{' '}
              <strong className="text-slate-200">{registeredEmail}</strong>.
              Revisa tu bandeja de entrada para activar el acceso.
            </p>
            <PrimaryButton
              onClick={() => {
                setRegistered(false);
                setIdentifier(email);
                setMode('login');
              }}
            >
              Ir a iniciar sesión
            </PrimaryButton>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ArchitecturalBackground />
      <div className="max-w-[420px] w-full">
        <SurfaceCard className="p-6 sm:p-8">
          <BrandTitle subtitle={null} />

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <Motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-5 text-center">
                  Autenticación de Personal
                </p>

                <div className="space-y-3.5">
                  <FormInput
                    icon={Mail}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="admin@minuta.com"
                    label="Usuario o correo corporativo"
                  />
                  <FormInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    label="Contraseña"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>

                {error && <ErrorBanner message={error} />}

                <div className="mt-5">
                  <PrimaryButton
                    onClick={handleLogin}
                    disabled={loading}
                    loading={loading}
                    icon={LogIn}
                  >
                    {loading ? 'Verificando credenciales...' : 'Iniciar sesión'}
                  </PrimaryButton>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-1">
                  <TextLink
                    onClick={() => navigate('/forgot', { replace: true })}
                  >
                    Recuperar contraseña
                  </TextLink>
                  <TextLink onClick={switchMode} icon={UserPlus} accent>
                    Registrar operador
                  </TextLink>
                </div>
              </Motion.div>
            ) : (
              <Motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-5 text-center">
                  Registro de Operador
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      label="Nombre"
                    />
                    <FormInput
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Pérez"
                      label="Apellido"
                    />
                  </div>
                  <FormInput
                    icon={Mail}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    placeholder="juanperez"
                    label="Nombre de usuario"
                  />
                  <FormInput
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="juan@ejemplo.com"
                    label="Correo electrónico"
                  />
                  <FormInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Mín. 8 caracteres"
                    label="Contraseña"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                  <FormInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Repite la contraseña"
                    label="Confirmar contraseña"
                  />
                </div>

                {error && <ErrorBanner message={error} />}

                <div className="mt-5">
                  <PrimaryButton
                    onClick={handleRegister}
                    disabled={loading}
                    loading={loading}
                    icon={UserPlus}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </PrimaryButton>
                </div>

                <div className="mt-4 text-center">
                  <TextLink onClick={switchMode} icon={ArrowLeft}>
                    Ya tengo cuenta registrada
                  </TextLink>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a selección de módulo
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

// ── Forgot Password Route ──
function ForgotRoute() {
  const navigate = useNavigate();
  return (
    <ForgotPasswordScreen
      onBack={() => navigate('/login/admin', { replace: true })}
    />
  );
}

// ── Main Login Router ──
export default function LoginScreen({ onRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  if (path === '/login/admin' || path.startsWith('/login/admin/')) {
    return (
      <AdminLogin
        onRole={onRole}
        onBack={() => navigate('/login', { replace: true })}
      />
    );
  }

  if (path === '/login/forgot' || path === '/forgot') {
    return <ForgotRoute />;
  }

  return (
    <RoleCards
      onSelectAdmin={() => navigate('/login/admin', { replace: true })}
      onSelectUser={() => onRole('user')}
    />
  );
}
