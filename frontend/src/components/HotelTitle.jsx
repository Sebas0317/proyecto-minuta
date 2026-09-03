import { memo } from 'react';
import { Shield } from 'lucide-react';

/**
 * HotelTitle / AppTitle — Centralized application brand component.
 */
const HotelTitle = memo(function HotelTitle({ variant = 'topbar', onClick }) {
  if (variant === 'login') {
    return (
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className="w-8 h-8 text-emerald-400" />
        <h1 className="text-2xl font-black text-white tracking-wider">PROYECTO MINUTA</h1>
      </div>
    );
  }
  if (variant === 'inline') {
    return <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Shield className="w-5 h-5" /> Proyecto Minuta</h2>;
  }
  if (onClick) {
    return (
      <span
        className="topbar-title cursor-pointer hover:text-emerald-400 flex items-center gap-2 font-bold"
        onClick={onClick}
      >
        <Shield className="w-4 h-4 text-emerald-400" /> Proyecto Minuta
      </span>
    );
  }
  return <span className="topbar-title font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Proyecto Minuta</span>;
});

export default HotelTitle;