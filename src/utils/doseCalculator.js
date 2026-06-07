// src/utils/doseCalculator.js
// Pure functions for pediatric dose calculations. No side effects, fully testable.

import { DOSE_CALC } from '../config/constants';

/**
 * Parse a dose string that may contain a range (e.g. "10-15 mg/kg" or "20 mg/kg")
 * Returns { min, max, unit } or null if unparseable.
 *
 * @param {string} doseStr
 * @returns {{ min: number, max: number, unit: string } | null}
 */
export function parseDoseString(doseStr) {
  if (!doseStr) return null;

  // Normalize: remove spaces around hyphen range operator
  const normalized = doseStr.trim().toLowerCase();

  // Match patterns like: "10 mg/kg", "10-15 mg/kg", "0.1mg/kg", "5 mcg/kg"
  const rangeMatch = normalized.match(
    /^([\d.]+)\s*[-–]\s*([\d.]+)\s*(mg\/kg|mcg\/kg|µg\/kg|ml\/kg|units\/kg|iu\/kg)?/i
  );
  const singleMatch = normalized.match(
    /^([\d.]+)\s*(mg\/kg|mcg\/kg|µg\/kg|ml\/kg|units\/kg|iu\/kg)?/i
  );

  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
      unit: normalizeUnit(rangeMatch[3] || 'mg/kg'),
      isRange: true,
    };
  }

  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    return {
      min: val,
      max: val,
      unit: normalizeUnit(singleMatch[2] || 'mg/kg'),
      isRange: false,
    };
  }

  return null;
}

/**
 * Parse a max dose string (e.g. "500 mg", "1 g", "no max")
 *
 * @param {string} maxStr
 * @returns {{ value: number, unit: string } | null}
 */
export function parseMaxDose(maxStr) {
  if (!maxStr || /no max|none|unlimited/i.test(maxStr)) return null;

  const match = maxStr.match(/^([\d.]+)\s*(mg|g|mcg|µg|ml|units|iu)?/i);
  if (!match) return null;

  let value = parseFloat(match[1]);
  const unit = (match[2] || 'mg').toLowerCase();

  // Normalize grams → mg for consistent comparison
  if (unit === 'g') return { value: value * 1000, unit: 'mg' };

  return { value, unit };
}

/**
 * Calculate the actual dose for a given patient weight.
 *
 * @param {string} dosePerKgStr  - e.g. "10-15 mg/kg"
 * @param {string} maxDoseStr    - e.g. "500 mg"
 * @param {number} weightKg      - patient weight in kg
 * @returns {DoseResult | null}
 */
export function calculateDose(dosePerKgStr, maxDoseStr, weightKg) {
  if (!weightKg || weightKg <= 0) return null;
  if (weightKg < DOSE_CALC.MIN_WEIGHT_KG || weightKg > DOSE_CALC.MAX_WEIGHT_KG) {
    return { error: `Weight must be between ${DOSE_CALC.MIN_WEIGHT_KG} and ${DOSE_CALC.MAX_WEIGHT_KG} kg` };
  }

  const dose = parseDoseString(dosePerKgStr);
  if (!dose) return null;

  const maxDose = parseMaxDose(maxDoseStr);

  let minCalc = dose.min * weightKg;
  let maxCalc = dose.max * weightKg;

  let cappedMin = minCalc;
  let cappedMax = maxCalc;
  let cappedByMax = false;

  // Apply max dose cap
  if (maxDose) {
    // Convert units if needed for comparison
    const maxInDoseUnit = convertToSameUnit(maxDose.value, maxDose.unit, dose.unit);

    if (maxInDoseUnit !== null) {
      if (minCalc > maxInDoseUnit) {
        cappedMin = maxInDoseUnit;
        cappedByMax = true;
      }
      if (maxCalc > maxInDoseUnit) {
        cappedMax = maxInDoseUnit;
        cappedByMax = true;
      }
    }
  }

  return {
    weightKg,
    raw: { min: minCalc, max: maxCalc },
    capped: { min: cappedMin, max: maxCalc <= cappedMax ? cappedMax : cappedMax },
    final: { min: round2(cappedMin), max: round2(cappedMax) },
    unit: extractDoseUnit(dose.unit),
    cappedByMax,
    isRange: dose.isRange || dose.min !== dose.max,
    formatted: formatDoseResult({ min: round2(cappedMin), max: round2(cappedMax) }, extractDoseUnit(dose.unit), dose.isRange),
  };
}

/**
 * Format a dose result for display.
 * @returns {string} e.g. "125 mg" or "100–150 mg"
 */
function formatDoseResult({ min, max }, unit, isRange) {
  if (!isRange || min === max) return `${min} ${unit}`;
  return `${min}–${max} ${unit}`;
}

// ─── Unit Helpers ─────────────────────────────────────────────────────────────

function normalizeUnit(unit) {
  if (!unit) return 'mg/kg';
  const u = unit.toLowerCase().replace('µ', 'mc');
  return u;
}

function extractDoseUnit(perKgUnit) {
  // "mg/kg" → "mg", "mcg/kg" → "mcg"
  return (perKgUnit || 'mg/kg').split('/')[0];
}

/**
 * Attempt unit conversion. Returns null if conversion is unknown.
 */
function convertToSameUnit(value, fromUnit, toPerKgUnit) {
  const to = extractDoseUnit(toPerKgUnit).toLowerCase();
  const from = fromUnit.toLowerCase();

  if (from === to) return value;
  if (from === 'g' && to === 'mg') return value * 1000;
  if (from === 'mg' && to === 'g') return value / 1000;
  if (from === 'mcg' && to === 'mg') return value / 1000;
  if (from === 'mg' && to === 'mcg') return value * 1000;

  return null; // Unknown conversion — skip capping
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @typedef {Object} DoseResult
 * @property {number} weightKg
 * @property {{ min: number, max: number }} raw       - Before max cap
 * @property {{ min: number, max: number }} final     - After max cap, rounded
 * @property {string} unit                            - "mg", "mcg", etc.
 * @property {boolean} cappedByMax
 * @property {boolean} isRange
 * @property {string} formatted                       - Display string
 * @property {string} [error]                         - If calculation failed
 */
