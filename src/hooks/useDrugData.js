// src/hooks/useDrugData.js
// React hook that wraps dataService — handles loading, errors, and live updates.

import { useState, useEffect, useCallback } from 'react';
import {
  initDataService,
  subscribeToDataUpdates,
  loadDrugs,
  startPolling,
  stopPolling,
  getCacheInfo,
} from '../services/dataService';

/**
 * @typedef {Object} UseDrugDataResult
 * @property {DrugEntry[]} drugs       - All drug entries
 * @property {boolean}     loading     - True during initial or forced fetch
 * @property {Error|null}  error       - Last fetch error (null if none)
 * @property {boolean}     offline     - True when browser has no network
 * @property {object}      cacheInfo   - Cache status (age, count, staleness)
 * @property {Function}    refresh     - Manually trigger a data refresh
 */

/**
 * Primary hook for accessing pediatric drug data in React components.
 *
 * @returns {UseDrugDataResult}
 */
export function useDrugData() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());

  // ── Initialize on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        const result = await initDataService();
        if (mounted) {
          setDrugs(result || []);
          setError(null);
          setCacheInfo(getCacheInfo());
        }
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    startPolling();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, []);

  // ── Subscribe to dataService events ────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToDataUpdates((event) => {
      switch (event.type) {
        case 'LOADING_START':
          setLoading(true);
          setError(null);
          break;

        case 'DATA_READY':
          setDrugs(event.drugs || []);
          setLoading(false);
          setError(null);
          setCacheInfo(getCacheInfo());
          break;

        case 'FETCH_ERROR':
          setError(event.error);
          setLoading(false);
          // Keep existing drugs (stale data is better than nothing)
          if (event.drugs?.length) setDrugs(event.drugs);
          break;

        case 'ONLINE':
          setOffline(false);
          break;

        case 'OFFLINE':
          setOffline(true);
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  // ── Manual refresh ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadDrugs({ forceRefresh: true });
      setDrugs(result || []);
      setCacheInfo(getCacheInfo());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { drugs, loading, error, offline, cacheInfo, refresh };
}

/**
 * Lightweight hook — returns just the drugs array with no status.
 * Use in child components that don't need to handle loading/error states.
 *
 * @returns {DrugEntry[]}
 */
export function useDrugs() {
  const { drugs } = useDrugData();
  return drugs;
}
