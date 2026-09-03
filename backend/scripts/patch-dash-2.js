const fs = require('fs');

const path = 'c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components/PorteriaDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update stats logic
content = content.replace(
  `  const stats = useMemo(() => {
    const enConjunto = (accesos || []).filter(a => a.estado === 'en_conjunto');
    const paquetesPendientes = (paquetes || []).filter(p => p.estado !== 'entregado');
    const cuposLibres = (parqueaderos || []).filter(p => p.estado === 'disponible').length;
    const novedadesHoy = (minuta || []).filter(m => m.fecha && m.fecha.startsWith(new Date().toISOString().slice(0, 10))).length;

    return {
      visitantesActivos: enConjunto.length,
      paquetesPendientes: paquetesPendientes.length,
      cuposLibres,
      novedadesHoy
    };
  }, [accesos, paquetes, parqueaderos, minuta]);`,
  `  const calcularDiasCasillero = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const diffMs = Date.now() - new Date(fechaIngreso).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const encomiendasPendientes = useMemo(() => {
    return (paquetes || []).filter(p => p.categoria !== 'recibo_publico' && p.estado !== 'entregado');
  }, [paquetes]);

  const recibosPendientes = useMemo(() => {
    return (paquetes || []).filter(p => p.categoria === 'recibo_publico' && p.estado !== 'entregado');
  }, [paquetes]);

  const stats = useMemo(() => {
    const enConjunto = (accesos || []).filter(a => a.estado === 'en_conjunto');
    const cuposLibres = (parqueaderos || []).filter(p => p.estado === 'disponible').length;
    const novedadesHoy = (minuta || []).filter(m => m.fecha && m.fecha.startsWith(new Date().toISOString().slice(0, 10))).length;
    const recibosCriticos = recibosPendientes.filter(r => calcularDiasCasillero(r.fechaIngreso) > 30).length;

    return {
      visitantesActivos: enConjunto.length,
      paquetesPendientes: encomiendasPendientes.length,
      recibosPendientes: recibosPendientes.length,
      recibosCriticos,
      cuposLibres,
      novedadesHoy
    };
  }, [accesos, encomiendasPendientes, recibosPendientes, parqueaderos, minuta]);`
);

// Update Quick Action button in header
content = content.replace(
  `<button
            onClick={() => setShowPaqueteModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <Package className="w-5 h-5" />
            <span>Llegó Paquete</span>
          </button>`,
  `<button
            onClick={() => setShowPaqueteModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <Package className="w-4 h-4" />
            <span>+ Llegó Paquete</span>
          </button>
          <button
            onClick={() => setShowReciboModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Factura / Recibo Público</span>
          </button>`
);

// Update Metric Cards
content = content.replace(
  `      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Visitas Activas</p>
            <h3 className="text-2xl font-bold text-white">{stats.visitantesActivos}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Paquetes por Retirar</p>
            <h3 className="text-2xl font-bold text-white">{stats.paquetesPendientes}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cupos Parqueadero</p>
            <h3 className="text-2xl font-bold text-white">{stats.cuposLibres} <span className="text-xs text-slate-400 font-normal">libres</span></h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Novedades Hoy</p>
            <h3 className="text-2xl font-bold text-white">{stats.novedadesHoy}</h3>
          </div>
        </div>
      </div>`,
  `      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Visitas Activas</p>
            <h3 className="text-xl font-black text-white">{stats.visitantesActivos}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Paquetería</p>
            <h3 className="text-xl font-black text-white">{stats.paquetesPendientes} <span className="text-[10px] text-slate-400 font-normal">encomiendas</span></h3>
          </div>
        </div>

        <div className={\`p-3.5 rounded-2xl flex items-center gap-3 border \${
          stats.recibosCriticos > 0
            ? 'bg-amber-950/40 border-amber-800/80'
            : 'bg-slate-800/60 border-slate-700/80'
        }\`}>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Recibos Casillero</p>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-black text-white">{stats.recibosPendientes}</h3>
              {stats.recibosCriticos > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-bold animate-pulse">
                  {stats.recibosCriticos} &gt;30d
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Parqueaderos</p>
            <h3 className="text-xl font-black text-white">{stats.cuposLibres} <span className="text-[10px] text-slate-400 font-normal">libres</span></h3>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Novedades Hoy</p>
            <h3 className="text-xl font-black text-white">{stats.novedadesHoy}</h3>
          </div>
        </div>
      </div>`
);

fs.writeFileSync(path, content);
console.log('✓ Part 2 updated in PorteriaDashboard.jsx');