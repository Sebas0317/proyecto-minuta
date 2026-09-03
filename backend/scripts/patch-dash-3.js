const fs = require('fs');

const path = 'c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components/PorteriaDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the pure package rendering section and add the dedicated Recibos Públicos section
const oldPackagesSection = `{/* PANEL DE PAQUETES POR ENTREGAR */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Paquetería Pendiente por Retiro
            </h3>
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold">
              {paquetes.filter(p => p.estado !== 'entregado').length} paquetes
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {paquetes.filter(p => p.estado !== 'entregado').length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay paquetes pendientes por entregar.</p>
              </div>
            ) : (
              paquetes.filter(p => p.estado !== 'entregado').map((p) => (
                <div key={p.id} className="bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs">
                      {p.apto}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                        {p.destinatario}
                        <span className="text-xs font-normal text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">{p.empresa}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {p.torre} - Apto {p.apto} • Guía: <strong className="text-slate-300">{p.guia}</strong>
                      </p>
                      <p className="text-[11px] text-amber-400 mt-0.5">
                        PIN Retiro: <strong className="font-mono bg-slate-800 px-1 rounded">{p.codigoRetiro}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNotificarWhatsApp(p)}
                      title="Enviar WhatsApp de aviso"
                      className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-lg text-xs transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowEntregaModal(p)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Entregar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>`;

const newPackagesAndRecibosSection = `{/* PANEL DE PAQUETERÍA & ENCOMIENDAS FÍSICAS (EXCLUSIVO) */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-white">Paquetería & Encomiendas</h3>
                <p className="text-[11px] text-slate-400">MercadoLibre, Amazon, Servientrega, etc.</p>
              </div>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold">
              {encomiendasPendientes.length} por retirar
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {encomiendasPendientes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay encomiendas pendientes por entregar.</p>
              </div>
            ) : (
              encomiendasPendientes.map((p) => (
                <div key={p.id} className="bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl font-bold text-xs">
                      {p.apto}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                        {p.destinatario}
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">{p.empresa}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {p.torre} - Apto {p.apto} • Guía: <strong className="text-slate-300">{p.guia}</strong>
                      </p>
                      <p className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">
                        PIN Retiro: <strong className="bg-slate-800 px-1.5 py-0.5 rounded text-white border border-slate-700">{p.codigoRetiro}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNotificarWhatsApp(p)}
                      title="Enviar WhatsApp con PIN de retiro"
                      className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-xl text-xs transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowEntregaModal(p)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Entregar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN EXCLUSIVA DEDICADA: CASILLERO DE RECIBOS PÚBLICOS SIN RECOGER */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Casillero de Recibos Públicos & Facturas Sin Recoger
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {recibosPendientes.length} en espera
                </span>
              </h3>
              <p className="text-slate-400 text-xs">
                Control de facturas físicas (Agua, Energía, Gas, Telecomunicaciones, Predial) con alerta de días acumulados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReciboModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + Ingresar Recibo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recibosPendientes.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay recibos públicos pendientes en el casillero.</p>
            </div>
          ) : (
            recibosPendientes.map((r) => {
              const dias = calcularDiasCasillero(r.fechaIngreso);
              const esCritico = dias > 30;
              return (
                <div
                  key={r.id}
                  className={\`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all \${
                    esCritico
                      ? 'bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/30'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  }\`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-xs font-mono font-bold">
                        {r.torre} - {r.apto}
                      </span>
                      <span className={\`text-[10px] px-2 py-0.5 rounded-full font-bold \${
                        esCritico
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }\`}>
                        {dias} días acumulados
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs">{r.tipoRecibo || r.empresa}</h4>
                      <p className="text-[11px] text-slate-400">Mes: <strong className="text-slate-300">{r.mesFacturado || 'Mes en curso'}</strong></p>
                      {r.valorFactura > 0 && (
                        <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          $\${Number(r.valorFactura).toLocaleString('es-CO')} COP
                        </p>
                      )}
                    </div>

                    {esCritico && (
                      <p className="text-[10px] text-red-400 font-semibold bg-red-950/80 p-1.5 rounded border border-red-900/60">
                        ⚠️ ALERTA: Más de 1 mes sin retirar. Riesgo de corte de servicio.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleEntregarReciboDirecto(r)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar Entregado
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>`;

content = content.replace(oldPackagesSection, newPackagesAndRecibosSection);

// Add the Modal for Recibo Público at the end before closing return
const modalReciboCode = `{/* MODAL: REGISTRO DE RECIBO PÚBLICO */}
      {showReciboModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" /> Registrar Llegada de Recibo Público
              </h3>
              <button onClick={() => setShowReciboModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarRecibo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Torre</label>
                  <select
                    value={reciboForm.torre}
                    onChange={(e) => setReciboForm({ ...reciboForm, torre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                    <option value="Torre 4">Torre 4</option>
                    <option value="Torre 5">Torre 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Apartamento</label>
                  <input
                    type="text"
                    required
                    value={reciboForm.apto}
                    onChange={(e) => setReciboForm({ ...reciboForm, apto: e.target.value })}
                    placeholder="Ej: 203"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Servicio Público</label>
                <select
                  value={reciboForm.tipoRecibo}
                  onChange={(e) => setReciboForm({ ...reciboForm, tipoRecibo: e.target.value, empresa: e.target.value.split(' ')[0] })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                >
                  <option value="Acueducto y Alcantarillado (Agua)">💧 Acueducto y Alcantarillado (Agua)</option>
                  <option value="Energía Eléctrica (Luz)">⚡ Energía Eléctrica (Luz)</option>
                  <option value="Gas Natural Domiciliario">🔥 Gas Natural Domiciliario</option>
                  <option value="Telecomunicaciones (Internet/TV)">📶 Telecomunicaciones (Internet/TV)</option>
                  <option value="Impuesto Predial Unificado">🏛️ Impuesto Predial Unificado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mes Facturado</label>
                  <input
                    type="text"
                    value={reciboForm.mesFacturado}
                    onChange={(e) => setReciboForm({ ...reciboForm, mesFacturado: e.target.value })}
                    placeholder="Ej: Septiembre 2026"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Valor Factura (COP)</label>
                  <input
                    type="number"
                    value={reciboForm.valorFactura}
                    onChange={(e) => setReciboForm({ ...reciboForm, valorFactura: e.target.value })}
                    placeholder="Ej: 85400"
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowReciboModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30"
                >
                  Guardar en Casillero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(
  "{/* MODAL: REGISTRO DE INGRESO */}",
  modalReciboCode + "      {/* MODAL: REGISTRO DE INGRESO */}"
);

fs.writeFileSync(path, content);
console.log('✓ Part 3 updated in PorteriaDashboard.jsx');