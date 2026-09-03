const fs = require('fs');

const rondasData = {
  puntosControl: [
    { id: "pc-1", nombre: "Sótano 2 - Bombas de Agua & Planta", ubicacion: "Sótano 2", qrToken: "QR-S2-BOMBAS-9921", orden: 1 },
    { id: "pc-2", nombre: "Sótano 1 - Cuarto de Basuras Principal", ubicacion: "Sótano 1", qrToken: "QR-S1-SHUT-8834", orden: 2 },
    { id: "pc-3", nombre: "Torre 1 - Hall & Escaleras de Emergencia", ubicacion: "Torre 1 Piso 1", qrToken: "QR-T1-HALL-1123", orden: 3 },
    { id: "pc-4", nombre: "Torre 3 - Terraza & Ascensores", ubicacion: "Torre 3 Piso 10", qrToken: "QR-T3-TERRAZA-3345", orden: 4 },
    { id: "pc-5", nombre: "Cerramiento Perimetral Norte", ubicacion: "Zona Exterior", qrToken: "QR-PERIMETRO-N-5567", orden: 5 },
    { id: "pc-6", nombre: "Zona Húmeda & Piscina", ubicacion: "Club House", qrToken: "QR-PISCINA-CH-7789", orden: 6 }
  ],
  registrosRondas: [
    {
      id: "rd-1",
      fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
      puntoId: "pc-1",
      nombrePunto: "Sótano 2 - Bombas de Agua & Planta",
      guarda: "Carlos Rodríguez",
      estado: "normal",
      observaciones: "Nivel de agua y presión de manómetros en rango normal. Sin fugas."
    },
    {
      id: "rd-2",
      fecha: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      puntoId: "pc-2",
      nombrePunto: "Sótano 1 - Cuarto de Basuras Principal",
      guarda: "Carlos Rodríguez",
      estado: "normal",
      observaciones: "Cuarto aseado y cerrado correctamente."
    },
    {
      id: "rd-3",
      fecha: new Date(Date.now() - 3600000).toISOString(),
      puntoId: "pc-3",
      nombrePunto: "Torre 1 - Hall & Escaleras de Emergencia",
      guarda: "Carlos Rodríguez",
      estado: "novedad",
      observaciones: "Lámpara de emergencia parpadeando en piso 4. Se notifica a mantenimiento."
    }
  ]
};

const reservasData = [
  {
    id: "res-1",
    espacio: "Cancha Sintética Fútbol 5",
    apto: "102",
    torre: "1",
    solicitante: "Andrés Cepeda",
    telefono: "311 445 6677",
    fechaReserva: new Date().toISOString().split('T')[0],
    horaInicio: "18:00",
    horaFin: "19:30",
    estado: "confirmada",
    deposito: 0,
    observaciones: "Partido amistoso residentes Torre 1"
  },
  {
    id: "res-2",
    espacio: "Zona BBQ & Asador 1",
    apto: "201",
    torre: "2",
    solicitante: "Mariana Gómez",
    telefono: "315 889 0011",
    fechaReserva: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    horaInicio: "12:00",
    horaFin: "16:00",
    estado: "confirmada",
    deposito: 50000,
    observaciones: "Almuerzo familiar cumpleaños"
  },
  {
    id: "res-3",
    espacio: "Salón Social de Eventos",
    apto: "305",
    torre: "3",
    solicitante: "Felipe Morales",
    telefono: "320 554 9988",
    fechaReserva: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    horaInicio: "16:00",
    horaFin: "23:00",
    estado: "confirmada",
    deposito: 200000,
    observaciones: "Reunión de aniversario - Paz y salvo verificado"
  }
];

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/rondas.json', JSON.stringify(rondasData, null, 2));
fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/reservas_zonas.json', JSON.stringify(reservasData, null, 2));
console.log('✓ rondas.json and reservas_zonas.json seeded successfully');