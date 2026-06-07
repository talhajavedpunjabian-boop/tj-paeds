// src/services/cacheService.js
// Two-tier cache: localStorage (fast, sync) + IndexedDB (large data, async)

import { CACHE_CONFIG } from '../config/constants';

// ─── IndexedDB Setup ──────────────────────────────────────────────────────────
const IDB_NAME = 'tj_paeds_db';
const IDB_VERSION = 1;
const IDB_STORE = 'drug_data';

let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      _idb = event.target.result;
      resolve(_idb);
    };

    request.onerror = (event) => {
      console.warn('[cacheService] IDB open failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

async function idbSet(key, value) {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ key, value });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return false;
  }
}

async function idbGet(key) {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return null;
  }
}

async function idbDelete(key) {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return false;
  }
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[cacheService] localStorage write failed:', e);
    return false;
  }
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* silent */
  }
}

// ─── Cache Metadata ───────────────────────────────────────────────────────────
function getMeta() {
  return lsGet(CACHE_CONFIG.META_KEY) || {};
}

function setMeta(meta) {
  lsSet(CACHE_CONFIG.META_KEY, { ...getMeta(), ...meta });
}

// ─── Public Cache API ─────────────────────────────────────────────────────────

/**
 * Save drug data to both localStorage (small metadata) and IndexedDB (full payload).
 * localStorage stores only fetchedAt + count for fast status checks.
 * IDB stores the full drug array.
 *
 * @param {{ drugs: DrugEntry[], fetchedAt: number, count: number }} payload
 */
export async function saveDrugData(payload) {
  const { drugs, fetchedAt, count } = payload;

  // Quick metadata in localStorage
  setMeta({ fetchedAt, count, version: 1 });

  // Full data in IndexedDB (handles large arrays without storage limits)
  const saved = await idbSet(CACHE_CONFIG.STORAGE_KEY, { drugs, fetchedAt, count });

  // Fallback: if IDB fails, try to squeeze into localStorage
  if (!saved) {
    lsSet(CACHE_CONFIG.STORAGE_KEY, { drugs, fetchedAt, count });
  }
}

/**
 * Load cached drug data from IndexedDB (with localStorage fallback).
 * Returns null if nothing is cached.
 *
 * @returns {Promise<{ drugs: DrugEntry[], fetchedAt: number, count: number } | null>}
 */
export async function loadCachedDrugData() {
  // Try IDB first
  const idbData = await idbGet(CACHE_CONFIG.STORAGE_KEY);
  if (idbData?.drugs?.length) return { ...idbData, source: 'cache' };

  // Fallback to localStorage
  const lsData = lsGet(CACHE_CONFIG.STORAGE_KEY);
  if (lsData?.drugs?.length) return { ...lsData, source: 'ls_cache' };

  return null;
}

/**
 * Check whether cached data exists and assess its freshness.
 *
 * @returns {{ exists: boolean, isStale: boolean, isExpired: boolean, fetchedAt: number|null }}
 */
export function getCacheStatus() {
  const meta = getMeta();

  if (!meta.fetchedAt) {
    return { exists: false, isStale: true, isExpired: true, fetchedAt: null };
  }

  const age = Date.now() - meta.fetchedAt;
  return {
    exists: true,
    isStale: age > CACHE_CONFIG.STALE_AFTER_MS,
    isExpired: age > CACHE_CONFIG.EXPIRE_AFTER_MS,
    fetchedAt: meta.fetchedAt,
    count: meta.count || 0,
    ageMinutes: Math.floor(age / 60000),
  };
}

/**
 * Purge all cached drug data (localStorage + IndexedDB).
 */
export async function clearCache() {
  lsRemove(CACHE_CONFIG.STORAGE_KEY);
  lsRemove(CACHE_CONFIG.META_KEY);
  await idbDelete(CACHE_CONFIG.STORAGE_KEY);
  console.log('[cacheService] Cache cleared.');
}
