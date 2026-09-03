const fs = require('fs');

const torres = ['Torre 1', 'Torre 2', 'Torre 3', 'Torre 4', 'Torre 5'];
const unidades = [];
const parqueaderos = [];

// Generar Bahías de Visitantes (V-01 a V-12)
for (let i = 1; i <= 12; i++) {
  const id = `V-${String(i).padStart(2, '0')}`;
  const tipo = i <= 9 ? 'carro' : 'moto';
  parqueaderos.push({
    id,
    categoria: 'visitantes',
    tipo,
    estado: i === 2 ? 'ocupado' : (i === 4 ? 'ocupado' : 'disponible'),
    placa: i === 2 ? 'KLP890' : (i === 4 ? 'MTO45E' : null),
    apto: i === 2 ? '203' : (i === 4 ? '401' : null),
    torre: i === 2 ? 'Torre 1' : (i === 4 ? 'Torre 2' : null),
    horaIngreso: i === 2 || i === 4 ? new Date(Date.now() - 3600000 * 2).toISOString() : null
  });
}

const nombresMuestra = [
  'Carlos Alberto Gómez', 'Mariana Rodríguez', 'Laura Marcela Pérez', 'Andrés Felipe Morales',
  'Claudia Patricia Vargas', 'Mauricio Restrepo', 'Diana Carolina Jaramillo', 'Jorge Iván Ramírez',
  'Valentina Castro', 'Santiago Henao', 'Esteban Duque', 'Sofía Ospina',
  'David Alejandro Ríos', 'Camila Ortiz', 'Alejandro Quintero', 'Isabella Montoya'
];

let aptoGlobalCount = 0;

torres.forEach((torre, tIdx) => {
  const numTorre = tIdx + 1;
  for (let piso = 1; piso <= 5; piso++) {
    for (let puerta = 1; puerta <= 4; puerta++) {
      aptoGlobalCount++;
      const numApto = `${piso}${String(puerta).padStart(2, '0')}`;
      const id = `t${numTorre}-${numApto}`;
      
      // Asignar cantidad de parqueaderos privados:
      // Algunos 2 (penthouse/pisos altos o esquinas), la mayoría 1, algunos 0
      let bahiasPrivadas = [];
      if ((piso === 5 && puerta <= 2) || (piso === 4 && puerta === 1)) {
        bahiasPrivadas = [`P-${numTorre}${numApto}A`, `P-${numTorre}${numApto}B`];
      } else if (puerta === 4 && piso <= 2) {
        bahiasPrivadas = []; // No compró parqueadero
      } else {
        bahiasPrivadas = [`P-${numTorre}${numApto}`];
      }

      // Crear las bahías privadas en parqueaderos.json
      bahiasPrivadas.forEach(bId => {
        parqueaderos.push({
          id: bId,
          categoria: 'privado',
          tipo: 'carro',
          aptoAsignado: numApto,
          torreAsignada: torre,
          estado: 'libre', // libre, ocupado_titular, invadido
          invasion: null
        });
      });

      // Estados de Ocupación y Comerciales variados
      let tipoOcupacion = 'propietario';
      let estadoComercial = 'habitado';
      let contratoArriendo = null;
      let residentes = [];
      let vehiculos = [];
      let propietario = {
        nombre: nombresMuestra[(aptoGlobalCount) % nombresMuestra.length],
        documento: `${1020000000 + aptoGlobalCount * 137}`,
        telefono: `31${(0 + aptoGlobalCount % 5)}${String(1000000 + aptoGlobalCount * 4567).slice(0, 7)}`,
        email: `prop.${numTorre}.${numApto}@condominio.com`
      };

      if (aptoGlobalCount % 7 === 0) {
        // Disponible para Arriendo
        tipoOcupacion = 'desocupado';
        estadoComercial = 'disponible_arriendo';
      } else if (aptoGlobalCount % 11 === 0) {
        // Disponible para Venta
        tipoOcupacion = 'desocupado';
        estadoComercial = 'disponible_venta';
      } else if (aptoGlobalCount % 13 === 0) {
        // Vacío / En remodelación
        tipoOcupacion = 'desocupado';
        estadoComercial = 'vacio';
      } else if (aptoGlobalCount % 3 === 0) {
        // Arrendado con contrato activo
        tipoOcupacion = 'arrendatario';
        estadoComercial = 'habitado';
        
        // Calcular fecha fin del contrato (algunos a 2 meses, otros a 7 meses, otros a 10 meses)
        const mesesRestantes = (aptoGlobalCount % 10) + 2;
        const fechaFin = new Date();
        fechaFin.setMonth(fechaFin.getMonth() + mesesRestantes);
        
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - (12 - mesesRestantes));

        contratoArriendo = {
          inquilinoNombre: `Inquilino ${nombresMuestra[(aptoGlobalCount + 3) % nombresMuestra.length]}`,
          inquilinoDoc: `${1050000000 + aptoGlobalCount * 231}`,
          inquilinoTel: `320${String(5000000 + aptoGlobalCount * 3123).slice(0, 7)}`,
          fechaInicio: fechaInicio.toISOString().slice(0, 10),
          fechaFin: fechaFin.toISOString().slice(0, 10),
          canonMensual: 1600000 + (piso * 100000),
          inmobiliaria: aptoGlobalCount % 2 === 0 ? 'Inmobiliaria El Bosque' : 'Directo con Propietario',
          telefonoInmobiliaria: '3009988776'
        };

        residentes = [{
          nombre: contratoArriendo.inquilinoNombre,
          documento: contratoArriendo.inquilinoDoc,
          telefono: contratoArriendo.inquilinoTel,
          parentesco: 'Arrendatario Titular',
          principal: true
        }];
      } else {
        // Habitado por Propietario
        tipoOcupacion = 'propietario';
        estadoComercial = 'habitado';
        residentes = [{
          nombre: propietario.nombre,
          documento: propietario.documento,
          telefono: propietario.telefono,
          parentesco: 'Propietario Residente',
          principal: true
        }];
      }

      // Vehículos asignados si tiene parqueadero y está habitado
      if (estadoComercial === 'habitado' && bahiasPrivadas.length > 0) {
        const letras = ['ABC', 'KLM', 'XYZ', 'WTR', 'GHJ', 'BNM'];
        const numPlaca = 100 + (aptoGlobalCount * 7) % 899;
        const placa = `${letras[aptoGlobalCount % letras.length]}${numPlaca}`;
        vehiculos.push({
          placa,
          tipo: 'carro',
          marca: piso >= 4 ? 'Toyota Corolla Cross' : 'Renault Duster',
          parqueaderoAsignado: bahiasPrivadas[0]
        });
      }

      // Estado Financiero (Administración y Servicios)
      const tieneMora = aptoGlobalCount % 6 === 0;
      const mesesMora = tieneMora ? (aptoGlobalCount % 4) + 1 : 0;
      const cuotaBase = 220000 + (bahiasPrivadas.length * 40000);
      const estadoFinanciero = {
        administracion: {
          alDia: !tieneMora,
          mesesMora: mesesMora,
          cuotaMensual: cuotaBase,
          saldoPendiente: mesesMora * cuotaBase,
          fechaUltimoPago: tieneMora ? '2026-05-15' : '2026-08-28'
        },
        recibosPublicos: {
          alDia: aptoGlobalCount % 12 !== 0,
          alertas: aptoGlobalCount % 12 === 0 ? 'Aviso de corte energía por mora' : 'Servicios públicos al día',
          suspendido: false
        }
      };

      unidades.push({
        id,
        torre,
        numero: numApto,
        piso,
        tipoOcupacion,
        estadoComercial,
        estado: estadoComercial === 'habitado' ? 'habitado' : 'desocupado',
        propietario,
        contratoArriendo,
        residentes,
        vehiculos,
        parqueaderosPrivados: bahiasPrivadas,
        mascotas: aptoGlobalCount % 4 === 0 ? [{ nombre: 'Max', tipo: 'perro', raza: 'Criollo' }] : [],
        estadoFinanciero,
        observaciones: bahiasPrivadas.length === 0 ? 'Inmueble sin bahía privada comprada.' : `Asignada bahía ${bahiasPrivadas.join(', ')}`,
        pinAcceso: String(1000 + aptoGlobalCount * 3).slice(0, 4)
      });
    }
  }
});

// Simular 2 casos de invasión/préstamo de bahía privada para pruebas interactivas:
const bahiaInvadida1 = parqueaderos.find(p => p.id === 'P-1101A' || p.id === 'P-1101');
if (bahiaInvadida1) {
  bahiaInvadida1.estado = 'invadido';
  bahiaInvadida1.invasion = {
    placa: 'UBR777',
    vehiculoTipo: 'carro',
    aptoResponsable: '302',
    torreResponsable: 'Torre 1',
    nombreResponsable: 'Pedro Pérez (Visita del 302)',
    telefonoResponsable: '3157778899',
    horaIngreso: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    motivo: 'Estacionó temporalmente sin avisar al propietario'
  };
}

const bahiaInvadida2 = parqueaderos.find(p => p.id === 'P-2201');
if (bahiaInvadida2) {
  bahiaInvadida2.estado = 'invadido';
  bahiaInvadida2.invasion = {
    placa: 'QWE456',
    vehiculoTipo: 'carro',
    aptoResponsable: '404',
    torreResponsable: 'Torre 2',
    nombreResponsable: 'Gabriel Sánchez (Residente 404)',
    telefonoResponsable: '3189991122',
    horaIngreso: new Date(Date.now() - 3600000 * 3).toISOString(),
    motivo: 'Préstamo verbal de vecino'
  };
}

fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/unidades.json', JSON.stringify(unidades, null, 2));
fs.writeFileSync('c:/Users/kevin/Desktop/PROYECTOS/minuta/backend/parqueaderos.json', JSON.stringify(parqueaderos, null, 2));

console.log(`✓ Generadas ${unidades.length} unidades en 5 Torres`);
console.log(`✓ Generadas ${parqueaderos.length} bahías de parqueadero (Privadas + Visitantes)`);