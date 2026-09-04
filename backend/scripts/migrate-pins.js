'use strict';
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function migrate() {
  const unidadesPath = path.resolve(__dirname, '..', 'unidades.json');
  const paquetesPath = path.resolve(__dirname, '..', 'paquetes.json');

  let unidadesMigradas = 0;
  let paquetesMigrados = 0;

  if (fs.existsSync(unidadesPath)) {
    const unidades = JSON.parse(fs.readFileSync(unidadesPath, 'utf8'));
    for (const u of unidades) {
      if (u.pinAcceso && typeof u.pinAcceso === 'string' && !u.pinAcceso.startsWith('$2')) {
        u.pinAccesoHash = await bcrypt.hash(String(u.pinAcceso).trim(), 10);
        delete u.pinAcceso;
        unidadesMigradas++;
      } else if (!u.pinAccesoHash) {
        const defaultPin = String(1000 + (Math.abs(global.parseInt(u.numero, 10)) || 100) % 9000);
        u.pinAccesoHash = await bcrypt.hash(defaultPin, 10);
        delete u.pinAcceso;
        unidadesMigradas++;
      }
    }
    fs.writeFileSync(unidadesPath, JSON.stringify(unidades, null, 2));
  }

  if (fs.existsSync(paquetesPath)) {
    const paquetes = JSON.parse(fs.readFileSync(paquetesPath, 'utf8'));
    for (const p of paquetes) {
      if (p.codigoRetiro && typeof p.codigoRetiro === 'string' && !p.codigoRetiro.startsWith('$2')) {
        p.codigoRetiroHash = await bcrypt.hash(String(p.codigoRetiro).trim(), 10);
        delete p.codigoRetiro;
        paquetesMigrados++;
      }
    }
    fs.writeFileSync(paquetesPath, JSON.stringify(paquetes, null, 2));
  }

  console.log(JSON.stringify({ unidadesMigradas, paquetesMigrados }, null, 2));
}

migrate().catch(console.error);