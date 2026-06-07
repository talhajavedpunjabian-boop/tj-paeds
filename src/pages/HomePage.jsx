// src/pages/HomePage.jsx
import React, { useCallback } from 'react';
import { AppHeader, OfflineBanner, UpdateBanner } from '../components/layout/AppHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { DrugCard } from '../components/ui/DrugCard';
import { ListSkeleton } from '../components/ui/Skeleton';
import { useDrugData } from '../hooks/useDrugData';
import { useSearch } from '../hooks/useSearch';

/* ─── Empty State ─────────────────────────────────────────────── */
function EmptySearch({ query }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--bg)',
        border: '1.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.25rem',
      }}>
        <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="var(--slate-light)" strokeWidth={1.75}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--slate)', fontSize: '0.9375rem' }}>
        No results for "{query}"
      </p>
      <p className="t-body" style={{ margin: 0, fontSize: '0.8125rem' }}>
        Try the generic name, indication, or route
      </p>
    </div>
  );
}

/* ─── Error State ─────────────────────────────────────────────── */
function ErrorState({ error, onRetry }) {
  return (
    <div style={{
      margin: '2rem 1rem',
      padding: '1.25rem',
      background: '#fff5f5',
      border: '1px solid #fed7d7',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth={2.5} />
        </svg>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: '#c53030', fontSize: '0.875rem' }}>
            Failed to load drug data
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#e53e3e' }}>
            {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
      <button className="btn-ghost" onClick={onRetry} style={{ alignSelf: 'flex-start' }}>
        Try again
      </button>
    </div>
  );
}

/* ─── Drug Count Status Bar ───────────────────────────────────── */
function StatusBar({ total, filtered, hasQuery, cacheInfo, isLoading }) {
  return (
    <div style={{
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span className="t-label">
        {hasQuery
          ? `${filtered} result${filtered !== 1 ? 's' : ''}`
          : `${total} drug${total !== 1 ? 's' : ''}`
        }
      </span>
      {isLoading && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--slate-light)' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
            style={{ animation: 'spin 0.8s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
          Updating…
        </span>
      )}
      {!isLoading && cacheInfo.exists && (
        <span style={{ fontSize: '0.7rem', color: 'var(--slate-light)' }}>
          {cacheInfo.ageMinutes < 2 ? 'Just updated' : `${cacheInfo.ageMinutes}m ago`}
        </span>
      )}
    </div>
  );
}

/* ─── Alphabetical Section Header ─────────────────────────────── */
function SectionHeader({ letter }) {
  return (
    <div className="section-letter">
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: 'var(--blue)',
      }}>
        {letter}
      </span>
    </div>
  );
}

/* ─── Main Home Page ──────────────────────────────────────────── */
export function HomePage({ onDrugSelect }) {
  const { drugs, loading, error, offline, cacheInfo, refresh } = useDrugData();
  const { query, setQuery, results, grouped, clearSearch, hasQuery, isFiltering } = useSearch(drugs);

  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [prevCount, setPrevCount] = React.useState(0);

  // Show update banner when data silently refreshed with new entries
  React.useEffect(() => {
    if (drugs.length > 0 && prevCount > 0 && drugs.length !== prevCount) {
      setShowUpdateBanner(true);
    }
    if (drugs.length > 0) setPrevCount(drugs.length);
  }, [drugs.length]);

  const handleRefresh = useCallback(async () => {
    setShowUpdateBanner(false);
    await refresh();
  }, [refresh]);

  const handleDrugSelect = useCallback((drug) => {
    onDrugSelect(drug);
  }, [onDrugSelect]);

  const rightAction = (
    <button
      onClick={handleRefresh}
      aria-label="Refresh drug data"
      disabled={loading}
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '0.375rem',
        borderRadius: 8,
        color: loading ? 'var(--slate-light)' : 'var(--blue)',
        display: 'flex',
        alignItems: 'center',
        opacity: loading ? 0.5 : 1,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = 'var(--blue-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" />
      </svg>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader
        title="TJ Paeds"
        subtitle="Paediatric Drug Reference"
        rightAction={rightAction}
      />

      {offline && <OfflineBanner />}
      {showUpdateBanner && <UpdateBanner onRefresh={handleRefresh} />}

      {/* Search bar */}
      <div style={{ padding: '0.875rem 1rem 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
        />
        <StatusBar
          total={drugs.length}
          filtered={results.length}
          hasQuery={hasQuery}
          cacheInfo={cacheInfo}
          isLoading={loading || isFiltering}
        />
      </div>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Error state */}
        {error && !drugs.length && (
          <ErrorState error={error} onRetry={handleRefresh} />
        )}

        {/* Loading skeletons */}
        {loading && !drugs.length && <ListSkeleton count={7} />}

        {/* Search results — flat list */}
        {hasQuery && !loading && (
          <div
            style={{ padding: '0.625rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            aria-label="Search results"
            aria-live="polite"
          >
            {results.length === 0 ? (
              <EmptySearch query={query} />
            ) : (
              results.map((drug, i) => (
                <DrugCard
                  key={`${drug.drug_name}-${i}`}
                  drug={drug}
                  onClick={handleDrugSelect}
                  query={query}
                  style={{
                    animationDelay: `${Math.min(i * 30, 200)}ms`,
                    opacity: 0,
                    animation: 'fadeUp 0.2s ease forwards',
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Alphabetical grouped list */}
        {!hasQuery && !loading && grouped && (
          <div aria-label="Drug list">
            {grouped.map(({ letter, drugs: groupDrugs }) => (
              <section key={letter}>
                <SectionHeader letter={letter} />
                <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {groupDrugs.map((drug, i) => (
                    <DrugCard
                      key={`${drug.drug_name}-${i}`}
                      drug={drug}
                      onClick={handleDrugSelect}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Footer spacer */}
            <div style={{ height: '2rem' }} />
          </div>
        )}

        {/* Empty db — no error, no loading */}
        {!loading && !error && drugs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--slate-light)' }}>
            <p>No drug data available.</p>
            <button className="btn-ghost" onClick={handleRefresh} style={{ marginTop: '1rem' }}>
              Fetch data
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
