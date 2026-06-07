// src/components/ui/SearchBar.jsx
import React, { useRef, useEffect } from 'react';

export function SearchBar({ value, onChange, onClear, placeholder = 'Search drugs, indications…', autoFocus = false }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay so the keyboard doesn't pop on initial mount on mobile
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Search icon */}
      <svg
        style={{
          position: 'absolute',
          left: '0.875rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 18,
          height: 18,
          color: 'var(--slate-light)',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>

      <input
        ref={inputRef}
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Search drugs"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={onClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '0.625rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--border)',
            border: 'none',
            borderRadius: '50%',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--slate-mid)',
            transition: 'background 0.12s',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#cbd5e1')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--border)')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
