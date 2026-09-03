/**
 * loop-cost.js
 * Tracks and estimates token expenditure and cost for the active session.
 */
const fs = require('fs');
const path = require('path');

const BUDGET_FILE = path.join(__dirname, '../../loop-budget.json');

// Get arguments from CLI
const args = process.argv.slice(2);
const inputTokens = parseInt(args[0], 10) || 0;
const outputTokens = parseInt(args[1], 10) || 0;
const model = args[2] || 'gemini-3.5-flash';

console.log('\x1b[36m%s\x1b[0m', `💸 [Loop Engineering] Calculando costo para modelo: ${model}...`);

if (!fs.existsSync(BUDGET_FILE)) {
  console.log('🔴 No se encontró loop-budget.json. Corre first: node scripts/loop/loop-init.js');
  process.exit(1);
}

const budget = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));

const modelRates = budget.modelPricing[model] || { inputPerMillion: 0.075, outputPerMillion: 0.30 };
const cost = ((inputTokens * modelRates.inputPerMillion) / 1000000) + 
             ((outputTokens * modelRates.outputPerMillion) / 1000000);

// Update Budget Accumulators
budget.currentSessionCost += cost;
budget.currentMonthCost += cost;

fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2), 'utf8');

console.log('\n=============================================');
console.log(`💲 ESTIMACIÓN DE COSTO DE LA LLAMADA (USD)`);
console.log('=============================================');
console.log(`- Tokens de Entrada:   ${inputTokens.toLocaleString()}`);
console.log(`- Tokens de Salida:    ${outputTokens.toLocaleString()}`);
console.log(`- Costo de esta llamada:  $${cost.toFixed(6)} USD`);
console.log(`- Acumulado de Sesión:    $${budget.currentSessionCost.toFixed(4)} / $${budget.sessionLimit.toFixed(2)} USD`);
console.log(`- Acumulado Mensual:      $${budget.currentMonthCost.toFixed(4)} / $${budget.monthlyLimit.toFixed(2)} USD`);
console.log('=============================================');

if (budget.currentSessionCost > budget.sessionLimit) {
  console.log('\x1b[31m%s\x1b[0m', '🚨 ALERTA: ¡Has excedido el presupuesto establecido para esta sesión! Detener llamadas adicionales.');
} else {
  console.log('\x1b[32m%s\x1b[0m', '🟢 Llamada dentro de presupuesto.');
}
console.log('\n');
