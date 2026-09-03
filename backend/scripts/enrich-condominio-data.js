const fs = require('fs');

// 1. ENRIQUECER UNIDADES CON BODEGAS Y BICICLETEROS
const unidades = JSON.parse(fs.readFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/unidades.json', 'utf8'));

unidades.forEach((u, idx) => {
  const numTorre = u.torre.replace('Torre ', '');
  // Asignar Bodega: 70% de apartamentos tienen cuarto útil / bodega
  if (idx % 3 !== 0) {
    u.bodega = `B-${numTorre}${u.numero}`;
  } else {
    u.bodega = null;
  }

  // Asignar Bicicletero Privado: 60% de apartamentos tienen cupo en bicicletero
  if (idx % 2 === 0) {
    u.bicicletero = `BIC-${String((idx % 40) + 1).padStart(2, '0')}`;
  } else {
    u.bicicletero = null;
  }
});

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/unidades.json', JSON.stringify(unidades, null, 2));
console.log(`✓ Actualizadas ${unidades.length} unidades con Bodegas y Bicicleteros`);

// 2. ENRIQUECER PAQUETES CON RECIBOS PÚBLICOS Y ENCOMIENDAS
const paquetes = [
  // Paquetes habituales
  {
    id: "pkg-101",
    categoria: "encomienda",
    unidadId: "t1-101",
    torre: "Torre 1",
    apto: "101",
    destinatario: "Carlos Alberto Gómez",
    empresa: "Servientrega",
    guia: "SER-9823412",
    descripcion: "Caja mediana de Amazon",
    estado: "recibido",
    fechaIngreso: new Date(Date.now() - 3600000 * 5).toISOString(),
    fechaEntrega: null,
    guardaIngreso: "Carlos Méndez",
    guardaEntrega: null,
    codigoRetiro: "4821",
    retiradoPor: null
  },
  {
    id: "pkg-102",
    categoria: "encomienda",
    unidadId: "t2-201",
    torre: "Torre 2",
    apto: "201",
    destinatario: "Andrés Felipe Quintana",
    empresa: "Mercado Libre",
    guia: "MELI-4499120",
    descripcion: "Sobre Manila - Repuestos",
    estado: "notificado",
    fechaIngreso: new Date(Date.now() - 3600000 * 2).toISOString(),
    fechaEntrega: null,
    guardaIngreso: "Jhon Beltrán",
    guardaEntrega: null,
    codigoRetiro: "1903",
    retiradoPor: null
  },
  // Recibos Públicos (Algunos recientes y otros con mora de más de 30 y 60 días sin reclamar)
  {
    id: "rec-201",
    categoria: "recibo_publico",
    tipoRecibo: "Acueducto y Alcantarillado (Agua)",
    unidadId: "t1-203",
    torre: "Torre 1",
    apto: "203",
    destinatario: "Titular Inmueble 203",
    empresa: "Empresa de Acueducto",
    mesFacturado: "Julio 2026",
    valorFactura: 85400,
    estado: "recibido",
    fechaIngreso: new Date(Date.now() - 86400000 * 48).toISOString(), // 48 días sin retirar
    fechaEntrega: null,
    guardaIngreso: "Pedro Martínez",
    guardaEntrega: null,
    codigoRetiro: "REC-203",
    retiradoPor: null,
    observacion: "⚠️ FACTURA ACUMULADA: 48 días en casillero sin reclamar"
  },
  {
    id: "rec-202",
    categoria: "recibo_publico",
    tipoRecibo: "Energía Eléctrica (Luz)",
    unidadId: "t3-401",
    torre: "Torre 3",
    apto: "401",
    destinatario: "Titular Inmueble 401",
    empresa: "Enel / Codensa",
    mesFacturado: "Junio 2026",
    valorFactura: 142000,
    estado: "recibido",
    fechaIngreso: new Date(Date.now() - 86400000 * 65).toISOString(), // 65 días sin retirar
    fechaEntrega: null,
    guardaIngreso: "Nelson Morales",
    guardaEntrega: null,
    codigoRetiro: "REC-401",
    retiradoPor: null,
    observacion: "⚠️ URGENTE: 2do aviso de corte por no retiro de factura"
  },
  {
    id: "rec-203",
    categoria: "recibo_publico",
    tipoRecibo: "Gas Natural",
    unidadId: "t1-102",
    torre: "Torre 1",
    apto: "102",
    destinatario: "Laura Marcela Pérez",
    empresa: "Vanti Gas Natural",
    mesFacturado: "Agosto 2026",
    valorFactura: 34900,
    estado: "recibido",
    fechaIngreso: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 días
    fechaEntrega: null,
    guardaIngreso: "Carlos Méndez",
    guardaEntrega: null,
    codigoRetiro: "REC-102",
    retiradoPor: null,
    observacion: "Factura vigente del mes actual"
  },
  {
    id: "rec-204",
    categoria: "recibo_publico",
    tipoRecibo: "Internet & Telefonía",
    unidadId: "t4-302",
    torre: "Torre 4",
    apto: "302",
    destinatario: "Claudia Patricia Vargas",
    empresa: "Claro Telecomunicaciones",
    mesFacturado: "Agosto 2026",
    valorFactura: 119900,
    estado: "entregado",
    fechaIngreso: new Date(Date.now() - 86400000 * 5).toISOString(),
    fechaEntrega: new Date(Date.now() - 86400000 * 1).toISOString(),
    guardaIngreso: "Carlos Méndez",
    guardaEntrega: "Nelson Morales",
    codigoRetiro: "REC-302",
    retiradoPor: "Claudia Vargas (Titular)"
  }
];

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/paquetes.json', JSON.stringify(paquetes, null, 2));
console.log(`✓ Actualizado paquetes.json con ${paquetes.length} registros (Encomiendas y Recibos Públicos)`);

// 3. ENRIQUECER ACCESOS CON HISTORIAL COMPLETO
const accesos = [
  {
    id: "acc-101",
    tipo: "visitante",
    nombre: "Santiago Valencia",
    documento: "1032445890",
    unidadId: "t1-101",
    torre: "Torre 1",
    apto: "101",
    motivo: "Visita familiar",
    vehiculo: { placa: "KLP890", tipo: "carro" },
    fechaIngreso: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    fechaSalida: null,
    estado: "en_conjunto",
    autorizadoPor: "Carlos Alberto Gómez (Propietario)",
    guarda: "Carlos Méndez"
  },
  {
    id: "acc-102",
    tipo: "domicilio",
    nombre: "Julián Castro (Rappi)",
    documento: "80774411",
    unidadId: "t2-401",
    torre: "Torre 2",
    apto: "401",
    motivo: "Entrega de Domicilio",
    vehiculo: { placa: "MTO45E", tipo: "moto" },
    fechaIngreso: new Date(Date.now() - 60000 * 18).toISOString(),
    fechaSalida: null,
    estado: "en_conjunto",
    autorizadoPor: "Mauricio Restrepo",
    guarda: "Jhon Beltrán"
  },
  {
    id: "acc-103",
    tipo: "contratista",
    nombre: "Héctor Fabio (Electricista)",
    documento: "19445871",
    unidadId: "t1-302",
    torre: "Torre 1",
    apto: "302",
    motivo: "Arreglo de breakers eléctricos",
    vehiculo: null,
    fechaIngreso: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    fechaSalida: new Date(Date.now() - 3600000 * 1).toISOString(),
    estado: "finalizado",
    autorizadoPor: "Diana Carolina Jaramillo",
    guarda: "Carlos Méndez"
  },
  {
    id: "acc-104",
    tipo: "visitante",
    nombre: "Marcela Bermúdez",
    documento: "52899441",
    unidadId: "t3-501",
    torre: "Torre 3",
    apto: "501",
    motivo: "Reunión de trabajo",
    vehiculo: { placa: "WTR992", tipo: "carro" },
    fechaIngreso: new Date(Date.now() - 3600000 * 6).toISOString(),
    fechaSalida: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    estado: "finalizado",
    autorizadoPor: "Santiago Henao",
    guarda: "Nelson Morales"
  }
];

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/accesos.json', JSON.stringify(accesos, null, 2));
console.log(`✓ Actualizado accesos.json con registros activos e histórico`);