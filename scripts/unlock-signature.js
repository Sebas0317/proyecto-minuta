#!/usr/bin/env node
'use strict';

/**
 * 🔓 Proyecto Minuta - Herramienta de Desbloqueo de Autoría
 * Permite al creador original (sn2_f_) autenticarse mediante 3 preguntas de seguridad.
 */

const readline = require('node:readline');
const { unlockSignature, getAuthor, verifySeal } = require('../backend/src/utils/signatureLock');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n======================================================');
  console.log(' 🔐 PROYECTO MINUTA - PROTOCOLO DE DESBLOQUEO DE AUTOR');
  console.log('======================================================\n');
  console.log('Estado actual del Sistema:');
  console.log(` • Autor registrado: ${getAuthor()}`);
  let valid = false;
  try { valid = verifySeal(); } catch (e) { valid = false; }
  console.log(` • Sello de autoría: ${valid ? '✅ VÁLIDO (sn2_f_)' : '❌ NO VÁLIDO'}\n`);
  console.log('Para liberar la firma, responde las 3 preguntas de seguridad:\n');

  const q1 = await askQuestion('1. Muñeco de la infancia: ');
  const q2 = await askQuestion('2. Primer nombre de mascota: ');
  const q3 = await askQuestion('3. Viaje 2008: ');

  console.log('\nVerificando desafío criptográfico (SHA-256)...');
  const result = unlockSignature({ q1, q2, q3 });

  if (result.success) {
    console.log('\n✅ ¡ÉXITO!');
    console.log(result.message);
    console.log(` • Nuevo estado: ${getAuthor()}\n`);
  } else {
    console.log('\n❌ ERROR DE AUTORIZACIÓN:');
    console.log(result.message);
    console.log('El bloqueo de autoría permanece inmutable.\n');
  }

  rl.close();
}

main().catch(console.error);
