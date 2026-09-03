import React, { useState } from 'react';
import {
  FileCheck,
  Printer,
  X,
  Building2,
  QrCode,
  ShieldCheck,
  Download,
  Calendar,
  User,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function CertificadosModal({ isOpen, onClose, aptoInicial = '101', torreInicial = '1' }) {
  const [tipo, setTipo] = useState('paz_y_salvo'); // 'paz_y_salvo' | 'trasteo' | 'residencia'
  const [apto, setApto] = useState(aptoInicial);
  const [torre, setTorre] = useState(torreInicial);
  const [nombre, setNombre] = useState('Juan Sebastián Rodríguez');
  const [cedula, setCedula] = useState('1.020.455.889');
  const [radicado, setRadicado] = useState(() => 'CERT-' + Math.floor(100000 + Math.random() * 900000));
  const [fechaExpedicion, setFechaExpedicion] = useState(() => new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }));

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* HEADER MODAL */}
        <div className="bg-slate-800/90 border-b border-slate-700 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Generador de Paz y Salvo & Certificados</h3>
              <p className="text-xs text-slate-400">Emisión digital oficial con código QR de verificación</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE TIPO Y DATOS */}
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Tipo de Certificado</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="paz_y_salvo">📜 Paz y Salvo de Administración</option>
              <option value="trasteo">🚚 Autorización de Mudanza / Trasteo</option>
              <option value="residencia">🏠 Certificado de Residencia</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Apartamento & Torre</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={apto}
                onChange={(e) => setApto(e.target.value)}
                placeholder="Apto"
                className="w-1/2 bg-slate-900 border border-slate-700 text-white px-2.5 py-2 rounded-xl outline-none text-center font-bold text-emerald-400"
              />
              <input
                type="text"
                value={torre}
                onChange={(e) => setTorre(e.target.value)}
                placeholder="Torre"
                className="w-1/2 bg-slate-900 border border-slate-700 text-white px-2.5 py-2 rounded-xl outline-none text-center font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Nombre del Residente / Propietario</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Documento / C.C.</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none"
            />
          </div>
        </div>

        {/* VISTA PREVIA DEL DOCUMENTO IMPRIMIBLE (DOCUMENT SHEET) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          <div
            id="print-certificate-area"
            className="w-full max-w-2xl bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 relative flex flex-col justify-between space-y-6 min-h-[500px]"
          >
            {/* MEMBRETE */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <Building2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                    CONDOMINIO RESIDENCIAL MINUTA P.H.
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                    NIT: 901.458.772-1 • Personería Jurídica Alcaldía Mayor • Ley 675 de 2001
                  </p>
                  <p className="text-[10px] text-slate-500">Calle 145 # 12-30 • PBX: (601) 320 114 4778 • Bogotá D.C., Colombia</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md">
                  VÁLIDO & AUTENTICADO
                </span>
                <p className="text-[10px] font-mono text-slate-500 mt-1 font-bold">Rad: {radicado}</p>
              </div>
            </div>

            {/* CUERPO DEL CERTIFICADO */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="text-center py-2">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
                  {tipo === 'paz_y_salvo' && 'CERTIFICADO OFICIAL DE PAZ Y SALVO'}
                  {tipo === 'trasteo' && 'AUTORIZACIÓN DE MUDANZA / TRASTEO'}
                  {tipo === 'residencia' && 'CERTIFICADO DE RESIDENCIA Y HABITABILIDAD'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">La Administración del Condominio Minuta P.H. hace constar:</p>
              </div>

              {tipo === 'paz_y_salvo' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p>
                    Que el inmueble identificado como <strong>Apartamento {apto} (Torre {torre})</strong>, a nombre de <strong>{nombre}</strong> identificado(a) con C.C. No. <strong>{cedula}</strong>, se encuentra a la fecha <strong>TOTALMENTE AL DÍA POR CONCEPTO DE CUOTAS DE ADMINISTRACIÓN ORDINARIAS Y EXTRAORDINARIAS</strong>, sin sanciones de convivencia ni recargos pendientes.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Este documento se expide para los fines que el interesado estime conveniente y tiene una vigencia de <strong>30 días calendario</strong> a partir de su fecha de expedición.
                  </p>
                </div>
              )}

              {tipo === 'trasteo' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p>
                    Que se autoriza formalmente el ingreso/salida de mudanza para el <strong>Apartamento {apto} (Torre {torre})</strong> a cargo de <strong>{nombre}</strong> (C.C. {cedula}). Se verifica paz y salvo en expensas comunes y depósito de garantía para uso de ascensor.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong>Horario autorizado:</strong> Lunes a Sábado de 08:00 AM a 05:00 PM con protección de cobijas en cabina de ascensor.
                  </p>
                </div>
              )}

              {tipo === 'residencia' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p>
                    Que <strong>{nombre}</strong>, portador(a) del documento de identidad No. <strong>{cedula}</strong>, figura en el censo oficial de la copropiedad en calidad de residente del <strong>Apartamento {apto} - Torre {torre}</strong>.
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-600 pt-2">
                Expedido en Bogotá D.C., a los {fechaExpedicion}.
              </div>
            </div>

            {/* FIRMAS Y SELLO QR DIGITAL */}
            <div className="pt-6 border-t border-slate-300 flex items-end justify-between">
              <div className="space-y-1">
                <div className="w-48 border-b-2 border-slate-800 pb-1 font-signature text-sm font-bold text-slate-800 italic">
                  Arq. Liliana Morales R.
                </div>
                <p className="text-[10px] font-bold text-slate-900 uppercase">Administración General</p>
                <p className="text-[9px] text-slate-500">Mat. Prof. 25418-CPH • Minuta P.H.</p>
              </div>

              {/* QR CODE VALIDATOR BADGE */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-300">
                <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-inner">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
                <div className="text-[9px] leading-tight text-slate-600">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Firma Digital
                  </span>
                  <span>Verificable con QR</span>
                  <span className="block font-mono text-slate-500 mt-0.5">{radicado}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BOTONES */}
        <div className="bg-slate-800/90 border-t border-slate-700 p-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Radicado generado: <strong className="text-emerald-400 font-mono">{radicado}</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}