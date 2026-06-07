// src/hooks/useSearch.js
// Sub-millisecond search using pre-built search index.
// Searches: drug_name, indication, form, route, notes (weighted)

import { useState, useMemo, useCallback, useTransition } from 'react';

/**
 * Build a flattened, lowercased search string for each drug.
 * Called once when drugs array changes.
 */
function buildSearchIndex(drugs) {
  return drugs.map((drug) => ({
    drug,
    // Weighted concatenation: name is repeated for higher relevance
    index: [
      drug.drug_name, drug.drug_name,           // weight ×2
      drug.indication,
      drug.form,
      drug.route,
      drug.notes,
      drug.frequency,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }));
}

/**
 * Score a drug against a query. Higher = better match.
 */
function scoreMatch(entry, queryLower) {
  const nameMatch = entry.drug.drug_name?.toLowerCase().startsWith(queryLower);
  const nameIncludes = entry.drug.drug_name?.toLowerCase().includes(queryLower);
  const indexIncludes = entry.index.includes(queryLower);

  if (nameMatch) return 3;
  if (nameIncludes) return 2;
  if (indexIncludes) return 1;
  return 0;
}

/**
 * Group drug entries alphabetically by first letter of drug_name.
 * Returns an array of { letter, drugs[] } sorted A–Z.
 */
export function groupAlphabetically(drugs) {
  const groups = {};
  for (const drug of drugs) {
    const letter = (drug.drug_name?.[0] || '#').toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(drug);
  }
  return Object.keys(groups)
    .sort()
    .map((letter) => ({ letter, drugs: groups[letter] }));
}

/**
 * Main search hook.
 *
 * @param {DrugEntry[]} drugs
 * @returns {{ query, setQuery, results, grouped, isFiltering, clearSearch }}
 */
export function useSearch(drugs) {
  const [query, setQueryRaw] = useState('');
  const [isPending, startTransition] = useTransition();

  // Build index once when drugs load (memoized)
  const searchIndex = useMemo(() => buildSearchIndex(drugs), [drugs]);

  // Deferred query state for filtering (keeps input responsive)
  const [deferredQuery, setDeferredQuery] = useState('');

  const setQuery = useCallback((q) => {
    setQueryRaw(q); // Immediate — keeps input value in sync
    startTransition(() => {
      setDeferredQuery(q); // Deferred — filter work happens in transition
    });
  }, []);

  const clearSearch = useCallback(() => {
    setQueryRaw('');
    setDeferredQuery('');
  }, []);

  // Filtered + sorted results
  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return drugs; // No filter — return all

    const scored = searchIndex
      .map((entry) => ({ drug: entry.drug, score: scoreMatch(entry, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.drug.drug_name?.localeCompare(b.drug.drug_name));

    return scored.map((item) => item.drug);
  }, [deferredQuery, searchIndex, drugs]);

  // Alphabetical grouping (only when not searching)
  const grouped = useMemo(() => {
    if (deferredQuery.trim()) return null; // Flat list during search
    return groupAlphabetically(drugs);
  }, [deferredQuery, drugs]);

  return {
    query,
    setQuery,
    results,
    grouped,
    isFiltering: isPending,
    clearSearch,
    hasQuery: deferredQuery.trim().length > 0,
  };
}
