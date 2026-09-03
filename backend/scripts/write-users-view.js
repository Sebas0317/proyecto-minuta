const fs = require('fs');

const code = `import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Key,
  Loader,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Clock,
  Briefcase,
  Phone,
  Calendar,
  Edit3
} from 'lucide-react';
import { useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  createUser,
  deleteUser,
  fetchUserStats,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from '../services/api';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrador',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-800/80',
  },
  supervisor: {
    label: 'Supervisor de Seguridad',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-800/80',
  },
  guarda: {
    label: 'Guarda de Seguridad',
    color: 'text-blue-400',
    bg: 'bg-blue-950/60',
    border: 'border-blue-800/80',
  },
  owner: {
    label: 'Propietario / Consejo',
    color: 'text-purple-400',
    bg: 'bg-purple-950/60',
    border: 'border-purple-800/80',
  },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.guarda;
  return (
    <span
      className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border \${cfg.bg} \${cfg.color} \${cfg.border}\`}
    >
      {cfg.label}
    </span>
  );
}

function UserFormModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [role, setRole] = useState('guarda');
  const [turno, setTurno] = useState('Turno Mañana (06:00 - 14:00)');
  const [puesto, setPuesto] = useState('Portería Principal Peatonal');
  const [diasLaborales, setDiasLaborales] = useState('Lunes a Domingo (Descanso Miércoles)');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      return setError('Completa los campos requeridos');
    }
    if (password.length < 4)
      return setError('La contraseña debe tener al menos 4 caracteres');
    setLoading(true);
    setError('');
    try {
      await createUser({
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        firstName,
        lastName,
        documento,
        telefono,
        role,
        turno,
        puesto,
        diasLaborales,
      });
      sonnerToast.success('Guarda / Usuario registrado exitosamente');
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" /> Registrar Nuevo Personal / Guarda
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos Eduardo"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Méndez"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Cédula / Documento</label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="1014258963"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Teléfono Móvil</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3201144778"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Usuario de Acceso *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="guarda.carlos"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@seguridad.com"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Contraseña Inicial *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 4 caracteres"
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Rol en el Conjunto</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              >
                <option value="guarda">Guarda de Seguridad</option>
                <option value="supervisor">Supervisor de Seguridad</option>
                <option value="admin">Administrador General</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Turno Asignado</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              >
                <option value="Turno Mañana (06:00 - 14:00)">Turno Mañana (06:00 - 14:00)</option>
                <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                <option value="Administración (08:00 - 17:00)">Administración (08:00 - 17:00)</option>
                <option value="Turno Rotativo / Control">Turno Rotativo / Control</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Puesto de Vigilancia</label>
              <input
                type="text"
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                placeholder="Portería Principal Peatonal"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Días Laborales y Descanso</label>
              <input
                type="text"
                value={diasLaborales}
                onChange={(e) => setDiasLaborales(e.target.value)}
                placeholder="Lunes a Domingo (Descanso Miércoles)"
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition-all"
            >
              {loading ? 'Guardando...' : 'Crear Cuenta de Guarda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [documento, setDocumento] = useState(user?.documento || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [role, setRole] = useState(user?.role || 'guarda');
  const [turno, setTurno] = useState(user?.turno || 'Turno Mañana (06:00 - 14:00)');
  const [puesto, setPuesto] = useState(user?.puesto || 'Portería Principal');
  const [diasLaborales, setDiasLaborales] = useState(user?.diasLaborales || '');
  const [isActive, setIsActive] = useState(user?.isActive !== false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateUser(user.id, {
        firstName,
        lastName,
        documento,
        telefono,
        role,
        turno,
        puesto,
        diasLaborales,
        isActive,
      });
      sonnerToast.success('Ficha de personal actualizada');
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-400" /> Editar Datos y Turno de {user.firstName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Cédula</label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              >
                <option value="guarda">Guarda de Seguridad</option>
                <option value="supervisor">Supervisor de Seguridad</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Turno de Trabajo</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              >
                <option value="Turno Mañana (06:00 - 14:00)">Turno Mañana (06:00 - 14:00)</option>
                <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                <option value="Administración (08:00 - 17:00)">Administración (08:00 - 17:00)</option>
                <option value="Turno Rotativo / Control">Turno Rotativo / Control</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Puesto de Vigilancia</label>
              <input
                type="text"
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Días Laborales y Descanso</label>
              <input
                type="text"
                value={diasLaborales}
                onChange={(e) => setDiasLaborales(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-white font-bold">Personal Activo en Planta</span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PantallaUsuarios() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      fetchUsers({ search, role: roleFilter || undefined }),
    staleTime: 10000,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: fetchUserStats,
    staleTime: 30000,
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    sonnerToast.info('Roster de vigilancia actualizado');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Personal & Turnos de Vigilancia <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Roster Oficial</span>
            </h1>
            <p className="text-slate-400 text-sm">Horarios de turnos (Mañana, Tarde, Noche), puestos de seguridad y personal asignado</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Guarda / Personal</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
            title="Recargar roster"
          >
            <RefreshCw className={\`w-5 h-5 \${isLoading ? 'animate-spin text-emerald-400' : ''}\`} />
          </button>
        </div>
      </div>

      {/* STATS RÁPIDOS DE TURNOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Personal</span>
          <p className="text-2xl font-black text-white">{users.length}</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">Turno Mañana (06:00-14:00)</span>
          <p className="text-2xl font-black text-emerald-400">
            {users.filter(u => u.turno?.includes('Mañana')).length}
          </p>
        </div>
        <div className="bg-blue-950/40 border border-blue-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-blue-400 uppercase">Turno Tarde (14:00-22:00)</span>
          <p className="text-2xl font-black text-blue-400">
            {users.filter(u => u.turno?.includes('Tarde')).length}
          </p>
        </div>
        <div className="bg-purple-950/40 border border-purple-800/50 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-purple-400 uppercase">Turno Noche (22:00-06:00)</span>
          <p className="text-2xl font-black text-purple-400">
            {users.filter(u => u.turno?.includes('Noche')).length}
          </p>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario, cédula o turno..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
        >
          <option value="">Todos los Roles</option>
          <option value="guarda">Guardas de Seguridad</option>
          <option value="supervisor">Supervisores</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      {/* GRID DE GUARDAS Y PERSONAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          return (
            <div
              key={u.id}
              className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-500 transition-all"
            >
              <div>
                <div className="flex items-start justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
                      {u.firstName?.[0] || 'G'}{u.lastName?.[0] || 'S'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{u.firstName} {u.lastName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>

                <div className="space-y-2 pt-3 text-xs">
                  {/* TURNO */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> Turno:
                      </span>
                      <span className="text-emerald-300 font-bold">{u.turno || 'Horario flexible'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" /> Puesto:
                      </span>
                      <span className="text-slate-300 font-medium">{u.puesto || 'Portería'}</span>
                    </div>
                  </div>

                  {/* DÍAS Y CONTACTO */}
                  <div className="space-y-1 text-[11px] text-slate-300 pt-1">
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {u.diasLaborales || 'Lunes a Domingo'}
                    </p>
                    {u.telefono && (
                      <p className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <Phone className="w-3.5 h-3.5" /> {u.telefono}
                      </p>
                    )}
                    <p className="text-slate-500">Doc: {u.documento || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Activo en Sistema
                </span>

                <button
                  onClick={() => setEditUser(u)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Turno
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      {editUser && (
        <EditUserModal
          isOpen={Boolean(editUser)}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components/PantallaUsuarios.jsx', code);
console.log('✓ PantallaUsuarios.jsx updated with security guards roster and shifts');