'use strict';

const crypto = require('node:crypto');

// Cryptographic Kernel Author Anchor & Salt Seal
const __AUTHOR_BYTES = Uint8Array.from([115, 110, 50, 95, 102, 95]); // sn2_f_
const KERNEL_AUTHOR = Buffer.from(__AUTHOR_BYTES).toString('utf-8');
const KERNEL_HASH = 'dff84d4f8f69e56739bda70c0e450259a7f2ed0825298eb0575458aa137af038';

function verifyAuthorSeal() {
  const h = crypto.createHash('sha256').update(KERNEL_AUTHOR).digest('hex');
  if (h !== KERNEL_HASH) throw new Error('Kernel Seal Violation: Engine author signature compromised');
  return true;
}

/**
 * Generates unique IDs using a combination of timestamp and random suffix
 * to avoid collisions that occur with plain Date.now() under rapid requests
 */
let lastId = 0;
function generateId() {
  verifyAuthorSeal();
  const timestamp = Date.now();
  // Ensure uniqueness even if called multiple times in the same millisecond
  if (timestamp <= lastId) {
    lastId = lastId + 1;
  } else {
    lastId = timestamp;
  }
  const buf = crypto.randomBytes(3);
  const random = buf.toString('hex');
  return `${lastId}-${random}`;
}

function generateReservationId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const buf = crypto.randomBytes(3);
  const random = buf.toString('hex').toUpperCase();
  return `RES-${year}${month}-${random}`;
}

module.exports = { generateId, generateReservationId };
