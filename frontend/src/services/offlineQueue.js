/**
 * Cola Offline resiliente en IndexedDB (con respaldo en memoria/localStorage para entornos sin IDB)
 * Garantiza que ingresos, minutas y rondas registrados durante cortes de internet en garita
 * no se pierdan y se sincronicen automáticamente al recuperar conexión.
 */

const DB_NAME = 'minutatech_offline_db';
const STORE_NAME = 'pending_mutations';
const FALLBACK_KEY = 'minutatech_offline_queue_fallback';

function notifyListeners(count, syncing = false) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('minuta:offline-queue', {
        detail: { count, syncing, online: typeof navigator !== 'undefined' ? navigator.onLine : true },
      })
    );
  }
}

function readFallback() {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFallback(items) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

function openQueueDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB unavailable'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'queueId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineQueue() {
  try {
    const db = await openQueueDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return readFallback();
  }
}

export async function enqueueOfflineMutation({ endpoint, method = 'POST', body, label = 'Registro' }) {
  const item = {
    queueId: `off-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    endpoint,
    method,
    body,
    label,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openQueueDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const current = readFallback();
    current.push(item);
    writeFallback(current);
  }

  const all = await getOfflineQueue();
  notifyListeners(all.length, false);
  return item;
}

export async function removeOfflineMutation(queueId) {
  try {
    const db = await openQueueDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(queueId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const current = readFallback().filter((i) => i.queueId !== queueId);
    writeFallback(current);
  }
}

export async function clearOfflineQueue() {
  try {
    const db = await openQueueDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    writeFallback([]);
  }
  notifyListeners(0, false);
}

let isFlushing = false;

export async function flushOfflineQueue(apiBase = '/v1') {
  if (isFlushing) return { synced: 0, remaining: (await getOfflineQueue()).length };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const items = await getOfflineQueue();
    notifyListeners(items.length, false);
    return { synced: 0, remaining: items.length };
  }

  const items = await getOfflineQueue();
  if (!items.length) {
    notifyListeners(0, false);
    return { synced: 0, remaining: 0 };
  }

  isFlushing = true;
  notifyListeners(items.length, true);
  let synced = 0;

  try {
    for (const item of items) {
      try {
        const res = await fetch(`${apiBase}${item.endpoint}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: typeof item.body === 'string' ? item.body : JSON.stringify(item.body),
        });
        // Remove if succeeded or if server rejected payload as invalid 4xx (except 401/408/429)
        if (res.ok || (res.status >= 400 && res.status < 500 && ![401, 408, 429].includes(res.status))) {
          await removeOfflineMutation(item.queueId);
          if (res.ok) synced += 1;
        }
      } catch {
        // Network still unreachable — stop flushing and retry on next online event
        break;
      }
    }
  } finally {
    isFlushing = false;
    const remaining = (await getOfflineQueue()).length;
    notifyListeners(remaining, false);
    if (synced > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('minuta:offline-synced', { detail: { synced, remaining } }));
    }
  }

  return { synced, remaining: (await getOfflineQueue()).length };
}
