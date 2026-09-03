/**
 * loop-init.js
 * Scaffolds and prepares the Loop Engineering state and budget files for the EcoBosque Hotel System.
 */
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../loop-state.json');
const BUDGET_FILE = path.join(__dirname, '../../loop-budget.json');

console.log('\x1b[36m%s\x1b[0m', '🔄 [Loop Engineering] Inicializando entorno del agente...');

// 1. Setup loop-state.json
const defaultState = {
  project: "EcoBosque Hotel System",
  initializedAt: new Date().toISOString(),
  lastAuditScore: null,
  activeBranches: [],
  currentSession: {
    startTime: new Date().toISOString(),
    completedTasksCount: 0,
    runningProcesses: []
  }
};

if (!fs.existsSync(STATE_FILE)) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
  console.log('\x1b[32m%s\x1b[0m', '✅ Archivo loop-state.json creado.');
} else {
  console.log('ℹ️ Archivo loop-state.json ya existe. Conservando estado.');
}

// 2. Setup loop-budget.json
const defaultBudget = {
  currency: "USD",
  sessionLimit: 5.00,
  monthlyLimit: 100.00,
  currentSessionCost: 0.0,
  currentMonthCost: 0.0,
  modelPricing: {
    "gemini-1.5-pro": { inputPerMillion: 1.25, outputPerMillion: 5.00 },
    "gemini-1.5-flash": { inputPerMillion: 0.075, outputPerMillion: 0.30 },
    "gemini-2.0-flash": { inputPerMillion: 0.075, outputPerMillion: 0.30 },
    "gemini-3.5-flash": { inputPerMillion: 0.075, outputPerMillion: 0.30 }
  }
};

if (!fs.existsSync(BUDGET_FILE)) {
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(defaultBudget, null, 2), 'utf8');
  console.log('\x1b[32m%s\x1b[0m', '✅ Archivo loop-budget.json creado.');
} else {
  console.log('ℹ️ Archivo loop-budget.json ya existe. Conservando límites presupuestarios.');
}

console.log('\x1b[35m%s\x1b[0m', '🎉 Entorno de Loop Engineering inicializado con éxito.');
