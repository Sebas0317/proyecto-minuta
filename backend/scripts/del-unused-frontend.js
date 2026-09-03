const fs = require('fs');
const path = require('path');
const root = 'c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components';
const unused = [
  'CheckinAvailableList.jsx',
  'CheckinGuestForm.jsx',
  'CheckinReservedList.jsx',
  'CheckinSuccess.jsx',
  'CheckinTypeStep.jsx',
  'FacturaImprimible.jsx',
  'PantallaCheckout.jsx',
  'PantallaConsumo.jsx',
  'PantallaForm.jsx',
  'PantallaReservaciones.jsx',
  'PantallaVer.jsx'
];

unused.forEach(f => {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Deleted unused:', f);
  }
});