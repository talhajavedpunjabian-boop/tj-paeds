// src/components/layout/AppHeader.jsx
import React from 'react';

export function AppHeader({ title, showBack, onBack, rightAction, subtitle }) {
  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        // Subtle frosted glass effect
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.92)',
      }}
    >
      {showBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.375rem',
            marginLeft: '-0.375rem',
            borderRadius: 8,
            color: 'var(--blue)',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--blue-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: showBack ? '1rem' : '1.0625rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--slate)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-light)', marginTop: '0.0625rem' }}>
            {subtitle}
          </p>
        )}
      </div>

      {rightAction && (
        <div style={{ flexShrink: 0 }}>
          {rightAction}
        </div>
      )}
    </header>
  );
}

/* ─── Offline Banner ───────────────────────────────────────── */
export function OfflineBanner() {
  return (
    <div className="offline-banner" role="status">
      <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      Offline — showing cached data
    </div>
  );
}

/* ─── Update Banner ─────────────────────────────────────────── */
export function UpdateBanner({ onRefresh }) {
  return (
    <div
      style={{
        background: '#eff6ff',
        borderBottom: '1px solid var(--blue-mid)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        fontSize: '0.8125rem',
        color: 'var(--blue-deep)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        New drug data available
      </span>
      <button
        onClick={onRefresh}
        style={{
          background: 'var(--blue)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '0.25rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Refresh
      </button>
    </div>
  );
}
