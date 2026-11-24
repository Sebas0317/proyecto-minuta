
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Search, Plus, QrCode, Shield, Phone, Printer, RefreshCw, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMascotas, createMascota } from '../services/api';

export default function MascotasView() {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [carnetImprimir, setCarnetImprimir] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    especie: 'perro',
    raza: 'Mestizo',
    apto: '',
    torre: '1',
    propietario: '',
    telefono: '',
    color: '',
    vacunaAntirrabica: true,
    fechaVacuna: new Date().toISOString().split('T')[0],
    manejoEspecial: false,
    polizaResponsabilidad: '',
    observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMascotas();
      setMascotas(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar censo de mascotas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMascotas = useMemo(() => {
    return mascotas.filter((m) => {
      const matchEspecie = !filtroEspecie || m.especie === filtroEspecie;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (m.nombre || '').toLowerCase().includes(q) ||
        (m.raza || '').toLowerCase().includes(q) ||
        String(m.apto || '').toLowerCase().includes(q) ||
        (m.propietario || m.propietarioNombre || '').toLowerCase().includes(q);
      return matchEspecie && matchSearch;
    });
  }, [mascotas, filtroEspecie, searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMascota(form);
      toast.success('Mascota censada y carnet generado');
      setShowModal(false);
      setForm({
        nombre: '',
        especie: 'perro',
        raza: 'Mestizo',
        apto: '',
        torre: '1',
        propietario: '',
        telefono: '',
        color: '',
        vacunaAntirrabica: true,
        fechaVacuna: new Date().toISOString().split('T')[0],
        manejoEspecial: false,
        polizaResponsabilidad: '',
        observaciones: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar mascota');
    }
  };

  const handleImprimirCarnet = (pet) => {
    setCarnetImprimir(pet);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-xl">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Censo de Mascotas & Carnet QR
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                Tenencia Responsable
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Registro de Animales de Compañía, Carnet Antirrábico y Control de Razas</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-pink-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Censar Mascota</span>
          </button>
          <button onClick={loadData} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all">
            <RefreshCw className={'w-5 h-5 ' + (loading ? 'animate-spin text-pink-400' : '')} />
          </button>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apto, raza o propietario..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-pink-500"
          />
        </div>
        <select
          value={filtroEspecie}
          onChange={(e) => setFiltroEspecie(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-pink-500"
        >
          <option value="">Todas las Especies</option>
          <option value="perro">🐶 Perros</option>
          <option value="gato">🐱 Gatos</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMascotas.length === 0 ? (
          <div className="col-span-full bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-2 opacity-30 text-pink-400" />
            <p className="text-sm font-semibold">No se encontraron mascotas con los filtros actuales.</p>
          </div>
        ) : (
        filteredMascotas.map((pet) => (
          <div key={pet.id} className="bg-slate-800/80 border border-slate-700/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-pink-500/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">{pet.especie === 'perro' ? '🐕' : '🐈'}</div>
                  <div>
                    <h3 className="text-base font-black text-white">{pet.nombre}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">{pet.raza} • {pet.color || 'Sin color'}</span>
                  </div>
                </div>
                <span className="bg-slate-900 text-pink-400 border border-slate-700 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                  T{String(pet.torre || '').replace(/^Torre\s*/i, '')}-{pet.apto}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenedor:</span>
                  <strong className="text-white">{pet.propietario || pet.propietarioNombre || 'Residente'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Teléfono:</span>
                  <a href={'tel:' + (pet.telefono || pet.telefonoContacto || '')} className="text-emerald-400 font-mono flex items-center gap-1 hover:underline">
                    <Phone className="w-3 h-3" /> {pet.telefono || pet.telefonoContacto || 'N/D'}
                  </a>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Vacuna Antirrábica:</span>
                  {pet.vacunaAntirrabica !== false ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Al día ({pet.fechaVacuna || 'Vigente'})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">Pendiente</span>
                  )}
                </div>
              </div>

              {pet.manejoEspecial && (
                <div className="bg-red-950/60 border border-red-800/80 p-2.5 rounded-xl text-[11px] text-red-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Raza de Manejo Especial • Bozal obligatorio</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/80">
              <span className="text-[10px] font-mono text-slate-400">TOKEN: {pet.qrToken}</span>
              <button
                onClick={() => handleImprimirCarnet(pet)}
                className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Ver / Imprimir Carnet
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {carnetImprimir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-pink-500/60 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-pink-400" /> Carnet Oficial de Mascota
              </h3>
              <button onClick={() => setCarnetImprimir(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-pink-600">EcoBosque P.H. • Censo Canino/Felino</span>
                  <h4 className="text-lg font-black text-slate-900">{carnetImprimir.nombre}</h4>
                  <p className="text-xs text-slate-600">{carnetImprimir.especie} • {carnetImprimir.raza}</p>
                </div>
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <p><strong>Inmueble:</strong> Torre {String(carnetImprimir.torre || '').replace(/^Torre\s*/i, '')} - Apto {carnetImprimir.apto}</p>
                <p><strong>Tenedor:</strong> {carnetImprimir.propietario || carnetImprimir.propietarioNombre || 'Residente'}</p>
                <p><strong>Teléfono:</strong> {carnetImprimir.telefono || carnetImprimir.telefonoContacto || 'N/D'}</p>
                <p><strong>Vacuna Antirrábica:</strong> {carnetImprimir.vacunaAntirrabica !== false ? `Vigente (${carnetImprimir.fechaVacuna || 'Al día'})` : 'Pendiente'}</p>
                <p className="font-mono text-[11px] text-slate-500 pt-1">Token QR: {carnetImprimir.qrToken}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCarnetImprimir(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold">
                Cerrar
              </button>
              <button onClick={() => window.print()} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">Censar Nueva Mascota</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Nombre de la Mascota</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Max"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Especie</label>
                  <select
                    value={form.especie}
                    onChange={(e) => setForm({ ...form, especie: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  >
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Raza</label>
                  <input
                    type="text"
                    required
                    value={form.raza}
                    onChange={(e) => setForm({ ...form, raza: e.target.value })}
                    placeholder="Ej: Labrador"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Color / Señas</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="Ej: Café con manchas"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Torre</label>
                  <input
                    type="text"
                    required
                    value={form.torre}
                    onChange={(e) => setForm({ ...form, torre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Apartamento</label>
                  <input
                    type="text"
                    required
                    value={form.apto}
                    onChange={(e) => setForm({ ...form, apto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Tenedor Responsable</label>
                  <input
                    type="text"
                    required
                    value={form.propietario}
                    onChange={(e) => setForm({ ...form, propietario: e.target.value })}
                    placeholder="Nombre completo"
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Teléfono Contacto</label>
                  <input
                    type="text"
                    required
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="300..."
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="manejoEspecial"
                  checked={form.manejoEspecial}
                  onChange={(e) => setForm({ ...form, manejoEspecial: e.target.checked })}
                  className="rounded border-slate-700"
                />
                <label htmlFor="manejoEspecial" className="text-xs text-slate-300 font-semibold">
                  ¿Es de manejo especial / potencialmente peligroso? (Ley 1801)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-xs font-bold">Guardar y Expedir Carnet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
