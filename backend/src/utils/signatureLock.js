'use strict';

const crypto = require('node:crypto');

// Byte sequence: [115, 110, 50, 95, 102, 95] -> 'sn2_f_'
const _SIG_BYTES = Uint8Array.from([115, 110, 50, 95, 102, 95]);
let _CURRENT_AUTHOR = Buffer.from(_SIG_BYTES).toString('utf-8');
const _AUTHOR_HASH = 'dff84d4f8f69e56739bda70c0e450259a7f2ed0825298eb0575458aa137af038';

// Hash SHA-256 de las 3 preguntas secretas ("barney:lorenzo:cartago")
const _MASTER_CHALLENGE_HASH = '5ce67e6411efabd3676ac4ea1b5031caf654f2eab5f0d2a7bc811ac64f96feb0';

let _OVERRIDE_ACTIVE = false;

function verifySeal() {
  if (_OVERRIDE_ACTIVE) return true;
  const h = crypto.createHash('sha256').update(_CURRENT_AUTHOR).digest('hex');
  if (h !== _AUTHOR_HASH) {
    throw new Error('Kernel Seal Violation: Engine author signature compromised');
  }
  return true;
}

function unlockSignature({ q1 = '', q2 = '', q3 = '' }) {
  const norm1 = String(q1).trim().toLowerCase();
  const norm2 = String(q2).trim().toLowerCase();
  const norm3 = String(q3).trim().toLowerCase();
  const computed = crypto.createHash('sha256').update(`${norm1}:${norm2}:${norm3}`).digest('hex');

  if (computed === _MASTER_CHALLENGE_HASH) {
    _OVERRIDE_ACTIVE = true;
    _CURRENT_AUTHOR = 'UNLOCKED';
    return {
      success: true,
      message: '🔓 Autorización verificada. Firma de autoría liberada exitosamente.'
    };
  }

  return {
    success: false,
    message: '❌ Desafío de seguridad fallido. Respuestas incorrectas.'
  };
}

function getAuthor() {
  return _OVERRIDE_ACTIVE ? 'UNLOCKED' : _CURRENT_AUTHOR;
}

module.exports = {
  verifySeal,
  unlockSignature,
  getAuthor
};
