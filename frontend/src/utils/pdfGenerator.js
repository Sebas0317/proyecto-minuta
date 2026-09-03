import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';

/**
 * ReportPDF - Generate PDF documents for Proyecto Minuta
 */
export function generateMinutaPDF(novedades = []) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROYECTO MINUTA', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Libro Oficial de Minuta y Novedades de Seguridad', pageWidth / 2, 28, {
    align: 'center',
  });

  // Divider
  doc.setDrawColor(16, 185, 129);
  doc.line(20, 35, pageWidth - 20, 35);

  let y = 45;
  novedades.slice(0, 15).forEach((item, index) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. [${item.severidad?.toUpperCase() || 'INFO'}] ${item.titulo || 'Novedad'} - ${item.tipo}`, 20, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${format(new Date(item.fecha), 'PPpp', { locale: es })} | Guarda: ${item.guarda || 'Vigilante'}`, 25, y);
    y += 5;

    const descLines = doc.splitTextToSize(item.descripcion || '', pageWidth - 50);
    doc.text(descLines, 25, y);
    y += (descLines.length * 4) + 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generado: ${format(new Date(), 'PPpp', { locale: es })}`,
    pageWidth / 2,
    280,
    { align: 'center' }
  );
  doc.text('Proyecto Minuta — Sistema de Seguridad y Vigilancia Residencial', pageWidth / 2, 285, {
    align: 'center',
  });

  return doc;
}

export function downloadMinutaPDF(novedades) {
  const doc = generateMinutaPDF(novedades);
  const filename = `Minuta_Oficial_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

export default { generateMinutaPDF, downloadMinutaPDF };