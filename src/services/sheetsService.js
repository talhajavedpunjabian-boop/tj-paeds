// src/services/sheetsService.js
// Fetches and parses drug data from the published Google Sheet (CSV endpoint)

import { SHEETS_CONFIG, DRUG_FIELDS } from '../config/constants';

/**
 * Fetch raw CSV text from the published Google Sheet.
 * Uses the ?output=csv endpoint which returns clean comma-separated data.
 *
 * @returns {Promise<string>} raw CSV string
 * @throws {Error} on network failure or non-200 response
 */
async function fetchRawCSV() {
  const url = `${SHEETS_CONFIG.GViz_URL}&gid=${SHEETS_CONFIG.SHEET_GID}`;
  const response = await fetch(url, {
    // Bypass any stale browser cache on explicit refresh
    cache: 'no-cache',
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) {
    throw new Error(`[sheetsService] HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Parse a CSV string into an array of objects using DRUG_FIELDS schema.
 * Handles quoted fields, commas inside quotes, and empty cells.
 *
 * @param {string} csv
 * @returns {DrugEntry[]}
 */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return []; // No data rows

  // First row = headers from the sheet
  const rawHeaders = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  // Build a mapping: our field name → column index in the sheet
  // Falls back to positional mapping if headers match DRUG_FIELDS order
  const fieldIndexMap = buildFieldIndexMap(rawHeaders);

  const drugs = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const entry = {};
    let hasContent = false;

    for (const field of DRUG_FIELDS) {
      const colIdx = fieldIndexMap[field];
      const raw = colIdx !== undefined ? (values[colIdx] || '').trim() : '';
      entry[field] = raw;
      if (raw) hasContent = true;
    }

    // Skip completely empty rows
    if (hasContent) {
      entry._rowIndex = i; // useful for debugging
      drugs.push(entry);
    }
  }

  return drugs;
}

/**
 * Map our internal field names to column indices in the sheet headers.
 * Supports exact match, partial match, and positional fallback.
 *
 * @param {string[]} rawHeaders - lowercased, underscore-spaced headers from CSV
 * @returns {Object} { field_name: columnIndex }
 */
function buildFieldIndexMap(rawHeaders) {
  const map = {};

  for (const field of DRUG_FIELDS) {
    // 1. Exact match
    let idx = rawHeaders.indexOf(field);

    // 2. Partial match (sheet header contains our field name)
    if (idx === -1) {
      idx = rawHeaders.findIndex((h) => h.includes(field) || field.includes(h));
    }

    // 3. Positional fallback (assume columns are in DRUG_FIELDS order)
    if (idx === -1) {
      idx = DRUG_FIELDS.indexOf(field);
    }

    map[field] = idx >= 0 ? idx : undefined;
  }

  return map;
}

/**
 * Parse a single CSV line, respecting quoted fields.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // last field
  return result;
}

/**
 * Normalize and validate a parsed drug entry.
 * Coerces numeric fields and flags entries with missing critical data.
 *
 * @param {Object} entry
 * @returns {DrugEntry}
 */
function normalizeDrugEntry(entry) {
  return {
    ...entry,
    drug_name: entry.drug_name || 'Unknown Drug',
    // Parse numeric dose fields — keep as string if unit is embedded (e.g. "10 mg/kg")
    dose_per_kg: entry.dose_per_kg || null,
    max_dose: entry.max_dose || null,
    // Boolean flag for UI warnings
    _incomplete: !entry.drug_name || !entry.dose_per_kg,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch, parse, and normalize all drug entries from Google Sheets.
 *
 * @returns {Promise<{ drugs: DrugEntry[], fetchedAt: number }>}
 */
export async function fetchDrugData() {
  const csv = await fetchRawCSV();
  const parsed = parseCSV(csv);
  const drugs = parsed.map(normalizeDrugEntry);

  return {
    drugs,
    fetchedAt: Date.now(),
    count: drugs.length,
    source: 'network',
  };
}

/**
 * @typedef {Object} DrugEntry
 * @property {string} drug_name
 * @property {string} form
 * @property {string} route
 * @property {string|null} dose_per_kg
 * @property {string|null} max_dose
 * @property {string} frequency
 * @property {string} indication
 * @property {string} notes
 * @property {boolean} _incomplete
 * @property {number} _rowIndex
 */
