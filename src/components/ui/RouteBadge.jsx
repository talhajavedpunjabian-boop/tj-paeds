// src/components/ui/RouteBadge.jsx
import React from 'react';

const ROUTE_MAP = {
  oral:        { label: 'Oral',      cls: 'route-oral' },
  po:          { label: 'PO',        cls: 'route-oral' },
  iv:          { label: 'IV',        cls: 'route-iv' },
  'i.v':       { label: 'IV',        cls: 'route-iv' },
  im:          { label: 'IM',        cls: 'route-im' },
  'i.m':       { label: 'IM',        cls: 'route-im' },
  inhaled:     { label: 'Inhaled',   cls: 'route-inh' },
  inhalation:  { label: 'Inhaled',   cls: 'route-inh' },
  inh:         { label: 'Inhaled',   cls: 'route-inh' },
  nebulised:   { label: 'Neb',       cls: 'route-inh' },
  topical:     { label: 'Topical',   cls: 'route-top' },
  top:         { label: 'Topical',   cls: 'route-top' },
  sc:          { label: 'SC',        cls: 'route-sc' },
  subcutaneous:{ label: 'SC',        cls: 'route-sc' },
  pr:          { label: 'PR',        cls: 'route-pr' },
  rectal:      { label: 'Rectal',    cls: 'route-pr' },
};

export function RouteBadge({ route }) {
  if (!route) return null;

  const key = route.toLowerCase().trim();
  const config = ROUTE_MAP[key] || { label: route.toUpperCase(), cls: 'badge-slate' };

  return (
    <span className={`badge ${config.cls}`} style={{ fontSize: '0.7rem' }}>
      {config.label}
    </span>
  );
}

export function FormBadge({ form }) {
  if (!form) return null;
  return (
    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
      {form}
    </span>
  );
}
