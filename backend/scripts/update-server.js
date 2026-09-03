const fs = require('fs');
const serverPath = './backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

if (!content.includes('unidadesRoutes')) {
  // Add route imports
  content = content.replace(
    "const usersRoutes = require('./src/routes/users');",
    `const usersRoutes = require('./src/routes/users');
// Rutas de Minuta y Conjuntos Residenciales
const unidadesRoutes = require('./src/routes/unidades');
const minutaRoutes = require('./src/routes/minuta');
const paquetesRoutes = require('./src/routes/paquetes');
const accesosRoutes = require('./src/routes/accesos');
const trasteosRoutes = require('./src/routes/trasteos');
const parqueaderosRoutes = require('./src/routes/parqueaderos');`
  );

  // Add route mount points
  content = content.replace(
    "app.use('/users', authRateLimiter, usersRoutes);",
    `app.use('/users', authRateLimiter, usersRoutes);

// ── RUTAS MINUTA Y PORTERÍA ──
app.use('/v1/unidades', unidadesRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/v1/minuta', minutaRoutes);
app.use('/minuta', minutaRoutes);
app.use('/v1/paquetes', paquetesRoutes);
app.use('/paquetes', paquetesRoutes);
app.use('/v1/accesos', accesosRoutes);
app.use('/accesos', accesosRoutes);
app.use('/v1/trasteos', trasteosRoutes);
app.use('/trasteos', trasteosRoutes);
app.use('/v1/parqueaderos', parqueaderosRoutes);
app.use('/parqueaderos', parqueaderosRoutes);`
  );

  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('server.js actualizado con rutas de portería y minuta');
} else {
  console.log('server.js ya contenía las rutas');
}
