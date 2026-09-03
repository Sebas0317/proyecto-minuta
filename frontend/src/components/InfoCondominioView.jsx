import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  Dumbbell,
  Sparkles,
  Trash2,
  Volume2,
  Car,
  CreditCard,
  PhoneCall,
  Shield,
  Clock,
  AlertCircle,
  Building,
  CheckCircle,
  FileText,
  Search,
  ExternalLink,
  Calendar,
  Truck,
  Phone,
  Info
} from 'lucide-react';

const CATEGORIES = [
  { id: 'recreacion', label: 'Zonas Recreativas', icon: Waves },
  { id: 'aseo', label: 'Aseo & Mantenimiento', icon: Sparkles },
  { id: 'basuras', label: 'Basuras & Shuts', icon: Trash2 },
  { id: 'convivencia', label: 'Manual de Convivencia', icon: Volume2 },
  { id: 'parqueaderos', label: 'Parqueaderos & Bodegas', icon: Car },
  { id: 'pagos', label: 'Pagos & Administración', icon: CreditCard },
  { id: 'emergencias', label: 'Directorio de Emergencias', icon: PhoneCall },
];

export default function InfoCondominioView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recreacion');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Guía & Manual del Condominio <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">Portal del Propietario</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Horarios oficiales de zonas comunes, rutas de aseo, basuras, manual de convivencia y directorio de servicios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-900 text-emerald-400 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-mono font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Normativa Vigente 2026
          </span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA EN TIEMPO REAL */}
      <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por piscina, gimnasio, basura, mudanza, cuenta de pago o teléfono de emergencia..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-white bg-slate-700 px-3 py-1.5 rounded-lg"
          >
            Limpiar Filtro
          </button>
        )}
      </div>

      {/* TABS DE CATEGORÍAS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/80 pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. ZONAS RECREATIVAS */}
      {activeTab === 'recreacion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Waves className="w-5 h-5 text-cyan-400" /> Piscina Climatizada
              </h3>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                Adultos y Niños
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario:</strong> Martes a Domingo (06:00 AM - 09:00 PM)</p>
              <p className="text-amber-400 font-semibold"><strong className="text-slate-400">Mantenimiento:</strong> Cerrada los Lunes (química y aspirado)</p>
              <p><strong className="text-slate-400">Requisitos:</strong> Ducha obligatoria, gorro de baño y traje en lycra.</p>
              <p><strong className="text-slate-400">Menores:</strong> Niños menores de 12 años siempre acompañados de adulto.</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" /> Gimnasio Equipado
              </h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Cardio & Fuerza
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario:</strong> Lunes a Domingo (05:00 AM - 10:00 PM)</p>
              <p><strong className="text-slate-400">Aforo Máximo:</strong> 20 personas simultáneas.</p>
              <p><strong className="text-slate-400">Norma Obligatoria:</strong> Toalla personal y desinfección de mancuernas tras su uso.</p>
              <p><strong className="text-slate-400">Acceso:</strong> Huella o tarjeta magnética en puerta principal.</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" /> Cancha Sintética Fútbol 5
                </h3>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Grama Sintética
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><strong className="text-slate-400">Horario:</strong> Lunes a Domingo (08:00 AM - 10:00 PM)</p>
                <p><strong className="text-slate-400">Reserva:</strong> Turnos de 1h 30m en el sistema de reservas.</p>
                <p><strong className="text-slate-400">Calzado:</strong> Solo tenis de fútbol sintético (no taches de aluminio).</p>
                <p className="text-emerald-400 font-semibold">Gratuito para residentes al día en administración.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/reservas')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Calendar className="w-3.5 h-3.5" /> Apartar Turno en Cancha
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" /> Salón Social de Eventos
                </h3>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Aforo 120 Personas
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><strong className="text-slate-400">Capacidad:</strong> 120 personas sentadas con mesas y cocina auxiliar.</p>
                <p><strong className="text-slate-400">Límite de Sonido:</strong> 02:00 AM (música a volumen moderado).</p>
                <p><strong className="text-slate-400">Depósito Reembolsable:</strong> $200.000 COP para garantía de aseo y daños.</p>
                <p><strong className="text-slate-400">Reserva:</strong> Mínimo 8 días de anticipación con administración.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/reservas')}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Calendar className="w-3.5 h-3.5" /> Reservar Salón Social
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Zona BBQ & Kiosco
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                  Asadores a Carbón
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><strong className="text-slate-400">Horario:</strong> 11:00 AM - 09:00 PM</p>
                <p><strong className="text-slate-400">Bloques:</strong> Máximo 4 horas continuas de uso.</p>
                <p><strong className="text-slate-400">Compromiso:</strong> Entregar parrillas limpias y carbón apagado con agua.</p>
                <p><strong className="text-slate-400">Reserva:</strong> Con 24 horas de antelación en portería.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/reservas')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Calendar className="w-3.5 h-3.5" /> Reservar Zona BBQ
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> Parque Infantil & Zona Mascotas
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Área Familiar
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><strong className="text-slate-400">Parque Infantil:</strong> 08:00 AM - 07:30 PM (menores de 10 años).</p>
                <p><strong className="text-slate-400">Pipican / Canino:</strong> 24 Horas con iluminación nocturna.</p>
                <p><strong className="text-slate-400">Regla Mascotas:</strong> Uso de correa obligatorio y recolección de heces.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/mascotas')}
              className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
            >
              🐶 Ver Censo de Mascotas & Carnets
            </button>
          </div>
        </div>
      )}

      {/* 2. ASEO & MANTENIMIENTO */}
      {activeTab === 'aseo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm">Torres 1 & 2 • Rutina de Aseo</h3>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                Lunes & Jueves
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario:</strong> 08:00 AM a 12:30 PM</p>
              <p><strong className="text-slate-400">Labores:</strong> Barrido y trapeado de pasillos de pisos 1 al 5, limpieza de pasamanos, desinfección de cabina de ascensor y vidrios del hall de entrada.</p>
              <p className="text-slate-400 pt-1 italic">Personal a cargo: Sandra Milena (Aseadora de Planta)</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm">Torres 3 & 4 • Rutina de Aseo</h3>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                Martes & Viernes
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario:</strong> 08:00 AM a 12:30 PM</p>
              <p><strong className="text-slate-400">Labores:</strong> Limpieza profunda de escaleras de emergencia, áreas de correspondencia, limpieza de ascensores y ventanería de corredores.</p>
              <p className="text-slate-400 pt-1 italic">Personal a cargo: Sandra Milena & Yaneth</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-sm">Torre 5 & Zonas Comunes</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Miércoles & Sábados
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario:</strong> 08:00 AM a 01:00 PM</p>
              <p><strong className="text-slate-400">Labores:</strong> Aseo completo de Torre 5, recepción principal de portería, baños sociales y senderos peatonales exteriores.</p>
              <p className="text-slate-400 pt-1 italic">Personal a cargo: Equipo de Servicios Generales</p>
            </div>
          </div>

          <div className="col-span-full bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Lavado Periódico de Sótanos y Parqueaderos
            </h3>
            <p className="text-xs text-slate-300">
              Se realiza el <strong>primer miércoles de cada mes</strong> (09:00 AM - 04:00 PM). La administración envía circular con 3 días de antelación para despejar las bahías señaladas.
            </p>
          </div>
        </div>
      )}

      {/* 3. BASURAS & SHUTS */}
      {activeTab === 'basuras' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
              <Trash2 className="w-5 h-5 text-emerald-400" /> Recolección Municipal de Basuras
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1">
                <span className="text-emerald-400 font-bold block">🚚 Días de Recolección (Empresa de Aseo):</span>
                <p className="text-white font-semibold">Lunes, Miércoles y Viernes a partir de las 07:00 PM</p>
              </div>
              <p><strong className="text-slate-400">Horario de Cuarto de Basuras (Sótano 1):</strong> Abierto 24 Horas para residentes.</p>
              <p><strong className="text-slate-400">Día de Reciclaje (Bolsa Blanca):</strong> Martes y Jueves (Plástico, cartón limpio, papel y metales).</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
              <AlertCircle className="w-5 h-5 text-red-400" /> Normas Obligatorias del Shut de Basuras
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario del Shut:</strong> 06:00 AM a 09:00 PM (prohibido arrojar basuras de noche por ruido).</p>
              <div className="bg-red-950/60 border border-red-800/80 p-3 rounded-xl space-y-1 text-red-200">
                <span className="font-bold block text-red-400">⚠️ PROHIBIDO ARROJAR POR EL DUCTO:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Botellas o envases de vidrio (riesgo de explosión al caer al fondo).</li>
                  <li>Cajas de pizza o cartones grandes (causan obstrucción del ducto).</li>
                  <li>Escombros, metales pesados o líquidos corrosivos.</li>
                </ul>
              </div>
              <p className="text-slate-400 text-[11px]">Bolsas deben ir bien selladas y con peso inferior a 10 kg.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUAL DE CONVIVENCIA */}
      {activeTab === 'convivencia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-700 pb-3">
              <Volume2 className="w-5 h-5 text-amber-400" /> Horarios de Silencio y Ruido
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-slate-400">Horario de Silencio:</strong> 10:00 PM a 07:00 AM todos los días.</p>
              <p><strong className="text-slate-400">Nivel de Decibeles:</strong> Máximo 45 dB en horario nocturno (Código de Policía).</p>
              <p className="text-amber-300/90 bg-slate-900 p-2.5 rounded-xl border border-amber-900/60">
                Llamados de atención por citófono tras la primera queja vecinal. Reincidencias acarrean sanción económica de asamblea.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-700 pb-3">
              <Sparkles className="w-5 h-5 text-blue-400" /> Obras & Remodelaciones
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-slate-400">Lunes a Viernes:</strong> 08:00 AM a 05:00 PM</p>
              <p><strong className="text-slate-400">Sábados:</strong> 08:00 AM a 01:00 PM</p>
              <p className="text-red-400 font-bold">Domingos y Festivos: Prohibido taladros y ruidos de obra.</p>
              <p className="text-[11px] text-slate-400">Todo contratista debe registrarse en portería con ARL vigente y cédula.</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-400" /> Mudanzas & Trasteos (Art. 24)
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300 mt-2">
                <p><strong className="text-slate-400">Horario:</strong> Lunes a Sábado de 08:00 AM a 05:00 PM</p>
                <p><strong className="text-slate-400">Domingos y Festivos:</strong> Prohibidos los trasteos.</p>
                <p><strong className="text-slate-400">Requisitos:</strong> Paz y Salvo de administración y depósito de $100.000 COP por protección de ascensores.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/trasteos')}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow mt-2"
            >
              📦 Gestionar Mudanzas
            </button>
          </div>
        </div>
      )}

      {/* 5. PARQUEADEROS, BODEGAS & BICICLETAS */}
      {activeTab === 'parqueaderos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" /> Bahías Privadas & Visitantes (Art. 52)
                </h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300 mt-2">
                <p><strong className="text-slate-400">Velocidad Máxima:</strong> 10 km/h con luces medias encendidas.</p>
                <p><strong className="text-slate-400">Tiempo Cortesía Visitantes:</strong> 4 horas continuas.</p>
                <p className="text-emerald-400 font-semibold">Si prestas tu bahía privada a otro residente, infórmalo en portería para evitar reportes de invasión.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/parqueadero')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow mt-2"
            >
              🚗 Ver Bahías Libres & Tiempo
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-700 pb-3">
              <FileText className="w-5 h-5 text-amber-400" /> Bodegas & Cuartos Útiles
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-slate-400">Ubicación:</strong> Sótanos 1 y 2 según nomenclatura del inmueble (ej: B-101).</p>
              <p className="text-red-300 bg-slate-900 p-2.5 rounded-xl border border-red-900/60">
                <strong>Prohibido almacenar:</strong> Gasolina, solventes químicos, pólvora o materiales altamente inflamables.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-700 pb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> Zonas de Bicicletas (Bicicleteros)
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-slate-400">Capacidad:</strong> 40 cupos numerados con anclaje de acero.</p>
              <p><strong className="text-slate-400">Registro:</strong> Registrar marca, color y serial de marco en portería.</p>
              <p><strong className="text-slate-400">Seguridad:</strong> Se exige candado tipo U-Lock por bicicleta.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. PAGOS & ADMINISTRACIÓN */}
      {activeTab === 'pagos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Canales de Pago & Fechas de Cuotas (Art. 45)
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-emerald-950/60 border border-emerald-800/80 p-3.5 rounded-xl space-y-1">
                <span className="text-emerald-300 font-bold block text-sm">💰 Descuento por Pronto Pago (10%):</span>
                <p className="text-slate-200">Aplica cancelando durante los primeros <strong>10 días calendario</strong> de cada mes.</p>
              </div>
              <p><strong className="text-slate-400">Cuota Plena Ordinaria:</strong> Del día 11 al último día del mes.</p>
              <p><strong className="text-slate-400">Intereses Moratorios:</strong> Se causan a partir del primer día del mes siguiente a la tasa de usura vigente.</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
              <Building className="w-5 h-5 text-blue-400" /> Cuentas Bancarias Oficiales del Conjunto
            </h3>
            <div className="space-y-2 text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-700 font-mono">
              <p><strong className="text-slate-400 font-sans">Titular:</strong> CONDOMINIO MINUTA P.H.</p>
              <p><strong className="text-slate-400 font-sans">NIT:</strong> 901.458.772-1</p>
              <p><strong className="text-slate-400 font-sans">Banco:</strong> Bancolombia / Davivienda</p>
              <p><strong className="text-slate-400 font-sans">Cuenta de Ahorros:</strong> <span className="text-emerald-400 font-bold">458-992145-02</span></p>
              <p><strong className="text-slate-400 font-sans">Envío de Soportes:</strong> <span className="text-blue-400">pagos@minuta.com</span></p>
            </div>
          </div>
        </div>
      )}

      {/* 7. DIRECTORIO DE EMERGENCIAS */}
      {activeTab === 'emergencias' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Interno Condominio</span>
            <h3 className="font-bold text-white text-base">Portería Principal 24/7</h3>
            <p className="text-xs text-slate-300">Citófono: <strong className="text-emerald-400 font-mono text-sm">Ext. 100 / 101</strong></p>
            <a href="tel:3201144778" className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> 320 114 4778
            </a>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Seguridad Ciudadana</span>
            <h3 className="font-bold text-white text-base">Policía Nacional (CAI)</h3>
            <p className="text-xs text-slate-300">Línea Nacional: <strong className="text-blue-400 font-mono text-sm">123</strong></p>
            <a href="tel:3002004455" className="text-xs text-blue-400 font-mono flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> Cuadrante: 300 200 4455
            </a>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Bomberos & Rescate</span>
            <h3 className="font-bold text-white text-base">Cuerpo de Bomberos</h3>
            <p className="text-xs text-slate-300">Emergencias Fuego: <strong className="text-red-400 font-mono text-sm">119</strong></p>
            <a href="tel:6013822500" className="text-xs text-red-400 font-mono flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> Central: (601) 382 2500
            </a>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Servicio Público</span>
            <h3 className="font-bold text-white text-base">Gas Natural (Vanti)</h3>
            <p className="text-xs text-slate-300">Línea de Escape / Fuga: <strong className="text-amber-400 font-mono text-sm">164</strong></p>
            <a href="tel:018000912800" className="text-xs text-amber-400 font-mono flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> Gratuita: 01 8000 912 800
            </a>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Servicio Público</span>
            <h3 className="font-bold text-white text-base">Acueducto & Alcantarillado</h3>
            <p className="text-xs text-slate-300">Reporte de Daños: <strong className="text-cyan-400 font-mono text-sm">116</strong></p>
            <p className="text-xs text-slate-300">Atención 24 Horas</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-2">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Servicio Eléctrico</span>
            <h3 className="font-bold text-white text-base">Energía (Enel Codensa)</h3>
            <p className="text-xs text-slate-300">Fallas de Energía: <strong className="text-yellow-400 font-mono text-sm">115</strong></p>
            <a href="tel:6017115115" className="text-xs text-yellow-400 font-mono flex items-center gap-1.5 hover:underline">
              <Phone className="w-3.5 h-3.5" /> Fijo: (601) 711 5115
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
