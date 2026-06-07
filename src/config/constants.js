// src/config/constants.js
// Central configuration for TJ Paeds

export const APP_NAME = 'TJ Paeds';
export const APP_VERSION = '1.0.0';

// ─── Google Sheets Data Source ────────────────────────────────────────────────
export const SHEETS_CONFIG = {
  // Published HTML endpoint (public, no auth required)
  BASE_URL:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP4TGkC6v6DCBGNeFz6GqMz13ipNEphRWZL9wVsTnHAeYfjc-DJBfpEyrceiy54i3Lvi5h8pwa1Jmc/pubhtml',

  // gviz/tq endpoint for structured JSON — same sheet ID
  GViz_URL:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP4TGkC6v6DCBGNeFz6GqMz13ipNEphRWZL9wVsTnHAeYfjc-DJBfpEyrceiy54i3Lvi5h8pwa1Jmc/pub?output=csv',

  // Sheet name/gid if multiple tabs (0 = first sheet)
  SHEET_GID: '0',
};

// ─── Cache Configuration ──────────────────────────────────────────────────────
export const CACHE_CONFIG = {
  // localStorage key for drug data
  STORAGE_KEY: 'tj_paeds_drug_data',
  // Metadata key (timestamps, version)
  META_KEY: 'tj_paeds_meta',
  // How long before data is considered stale (ms)
  STALE_AFTER_MS: 60 * 60 * 1000,          // 1 hour → triggers background refresh
  // Hard expiry — force refetch regardless
  EXPIRE_AFTER_MS: 24 * 60 * 60 * 1000,    // 24 hours
  // Polling interval when app is in foreground (ms)
  POLL_INTERVAL_MS: 15 * 60 * 1000,        // 15 minutes
};

// ─── Drug Data Field Map ──────────────────────────────────────────────────────
// Maps parsed column indices / header names → our internal schema
export const DRUG_FIELDS = [
  'drug_name',
  'form',
  'route',
  'dose_per_kg',
  'max_dose',
  'frequency',
  'indication',
  'notes',
];

// ─── Dose Calculator ─────────────────────────────────────────────────────────
export const DOSE_CALC = {
  MIN_WEIGHT_KG: 0.5,
  MAX_WEIGHT_KG: 120,
  WEIGHT_UNIT: 'kg',
};
