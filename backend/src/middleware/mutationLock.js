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
    let closedWhileWaiting = false;
    const onEarlyDone = () => {
      closedWhileWaiting = true;
    };
    res.once('finish', onEarlyDone);
    res.once('close', onEarlyDone);

    try {
      await wait;
    } catch {
      // Previous holder errored; safe to proceed
    }

    res.removeListener('finish', onEarlyDone);
    res.removeListener('close', onEarlyDone);

    if (
      closedWhileWaiting ||
      req.timedOut ||
      res.destroyed ||
      res.writableEnded ||
      res.headersSent
    ) {
      release();
      return;
    }

    const safetyTimer = setTimeout(release, LOCK_TIMEOUT_MS);
    if (safetyTimer.unref) safetyTimer.unref();

    const cleanup = () => {
      clearTimeout(safetyTimer);
      release();
    };

    res.once('finish', cleanup);
    res.once('close', cleanup);

    try {
      next();
    } catch (err) {
      cleanup();
      return next(err);
    }
  };
}

module.exports = { mutationLock, acquireDomainLock };
