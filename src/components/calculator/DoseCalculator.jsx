// src/components/calculator/DoseCalculator.jsx
// Floating Dose Calculator — accessible modal with drug selector + weight input
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { calculateDose } from '../../utils/doseCalculator';
import { DOSE_CALC } from '../../config/constants';

/* ─── Calculator Icon ─────────────────────────────────────────── */
function CalcIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5" />
      <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" />
      <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" />
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" />
      <line x1="16" y1="14" x2="16" y2="18" strokeWidth="2.5" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5} />
    </svg>
  );
}

/* ─── Result Display ─────────────────────────────────────────── */
function DoseResult({ result, drug }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        background: '#fff5f5',
        borderRadius: 10,
        border: '1px solid #fed7d7',
        fontSize: '0.8125rem',
        color: '#c53030',
      }}>
        {result.error}
      </div>
    );
  }

  // Daily dose estimation based on frequency text
  const freqMap = {
    'once': 1, 'od': 1, 'daily': 1, 'qd': 1,
    'twice': 2, 'bd': 2, 'bid': 2, 'tds': 3,
    'three': 3, 'tid': 3, 'four': 4, 'qid': 4, 'qds': 4,
    'q6': 4, 'q8': 3, 'q12': 2,
  };

  let dailyMultiplier = null;
  if (drug?.frequency) {
    const f = drug.frequency.toLowerCase();
    for (const [key, val] of Object.entries(freqMap)) {
      if (f.includes(key)) { dailyMultiplier = val; break; }
    }
  }

  const singleMin = result.final.min;
  const singleMax = result.final.max;
  const isRange = result.isRange && singleMin !== singleMax;

  const dailyMin = dailyMultiplier ? Math.round(singleMin * dailyMultiplier * 10) / 10 : null;
  const dailyMax = dailyMultiplier ? Math.round(singleMax * dailyMultiplier * 10) / 10 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Single dose */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderRadius: 12,
        padding: '0.875rem 1rem',
        border: '1.5px solid #bfdbfe',
      }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '0.25rem' }}>
          Single dose
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1d4ed8',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {isRange ? `${singleMin}–${singleMax}` : singleMin}
          <span style={{ fontSize: '0.9375rem', marginLeft: '0.25rem', opacity: 0.7 }}>{result.unit}</span>
        </div>
        {result.cappedByMax && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', fontSize: '0.75rem', color: '#1d4ed8', opacity: 0.75 }}>
            <WarningIcon />
            Capped at maximum dose
          </div>
        )}
      </div>

      {/* Daily dose */}
      {dailyMin !== null && (
        <div style={{
          background: '#f0fdf4',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10b981', marginBottom: '0.2rem' }}>
            Daily total ({drug.frequency})
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#065f46',
            letterSpacing: '-0.02em',
          }}>
            {isRange && dailyMax !== dailyMin ? `${dailyMin}–${dailyMax}` : dailyMin}
            <span style={{ fontSize: '0.875rem', marginLeft: '0.25rem', opacity: 0.7 }}>{result.unit}/day</span>
          </div>
        </div>
      )}

      {/* Per kg source */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        fontSize: '0.75rem',
      }}>
        {drug?.dose_per_kg && (
          <div>
            <span style={{ color: 'var(--slate-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.625rem' }}>Per kg</span>
            <div style={{ fontFamily: "'DM Mono', monospace", color: 'var(--slate)', fontWeight: 500, marginTop: '0.1rem' }}>{drug.dose_per_kg}</div>
          </div>
        )}
        {drug?.max_dose && (
          <div>
            <span style={{ color: 'var(--slate-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.625rem' }}>Max</span>
            <div style={{ fontFamily: "'DM Mono', monospace", color: 'var(--slate)', fontWeight: 500, marginTop: '0.1rem' }}>{drug.max_dose}</div>
          </div>
        )}
        <div>
          <span style={{ color: 'var(--slate-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.625rem' }}>Weight</span>
          <div style={{ fontFamily: "'DM Mono', monospace", color: 'var(--slate)', fontWeight: 500, marginTop: '0.1rem' }}>{result.weightKg} kg</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Calculator Modal ─────────────────────────────────── */
function CalculatorModal({ drugs, onClose, initialDrug }) {
  const [weight, setWeight] = useState('');
  const [selectedDrugName, setSelectedDrugName] = useState(initialDrug?.drug_name || '');
  const [drugSearch, setDrugSearch] = useState(initialDrug?.drug_name || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [touched, setTouched] = useState(false);
  const weightRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus weight input on open (after a short delay for animation)
  useEffect(() => {
    const t = setTimeout(() => weightRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const selectedDrug = useMemo(() =>
    drugs.find(d => d.drug_name === selectedDrugName) || null,
    [drugs, selectedDrugName]
  );

  // Filtered drug list for search
  const filteredDrugs = useMemo(() => {
    if (!drugSearch) return drugs.slice(0, 50);
    const q = drugSearch.toLowerCase();
    return drugs
      .filter(d => d.drug_name?.toLowerCase().includes(q) || d.indication?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [drugs, drugSearch]);

  const result = useMemo(() => {
    const w = parseFloat(weight);
    if (!w || !selectedDrug?.dose_per_kg) return null;
    return calculateDose(selectedDrug.dose_per_kg, selectedDrug.max_dose, w);
  }, [weight, selectedDrug]);

  const weightNum = parseFloat(weight);
  const weightInvalid = touched && weight && (
    isNaN(weightNum) || weightNum < DOSE_CALC.MIN_WEIGHT_KG || weightNum > DOSE_CALC.MAX_WEIGHT_KG
  );

  const handleDrugSelect = useCallback((drug) => {
    setSelectedDrugName(drug.drug_name);
    setDrugSearch(drug.drug_name);
    setShowDropdown(false);
    weightRef.current?.focus();
  }, []);

  const handleDrugSearchChange = useCallback((e) => {
    setDrugSearch(e.target.value);
    setSelectedDrugName('');
    setShowDropdown(true);
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Dose Calculator"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
        animation: 'overlayIn 0.18s ease',
      }}
    >
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .calc-select-row { display: flex; align-items: center; padding: 0.625rem 1rem; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.1s; }
        .calc-select-row:hover { background: var(--blue-light); }
        .calc-select-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%',
        maxWidth: 480,
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '0 0 env(safe-area-inset-bottom)',
        animation: 'sheetUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.875rem 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <CalcIcon size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--slate)', letterSpacing: '-0.02em' }}>
                Dose Calculator
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-light)' }}>
                Paediatric weight-based dosing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calculator"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--slate-mid)',
              flexShrink: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '1.25rem' }}>
          {/* Drug selector */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--slate-mid)',
              marginBottom: '0.375rem',
            }}>
              Drug
            </label>
            <input
              type="text"
              value={drugSearch}
              onChange={handleDrugSearchChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search drug name or indication…"
              autoComplete="off"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1.5px solid ${selectedDrug ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                color: 'var(--slate)',
                outline: 'none',
                background: 'var(--surface)',
                boxShadow: selectedDrug ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
            />

            {/* Dropdown */}
            {showDropdown && filteredDrugs.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 10,
                maxHeight: 220,
                overflowY: 'auto',
                marginTop: 4,
              }}>
                {filteredDrugs.map((drug, i) => (
                  <div
                    key={`${drug.drug_name}-${i}`}
                    className="calc-select-row"
                    onMouseDown={() => handleDrugSelect(drug)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {drug.drug_name}
                      </div>
                      {drug.dose_per_kg && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--blue-deep)', marginTop: '0.1rem' }}>
                          {drug.dose_per_kg}
                        </div>
                      )}
                    </div>
                    {drug.route && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: 'var(--blue-light)', color: 'var(--blue)',
                        padding: '0.15rem 0.5rem', borderRadius: 6,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        flexShrink: 0, marginLeft: '0.5rem',
                      }}>
                        {drug.route}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No dose_per_kg warning */}
          {selectedDrug && !selectedDrug.dose_per_kg && (
            <div style={{
              padding: '0.625rem 0.875rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 8,
              fontSize: '0.8125rem',
              color: '#92400e',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              <WarningIcon />
              No weight-based dosing available for this drug
            </div>
          )}

          {/* Weight input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="calc-weight" style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--slate-mid)',
              marginBottom: '0.375rem',
            }}>
              Patient weight
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="calc-weight"
                ref={weightRef}
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); setTouched(true); }}
                placeholder={`${DOSE_CALC.MIN_WEIGHT_KG} – ${DOSE_CALC.MAX_WEIGHT_KG}`}
                min={DOSE_CALC.MIN_WEIGHT_KG}
                max={DOSE_CALC.MAX_WEIGHT_KG}
                step="0.1"
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  border: `1.5px solid ${weightInvalid ? 'var(--red)' : result && !result.error ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 10,
                  fontSize: '1.25rem',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  color: 'var(--slate)',
                  outline: 'none',
                  background: 'var(--surface)',
                  boxShadow: result && !result.error ? '0 0 0 3px rgba(59,130,246,0.1)' : weightInvalid ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{
                position: 'absolute', right: '1rem',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600, fontSize: '0.9375rem',
                color: 'var(--slate-light)',
                pointerEvents: 'none',
              }}>
                kg
              </span>
            </div>
            {weightInvalid && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--red)' }}>
                Weight must be {DOSE_CALC.MIN_WEIGHT_KG}–{DOSE_CALC.MAX_WEIGHT_KG} kg
              </p>
            )}
          </div>

          {/* Result */}
          {result && selectedDrug && (
            <DoseResult result={result} drug={selectedDrug} />
          )}

          {/* Disclaimer */}
          <div style={{
            marginTop: '1rem',
            padding: '0.625rem 0.875rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}>
            <WarningIcon />
            <p style={{ margin: 0, fontSize: '0.725rem', color: '#92400e', lineHeight: 1.5 }}>
              Always verify with current local guidelines. This tool assists — it does not replace — clinical judgement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floating Action Button ────────────────────────────────── */
export function DoseCalculatorFAB({ drugs = [] }) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* FAB */}
      <button
        onClick={handleOpen}
        aria-label="Open dose calculator"
        title="Dose Calculator"
        style={{
          position: 'fixed',
          bottom: `calc(1.5rem + env(safe-area-inset-bottom))`,
          right: '1.25rem',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0 1.125rem',
          height: 52,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 26,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: '0.9375rem',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(29,78,216,0.35), 0 1px 4px rgba(0,0,0,0.1)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,78,216,0.45), 0 2px 8px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,78,216,0.35), 0 1px 4px rgba(0,0,0,0.1)';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      >
        <CalcIcon size={20} />
        Calculator
      </button>

      {/* Modal */}
      {open && (
        <CalculatorModal
          drugs={drugs}
          onClose={handleClose}
          initialDrug={null}
        />
      )}
    </>
  );
}

/* ─── Inline Calculator (for DrugDetailPage) ────────────────── */
export { CalculatorModal };
export default DoseCalculatorFAB;
