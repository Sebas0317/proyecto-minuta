import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Search, Plus, User, Phone, Car, 
  RefreshCw, X, Shield, Users, Edit3, Trash2, Home, AlertTriangle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchUnidades, createUnidad, updateUnidad, deleteUnidad } from '../services/api';

export default function UnidadesView() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTorre, setFiltroTorre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    torre: 'Torre 1',
    numero: '',
    piso: 1,
    tipoOcupacion: 'propietario',
    estadoComercial: 'habitado',
    propietarioNombre: '',
    propietarioTel: '',
    propietarioDoc: '',
    inquilinoNombre: '',
    inquilinoTel: '',
    inquilinoDoc: '',
    fechaFinContrato: '',
    canonMensual: 1800000,
    inmobiliaria: 'Directo con Propietario',
    parqueaderosPrivados: '',
    vehiculoPlaca: '',
    vehiculoMarca: '',
    alDiaAdmon: true,
    mesesMora: 0,
    observaciones: '',
    pinAcceso: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUnidades({
        torre: filtroTorre || undefined,
        search: searchQuery || undefined
      });
      setUnidades(data || []);
    } catch (err) {
      toast.error('Error al cargar censo');
    } finally {
      setLoading(false);
    }
  }, [filtroTorre, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bahias = form.parqueaderosPrivados
        ? form.parqueaderosPrivados.split(',').map(b => b.trim().toUpperCase()).filter(Boolean)
        : [];

      const payload = {
        torre: form.torre,
        numero: form.numero,
        piso: Number(form.piso) || 1,
        tipoOcupacion: form.tipoOcupacion,
        estadoComercial: form.estadoComercial,
        estado: form.estadoComercial === 'habitado' ? 'habitado' : 'desocupado',
        propietario: {
          nombre: form.propietarioNombre,
          documento: form.propietarioDoc,
          telefono: form.propietarioTel
        },
        contratoArriendo: form.tipoOcupacion === 'arrendatario' ? {
          inquilinoNombre: form.inquilinoNombre,
          inquilinoDoc: form.inquilinoDoc,
          inquilinoTel: form.inquilinoTel,
          fechaFin: form.fechaFinContrato,
          canonMensual: Number(form.canonMensual) || 1800000,
          inmobiliaria: form.inmobiliaria
        } : null,
        residentes: form.tipoOcupacion === 'arrendatario' && form.inquilinoNombre ? [{
          nombre: form.inquilinoNombre,
          documento: form.inquilinoDoc,
          telefono: form.inquilinoTel,
          parentesco: 'Arrendatario Titular',
          principal: true
        }] : form.propietarioNombre ? [{
          nombre: form.propietarioNombre,
          documento: form.propietarioDoc,
          telefono: form.propietarioTel,
          parentesco: 'Propietario Titular',
          principal: true
        }] : [],
        vehiculos: form.vehiculoPlaca ? [{
          placa: form.vehiculoPlaca.toUpperCase(),
          tipo: 'carro',
          marca: form.vehiculoMarca,
          parqueaderoAsignado: bahias[0] || 'Sin bahía'
        }] : [],
        parqueaderosPrivados: bahias,
        estadoFinanciero: {
          administracion: {
            alDia: form.alDiaAdmon,
            mesesMora: form.alDiaAdmon ? 0 : Number(form.mesesMora) || 1,
            cuotaMensual: 220000 + (bahias.length * 40000),
            saldoPendiente: form.alDiaAdmon ? 0 : (Number(form.mesesMora) || 1) * (220000 + (bahias.length * 40000))
          },
          recibosPublicos: {
            alDia: true,
            alertas: 'Servicios al día'
          }
        },
        observaciones: form.observaciones,
        pinAcceso: form.pinAcceso || null
      };

      if (isEditing && selectedUnidad) {
        await updateUnidad(selectedUnidad.id, payload);
        toast.success('Ficha de inmueble actualizada correctamente');
      } else {
        await createUnidad(payload);
        toast.success('Nueva unidad registrada en el censo');
      }

      setShowModal(false);
      setIsEditing(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al guardar unidad');
    }
  };

  const handleEdit = (u) => {
    setSelectedUnidad(u);
    setIsEditing(true);
    setForm({
      torre: u.torre || 'Torre 1',
      numero: u.numero || '',
      piso: u.piso || 1,
      tipoOcupacion: u.tipoOcupacion || 'propietario',
      estadoComercial: u.estadoComercial || 'habitado',
      propietarioNombre: u.propietario?.nombre || '',
      propietarioTel: u.propietario?.telefono || '',
      propietarioDoc: u.propietario?.documento || '',
      inquilinoNombre: u.contratoArriendo?.inquilinoNombre || '',
      inquilinoTel: u.contratoArriendo?.inquilinoTel || '',
      inquilinoDoc: u.contratoArriendo?.inquilinoDoc || '',
      fechaFinContrato: u.contratoArriendo?.fechaFin || '',
      canonMensual: u.contratoArriendo?.canonMensual || 1800000,
      inmobiliaria: u.contratoArriendo?.inmobiliaria || 'Directo con Propietario',
      parqueaderosPrivados: u.parqueaderosPrivados?.join(', ') || '',
      vehiculoPlaca: u.vehiculos?.[0]?.placa || '',
      vehiculoMarca: u.vehiculos?.[0]?.marca || '',
      alDiaAdmon: u.estadoFinanciero?.administracion?.alDia !== false,
      mesesMora: u.estadoFinanciero?.administracion?.mesesMora || 0,
      observaciones: u.observaciones || '',
      pinAcceso: u.pinAcceso || ''
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Censo Oficial de Inmuebles <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100 Apartamentos</span>
            </h1>
            <p className="text-slate-400 text-sm">Directorio maestro de propietarios, contratos de arriendo, bahías privadas y administración</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setIsEditing(false);
              setForm({
                torre: 'Torre 1',
                numero: '',
                piso: 1,
                tipoOcupacion: 'propietario',
                estadoComercial: 'habitado',
                propietarioNombre: '',
                propietarioTel: '',
                propietarioDoc: '',
                inquilinoNombre: '',
                inquilinoTel: '',
                inquilinoDoc: '',
                fechaFinContrato: '',
                canonMensual: 1800000,
                inmobiliaria: 'Directo con Propietario',
                parqueaderosPrivados: '',
                vehiculoPlaca: '',
                vehiculoMarca: '',
                alDiaAdmon: true,
                mesesMora: 0,
                observaciones: '',
                pinAcceso: ''
              });
              setShowModal(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Apartamento</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por apartamento (ej: 101, 304), nombre de dueño o inquilino, documento o placa..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={filtroTorre}
          onChange={(e) => setFiltroTorre(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
        >
          <option value="">Todas las Torres (1 a 5)</option>
          <option value="Torre 1">Torre 1</option>
          <option value="Torre 2">Torre 2</option>
          <option value="Torre 3">Torre 3</option>
          <option value="Torre 4">Torre 4</option>
          <option value="Torre 5">Torre 5</option>
        </select>
      </div>

      {/* GRID DE UNIDADES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {unidades.map((u) => {
          const tieneMora = u.estadoFinanciero?.administracion?.alDia === false;
          return (
            <div 
              key={u.id} 
              className={`bg-slate-800/80 border-2 ${
                tieneMora ? 'border-red-500/80 shadow-lg shadow-red-950/20' : 'border-slate-700'
              } p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-500 transition-all`}
            >
              <div>
                {/* APTO HEADER */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl font-black text-lg">{u.numero}</span>
                    <div>
                      <h3 className="font-bold text-white text-base">{u.torre} - Apto {u.numero}</h3>
                      <p className="text-xs text-slate-400">Piso {u.piso}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    u.tipoOcupacion === 'arrendatario' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    u.estadoComercial === 'disponible_arriendo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    u.estadoComercial === 'disponible_venta' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    u.estadoComercial === 'vacio' ? 'bg-slate-700 text-slate-300' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {u.tipoOcupacion === 'arrendatario' ? 'Arrendado' : u.estadoComercial.replace('_', ' ')}
                  </span>
                </div>

                {/* DETALLE */}
                <div className="space-y-2 pt-3 text-xs">
                  {/* PROPIETARIO */}
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold uppercase flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Propietario:
                    </span>
                    <p className="text-white font-bold">{u.propietario?.nombre || 'Sin registrar'}</p>
                    {u.propietario?.telefono && (
                      <p className="text-slate-400 font-mono">Tel: {u.propietario.telefono}</p>
                    )}
                  </div>

                  {/* INQUILINO SI ESTÁ ARRENDADO */}
                  {u.tipoOcupacion === 'arrendatario' && (
                    <div className="bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/60 space-y-0.5">
                      <span className="text-blue-300 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Inquilino: {u.contratoArriendo?.inquilinoNombre}
                      </span>
                      <p className="text-slate-400">Tel: <strong className="text-slate-200">{u.contratoArriendo?.inquilinoTel}</strong></p>
                      <p className="text-slate-400">Vence: <strong className="text-white">{u.contratoArriendo?.fechaFin}</strong></p>
                    </div>
                  )}

                  {/* PARQUEADEROS PRIVADOS */}
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold uppercase flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-purple-400" /> Bahías Privadas:
                    </span>
                    {u.parqueaderosPrivados?.length > 0 ? (
                      <p className="font-mono text-purple-300 font-bold">{u.parqueaderosPrivados.join(', ')}</p>
                    ) : (
                      <p className="text-amber-400/80 font-semibold">❌ Sin cupo privado comprado</p>
                    )}
                  </div>

                  {/* ADMON & MORA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Administración:</span>
                    {tieneMora ? (
                      <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800 text-[11px]">
                        ⚠️ Mora: ${Number(u.estadoFinanciero?.administracion?.saldoPendiente).toLocaleString('es-CO')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[11px]">✓ Paz y Salvo</span>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER ACCIÓN */}
              <div className="pt-3 border-t border-slate-700/60 flex justify-end">
                <button
                  onClick={() => handleEdit(u)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Ficha Maestra
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR COMPLETO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" /> {isEditing ? `Editar Inmueble ${form.torre} - ${form.numero}` : 'Registrar Nuevo Inmueble'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* TORRE, APTO, PISO */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Torre *</label>
                  <select
                    value={form.torre}
                    onChange={(e) => setForm({ ...form, torre: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Número *</label>
                  <input
                    type="text"
                    required
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="Ej: 101"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Piso</label>
                  <input
                    type="number"
                    value={form.piso}
                    onChange={(e) => setForm({ ...form, piso: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              {/* TIPO DE OCUPACIÓN Y ESTADO COMERCIAL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Tipo de Ocupante</label>
                  <select
                    value={form.tipoOcupacion}
                    onChange={(e) => setForm({ ...form, tipoOcupacion: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="propietario">Propietario</option>
                    <option value="arrendatario">Arrendatario / Inquilino</option>
                    <option value="desocupado">Desocupado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Estado Comercial</label>
                  <select
                    value={form.estadoComercial}
                    onChange={(e) => setForm({ ...form, estadoComercial: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm outline-none"
                  >
                    <option value="habitado">Habitado</option>
                    <option value="disponible_arriendo">Disponible para Arriendo</option>
                    <option value="disponible_venta">Disponible para Venta</option>
                    <option value="vacio">Vacío / Desocupado</option>
                  </select>
                </div>
              </div>

              {/* PROPIETARIO */}
              <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase">Datos del Propietario (Dueño)</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={form.propietarioNombre}
                    onChange={(e) => setForm({ ...form, propietarioNombre: e.target.value })}
                    placeholder="Nombre Completo"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={form.propietarioDoc}
                    onChange={(e) => setForm({ ...form, propietarioDoc: e.target.value })}
                    placeholder="Cédula"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={form.propietarioTel}
                    onChange={(e) => setForm({ ...form, propietarioTel: e.target.value })}
                    placeholder="Teléfono"
                    className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* INQUILINO SI ES ARRENDATARIO */}
              {form.tipoOcupacion === 'arrendatario' && (
                <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-blue-400 uppercase">Contrato de Arriendo e Inquilino</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={form.inquilinoNombre}
                      onChange={(e) => setForm({ ...form, inquilinoNombre: e.target.value })}
                      placeholder="Nombre Inquilino"
                      className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={form.inquilinoTel}
                      onChange={(e) => setForm({ ...form, inquilinoTel: e.target.value })}
                      placeholder="Teléfono Inquilino"
                      className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                    />
                    <input
                      type="date"
                      value={form.fechaFinContrato}
                      onChange={(e) => setForm({ ...form, fechaFinContrato: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg text-xs"
                      title="Fecha Fin de Contrato"
                    />
                  </div>
                </div>
              )}

              {/* PARQUEADEROS PRIVADOS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Bahías Privadas (Separadas por coma)</label>
                  <input
                    type="text"
                    value={form.parqueaderosPrivados}
                    onChange={(e) => setForm({ ...form, parqueaderosPrivados: e.target.value })}
                    placeholder="Ej: P-1101A, P-1101B"
                    className="w-full mt-1 uppercase font-mono bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Estado Administración</label>
                  <select
                    value={form.alDiaAdmon ? 'si' : 'no'}
                    onChange={(e) => setForm({ ...form, alDiaAdmon: e.target.value === 'si' })}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="si">Paz y Salvo (Al día)</option>
                    <option value="no">En Mora</option>
                  </select>
                </div>
              </div>

              {!form.alDiaAdmon && (
                <div>
                  <label className="text-xs font-medium text-red-300">Meses de Mora en Administración</label>
                  <input
                    type="number"
                    min="1"
                    value={form.mesesMora}
                    onChange={(e) => setForm({ ...form, mesesMora: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-red-800 text-white px-3 py-2 rounded-xl text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40"
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear Apartamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}