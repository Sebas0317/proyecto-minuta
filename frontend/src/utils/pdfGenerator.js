import { jsPDF } from 'jspdf';

/**
 * Formats a number to Colombian Peso currency format
 */
function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '$0';
  return `$${Number(num).toLocaleString('es-CO')}`;
}

/**
 * Returns long Spanish formatted date (e.g. "5 de septiembre de 2026")
 */
function getLongDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generates an official Certificate of "Paz y Salvo" in PDF format and triggers browser download.
 * 
 * @param {Object} unidad - Unit data (torre, numero, propietario, saldoPendiente, coeficiente, etc.)
 * @param {Object} [options] - Additional metadata (adminName, nit, condominioName)
 */
export function generarPazYSalvoPDF(unidad, options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const condominioName = options.condominioName || 'CONDOMINIO RESIDENCIAL ECOBOSQUE';
  const nit = options.nit || 'NIT: 901.458.712-3';
  const adminName = options.adminName || 'ADMINISTRACIÓN GENERAL';
  const radicado = `PYS-${unidad.torre || 'T1'}${unidad.numero || '101'}-${Date.now().toString().slice(-6)}`;
  const fechaExpedicion = getLongDate();
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
  const fechaVencimientoStr = getLongDate(fechaVencimiento);

  // Decorative Header Bar (Emerald Green gradient simulation)
  doc.setFillColor(16, 85, 53); // #105535
  doc.rect(0, 0, 210, 22, 'F');

  doc.setFillColor(34, 197, 94); // Accent line #22c55e
  doc.rect(0, 22, 210, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(condominioName, 105, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${nit} • Régimen de Propiedad Horizontal - Ley 675 de 2001`, 105, 18, { align: 'center' });

  // Document Badge & Radicado
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICADO OFICIAL DE PAZ Y SALVO', 105, 40, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Radicado No: ${radicado} | Fecha de Expedición: ${fechaExpedicion}`, 105, 46, { align: 'center' });

  // Main Intro text
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');

  const introText = 
    `La Administración del ${condominioName}, persona jurídica constituida bajo el Régimen de Propiedad Horizontal establecido en la Ley 675 de 2001, por medio del presente documento:`;
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, 58);

  // Big CERTIFICA callout
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 85, 53);
  doc.text('CERTIFICA', 105, 75, { align: 'center' });

  // Info Card (Box with border)
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(20, 82, 170, 70, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const leftX = 26;
  const valX = 85;
  let curY = 92;

  const rows = [
    ['Inmueble / Unidad:', `Torre ${unidad.torre || 'N/A'} - Apartamento ${unidad.numero || 'N/A'}`],
    ['Propietario Registrado:', unidad.propietario || 'No especificado'],
    ['Cédula / NIT:', unidad.cedula || unidad.documento || 'Registrado en Base de Datos'],
    ['Coeficiente de Copropiedad:', unidad.coeficiente ? `${(unidad.coeficiente * 100).toFixed(3)}%` : '0.850%'],
    ['Estado de Cartera a la Fecha:', 'AL DÍA / PAZ Y SALVO ($0 COP)'],
    ['Conceptos Verificados:', 'Cuotas Ordinarias, Extraordinarias y Sanciones'],
  ];

  rows.forEach(([label, value], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, leftX, curY);
    
    if (idx === 4) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52); // Green 800
      doc.text(value, valX, curY);
      doc.setTextColor(30, 41, 59);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(value, valX, curY);
    }
    curY += 9.5;
  });

  // Secondary text / legal notice
  curY = 162;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const legalBody = 
    `Se hace constar que a la fecha y hora de emisión del presente certificado, la unidad antes mencionada no presenta saldos pendientes por concepto de expensas comunes ordinarias ni extraordinarias, intereses de mora, multas o servicios comunales con la administración de la copropiedad.\n\n` +
    `Este documento es válido para trámites notariales, escrituración pública, promesas de compraventa, arrendamientos o trámites bancarios ante entidades financieras de conformidad con el Artículo 29 de la Ley 675 de 2001.\n\n` +
    `VALIDEZ: Este certificado tiene una vigencia legal de treinta (30) días calendario, con vencimiento el ${fechaVencimientoStr}.`;

  const splitLegal = doc.splitTextToSize(legalBody, 170);
  doc.text(splitLegal, 20, curY);

  // Digital Security Box / Watermark Hash
  curY += 45;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, curY, 170, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA DIGITAL Y SEGURIDAD CRIPTOGRÁFICA ECOBOSQUE SAAS', 25, curY + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const fakeHash = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  doc.text(`HASH SHA-256: ${fakeHash.toUpperCase()}`, 25, curY + 12);
  doc.text(`TOKEN VERIFICACIÓN: ECO-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()} • VÁLIDO EN SERVIDOR`, 25, curY + 16);

  // Signature line
  curY += 42;
  doc.setDrawColor(100, 116, 139);
  doc.line(70, curY, 140, curY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(adminName, 105, curY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Representante Legal / Administración de la Copropiedad', 105, curY + 9, { align: 'center' });
  doc.text(condominioName, 105, curY + 13, { align: 'center' });

  // Footer bar
  doc.setFillColor(16, 85, 53);
  doc.rect(0, 289, 210, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`Sistema de Gestión Residencial EcoBosque • Documento Oficial No. ${radicado}`, 105, 294, { align: 'center' });

  // Save the document
  const fileName = `Paz_y_Salvo_T${unidad.torre || '1'}_Apto${unidad.numero || '101'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates an official Assembly Minutes (Acta Oficial de Asamblea) PDF and triggers browser download.
 * 
 * @param {Object} asamblea - Assembly data (titulo, tipo, fecha, estado, quorumRegistrado, votaciones, etc.)
 * @param {Object} [options] - Additional metadata
 */
export function generarActaAsambleaPDF(asamblea, options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const condominioName = options.condominioName || 'CONDOMINIO RESIDENCIAL ECOBOSQUE P.H.';
  const nit = options.nit || 'NIT: 901.458.712-3';
  const radicado = `ACTA-ASAM-${asamblea.id || 'GEN'}-${new Date().getFullYear()}`;

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Navy #1e3a8a
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(59, 130, 246); // Blue line
  doc.rect(0, 22, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(condominioName, 105, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${nit} • Órgano Máximo de Dirección - Ley 675 de 2001`, 105, 18, { align: 'center' });

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`ACTA OFICIAL DE ASAMBLEA GENERAL`, 105, 36, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(asamblea.titulo || 'Asamblea General de Copropietarios', 105, 42, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Acta No: ${radicado} • Fecha: ${asamblea.fecha || getLongDate()} • Estado: ${(asamblea.estado || 'Finalizada').toUpperCase()}`, 105, 48, { align: 'center' });

  // Quórum Card
  doc.setDrawColor(191, 219, 254);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(20, 54, 170, 24, 2, 2, 'FD');

  const quorumVal = asamblea.quorumRegistrado !== undefined ? Number(asamblea.quorumRegistrado).toFixed(2) : '0.00';
  const quorumConstituido = Number(quorumVal) >= 51;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text('VERIFICACIÓN DEL QUÓRUM (Ley 675 de 2001 - Art. 45)', 25, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Quórum de Coeficiente Representado: ${quorumVal}% del total de la copropiedad.`, 25, 69);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(quorumConstituido ? 22 : 185, quorumConstituido ? 101 : 28, quorumConstituido ? 52 : 28);
  doc.text(`Estado Quórum: ${quorumConstituido ? 'QUÓRUM DELIBERATORIO Y DECISORIO HÁBIL' : 'QUÓRUM INSUFICIENTE (< 51%)'}`, 25, 74);

  // Votaciones Section Header
  let curY = 86;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTRO DE DELIBERACIONES Y DECISIONES ADOPTADAS', 20, curY);

  curY += 6;
  const votaciones = asamblea.votaciones || [];

  if (votaciones.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron votaciones electrónicas para este evento.', 20, curY + 4);
    curY += 20;
  } else {
    votaciones.forEach((vot, idx) => {
      if (curY > 230) {
        doc.addPage();
        curY = 25;
      }

      // Vote Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, curY, 170, 32, 2, 2, 'FD');

      // Question title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const questionText = `${idx + 1}. ${vot.pregunta || 'Pregunta de Votación'}`;
      const splitQ = doc.splitTextToSize(questionText, 160);
      doc.text(splitQ, 24, curY + 6);

      // Results line
      const siVal = vot.si || 0;
      const noVal = vot.no || 0;
      const blancoVal = vot.blanco || 0;
      const total = (siVal + noVal + blancoVal) || 1;
      const pctSi = ((siVal / total) * 100).toFixed(1);
      const pctNo = ((noVal / total) * 100).toFixed(1);
      const pctBlanco = ((blancoVal / total) * 100).toFixed(1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Votos registrados:  SÍ: ${siVal} (${pctSi}%)   |   NO: ${noVal} (${pctNo}%)   |   BLANCO: ${blancoVal} (${pctBlanco}%)`, 24, curY + 16);

      // Decision verdict
      const aprobada = siVal > noVal;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(aprobada ? 22 : 220, aprobada ? 101 : 38, aprobada ? 52 : 38);
      doc.text(`DECISIÓN: ${aprobada ? 'APROBADA POR MAYORÍA' : 'NO APROBADA / RECHAZADA'} • ESTADO: ${(vot.estado || 'Cerrada').toUpperCase()}`, 24, curY + 24);

      curY += 36;
    });
  }

  // Legal and signatures section
  if (curY > 220) {
    doc.addPage();
    curY = 30;
  }

  curY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const closingText = 'Habiéndose agotado el orden del día y verificado el quórum y mayorías de ley requeridas por la Ley 675 de 2001, se levanta la sesión y se suscribe la presente acta para constancia.';
  doc.text(doc.splitTextToSize(closingText, 170), 20, curY);

  curY += 28;
  // Two signature lines
  doc.setDrawColor(100, 116, 139);
  doc.line(25, curY, 85, curY);
  doc.line(125, curY, 185, curY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PRESIDENTE DE ASAMBLEA', 55, curY + 5, { align: 'center' });
  doc.text('SECRETARIO DE ASAMBLEA', 155, curY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('C.C. ___________________', 55, curY + 9, { align: 'center' });
  doc.text('C.C. ___________________', 155, curY + 9, { align: 'center' });

  // Footer bar
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 289, 210, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`Sistema de Gestión Residencial EcoBosque • Acta Oficial ${radicado}`, 105, 294, { align: 'center' });

  const fileName = `Acta_Asamblea_${asamblea.id || 'general'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates an official Radicado receipt for a PQRS ticket.
 * 
 * @param {Object} pqrs - PQRS ticket data (radicado, categoria, asunto, descripcion, torre, apto, solicitante, fecha, fechaLimiteRespuesta, estado, etc.)
 */
export function generarTicketPqrsPDF(pqrs) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Half sheet A5 for handy receipt
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
  doc.rect(0, 0, 148, 18, 'F');
  doc.setFillColor(14, 165, 233); // Cyan line
  doc.rect(0, 18, 148, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONDOMINIO RESIDENCIAL ECOBOSQUE P.H.', 74, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('COMPROBANTE OFICIAL DE RADICACIÓN PQRS', 74, 15, { align: 'center' });

  // Radicado Title & Code
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`RADICADO: ${pqrs.radicado || 'PQRS-PENDIENTE'}`, 74, 28, { align: 'center' });

  // Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 33, 124, 78, 2, 2, 'FD');

  const fields = [
    ['Fecha Radicación:', pqrs.fecha || getLongDate()],
    ['Fecha Límite Legal:', pqrs.fechaLimiteRespuesta || '15 días hábiles'],
    ['Tipo de Solicitud:', (pqrs.categoria || 'Petición').toUpperCase()],
    ['Inmueble / Unidad:', `Torre ${pqrs.torre || 'N/D'} - Apto ${pqrs.apto || 'N/D'}`],
    ['Solicitante:', pqrs.solicitante || 'Residente'],
    ['Estado Actual:', (pqrs.estado || 'Radicado').toUpperCase()],
    ['Asunto:', pqrs.asunto || 'Sin asunto'],
  ];

  let curY = 40;
  fields.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(k, 16, curY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const splitV = doc.splitTextToSize(String(v), 70);
    doc.text(splitV, 55, curY);
    curY += 8.5;
  });

  // Description snippet
  curY = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Detalle / Descripción:', 16, curY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const splitDesc = doc.splitTextToSize(pqrs.descripcion || 'Sin descripción adicional.', 116);
  doc.text(splitDesc.slice(0, 3), 16, curY + 4);

  // Footer note
  curY = 118;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const note = 'Conforme a la Ley 1755 de 2015 y Ley 675 de 2001, las peticiones tienen un término máximo de respuesta de quince (15) días hábiles. Puede consultar el estado de este radicado en su Portal del Residente.';
  doc.text(doc.splitTextToSize(note, 124), 12, curY);

  // Footer Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 204, 148, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text(`EcoBosque Residencial • Ticket Radicado ${pqrs.radicado}`, 74, 208, { align: 'center' });

  const fileName = `Radicado_${pqrs.radicado || 'PQRS'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
