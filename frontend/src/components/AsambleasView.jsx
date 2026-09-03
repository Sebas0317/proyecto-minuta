
import React, { useState, useEffect } from 'react';
import { Vote, Plus, Clock, RefreshCw, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAsambleas, createAsamblea, updateQuorum, addVotacion, castVote, closeVotacion } from '../services/api';

export default function AsambleasView() {
  const [asambleas, setAsambleas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAsambleaModal, setShowAsambleaModal] = useState(false);
  const [showVotModal, setShowVotModal] = useState(false);
  const [selectedAsambleaId, setSelectedAsambleaId] = useState(null);

  const [formAsamblea, setFormAsamblea] = useState({
    titulo: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '08:00 AM',
    totalCoeficiente: 100
  });

  const [formVot, setFormVot] = useState({ pregunta: '' });
  const [coeficienteVoto, setCoeficienteVoto] = useState(1.25);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAsambleas();
      setAsambleas(data || []);
      if (data && data.length > 0 && !selectedAsambleaId) {
        setSelectedAsambleaId(data[0].id);
      }
    } catch (e) {
      toast.error('Error al cargar asambleas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAsamblea = asambleas.find(a => a.id === selectedAsambleaId) || asambleas[0];

  const handleCreateAsamblea = async (e) => {
    e.preventDefault();
    try {
      await createAsamblea(formAsamblea);
      toast.success('Asamblea convocada exitosamente');
      setShowAsambleaModal(false);
      loadData();
    } catch (e) {
      toast.error('Error al convocar asamblea');
    }
  };

  const handleUpdateQuorum = async (nuevoQuorum) => {
    if (!activeAsamblea) return;
    try {
      await updateQuorum(activeAsamblea.id, nuevoQuorum);
      toast.success('Quórum actualizado: ' + nuevoQuorum + '%');
      loadData();
    } catch (e) {
      toast.error('Error al actualizar quórum');
    }
  };

  const handleAddVotacion = async (e) => {
    e.preventDefault();
    if (!activeAsamblea) return;
    try {
      await addVotacion(activeAsamblea.id, formVot.pregunta);
      toast.success('Pregunta de votación añadida');
      setShowVotModal(false);
      setFormVot({ pregunta: '' });
      loadData();
    } catch (e) {
      toast.error('Error al añadir votación');
    }
  };

  const handleCastVote = async (votId, opcion) => {
    if (!activeAsamblea) return;
    try {
      await castVote(activeAsamblea.id, votId, opcion, coeficienteVoto);
      toast.success('Voto registrado (' + opcion.toUpperCase() + ' - Coef: ' + coeficienteVoto + '%)');
      loadData();
    } catch (e) {
      toast.error('Error al registrar voto');
    }
  };

  const handleCloseVot = async (votId) => {
    if (!window.confirm('¿Seguro que deseas cerrar esta votación y consolidar el resultado?')) return;
    try {
      await closeVotacion(activeAsamblea.id, votId);
      toast.success('Votación cerrada');
      loadData();
    } catch (e) {
      toast.error('Error al cerrar votación');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <Vote className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Asambleas & Votaciones Digitales
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Ley 675
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Control de Quórum por Coeficiente y Votaciones en Tiempo Real</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAsambleaModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Asamblea</span>
          </button>
          <button onClick={loadData} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all">
            <RefreshCw className={'w-5 h-5 ' + (loading ? 'animate-spin text-indigo-400' : '')} />
          </button>
        </div>
      </div>

      {activeAsamblea && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Quórum Registrado</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-md font-bold">
                {activeAsamblea.quorumRegistrado >= 50.01 ? '🟢 Quórum Deliberatorio' : '🔴 Sin Quórum'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{activeAsamblea.quorumRegistrado}%</span>
              <span className="text-xs text-slate-400">de 100% Coeficiente</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: Math.min(activeAsamblea.quorumRegistrado, 100) + '%' }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleUpdateQuorum(Number((activeAsamblea.quorumRegistrado + 5.25).toFixed(2)))}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold py-1.5 rounded-lg"
              >
                + Registrar +5.25%
              </button>
              <button
                onClick={() => handleUpdateQuorum(Number((activeAsamblea.quorumRegistrado + 1.15).toFixed(2)))}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold py-1.5 rounded-lg"
              >
                + Apto (+1.15%)
              </button>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Asamblea Activa</span>
              <h3 className="text-lg font-bold text-white mt-1">{activeAsamblea.titulo}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Fecha: {activeAsamblea.fecha} • {activeAsamblea.horaInicio}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
              <span>Estado: <strong className="text-emerald-400 uppercase">En Curso</strong></span>
              <span>{(activeAsamblea.votaciones || []).length} Preguntas creadas</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Simulador de Votación</span>
              <p className="text-xs text-slate-300 mt-1">Coeficiente del votante actual (%):</p>
              <input
                type="number"
                step="0.05"
                value={coeficienteVoto}
                onChange={(e) => setCoeficienteVoto(Number(e.target.value))}
                className="w-full mt-2 bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-sm font-mono font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowVotModal(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold mt-3 shadow-md"
            >
              + Lanzar Pregunta a Votación
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Votaciones y Decisiones de la Asamblea
        </h3>

        {(!activeAsamblea || !activeAsamblea.votaciones || activeAsamblea.votaciones.length === 0) ? (
          <div className="bg-slate-800/60 border border-slate-700 p-12 text-center rounded-2xl text-slate-500">
            <Vote className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No hay preguntas de votación activas en esta asamblea.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAsamblea.votaciones.map((vot) => {
              const total = vot.totalVotado || 1;
              const pctSi = ((vot.votosSi / total) * 100).toFixed(1);
              const pctNo = ((vot.votosNo / total) * 100).toFixed(1);
              const pctBlanco = ((vot.votosBlanco / total) * 100).toFixed(1);

              return (
                <div key={vot.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ' + (
                        vot.estado === 'activa' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' : 'bg-slate-700 text-slate-300'
                      )}>
                        {vot.estado === 'activa' ? '🟢 Votación Abierta' : '🔒 Cerrada (' + (vot.resultado || 'FINALIZADA') + ')'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Total Coef: {vot.totalVotado}%</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{vot.pregunta}</h4>
                  </div>

                  <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-emerald-400">SÍ: {vot.votosSi}%</span>
                        <span className="text-slate-400">{pctSi}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: pctSi + '%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-red-400">NO: {vot.votosNo}%</span>
                        <span className="text-slate-400">{pctNo}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: pctNo + '%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-amber-400">BLANCO: {vot.votosBlanco}%</span>
                        <span className="text-slate-400">{pctBlanco}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: pctBlanco + '%' }} />
                      </div>
                    </div>
                  </div>

                  {vot.estado === 'activa' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCastVote(vot.id, 'si')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow"
                      >
                        ✓ Votar SÍ
                      </button>
                      <button
                        onClick={() => handleCastVote(vot.id, 'no')}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow"
                      >
                        ✗ Votar NO
                      </button>
                      <button
                        onClick={() => handleCloseVot(vot.id)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                      >
                        Cerrar
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-1.5 bg-slate-900 rounded-xl text-xs font-bold text-slate-300">
                      Resultado Final: <strong className={vot.resultado === 'APROBADA' ? 'text-emerald-400' : 'text-red-400'}>{vot.resultado}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAsambleaModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Convocar Nueva Asamblea</h3>
            <form onSubmit={handleCreateAsamblea} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Título de la Asamblea</label>
                <input
                  type="text"
                  required
                  value={formAsamblea.titulo}
                  onChange={(e) => setFormAsamblea({ ...formAsamblea, titulo: e.target.value })}
                  placeholder="Ej: Asamblea Extraordinaria - Reparaciones"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formAsamblea.fecha}
                    onChange={(e) => setFormAsamblea({ ...formAsamblea, fecha: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Hora Inicio</label>
                  <input
                    type="text"
                    required
                    value={formAsamblea.horaInicio}
                    onChange={(e) => setFormAsamblea({ ...formAsamblea, horaInicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAsambleaModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold">Crear Asamblea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVotModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Nueva Pregunta a Votación</h3>
            <form onSubmit={handleAddVotacion} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Pregunta / Proposición</label>
                <textarea
                  rows={3}
                  required
                  value={formVot.pregunta}
                  onChange={(e) => setFormVot({ ...formVot, pregunta: e.target.value })}
                  placeholder="Ej: ¿Aprueba usted la reforma del artículo 15 del manual de convivencia?"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowVotModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold">Abrir Votación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
