/**
 * loop-audit.js
 * Inspects the repository and calculates a "Loop Readiness Score" based on SaaS-ready standards.
 */
const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.join(__dirname, '../../backend/server.js');
const SANITIZE_FILE = path.join(__dirname, '../../backend/src/middleware/sanitize.js');
const CI_FILE = path.join(__dirname, '../../.github/workflows/ci.yml');
const SEMGREP_FILE = path.join(__dirname, '../../.semgrepignore');
const STATE_FILE = path.join(__dirname, '../../loop-state.json');

console.log('\x1b[36m%s\x1b[0m', '🔍 [Loop Engineering] Auditando preparación de agentes (Loop Readiness)...');

let score = 0;
const checks = [];

// 1. Check Server Test-Readiness
if (fs.existsSync(SERVER_FILE)) {
  const content = fs.readFileSync(SERVER_FILE, 'utf8');
  if (content.includes('process.env.NODE_ENV !== \'test\'') || content.includes('process.env.NODE_ENV !== "test"')) {
    score += 20;
    checks.push({ name: "Guarda condicional en server.js (Evita EADDRINUSE)", status: "🟢 PASÓ (20 pts)" });
  } else {
    checks.push({ name: "Guarda condicional en server.js", status: "🔴 FALLÓ (Falta process.env.NODE_ENV !== 'test')" });
  }
} else {
  checks.push({ name: "Archivo server.js", status: "🔴 NO ENCONTRADO" });
}

// 2. Check Prototype Pollution Sanitizer Hardening
if (fs.existsSync(SANITIZE_FILE)) {
  const content = fs.readFileSync(SANITIZE_FILE, 'utf8');
  if (content.includes('__proto__') || content.includes('constructor') || content.includes('prototype')) {
    score += 20;
    checks.push({ name: "Protección contra inyección en prototipos (sanitize.js)", status: "🟢 PASÓ (20 pts)" });
  } else {
    checks.push({ name: "Protección contra inyección en prototipos", status: "🔴 FALLÓ (Faltan validaciones de llaves restringidas)" });
  }
} else {
  checks.push({ name: "Middleware sanitize.js", status: "🔴 NO ENCONTRADO" });
}

// 3. Check GitHub CI/CD Actions Workflow
if (fs.existsSync(CI_FILE)) {
  const content = fs.readFileSync(CI_FILE, 'utf8');
  if (content.includes('ai-review-pipeline') && content.includes('semgrep')) {
    score += 20;
    checks.push({ name: "Flujo CI en ci.yml con Semgrep y AI Review", status: "🟢 PASÓ (20 pts)" });
  } else {
    checks.push({ name: "Flujo CI en ci.yml", status: "🟡 PARCIAL (Falta ai-review-pipeline o semgrep)" });
  }
} else {
  checks.push({ name: "Flujo CI/CD GitHub Actions", status: "🔴 NO ENCONTRADO" });
}

// 4. Check Semgrep Ignorations & SAST settings
if (fs.existsSync(SEMGREP_FILE)) {
  score += 20;
  checks.push({ name: "Archivo .semgrepignore activo para excluir datos/reportes", status: "🟢 PASÓ (20 pts)" });
} else {
  checks.push({ name: "Archivo .semgrepignore", status: "🔴 FALLÓ (Falta .semgrepignore en raíz)" });
}

// 5. Check Custom Workspace Skills
const skillsDir = path.join(__dirname, '../../.agents/skills');
if (fs.existsSync(skillsDir) && fs.readdirSync(skillsDir).length > 0) {
  score += 20;
  checks.push({ name: "Carpeta de habilidades personalizadas (.agents/skills/)", status: "🟢 PASÓ (20 pts)" });
} else {
  checks.push({ name: "Habilidades personalizadas", status: "🔴 FALLÓ (No se detectaron habilidades)" });
}

// Write score to state if exists
if (fs.existsSync(STATE_FILE)) {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.lastAuditScore = score;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    // Silent fail
  }
}

// Output Report Card
console.log('\n=============================================');
console.log(`📋 REPORT CARD: LOOP READINESS SCORE: ${score}/100`);
console.log('=============================================');
checks.forEach(c => {
  console.log(`- ${c.name.padEnd(55)} [${c.status}]`);
});
console.log('=============================================');

if (score === 100) {
  console.log('\x1b[32m%s\x1b[0m', '🚀 ¡Felicidades! El repositorio está al 100% de madurez para el desarrollo autónomo en Loop.');
} else {
  console.log('\x1b[33m%s\x1b[0m', `⚠️ Puntuación actual: ${score}/100. Resuelve los puntos marcados con 🔴 para habilitar el agente al máximo.`);
}
console.log('\n');
