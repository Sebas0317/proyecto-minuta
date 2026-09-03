'use strict';

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '..');

// ── 1. ACCESOS Y VISITANTES ──
const now = new Date();
const isoNow = now.toISOString();

const accesosData = [
  {
    id: 'acc-1001',
    tipo: 'visitante',
    nombre: 'Carlos Eduardo Ramírez',
    documento: '1020304050',
    unidadId: 't1-101',
    torre: 'Torre 1',
    apto: '101',
    motivo: 'Visita familiar a Mariana Rodríguez',
    vehiculo: { tipo: 'carro', placa: 'HJK892' },
    parqueaderoAsignado: 'V-02',
    fechaIngreso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    fechaSalida: null,
    estado: 'en_conjunto',
    autorizadoPor: 'Mariana Rodríguez',
    guarda: 'Guarda Rodríguez'
  },
  {
    id: 'acc-1002',
    tipo: 'domicilio',
    nombre: 'Jhonathan Gómez (Rappi)',
    documento: '1098765432',
    unidadId: 't1-204',
    torre: 'Torre 1',
    apto: '204',
    motivo: 'Entrega de pedido farmacia',
    vehiculo: { tipo: 'moto', placa: 'KLR45F' },
    parqueaderoAsignado: 'M-01',
    fechaIngreso: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    fechaSalida: null,
    estado: 'en_conjunto',
    autorizadoPor: 'Residente Apto 204',
    guarda: 'Guarda Rodríguez'
  },
  {
    id: 'acc-1003',
    tipo: 'contratista',
    nombre: 'Mario Alberto Veloza (Técnico Claro)',
    documento: '79845123',
    unidadId: 't2-302',
    torre: 'Torre 2',
    apto: '302',
    motivo: 'Instalación de fibra óptica',
    vehiculo: { tipo: 'carro', placa: 'CXW781' },
    parqueaderoAsignado: 'V-04',
    fechaIngreso: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    fechaSalida: null,
    estado: 'en_conjunto',
    autorizadoPor: 'Copropietario Torre 2',
    guarda: 'Guarda Martínez'
  },
  {
    id: 'acc-1004',
    tipo: 'visitante',
    nombre: 'Ana María Restrepo',
    documento: '52899441',
    unidadId: 't3-102',
    torre: 'Torre 3',
    apto: '102',
    motivo: 'Reunión de trabajo',
    vehiculo: null,
    parqueaderoAsignado: null,
    fechaIngreso: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    fechaSalida: null,
    estado: 'en_conjunto',
    autorizadoPor: 'Residente Titular',
    guarda: 'Guarda Rodríguez'
  },
  {
    id: 'acc-1005',
    tipo: 'familiar',
    nombre: 'Santiago Andrés Morales',
    documento: '1032445890',
    unidadId: 't1-101',
    torre: 'Torre 1',
    apto: '101',
    motivo: 'Visita de fin de semana',
    vehiculo: { tipo: 'carro', placa: 'NMO345' },
    parqueaderoAsignado: null,
    fechaIngreso: null,
    fechaSalida: null,
    fechaEsperada: new Date().toISOString().split('T')[0],
    estado: 'preautorizado',
    paseQR: 'PASS-8841',
    autorizadoPor: 'Mariana Rodríguez',
    guarda: 'Portal Residente'
  },
  {
    id: 'acc-1006',
    tipo: 'domicilio',
    nombre: 'Mensajero MercadoLibre',
    documento: '1014228990',
    unidadId: 't1-102',
    torre: 'Torre 1',
    apto: '102',
    motivo: 'Entrega paquete voluminoso',
    vehiculo: { tipo: 'carro', placa: 'WEO990' },
    parqueaderoAsignado: null,
    fechaIngreso: null,
    fechaSalida: null,
    fechaEsperada: new Date().toISOString().split('T')[0],
    estado: 'preautorizado',
    paseQR: 'PASS-3920',
    autorizadoPor: 'Laura Marcela Pérez',
    guarda: 'Portal Residente'
  },
  {
    id: 'acc-1007',
    tipo: 'tecnico',
    nombre: 'Ing. David Pardo (Mantenimiento Ascensor)',
    documento: '80456123',
    unidadId: 't4-501',
    torre: 'Torre 4',
    apto: '501',
    motivo: 'Inspección bimestral de tracción',
    vehiculo: { tipo: 'carro', placa: 'UPZ220' },
    parqueaderoAsignado: 'V-08',
    fechaIngreso: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    fechaSalida: null,
    estado: 'en_conjunto',
    autorizadoPor: 'Administración',
    guarda: 'Guarda Rodríguez'
  },
  {
    id: 'acc-1008',
    tipo: 'visitante',
    nombre: 'Camilo Ernesto Daza',
    documento: '1019003445',
    unidadId: 't2-201',
    torre: 'Torre 2',
    apto: '201',
    motivo: 'Almuerzo familiar',
    vehiculo: { tipo: 'carro', placa: 'JIK678' },
    parqueaderoAsignado: 'V-06',
    fechaIngreso: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    fechaSalida: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estado: 'finalizado',
    autorizadoPor: 'Residente Apto 201',
    guarda: 'Guarda Martínez'
  }
];

// ── 2. PARQUEADEROS CON BAHÍAS DE VISITANTES Y PRIVADOS ──
const parqueaderosData = [
  { id: 'V-01', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-02', categoria: 'visitantes', tipo: 'carro', estado: 'ocupado', placa: 'HJK892', apto: '101', torre: 'Torre 1', horaIngreso: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'V-03', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-04', categoria: 'visitantes', tipo: 'carro', estado: 'ocupado', placa: 'CXW781', apto: '302', torre: 'Torre 2', horaIngreso: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
  { id: 'V-05', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-06', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-07', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-08', categoria: 'visitantes', tipo: 'carro', estado: 'ocupado', placa: 'UPZ220', apto: '501', torre: 'Torre 4', horaIngreso: new Date(Date.now() - 140 * 60 * 1000).toISOString() },
  { id: 'V-09', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-10', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-11', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'V-12', categoria: 'visitantes', tipo: 'carro', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'M-01', categoria: 'visitantes', tipo: 'moto', estado: 'ocupado', placa: 'KLR45F', apto: '204', torre: 'Torre 1', horaIngreso: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'M-02', categoria: 'visitantes', tipo: 'moto', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'M-03', categoria: 'visitantes', tipo: 'moto', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null },
  { id: 'M-04', categoria: 'visitantes', tipo: 'moto', estado: 'disponible', placa: null, apto: null, torre: null, horaIngreso: null }
];

// Generar bahías privadas para las unidades
for (let t = 1; t <= 5; t++) {
  for (let a = 101; a <= 104; a++) {
    parqueaderosData.push({
      id: `P-${t}${a}`,
      categoria: 'privado',
      tipo: 'carro',
      estado: 'ocupado',
      placa: `KLM${t}${a}`,
      apto: String(a),
      torre: `Torre ${t}`,
      horaIngreso: null
    });
  }
}

// ── 3. PAQUETERÍA Y RECIBOS ──
const paquetesData = [
  {
    id: 'pkg-101',
    categoria: 'encomienda',
    torre: 'Torre 1',
    apto: '101',
    destinatario: 'Mariana Rodríguez',
    empresa: 'Servientrega',
    guia: 'SER-9948201',
    descripcion: 'Caja mediana de ropa y accesorios',
    codigoRetiro: '8832',
    fechaIngreso: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Rodríguez',
    notificadoWhatsapp: true
  },
  {
    id: 'pkg-102',
    categoria: 'recibo_publico',
    torre: 'Torre 1',
    apto: '101',
    tipoRecibo: 'Enel-Codensa',
    mesFacturado: 'Agosto 2026',
    destinatario: 'Titular Apto 101',
    guia: 'REC-ENEL-101',
    descripcion: 'Factura de Energía Eléctrica',
    codigoRetiro: '4410',
    fechaIngreso: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Rodríguez',
    notificadoWhatsapp: false
  },
  {
    id: 'pkg-103',
    categoria: 'encomienda',
    torre: 'Torre 1',
    apto: '102',
    destinatario: 'Laura Marcela Pérez',
    empresa: 'Amazon / Coordinadora',
    guia: 'AMZ-CO-88123',
    descripcion: 'Sobre acolchado con repuestos electrónicos',
    codigoRetiro: '5192',
    fechaIngreso: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Rodríguez',
    notificadoWhatsapp: true
  },
  {
    id: 'pkg-104',
    categoria: 'encomienda',
    torre: 'Torre 2',
    apto: '201',
    destinatario: 'Carlos Mario Benítez',
    empresa: 'MercadoLibre',
    guia: 'ML-77884102',
    descripcion: 'Caja con artículos para el hogar',
    codigoRetiro: '9034',
    fechaIngreso: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Martínez',
    notificadoWhatsapp: true
  },
  {
    id: 'pkg-105',
    categoria: 'recibo_publico',
    torre: 'Torre 2',
    apto: '204',
    tipoRecibo: 'Vanti Gas Natural',
    mesFacturado: 'Agosto 2026',
    destinatario: 'Titular Apto 204',
    guia: 'REC-VANTI-204',
    descripcion: 'Recibo servicio de gas',
    codigoRetiro: '3318',
    fechaIngreso: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Martínez',
    notificadoWhatsapp: false
  },
  {
    id: 'pkg-106',
    categoria: 'encomienda',
    torre: 'Torre 3',
    apto: '301',
    destinatario: 'Gabriel Sanabria',
    empresa: 'Interrapidísimo',
    guia: 'INT-400192',
    descripcion: 'Documentos legales en sobre sellado',
    codigoRetiro: '7721',
    fechaIngreso: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    fechaEntrega: null,
    retiradoPor: null,
    estado: 'recibido',
    guarda: 'Guarda Rodríguez',
    notificadoWhatsapp: true
  },
  {
    id: 'pkg-107',
    categoria: 'encomienda',
    torre: 'Torre 1',
    apto: '101',
    destinatario: 'Mariana Rodríguez',
    empresa: 'FedEx',
    guia: 'FDX-112233',
    descripcion: 'Paquete de libros',
    codigoRetiro: '1209',
    fechaIngreso: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    fechaEntrega: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    retiradoPor: 'Mariana Rodríguez (Titular)',
    estado: 'entregado',
    guarda: 'Guarda Rodríguez',
    notificadoWhatsapp: true
  }
];

// ── 4. MINUTA DIGITAL OFICIAL DE NOVEDADES ──
const minutaData = [
  {
    id: 'min-101',
    tipo: 'entrega_turno',
    titulo: 'Relevo de Guardia Diurno 06:00 - 18:00',
    descripcion: 'Se recibe puesto de portería principal sin novedades de seguridad. Armamento y libro de minuta al día. 4 radios portátiles Motorola con batería cargada al 100%. Sistema de CCTV operando con normalidad en las 24 cámaras activas.',
    severidad: 'info',
    guarda: 'Guarda Rodríguez',
    fecha: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    id: 'min-102',
    tipo: 'recorrido',
    titulo: 'Ronda de Inspección Perimetral y Sótanos',
    descripcion: 'Se efectúa ronda completa por sótanos 1 y 2, cuarto de bombas hidráulicas y shut de basuras. Se verifica que no hay fugas de agua y que los extintores se encuentran con manómetro en rango verde.',
    severidad: 'info',
    guarda: 'Guarda Martínez',
    fecha: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'min-103',
    tipo: 'mantenimiento',
    titulo: 'Prueba Semanal de Planta Eléctrica y Motobombas',
    descripcion: 'Ingresa técnico de planta de emergencia Diésel Cummins. Se realiza encendido de prueba por 15 minutos sin carga. Niveles de ACPM y refrigerante en rango óptimo.',
    severidad: 'info',
    guarda: 'Guarda Rodríguez',
    fecha: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'min-104',
    tipo: 'seguridad',
    titulo: 'Vehículo en Bahía de Visitantes excediendo tiempo',
    descripcion: 'Vehículo Mazda 3 de placas KLP890 en bahía V-02 supera las 4 horas de cortesía permitidas. Se contacta vía citófono al Apto 101 para solicitar reubicación a parqueadero privado.',
    severidad: 'warning',
    guarda: 'Guarda Rodríguez',
    fecha: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'min-105',
    tipo: 'general',
    titulo: 'Recepción de Encomiendas y Facturación de Servicios',
    descripcion: 'Se reciben 12 paquetes de Servientrega y Coordinadora y 45 facturas de energía Enel. Se ingresan en el sistema digital de casillero y se despachan notificaciones con PIN a los residentes.',
    severidad: 'info',
    guarda: 'Guarda Rodríguez',
    fecha: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  }
];

// ── 5. RESERVAS DE ZONAS COMUNES ──
const reservasData = [
  {
    id: 'res-101',
    espacio: '⚽ Cancha Sintética Fútbol 5',
    torre: 'Torre 1',
    apto: '101',
    solicitante: 'Mariana Rodríguez',
    telefono: '3111004567',
    fechaReserva: new Date().toISOString().split('T')[0],
    horaInicio: '19:00',
    horaFin: '20:30',
    observaciones: 'Partido amistoso residentes Torre 1 vs Torre 2',
    estado: 'confirmada',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'res-102',
    espacio: '🍖 Zona BBQ & Asador 1',
    torre: 'Torre 2',
    apto: '302',
    solicitante: 'Carlos Mario Benítez',
    telefono: '3152003344',
    fechaReserva: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    horaInicio: '12:00',
    horaFin: '16:00',
    observaciones: 'Almuerzo familiar domingo. Depósito de $50.000 verificado.',
    estado: 'confirmada',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 'res-103',
    espacio: '🎉 Salón Social de Eventos',
    torre: 'Torre 3',
    apto: '201',
    solicitante: 'Valentina Restrepo',
    telefono: '3187766554',
    fechaReserva: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    horaInicio: '15:00',
    horaFin: '22:00',
    observaciones: 'Cumpleaños infantil. Depósito de garantía $200.000 depositado en administración.',
    estado: 'confirmada',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  }
];

// ── 6. ASAMBLEAS & VOTACIONES LEY 675 ──
const asambleasData = [
  {
    id: 'asm-2026-01',
    titulo: 'Asamblea General Ordinaria de Copropietarios 2026',
    fecha: '2026-09-15',
    horaInicio: '08:00 AM',
    estado: 'en_curso',
    quorumRegistrado: 72.45,
    totalCoeficiente: 100,
    votaciones: [
      {
        id: 'vot-01',
        pregunta: '¿Aprueba el Presupuesto General de Gastos e Inversión para el periodo 2026-2027?',
        opciones: {
          si: 65.20,
          no: 4.80,
          blanco: 2.45
        },
        totalVotado: 72.45,
        estado: 'abierta'
      },
      {
        id: 'vot-02',
        pregunta: '¿Autoriza la instalación del nuevo sistema de circuito cerrado de cámaras y control biométrico en acceso vehicular?',
        opciones: {
          si: 58.90,
          no: 10.15,
          blanco: 3.40
        },
        totalVotado: 72.45,
        estado: 'abierta'
      }
    ]
  }
];

// ── 7. EQUIPOS DE EMERGENCIA Y EXTINTORES ──
const equiposData = [
  {
    id: 'EXT-T1-P1',
    tipo: 'extintor',
    nombre: 'Extintor Pasillo Piso 1',
    ubicacion: 'Junto a puerta de acceso ascensor',
    torre: 1,
    piso: 1,
    capacidad: '20 Lbs',
    agente: 'Polvo Químico Seco (PQS)',
    fechaRecarga: '2026-01-15',
    fechaVencimiento: '2027-01-15',
    observaciones: 'Presión en verde, precinto de seguridad intacto.'
  },
  {
    id: 'EXT-T1-P2',
    tipo: 'extintor',
    nombre: 'Extintor Pasillo Piso 2',
    ubicacion: 'Frente a Apto 202',
    torre: 1,
    piso: 2,
    capacidad: '20 Lbs',
    agente: 'Polvo Químico Seco (PQS)',
    fechaRecarga: '2026-01-15',
    fechaVencimiento: '2027-01-15',
    observaciones: 'Inspección conforme.'
  },
  {
    id: 'EXT-T1-P3',
    tipo: 'extintor',
    nombre: 'Extintor Pasillo Piso 3',
    ubicacion: 'Frente a Apto 302',
    torre: 1,
    piso: 3,
    capacidad: '20 Lbs',
    agente: 'Polvo Químico Seco (PQS)',
    fechaRecarga: '2026-01-15',
    fechaVencimiento: '2027-01-15',
    observaciones: 'Inspección conforme.'
  },
  {
    id: 'EXT-T2-P1',
    tipo: 'extintor',
    nombre: 'Extintor Lobby Torre 2',
    ubicacion: 'Hall de entrada',
    torre: 2,
    piso: 1,
    capacidad: '20 Lbs',
    agente: 'Polvo Químico Seco (PQS)',
    fechaRecarga: '2026-01-15',
    fechaVencimiento: '2027-01-15',
    observaciones: 'Inspección conforme.'
  },
  {
    id: 'EXT-SOT-BOMB',
    tipo: 'extintor',
    nombre: 'Extintor Cuarto de Bombas',
    ubicacion: 'Sótano 1 - Cuarto Técnico',
    torre: 'Sótano',
    piso: -1,
    capacidad: '10 Lbs',
    agente: 'CO2 (Dióxido de Carbono)',
    fechaRecarga: '2026-03-10',
    fechaVencimiento: '2027-03-10',
    observaciones: 'Especial para equipos eléctricos y bombas.'
  },
  {
    id: 'DEA-PORT-01',
    tipo: 'botiquin',
    nombre: 'Desfibrilador Automático Externo (DEA) & Botiquín Tipo B',
    ubicacion: 'Portería Principal - Muro de Emergencias',
    torre: 'Portería',
    piso: 1,
    capacidad: 'Kit Completo',
    agente: 'Médico Primeros Auxilios',
    fechaRecarga: '2026-02-01',
    fechaVencimiento: '2027-02-01',
    observaciones: 'Batería del DEA al 100%, parches para adulto y pediátricos vigentes.'
  }
];

// ── 8. CENSO DE MASCOTAS ──
const mascotasData = [
  {
    id: 'pet-101',
    nombre: 'Max',
    especie: 'perro',
    raza: 'Golden Retriever',
    color: 'Dorado',
    edad: '3 años',
    apto: '101',
    torre: 'Torre 1',
    unidadId: 't1-101',
    propietario: 'Mariana Rodríguez',
    propietarioNombre: 'Mariana Rodríguez',
    telefono: '3111004567',
    telefonoContacto: '3111004567',
    vacunaAntirrabica: true,
    fechaVacuna: '2026-02-14',
    manejoEspecial: false,
    qrToken: 'PET-QR-T1101-MAX',
    observaciones: 'Dócil, carnet veterinario al día.'
  },
  {
    id: 'pet-102',
    nombre: 'Luna',
    especie: 'gato',
    raza: 'Siamés',
    color: 'Blanco con marrón',
    edad: '2 años',
    apto: '102',
    torre: 'Torre 1',
    unidadId: 't1-102',
    propietario: 'Laura Marcela Pérez',
    propietarioNombre: 'Laura Marcela Pérez',
    telefono: '3121009134',
    telefonoContacto: '3121009134',
    vacunaAntirrabica: true,
    fechaVacuna: '2026-03-20',
    manejoEspecial: false,
    qrToken: 'PET-QR-T1102-LUNA',
    observaciones: 'Esterilizada, vacunación completa.'
  },
  {
    id: 'pet-103',
    nombre: 'Rocky',
    especie: 'perro',
    raza: 'Pastor Alemán',
    color: 'Negro con fuego',
    edad: '4 años',
    apto: '204',
    torre: 'Torre 1',
    unidadId: 't1-204',
    propietario: 'Sergio Andrés Henao',
    propietarioNombre: 'Sergio Andrés Henao',
    telefono: '3145558900',
    telefonoContacto: '3145558900',
    vacunaAntirrabica: true,
    fechaVacuna: '2026-01-10',
    manejoEspecial: true,
    polizaResponsabilidad: 'POL-SEGUROS-88341',
    qrToken: 'PET-QR-T1204-ROCKY',
    observaciones: 'Uso obligatorio de bozal y correa en zonas comunes según Art. 18.'
  },
  {
    id: 'pet-104',
    nombre: 'Milo',
    especie: 'perro',
    raza: 'Beagle',
    color: 'Tricolor',
    edad: '1 año',
    apto: '302',
    torre: 'Torre 2',
    unidadId: 't2-302',
    propietario: 'Carlos Mario Benítez',
    propietarioNombre: 'Carlos Mario Benítez',
    telefono: '3152003344',
    telefonoContacto: '3152003344',
    vacunaAntirrabica: true,
    fechaVacuna: '2026-04-05',
    manejoEspecial: false,
    qrToken: 'PET-QR-T2302-MILO',
    observaciones: 'Microchip registrado en censo distrital.'
  }
];

// ── 9. RONDAS DE VIGILANCIA & PUNTOS QR ──
const rondasData = {
  puntosControl: [
    { id: 'QR-01', nombre: 'Portería Principal & Acceso Vehicular', torre: 'Portería', piso: 1, tag: 'PT-01' },
    { id: 'QR-02', nombre: 'Sótano 1 - Cuarto de Bombas & Tableros', torre: 'Sótano', piso: -1, tag: 'PT-02' },
    { id: 'QR-03', nombre: 'Sótano 2 - Planta Eléctrica Diésel', torre: 'Sótano', piso: -2, tag: 'PT-03' },
    { id: 'QR-04', nombre: 'Torre 1 - Terraza y Cuarto de Máquinas', torre: 'Torre 1', piso: 5, tag: 'PT-04' },
    { id: 'QR-05', nombre: 'Torre 2 - Terraza y Tanques de Reserva', torre: 'Torre 2', piso: 5, tag: 'PT-05' },
    { id: 'QR-06', nombre: 'Cancha Sintética & Zona BBQ', torre: 'Zonas Comunes', piso: 1, tag: 'PT-06' },
    { id: 'QR-07', nombre: 'Perímetro Trasero y Malla Electrificada', torre: 'Perímetro', piso: 1, tag: 'PT-07' }
  ],
  historialRondas: [
    {
      id: 'rnd-101',
      guarda: 'Guarda Rodríguez',
      fechaInicio: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      fechaFin: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      estado: 'completada',
      puntosEscaneados: 7,
      totalPuntos: 7,
      novedadesDetectadas: 'Sin novedades. Todas las puertas de acceso cerradas correctamente.'
    },
    {
      id: 'rnd-102',
      guarda: 'Guarda Martínez',
      fechaInicio: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
      fechaFin: new Date(Date.now() - 6.5 * 3600 * 1000).toISOString(),
      estado: 'completada',
      puntosEscaneados: 7,
      totalPuntos: 7,
      novedadesDetectadas: 'Iluminación perimetral operando al 100%.'
    }
  ]
};

// Guardar todos los archivos JSON en backend/
function saveJson(filename, data) {
  const filePath = path.join(BACKEND_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${filename} actualizado (${Array.isArray(data) ? data.length + ' registros' : 'objeto guardado'})`);
}

saveJson('accesos.json', accesosData);
saveJson('parqueaderos.json', parqueaderosData);
saveJson('paquetes.json', paquetesData);
saveJson('minuta.json', minutaData);
saveJson('reservas_zonas.json', reservasData);
saveJson('asambleas.json', asambleasData);
saveJson('equipos.json', equiposData);
saveJson('mascotas.json', mascotasData);
saveJson('rondas.json', rondasData);

console.log('\n🎉 ¡Todos los datos de Minuta, Parqueaderos, Visitantes, Rondas y Zonas Comunes han sido poblados exitosamente!');
