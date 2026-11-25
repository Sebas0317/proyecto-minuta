'use strict';

/**
 * Per-domain FIFO async mutex for state-changing HTTP requests (POST/PUT/PATCH/DELETE).
 * Prevents read-modify-write race conditions (lost updates, duplicate PQRS radicados,
 * double-bookings, and concurrent vote-stuffing) while keeping GET/HEAD/OPTIONS 100% lock-free.
 */
const domainQueues = new Map();
const LOCK_TIMEOUT_MS = 15000;

function acquireDomainLock(domain) {
  const prev = domainQueues.get(domain) || Promise.resolve();
  let releaseFn;
  const gate = new Promise((resolve) => {
    releaseFn = resolve;
  });
  const next = prev.then(() => gate, () => gate);
  domainQueues.set(domain, next);

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    releaseFn();
    if (domainQueues.get(domain) === next) {
      domainQueues.delete(domain);
    }
  };

  return { wait: prev, release };
}

function mutationLock(domain) {
  return async function mutationLockMiddleware(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    const { wait, release } = acquireDomainLock(domain);
    try {
      await wait;
    } catch {
      // Previous holder errored; safe to proceed
    }

    const safetyTimer = setTimeout(release, LOCK_TIMEOUT_MS);
    if (safetyTimer.unref) safetyTimer.unref();

    const cleanup = () => {
      clearTimeout(safetyTimer);
      release();
    };

    res.once('finish', cleanup);
    res.once('close', cleanup);

    next();
  };
}

module.exports = { mutationLock, acquireDomainLock };
