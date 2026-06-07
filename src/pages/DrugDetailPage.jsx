// src/pages/DrugDetailPage.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { RouteBadge, FormBadge } from '../components/ui/RouteBadge';
import { calculateDose } from '../utils/doseCalculator';
import { DOSE_CALC } from '../config/constants';

/* ─── Detail Row ──────────────────────────────────────────────── */
function DetailRow({ label, value, mono = false, highlight = false }) {
  if (!value || value === '—') return null;
  return (
    <div className="detail-row">
      <span className="t-label">{label}</span>
      <span
        style={{
          fontSize: mono ? '0.875rem' : '0.9375rem',
          fontFamily: mono ? "'DM Mono', monospace" : 'inherit',
          color: highlight ? 'var(--blue-deep)' : 'var(--slate)',
          fontWeight: highlight ? 500 : 400,
          lineHeight: 1.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Notes Section ───────────────────────────────────────────── */
function NotesSection({ notes }) {
  const [expanded, setExpanded] = useState(false);
  if (!notes) return null;
  const isLong = notes.length > 160;
  const display = !isLong || expanded ? notes : notes.slice(0, 160) + '…';

  return (
    <div className="detail-row">
      <span className="t-label">Notes</span>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-mid)', lineHeight: 1.6 }}>
        {display}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--blue)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0 0.25rem',
              fontFamily: 'inherit',
            }}
          >
            {expanded ? ' Show less' : ' Show more'}
          </button>
        )}
      </p>
    </div>
  );
}

/* ─── Dose Calculator Panel ───────────────────────────────────── */
function DoseCalculator({ drug }) {
  const [weight, setWeight] = useState('');
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => {
    const w = parseFloat(weight);
    if (!w || !drug.dose_per_kg) return null;
    return calculateDose(drug.dose_per_kg, drug.max_dose, w);
  }, [weight, drug.dose_per_kg, drug.max_dose]);

  const weightNum = parseFloat(weight);
  const weightInvalid =
    touched &&
    weight &&
    (isNaN(weightNum) || weightNum < DOSE_CALC.MIN_WEIGHT_KG || weightNum > DOSE_CALC.MAX_WEIGHT_KG);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.875rem 1.125rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg)',
        }}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate)', letterSpacing: '-0.01em' }}>
          Dose Calculator
        </span>
      </div>

      <div style={{ padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Weight input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label
            htmlFor="weight-input"
            style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--slate-mid)', letterSpacing: '0.02em' }}
          >
            Patient weight (kg)
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="weight-input"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setTouched(true); }}
              placeholder="e.g. 12.5"
              min={DOSE_CALC.MIN_WEIGHT_KG}
              max={DOSE_CALC.MAX_WEIGHT_KG}
              step="0.1"
              style={{
                width: '100%',
                padding: '0.625rem 2.75rem 0.625rem 0.875rem',
                border: `1.5px solid ${weightInvalid ? 'var(--red)' : result ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
                color: 'var(--slate)',
                outline: 'none',
                background: 'var(--surface)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: result ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--slate-light)',
                pointerEvents: 'none',
              }}
            >
              kg
            </span>
          </div>
          {weightInvalid && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--red)' }}>
              Enter weight between {DOSE_CALC.MIN_WEIGHT_KG}–{DOSE_CALC.MAX_WEIGHT_KG} kg
            </p>
          )}
        </div>

        {/* Dose result */}
        {result && !result.error && (
          <div className="dose-box animate-fade-in">
            <div style={{ marginBottom: '0.375rem' }}>
              <span className="t-label" style={{ color: 'var(--blue)' }}>Calculated dose</span>
            </div>
            <div className="dose-value">{result.formatted}</div>
            {result.cappedByMax && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--blue-deep)', opacity: 0.8 }}>
                ↑ Capped at maximum dose
              </p>
            )}
            {drug.frequency && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--slate-mid)' }}>
                {drug.frequency}
              </p>
            )}
          </div>
        )}

        {result?.error && (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--red)' }}>{result.error}</p>
        )}

        {/* Dose source */}
        <div style={{
          display: 'flex',
          gap: '1.25rem',
          padding: '0.625rem 0',
          borderTop: '1px solid var(--border)',
        }}>
          {drug.dose_per_kg && (
            <div>
              <div className="t-label" style={{ marginBottom: '0.125rem' }}>Per kg</div>
              <span className="t-mono" style={{ color: 'var(--slate)', fontWeight: 500, fontSize: '0.8125rem' }}>
                {drug.dose_per_kg}
              </span>
            </div>
          )}
          {drug.max_dose && (
            <div>
              <div className="t-label" style={{ marginBottom: '0.125rem' }}>Max dose</div>
              <span className="t-mono" style={{ color: 'var(--slate)', fontWeight: 500, fontSize: '0.8125rem' }}>
                {drug.max_dose}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Drug Detail Page ───────────────────────────────────── */
export function DrugDetailPage({ drug, onBack }) {
  if (!drug) return null;

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}
    >
      <AppHeader
        title={drug.drug_name}
        showBack
        onBack={onBack}
        subtitle={[drug.form, drug.route].filter(Boolean).join(' · ')}
      />

      <main style={{ flex: 1, padding: '1rem', maxWidth: 640, width: '100%', margin: '0 auto' }}>
        {/* Drug name + badges */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.125rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              margin: '0 0 0.5rem',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--slate)',
            }}
          >
            {drug.drug_name}
          </h2>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {drug.form && <FormBadge form={drug.form} />}
            {drug.route && <RouteBadge route={drug.route} />}
            {drug.indication && (
              <span className="badge badge-slate" style={{ fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {drug.indication.length > 30 ? drug.indication.slice(0, 30) + '…' : drug.indication}
              </span>
            )}
          </div>
        </div>

        {/* Dose Calculator */}
        {drug.dose_per_kg && <DoseCalculator drug={drug} />}

        {/* Full detail card */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '0 1.125rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <DetailRow label="Dose per kg" value={drug.dose_per_kg} mono highlight />
          <DetailRow label="Maximum dose" value={drug.max_dose} mono />
          <DetailRow label="Frequency" value={drug.frequency} />
          <DetailRow label="Route" value={drug.route} />
          <DetailRow label="Form" value={drug.form} />
          <DetailRow label="Indication" value={drug.indication} />
          <NotesSection notes={drug.notes} />
        </div>

        {/* Clinical disclaimer */}
        <div
          style={{
            margin: '1.25rem 0 0.5rem',
            padding: '0.75rem 1rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', lineHeight: 1.5 }}>
            Always verify doses with current local guidelines. This tool assists — it does not replace — clinical judgement.
          </p>
        </div>

        <div style={{ height: '2rem' }} />
      </main>
    </div>
  );
}
