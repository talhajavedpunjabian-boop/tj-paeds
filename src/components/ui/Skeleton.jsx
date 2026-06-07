// src/components/ui/Skeleton.jsx
import React from 'react';

function Rect({ w = '100%', h = 16, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: 6, ...style }}
    />
  );
}

export function DrugCardSkeleton() {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Rect w="55%" h={18} />
        <Rect w="14%" h={20} style={{ borderRadius: 999 }} />
      </div>
      <Rect w="75%" h={13} />
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <Rect w="18%" h={20} style={{ borderRadius: 999 }} />
        <Rect w="22%" h={20} style={{ borderRadius: 999 }} />
      </div>
    </div>
  );
}

export function DrugDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      <Rect w="60%" h={28} />
      <Rect w="35%" h={14} />
      <div style={{ height: 12 }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: '0.875rem', borderBottom: '1px solid var(--border)' }}>
          <Rect w="25%" h={11} />
          <Rect w="70%" h={15} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '1rem' }}>
      {[...Array(count)].map((_, i) => (
        <DrugCardSkeleton key={i} />
      ))}
    </div>
  );
}
