import { Navigate } from 'react-router-dom';

const ROLES = {
  admin: (rol) => rol && rol !== 'user' && rol !== 'cliente' && rol !== 'residente',
  user: (rol) => rol === 'user' || rol === 'cliente' || rol === 'residente',
  any: (rol) => !!rol,
  guest: (rol) => !rol,
};

export default function ProtectedRoute({ rol, allowed, children }) {
  if (allowed === 'guest' && rol) {
    const target = (rol === 'user' || rol === 'cliente' || rol === 'residente') ? '/residente' : '/admin';
    return <Navigate to={target} replace />;
  }
  const check = ROLES[allowed] || ROLES.any;
  if (check(rol)) return children;
  return <Navigate to="/" replace />;
}
