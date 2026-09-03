import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Home,
  Package,
  UserCheck,
  Calendar,
  Vote,
  Dog,
  Truck,
  FileCheck,
  Bot,
  Search,
  Plus,
  QrCode,
  Shield,
  CreditCard,
  Phone,
  Mail,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Share2,
  Send,
  Sparkles,
  ChevronRight,
  LogOut,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchUnidadesSummary,
  fetchUnidadPortalData,
  fetchPaquetesUnidad,
  fetchPreautorizadosUnidad,
  preautorizarAcceso,
  fetchReservasZonas,
  createReservaZona,
  fetchAsambleas,
  castVote,
  fetchMascotas,
  createMascota,
  queryChatbot
} from '../services/api';
import CertificadosModal from './CertificadosModal';

const TABS = [
  { id: 'resumen', label: 'Mi Inmueble & Finanzas', icon: Home },
  { id: 'paquetes', label: 'Paquetes & Recibos', icon: Package },
  { id: 'visitas', label: 'Pre-autorizar Visitas', icon: UserCheck },
  { id: 'reservas', label: 'Reservar Zonas', icon: Calendar },
  { id: 'asambleas', label: 'Asamblea Digital', icon: Vote },
  { id: 'mascotas', label: 'Mis Mascotas', icon: Dog },
  { id: 'trasteos', label: 'Mudanzas', icon: Truck },
  { id: 'chatbot', label: 'MinutaBot IA', icon: Bot },
];

export default function PortalResidenteView() {
  const navigate = useNavigate();

  // Selector de apartamento
  const [unidadesList, setUnidadesList] = useState([]);
  const [selectedUnidadId, setSelectedUnidadId] = useState(() => {
    return localStorage.getItem('residente_unidad_id') || 't1-101';
  });
  const [unidadData, setUnidadData] = useState(null);
  const [loadingUnidad, setLoadingUnidad] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  // Paquetes
  const [paquetes, setPaquetes] = useState([]);
  const [loadingPaquetes, setLoadingPaquetes] = useState(false);

  // Visitas Pre-autorizadas
  const [visitas, setVisitas] = useState([]);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [showPreautorizarModal, setShowPreautorizarModal] = useState(false);
  const [formVisita, setFormVisita] = useState({
    nombre: '',
    documento: '',
    tipo: 'familiar',
    fechaEsperada: new Date().toISOString().split('T')[0],
    motivo: 'Visita autorizada por residente',
    tipoVehiculo: 'peatonal',
    placa: '',
    observaciones: ''
  });

  // Reservas
  const [reservas, setReservas] = useState([]);
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [formReserva, setFormReserva] = useState({
    espacio: '⚽ Cancha Sintética Fútbol 5',
    fechaReserva: new Date().toISOString().split('T')[0],
    horaInicio: '18:00',
    horaFin: '19:30',
    observaciones: ''
  });

  // Asambleas
  const [asambleas, setAsambleas] = useState([]);

  // Mascotas
  const [mascotas, setMascotas] = useState([]);
  const [showMascotaModal, setShowMascotaModal] = useState(false);
  const [formMascota, setFormMascota] = useState({
    nombre: '',
    especie: 'perro',
    raza: '',
    color: '',
    edad: '',
    vacunaAntirrabica: true,
    fechaVacuna: new Date().toISOString().split('T')[0]
  });

  // Chatbot Embebido
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! 👋 Soy **MinutaBot**, asistente inteligente del condominio.\n\nPuedes consultarme sobre horarios de zonas comunes, rutas de aseo, basuras, tus paquetes pendientes o pedirme que emita tu Paz y Salvo de administración al instante.',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Certificados
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certTipo, setCertTipo] = useState('paz_y_salvo');

  // Cargar lista de unidades para el selector
  useEffect(() => {
    fetchUnidadesSummary()
      .then(res => setUnidadesList(res || []))
      .catch(() => {});
  }, []);

  // Cargar datos de la unidad seleccionada
  const loadUnidad = async (uId) => {
    try {
      setLoadingUnidad(true);
      const data = await fetchUnidadPortalData(uId);
      setUnidadData(data);
      localStorage.setItem('residente_unidad_id', uId);

      // Cargar paquetes y visitas correspondientes
      const aptoNum = data?.numero || '101';
      fetchPaquetesUnidad(aptoNum, { torre: data?.torre }).then(setPaquetes).catch(() => {});
      fetchPreautorizadosUnidad(data?.id || uId, { apto: aptoNum }).then(setVisitas).catch(() => {});
      fetchReservasZonas().then(setReservas).catch(() => {});
      fetchAsambleas().then(setAsambleas).catch(() => {});
      fetchMascotas({ apto: aptoNum }).then(setMascotas).catch(() => {});
    } catch (e) {
      toast.error('No se pudo cargar la información del apartamento');
    } finally {
      setLoadingUnidad(false);
    }
  };

  useEffect(() => {
    if (selectedUnidadId) {
      loadUnidad(selectedUnidadId);
    }
  }, [selectedUnidadId]);

  // Manejar pre-autorización de visitas
  const handlePreautorizar = async (e) => {
    e.preventDefault();
    if (!formVisita.nombre) {
      toast.error('El nombre del visitante es obligatorio');
      return;
    }

    try {
      const payload = {
        unidadId: unidadData?.id || selectedUnidadId,
        torre: unidadData?.torre || 'Torre 1',
        apto: String(unidadData?.numero || '101'),
        nombre: formVisita.nombre,
        documento: formVisita.documento || 'Sin documento',
        tipo: formVisita.tipo,
        fechaEsperada: formVisita.fechaEsperada,
        motivo: formVisita.motivo,
        vehiculo: {
          tipo: formVisita.tipoVehiculo,
          placa: formVisita.placa ? formVisita.placa.toUpperCase() : null
        },
        observaciones: formVisita.observaciones
      };

      const res = await preautorizarAcceso(payload);
      toast.success(`Visita pre-autorizada con Pase ${res.paseQR}`);
      setShowPreautorizarModal(false);
      setFormVisita({
        nombre: '',
        documento: '',
        tipo: 'familiar',
        fechaEsperada: new Date().toISOString().split('T')[0],
        motivo: 'Visita autorizada por residente',
        tipoVehiculo: 'peatonal',
        placa: '',
        observaciones: ''
      });

      // Recargar lista
      const aptoNum = unidadData?.numero || '101';
      fetchPreautorizadosUnidad(unidadData?.id || selectedUnidadId, { apto: aptoNum }).then(setVisitas);
    } catch (err) {
      toast.error(err.message || 'Error al crear pre-autorización');
    }
  };

  // Manejar reservas
  const handleCrearReserva = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        espacio: formReserva.espacio,
        torre: unidadData?.torre || 'Torre 1',
        apto: String(unidadData?.numero || '101'),
        solicitante: unidadData?.propietario?.nombre || 'Residente',
        telefono: unidadData?.propietario?.telefono || '3000000000',
        fechaReserva: formReserva.fechaReserva,
        horaInicio: formReserva.horaInicio,
        horaFin: formReserva.horaFin,
        observaciones: formReserva.observaciones || 'Reserva desde el Portal del Residente'
      };

      await createReservaZona(payload);
      toast.success('Reserva confirmada en el calendario');
      setShowReservaModal(false);
      fetchReservasZonas().then(setReservas);
    } catch (err) {
      toast.error(err.message || 'Error al solicitar reserva');
    }
  };

  // Manejar Voto en Asamblea
  const handleVotar = async (asambleaId, votacionId, opcion) => {
    try {
      const coef = unidadData?.coeficiente || 1.25;
      await castVote(asambleaId, votacionId, opcion, coef);
      toast.success(`Voto por "${opcion.toUpperCase()}" registrado (${coef}%)`);
      fetchAsambleas().then(setAsambleas);
    } catch (e) {
      toast.error(e.message || 'Error al registrar voto');
    }
  };

  // Manejar Registro de Mascota
  const handleRegistrarMascota = async (e) => {
    e.preventDefault();
    if (!formMascota.nombre || !formMascota.raza) {
      toast.error('Nombre y raza son requeridos');
      return;
    }

    try {
      const payload = {
        ...formMascota,
        torre: unidadData?.torre || 'Torre 1',
        apto: String(unidadData?.numero || '101'),
        unidadId: unidadData?.id || selectedUnidadId,
        propietarioNombre: unidadData?.propietario?.nombre || 'Residente',
        telefonoContacto: unidadData?.propietario?.telefono || '3000000000'
      };

      await createMascota(payload);
      toast.success('Mascota registrada exitosamente con carnet QR');
      setShowMascotaModal(false);
      fetchMascotas({ apto: unidadData?.numero || '101' }).then(setMascotas);
    } catch (err) {
      toast.error(err.message || 'Error al registrar mascota');
    }
  };

  // Enviar mensaje al bot
  const handleSendChat = async (e) => {
    e?.preventDefault();
    const q = chatInput.trim();
    if (!q || chatLoading) return;

    const usrMsg = { id: 'usr-' + Date.now(), sender: 'user', text: q, timestamp: new Date() };
    setChatMessages(prev => [...prev, usrMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await queryChatbot(q, { apto: unidadData?.numero || '101', torre: unidadData?.torre });
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: res.answer || 'Información procesada por MinutaBot.',
        action: res.item?.accionRapida || res.accionRapida || null,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { id: 'err-' + Date.now(), sender: 'bot', text: 'No se pudo contactar con MinutaBot.', timestamp: new Date() }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const paquetesPendientes = useMemo(() => {
    return (paquetes || []).filter(p => p.estado !== 'entregado');
  }, [paquetes]);

  const visitasActivas = useMemo(() => {
    return (visitas || []).filter(v => v.estado === 'preautorizado' || v.estado === 'activo');
  }, [visitas]);

  const alDia = unidadData?.estadoFinanciero?.administracion?.alDia ?? true;
  const saldoPendiente = unidadData?.estadoFinanciero?.administracion?.saldoPendiente || 0;
  const cuotaMensual = unidadData?.estadoFinanciero?.administracion?.cuotaMensual || 260000;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* TOPBAR DEL PORTAL DEL RESIDENTE */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Portal del Residente <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Mi Apartamento</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              {unidadData ? `${unidadData.torre} • Apartamento ${unidadData.numero}` : 'Cargando inmueble...'}
            </p>
          </div>
        </div>

        {/* SELECTOR RÁPIDO DE INMUEBLE & ACCIONES */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSelectorModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cambiar Apto ({unidadData?.numero || '101'})</span>
          </button>

          <button
            onClick={() => {
              setCertTipo('paz_y_salvo');
              setCertModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
              alDia
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{alDia ? '📄 Paz y Salvo Oficial' : '⚠️ Estado de Cuenta'}</span>
          </button>

          <button
            onClick={() => navigate('/', { replace: true })}
            className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 hover:border-red-500/40 rounded-xl text-xs transition-all"
            title="Volver a Selección de Rol"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 flex-1">
        {/* BANNER DE RESUMEN DEL INMUEBLE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tarjeta 1: Inmueble & Propietario */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inmueble</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                Coef. {unidadData?.coeficiente || '1.25'}%
              </span>
            </div>
            <h3 className="text-xl font-black text-white">
              {unidadData?.torre || 'Torre 1'} — {unidadData?.numero || '101'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 truncate">
              👤 {unidadData?.propietario?.nombre || 'Mariana Rodríguez'}
            </p>
            <p className="text-[11px] text-slate-400">
              📞 {unidadData?.propietario?.telefono || '311 100 4567'}
            </p>
          </div>

          {/* Tarjeta 2: Estado Financiero */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Administración</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                alDia ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {alDia ? 'Al Día' : 'Saldo Pendiente'}
              </span>
            </div>
            <h3 className="text-xl font-black text-emerald-400">
              ${Number(cuotaMensual).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/mes</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {alDia ? '✅ Paz y salvo habilitado' : `⚠️ Saldo en mora: $${Number(saldoPendiente).toLocaleString()}`}
            </p>
            <p className="text-[11px] text-slate-400">10% desc. hasta el día 10</p>
          </div>

          {/* Tarjeta 3: Paquetes en Portería */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paquetería</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                {paquetesPendientes.length} Pendiente(s)
              </span>
            </div>
            <h3 className="text-xl font-black text-white">
              {paquetesPendientes.length > 0 ? (
                <span className="text-amber-400 font-mono">PIN: {paquetesPendientes[0]?.codigoRetiro || '----'}</span>
              ) : (
                <span className="text-slate-400">Sin paquetes</span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-1 truncate">
              {paquetesPendientes.length > 0
                ? `📦 ${paquetesPendientes[0]?.empresa || 'Encomienda'} (${paquetesPendientes[0]?.guia || 'Guía'})`
                : 'No hay correspondencia en portería'}
            </p>
            <button
              onClick={() => setActiveTab('paquetes')}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5 mt-0.5"
            >
              Ver todos los paquetes <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Tarjeta 4: Pases & Pre-autorizaciones */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pases QR</span>
              <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                {visitasActivas.length} Activo(s)
              </span>
            </div>
            <h3 className="text-xl font-black text-white">
              Pre-autorizaciones
            </h3>
            <p className="text-xs text-slate-300 mt-1 truncate">
              {visitasActivas.length > 0 ? `👤 ${visitasActivas[0]?.nombre} (${visitasActivas[0]?.paseQR})` : 'Sin visitas programadas'}
            </p>
            <button
              onClick={() => setShowPreautorizarModal(true)}
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-0.5 mt-0.5 font-bold"
            >
              + Pre-autorizar nueva visita <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE TABS */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'paquetes' && paquetesPendientes.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {paquetesPendientes.length}
                  </span>
                )}
                {tab.id === 'visitas' && visitasActivas.length > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {visitasActivas.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: RESUMEN DEL INMUEBLE & FINANZAS */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Residentes & Familiares */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Residentes Registrados
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                  {unidadData?.residentes?.length || 1} Persona(s)
                </span>
              </div>
              <div className="space-y-2.5">
                {(unidadData?.residentes || [{ nombre: 'Mariana Rodríguez', parentesco: 'Propietario Residente', documento: '1020000137' }]).map((r, i) => (
                  <div key={i} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{r.nombre}</p>
                      <p className="text-[11px] text-slate-400">{r.parentesco} • Doc: {r.documento}</p>
                    </div>
                    {r.principal && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        Titular
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehículos & Parqueaderos */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" /> Vehículos & Parqueaderos
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold">
                  Bahía {unidadData?.parqueaderosPrivados?.[0] || `P-${unidadData?.numero || '101'}`}
                </span>
              </div>
              <div className="space-y-2.5">
                {(unidadData?.vehiculos || [{ placa: 'KLM107', tipo: 'carro', marca: 'Renault Duster' }]).map((v, i) => (
                  <div key={i} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-xs">
                        {v.placa}
                      </span>
                      <p className="text-[11px] text-slate-400 font-sans mt-1">{v.marca} ({v.tipo})</p>
                    </div>
                    <span className="text-slate-400 text-[11px] font-sans">
                      Asignado: {v.parqueaderoAsignado || 'Bahía Privada'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuentas & Soporte de Administración */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Cuentas para Pago
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                  Bancolombia
                </span>
              </div>
              <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
                <p><span className="text-slate-400 font-sans">Cuenta Ahorros:</span> <strong className="text-emerald-400">458-992145-02</strong></p>
                <p><span className="text-slate-400 font-sans">NIT:</span> 901.458.772-1</p>
                <p><span className="text-slate-400 font-sans">Titular:</span> CONDOMINIO MINUTA P.H.</p>
                <p><span className="text-slate-400 font-sans">Enviar comprobante:</span> <span className="text-blue-400">pagos@minuta.com</span></p>
              </div>
              <button
                onClick={() => {
                  setCertTipo('paz_y_salvo');
                  setCertModalOpen(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Generar Certificado de Residencia
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PAQUETES & RECIBOS PENDIENTES CON PIN */}
        {activeTab === 'paquetes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" /> Correspondencia y Encomiendas en Portería
                </h3>
                <p className="text-xs text-slate-400">
                  Presenta tu código PIN de 4 dígitos al guarda en la recepción para retirar tus paquetes o recibos.
                </p>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl font-bold">
                {paquetesPendientes.length} por retirar
              </span>
            </div>

            {paquetesPendientes.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">¡No tienes paquetes pendientes!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Apenas llegue una encomienda, paquete o recibo público a portería, se registrará aquí con su respectivo código PIN de seguridad.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paquetesPendientes.map(p => (
                  <div key={p.id} className="bg-slate-900/90 border-2 border-amber-500/40 p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {p.categoria === 'recibo_publico' ? '📬 Recibo Público' : '📦 Encomienda'}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        {p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <p><strong className="text-slate-400">Empresa / Remitente:</strong> <span className="text-white font-semibold">{p.empresa || p.tipoRecibo}</span></p>
                      <p><strong className="text-slate-400">Guía / Factura:</strong> <span className="font-mono text-cyan-400">{p.guia || p.mesFacturado || 'N/A'}</span></p>
                      <p><strong className="text-slate-400">Destinatario:</strong> {p.destinatario || 'Residente'}</p>
                    </div>

                    {/* PIN DE SEGURIDAD EN GRANDE */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 text-center space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Código PIN de Retiro</span>
                      <span className="text-3xl font-black font-mono tracking-widest text-amber-400">
                        {p.codigoRetiro || '1234'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center italic">
                      Muestra este PIN al guarda de turno para autorizar la entrega.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRE-AUTORIZACIÓN DE VISITAS & PASES QR */}
        {activeTab === 'visitas' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" /> Pases Digitales & Pre-autorización de Visitas
                </h3>
                <p className="text-xs text-slate-400">
                  Registra a tus visitantes o domiciliarios con anticipación para un ingreso ágil y seguro en portería.
                </p>
              </div>
              <button
                onClick={() => setShowPreautorizarModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Pre-autorizar Visita
              </button>
            </div>

            {visitas.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
                <UserCheck className="w-12 h-12 text-purple-400/60 mx-auto" />
                <h4 className="text-base font-bold text-white">No tienes visitas pre-autorizadas</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Crea un pase digital para familiares, amigos, domicilios de Rappi/MercadoLibre o técnicos de servicios públicos.
                </p>
                <button
                  onClick={() => setShowPreautorizarModal(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Crear Primer Pase Digital
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visitas.map(v => (
                  <div key={v.id} className="bg-slate-900/90 border border-purple-500/30 p-5 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                          Pase: {v.paseQR || 'PASS-XXXX'}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                          v.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : v.estado === 'preautorizado'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {v.estado === 'preautorizado' ? 'Pre-autorizado' : v.estado === 'activo' ? 'En el Conjunto' : 'Finalizado'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 mt-3">
                        <p className="text-base font-bold text-white">{v.nombre}</p>
                        <p><strong className="text-slate-400">Tipo:</strong> <span className="capitalize">{v.tipo}</span></p>
                        <p><strong className="text-slate-400">Documento:</strong> {v.documento || 'Por verificar'}</p>
                        <p><strong className="text-slate-400">Fecha Esperada:</strong> {v.fechaEsperada || 'Hoy'}</p>
                        {v.vehiculo?.placa && (
                          <p><strong className="text-slate-400">Vehículo:</strong> <span className="font-mono text-amber-400 font-bold">{v.vehiculo.placa}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Pase QR listo para portería</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Pase de Acceso al Condominio Minuta: ${v.nombre} (Pase: ${v.paseQR}) para Apto ${unidadData?.torre} ${unidadData?.numero}`);
                          toast.success('Pase copiado para compartir por WhatsApp');
                        }}
                        className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Compartir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RESERVAS DE ZONAS COMUNES */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" /> Reservas de Zonas Comunes
                </h3>
                <p className="text-xs text-slate-400">
                  Aparta la cancha de fútbol, la zona BBQ o el salón social de eventos de forma directa.
                </p>
              </div>
              <button
                onClick={() => setShowReservaModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Nueva Reserva
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(reservas || []).filter(r => String(r.apto) === String(unidadData?.numero || '101')).map(r => (
                <div key={r.id} className="bg-slate-900/90 border border-blue-500/30 p-5 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-blue-400">{r.espacio}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                      Confirmada
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-slate-400">Fecha:</strong> <span className="text-white font-semibold">{r.fechaReserva}</span></p>
                    <p><strong className="text-slate-400">Horario:</strong> {r.horaInicio} a {r.horaFin}</p>
                    <p><strong className="text-slate-400">Solicitante:</strong> {r.solicitante}</p>
                  </div>
                </div>
              ))}
              {(reservas || []).filter(r => String(r.apto) === String(unidadData?.numero || '101')).length === 0 && (
                <div className="col-span-full bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
                  No tienes reservas activas. Pulsa en "+ Nueva Reserva" para apartar un turno en cancha sintética o BBQ.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ASAMBLEA & VOTACIONES (LEY 675) */}
        {activeTab === 'asambleas' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Vote className="w-5 h-5 text-emerald-400" /> Asamblea General de Propietarios (Ley 675 de 2001)
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  Tu Coeficiente: {unidadData?.coeficiente || '1.25'}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tu voto se pondera automáticamente según el coeficiente oficial de propiedad horizontal de tu apartamento.
              </p>
            </div>

            {asambleas.map(asm => (
              <div key={asm.id} className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-base">{asm.titulo}</h4>
                    <p className="text-xs text-slate-400">Quórum actual registrado: <strong className="text-emerald-400 font-mono">{asm.quorumRegistrado || 68.5}%</strong></p>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-xl font-bold uppercase">
                    {asm.estado}
                  </span>
                </div>

                <div className="space-y-4">
                  {(asm.votaciones || []).map(v => (
                    <div key={v.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <p className="text-sm font-bold text-white">{v.pregunta}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleVotar(asm.id, v.id, 'si')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
                        >
                          👍 Votar SÍ
                        </button>
                        <button
                          onClick={() => handleVotar(asm.id, v.id, 'no')}
                          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
                        >
                          👎 Votar NO
                        </button>
                        <button
                          onClick={() => handleVotar(asm.id, v.id, 'blanco')}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
                        >
                          ⚪ Voto en Blanco
                        </button>
                        <span className="text-xs text-slate-400 ml-auto">
                          Votado: <strong className="text-white font-mono">{v.totalVotado || 0}%</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: MIS MASCOTAS */}
        {activeTab === 'mascotas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Dog className="w-5 h-5 text-pink-400" /> Censo de Mascotas & Carnet QR
                </h3>
                <p className="text-xs text-slate-400">
                  Registra tus animales de compañía conforme al Art. 18 del Manual de Convivencia y la Ley 1801.
                </p>
              </div>
              <button
                onClick={() => setShowMascotaModal(true)}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Registrar Mascota
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mascotas.map(m => (
                <div key={m.id} className="bg-slate-900/90 border border-pink-500/30 p-5 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-base font-bold text-white flex items-center gap-1.5">
                      🐾 {m.nombre}
                    </span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold capitalize">
                      {m.especie}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-slate-400">Raza:</strong> {m.raza}</p>
                    <p><strong className="text-slate-400">Vacuna Antirrábica:</strong> <span className="text-emerald-400 font-semibold">{m.vacunaAntirrabica ? 'Al Día' : 'Pendiente'}</span></p>
                    <p><strong className="text-slate-400">Token QR:</strong> <span className="font-mono text-cyan-400">{m.qrToken || 'PET-QR'}</span></p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-400">Zona Pipican 24h</span>
                    <span className="text-emerald-400 font-bold">Carnet Activo</span>
                  </div>
                </div>
              ))}
              {mascotas.length === 0 && (
                <div className="col-span-full bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
                  No tienes mascotas registradas en este apartamento. Pulsa en "+ Registrar Mascota".
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: MUDANZAS & TRASTEOS */}
        {activeTab === 'trasteos' && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-400" /> Solicitud de Mudanzas (Art. 24)
                </h3>
                <p className="text-xs text-slate-400">Horario permitido: Lunes a Sábado de 08:00 AM a 05:00 PM.</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-xl font-bold ${
                alDia ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {alDia ? 'Paz y Salvo Aprobado' : 'Requiere Paz y Salvo'}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Para realizar una mudanza de entrada o salida, el inmueble debe estar a <strong>Paz y Salvo</strong> con la administración y realizar el depósito de garantía de <strong>$100.000 COP</strong> para la protección de ascensores y pasillos.
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Estado de Autorización de tu Apartamento:</span>
                <p className="text-emerald-400 font-semibold">
                  {alDia ? '✅ Tu inmueble cumple los requisitos para programar mudanza.' : '❌ Debes ponerte al día en administración antes de solicitar mudanza.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: MINUTABOT IA RESIDENCIAL */}
        {activeTab === 'chatbot' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[550px]">
            <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    MinutaBot IA <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-bold">Residencial</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Asistente en vivo para Apto {unidadData?.numero || '101'}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Inteligencia Local
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 shadow-md'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    {m.action && (
                      <button
                        onClick={() => {
                          if (m.action.ruta?.includes('reservas')) setActiveTab('reservas');
                          else if (m.action.ruta?.includes('paquetes')) setActiveTab('paquetes');
                        }}
                        className="mt-2.5 bg-slate-900 hover:bg-slate-950 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> {m.action.label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl text-xs text-slate-400 animate-pulse">
                    MinutaBot está pensando...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pregunta sobre piscina, gimnasio, basura, paz y salvo o tus paquetes..."
                className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Enviar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: CAMBIAR / SELECCIONAR APARTAMENTO */}
      {showSelectorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" /> Selecciona tu Inmueble
              </h3>
              <button onClick={() => setShowSelectorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Elige tu torre y apartamento para cargar tus paquetes, pases QR y estado financiero:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {unidadesList.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUnidadId(u.id);
                    setShowSelectorModal(false);
                    toast.success(`Apartamento ${u.torre} ${u.numero} cargado`);
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    selectedUnidadId === u.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white">{u.torre} — Apto {u.numero}</p>
                    <p className="text-[11px] text-slate-400">{u.propietarioNombre}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    u.alDia ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {u.alDia ? 'Paz y Salvo' : 'En Mora'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRE-AUTORIZAR VISITA */}
      {showPreautorizarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" /> Pre-autorizar Ingreso a tu Apartamento
              </h3>
              <button onClick={() => setShowPreautorizarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePreautorizar} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Completo del Visitante *</label>
                <input
                  type="text"
                  required
                  value={formVisita.nombre}
                  onChange={e => setFormVisita({ ...formVisita, nombre: e.target.value })}
                  placeholder="Ej: Carlos Alberto Pérez"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cédula / Documento</label>
                  <input
                    type="text"
                    value={formVisita.documento}
                    onChange={e => setFormVisita({ ...formVisita, documento: e.target.value })}
                    placeholder="Ej: 1020304050"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Visita</label>
                  <select
                    value={formVisita.tipo}
                    onChange={e => setFormVisita({ ...formVisita, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-purple-500"
                  >
                    <option value="familiar">Familiar / Amigo</option>
                    <option value="domicilio">Domicilio / Entrega</option>
                    <option value="contratista">Contratista / Obras</option>
                    <option value="tecnico">Técnico de Servicios</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha de la Visita</label>
                  <input
                    type="date"
                    value={formVisita.fechaEsperada}
                    onChange={e => setFormVisita({ ...formVisita, fechaEsperada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Placa Vehículo (Opcional)</label>
                  <input
                    type="text"
                    value={formVisita.placa}
                    onChange={e => setFormVisita({ ...formVisita, placa: e.target.value, tipoVehiculo: e.target.value ? 'carro' : 'peatonal' })}
                    placeholder="Ej: ABC123"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl font-mono uppercase outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Observaciones para el Guarda</label>
                <input
                  type="text"
                  value={formVisita.observaciones}
                  onChange={e => setFormVisita({ ...formVisita, observaciones: e.target.value })}
                  placeholder="Ej: Lleva paquete pesado o herramientas"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreautorizarModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                >
                  Generar Pase QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR RESERVA */}
      {showReservaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" /> Apartar Zona Común
              </h3>
              <button onClick={() => setShowReservaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Zona Común</label>
                <select
                  value={formReserva.espacio}
                  onChange={e => setFormReserva({ ...formReserva, espacio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="⚽ Cancha Sintética Fútbol 5">⚽ Cancha Sintética Fútbol 5 (Gratis)</option>
                  <option value="🍖 Zona BBQ & Asador 1">🍖 Zona BBQ & Asador 1 ($50.000 depósito)</option>
                  <option value="🍖 Zona BBQ & Asador 2">🍖 Zona BBQ & Asador 2 ($50.000 depósito)</option>
                  <option value="🎉 Salón Social de Eventos">🎉 Salón Social de Eventos ($200.000 depósito)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={formReserva.fechaReserva}
                  onChange={e => setFormReserva({ ...formReserva, fechaReserva: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={formReserva.horaInicio}
                    onChange={e => setFormReserva({ ...formReserva, horaInicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={formReserva.horaFin}
                    onChange={e => setFormReserva({ ...formReserva, horaFin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReservaModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MASCOTA */}
      {showMascotaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Dog className="w-5 h-5 text-pink-400" /> Registrar Mascota en tu Apto
              </h3>
              <button onClick={() => setShowMascotaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMascota} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre de la Mascota *</label>
                <input
                  type="text"
                  required
                  value={formMascota.nombre}
                  onChange={e => setFormMascota({ ...formMascota, nombre: e.target.value })}
                  placeholder="Ej: Max"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Especie</label>
                  <select
                    value={formMascota.especie}
                    onChange={e => setFormMascota({ ...formMascota, especie: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-pink-500"
                  >
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Raza *</label>
                  <input
                    type="text"
                    required
                    value={formMascota.raza}
                    onChange={e => setFormMascota({ ...formMascota, raza: e.target.value })}
                    placeholder="Ej: Golden Retriever"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMascotaModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                >
                  Guardar Mascota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CERTIFICADOS Y PAZ Y SALVO */}
      {certModalOpen && (
        <CertificadosModal
          unidad={unidadData}
          tipoInicial={certTipo}
          onClose={() => setCertModalOpen(false)}
        />
      )}
    </div>
  );
}
