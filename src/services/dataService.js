// src/services/dataService.js
// Orchestrates fetching, caching, and auto-refresh of drug data.
// This is the single entry point the UI uses — never call sheetsService directly.

import { fetchDrugData } from './sheetsService';
import { saveDrugData, loadCachedDrugData, getCacheStatus, clearCache } from './cacheService';
import { CACHE_CONFIG } from '../config/constants';

// ─── Event Bus (lightweight, no external deps) ────────────────────────────────
const listeners = new Set();

export function subscribeToDataUpdates(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback); // returns unsubscribe fn
}

function emit(event) {
  listeners.forEach((cb) => {
    try { cb(event); } catch (e) { console.error('[dataService] Listener error:', e); }
  });
}

// ─── State ────────────────────────────────────────────────────────────────────
let _drugs = [];
let _loading = false;
let _lastError = null;
let _pollTimer = null;
let _initialized = false;

// ─── Core Load Logic ──────────────────────────────────────────────────────────

/**
 * Load drug data with smart cache-first strategy:
 * 1. If valid cache exists → serve it immediately, refresh in background if stale
 * 2. If expired/missing → fetch from network, block until done
 *
 * @param {{ forceRefresh?: boolean }} options
 * @returns {Promise<DrugEntry[]>}
 */
export async function loadDrugs({ forceRefresh = false } = {}) {
  const status = getCacheStatus();

  // ── Case 1: Force refresh ──────────────────────────────────────────────────
  if (forceRefresh) {
    return _fetchAndCache();
  }

  // ── Case 2: No cache or expired → must fetch ───────────────────────────────
  if (!status.exists || status.isExpired) {
    return _fetchAndCache();
  }

  // ── Case 3: Fresh cache → serve immediately ────────────────────────────────
  if (!status.isStale) {
    const cached = await loadCachedDrugData();
    if (cached?.drugs) {
      _drugs = cached.drugs;
      emit({ type: 'DATA_READY', drugs: _drugs, source: cached.source, status });
      return _drugs;
    }
  }

  // ── Case 4: Stale cache → serve stale, refresh background ─────────────────
  const cached = await loadCachedDrugData();
  if (cached?.drugs) {
    _drugs = cached.drugs;
    emit({ type: 'DATA_READY', drugs: _drugs, source: 'stale_cache', status });
    // Background refresh (non-blocking)
    _fetchAndCache({ silent: true }).catch((err) => {
      console.warn('[dataService] Background refresh failed:', err.message);
    });
    return _drugs;
  }

  // ── Fallback: cache read failed for some reason ────────────────────────────
  return _fetchAndCache();
}

/**
 * Internal: fetch from network, update cache, and emit events.
 * @param {{ silent?: boolean }} options
 */
async function _fetchAndCache({ silent = false } = {}) {
  if (_loading) return _drugs; // Prevent duplicate concurrent fetches

  _loading = true;
  _lastError = null;

  if (!silent) {
    emit({ type: 'LOADING_START' });
  }

  try {
    const result = await fetchDrugData();
    _drugs = result.drugs;
    await saveDrugData(result);

    emit({
      type: 'DATA_READY',
      drugs: _drugs,
      source: 'network',
      fetchedAt: result.fetchedAt,
      count: result.count,
    });

    return _drugs;
  } catch (error) {
    _lastError = error;
    emit({ type: 'FETCH_ERROR', error, drugs: _drugs }); // still emit stale data if any
    throw error;
  } finally {
    _loading = false;
  }
}

// ─── Polling / Auto-refresh ───────────────────────────────────────────────────

/**
 * Start background polling to keep data fresh while the app is open.
 * Safe to call multiple times — only one timer runs at a time.
 */
export function startPolling() {
  if (_pollTimer) return; // already running

  _pollTimer = setInterval(async () => {
    const status = getCacheStatus();
    if (status.isStale) {
      console.log('[dataService] Poll: data is stale, refreshing...');
      try {
        await _fetchAndCache({ silent: true });
      } catch {
        // Silently fail — user still has cached data
      }
    }
  }, CACHE_CONFIG.POLL_INTERVAL_MS);

  console.log(`[dataService] Polling started (every ${CACHE_CONFIG.POLL_INTERVAL_MS / 60000} min)`);
}

/**
 * Stop background polling (e.g. when app goes to background).
 */
export function stopPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
    console.log('[dataService] Polling stopped.');
  }
}

// ─── Visibility-based refresh ─────────────────────────────────────────────────

/**
 * Initialize the data service once.
 * Sets up visibility change listener to refresh on tab re-focus.
 *
 * @returns {Promise<DrugEntry[]>}
 */
export async function initDataService() {
  if (_initialized) return _drugs;
  _initialized = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const status = getCacheStatus();
      if (status.isStale || status.isExpired) {
        console.log('[dataService] Tab focused — refreshing stale data');
        _fetchAndCache({ silent: true }).catch(() => {});
      }
    }
  });

  // Online recovery: refetch when connection restores
  window.addEventListener('online', () => {
    console.log('[dataService] Network restored — refreshing data');
    _fetchAndCache({ silent: true }).catch(() => {});
    emit({ type: 'ONLINE' });
  });

  window.addEventListener('offline', () => {
    emit({ type: 'OFFLINE' });
  });

  return loadDrugs();
}

// ─── Utility Getters ──────────────────────────────────────────────────────────
export const getDrugs = () => _drugs;
export const isLoading = () => _loading;
export const getLastError = () => _lastError;
export const getCacheInfo = () => getCacheStatus();
export { clearCache };
