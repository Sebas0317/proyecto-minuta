const fs = require('fs');

const path = 'c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components/PorteriaDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ensure lucide-react has needed icons
if (!content.includes('Receipt')) {
  content = content.replace(
    "import { \n  Shield, Search, UserCheck, Package, Car, AlertTriangle,",
    "import { \n  Shield, Search, UserCheck, Package, Car, AlertTriangle, Receipt, FileText, Droplets, Zap, Flame, Wifi,"
  );
}

// 2. Add recibo state declarations
if (!content.includes('showReciboModal')) {
  content = content.replace(
    "  const [showEntregaModal, setShowEntregaModal] = useState(null);\n  const [tabVisitas, setTabVisitas] = useState('activos');",
    `  const [showEntregaModal, setShowEntregaModal] = useState(null);
  const [showReciboModal, setShowReciboModal] = useState(false);
  const [tabVisitas, setTabVisitas] = useState('activos');

  const [reciboForm, setReciboForm] = useState({
    torre: 'Torre 1',
    apto: '',
    tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
    empresa: 'Empresa de Acueducto',
    mesFacturado: 'Septiembre 2026',
    valorFactura: '',
    destinatario: 'Titular Inmueble'
  });`
  );
}

// 3. Add handlers for receipts
if (!content.includes('handleRegistrarRecibo')) {
  content = content.replace(
    "  const handleRegistrarPaquete = async (e) => {",
    `  const handleRegistrarRecibo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoria: 'recibo_publico',
        tipoRecibo: reciboForm.tipoRecibo,
        empresa: reciboForm.empresa,
        mesFacturado: reciboForm.mesFacturado,
        valorFactura: Number(reciboForm.valorFactura) || 0,
        torre: reciboForm.torre,
        apto: String(reciboForm.apto),
        destinatario: reciboForm.destinatario || \`Titular Inmueble \${reciboForm.apto}\`,
        guia: \`REC-\${reciboForm.apto}-\${Date.now().toString().slice(-4)}\`,
        descripcion: \`Factura de \${reciboForm.tipoRecibo} - \${reciboForm.mesFacturado}\`,
        codigoRetiro: \`REC-\${reciboForm.apto}\`
      };
      await createPaquete(payload);
      toast.success(\`Recibo de \${reciboForm.tipoRecibo} para \${reciboForm.torre} Apto \${reciboForm.apto} registrado en casillero\`);
      setShowReciboModal(false);
      setReciboForm({
        torre: 'Torre 1',
        apto: '',
        tipoRecibo: 'Acueducto y Alcantarillado (Agua)',
        empresa: 'Empresa de Acueducto',
        mesFacturado: 'Septiembre 2026',
        valorFactura: '',
        destinatario: 'Titular Inmueble'
      });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error al registrar recibo público');
    }
  };

  const handleEntregarReciboDirecto = async (recibo) => {
    const quien = window.prompt(\`Entregar recibo de \${recibo.tipoRecibo || recibo.empresa} para \${recibo.torre} Apto \${recibo.apto}.\\n\\n¿Quién retira la factura?:\`, 'Residente');
    if (!quien) return;
    try {
      await entregarPaquete(recibo.id, { retiradoPor: quien, codigoRetiro: recibo.codigoRetiro });
      toast.success(\`Recibo entregado a \${quien}\`);
      loadData();
    } catch (err) {
      toast.error('Error al entregar recibo');
    }
  };

  const handleRegistrarPaquete = async (e) => {`
  );
}

fs.writeFileSync(path, content);
console.log('✓ Part 1 updated in PorteriaDashboard.jsx');