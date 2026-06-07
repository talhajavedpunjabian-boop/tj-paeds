// src/components/ui/DrugCard.jsx
import React, { memo } from 'react';
import { RouteBadge, FormBadge } from './RouteBadge';

/**
 * Truncates a string to maxLen characters, appending "…" if needed.
 */
function truncate(str, maxLen = 72) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen).trim() + '…' : str;
}

/**
 * Highlights matched text within a string.
 * Returns an array of React elements with <mark> on the matched portion.
 */
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background: 'rgba(59,130,246,0.15)',
        color: 'var(--blue-deep)',
        borderRadius: 2,
        padding: '0 1px',
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export const DrugCard = memo(function DrugCard({ drug, onClick, query = '', style = {} }) {
  return (
    <article
      className="card"
      onClick={() => onClick(drug)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(drug)}
      role="button"
      tabIndex={0}
      aria-label={`${drug.drug_name}, ${drug.route}`}
      style={{
        padding: '0.875rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        ...style,
      }}
    >
      {/* ── Row 1: Drug name + route badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3
          className="t-title"
          style={{ margin: 0, fontSize: '0.9375rem', flex: 1, lineHeight: 1.3 }}
        >
          <Highlight text={drug.drug_name} query={query} />
        </h3>
        <RouteBadge route={drug.route} />
      </div>

      {/* ── Row 2: Dose per kg (most critical info) ── */}
      {drug.dose_per_kg && (
        <p
          className="t-mono"
          style={{
            margin: 0,
            color: 'var(--blue-deep)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <Highlight text={drug.dose_per_kg} query={query} />
        </p>
      )}

      {/* ── Row 3: Indication snippet ── */}
      {drug.indication && (
        <p
          className="t-body"
          style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.4 }}
        >
          <Highlight text={truncate(drug.indication)} query={query} />
        </p>
      )}

      {/* ── Row 4: Form + frequency chips ── */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
        {drug.form && <FormBadge form={drug.form} />}
        {drug.frequency && (
          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
            {drug.frequency}
          </span>
        )}
      </div>
    </article>
  );
});
