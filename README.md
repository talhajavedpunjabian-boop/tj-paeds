# TJ Paeds 🩺

**Paediatric Drug Reference & Dose Calculator** — A clinical-grade PWA for bedside use.

## Features

- **Drug Reference** — Full paediatric formulary synced from Google Sheets
- **Dose Calculator** — Weight-based dosing with max-dose caps, single + daily dose display
- **Offline Support** — Full offline functionality after first load (Service Worker + localStorage cache)
- **Installable PWA** — Add to home screen on iOS and Android
- **Fast** — Loads from cache in <1s, syncs in background

## Quick Start

```bash
npm install
npm start        # Dev server at http://localhost:3000
npm run build    # Production build → /build
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Framework: **Create React App**
4. Build command: `npm run build`
5. Output directory: `build`

Or via CLI:
```bash
npm i -g vercel
vercel --prod
```

## Project Structure

```
src/
├── components/
│   ├── calculator/
│   │   └── DoseCalculator.jsx   ← FAB + modal calculator
│   ├── layout/
│   │   └── AppHeader.jsx
│   └── ui/
│       ├── DrugCard.jsx
│       ├── RouteBadge.jsx
│       ├── SearchBar.jsx
│       └── Skeleton.jsx
├── config/
│   └── constants.js             ← Sheets URL, cache config, DOSE_CALC limits
├── hooks/
│   ├── useDrugData.js           ← Primary data hook
│   └── useSearch.js
├── pages/
│   ├── HomePage.jsx
│   └── DrugDetailPage.jsx
├── services/
│   ├── sheetsService.js         ← Google Sheets CSV parser
│   ├── dataService.js           ← Fetch + event bus
│   └── cacheService.js          ← localStorage cache layer
├── styles/
│   └── globals.css
└── utils/
    └── doseCalculator.js        ← Pure dose calculation functions
```

## Data Source

Drug data is fetched from a public Google Sheet (CSV endpoint). Update `SHEETS_CONFIG` in `src/config/constants.js` to point to your own sheet.

Expected columns: `drug_name, form, route, dose_per_kg, max_dose, frequency, indication, notes`

## PWA / Service Worker

- **Precaches** all static assets at install
- **Network-first** for Google Sheets (falls back to 24h cache offline)
- **Cache-first** for static assets (30 days)
- **Background sync** refreshes drug data when back online
- Workbox-powered with `cleanupOutdatedCaches`

## Clinical Disclaimer

> This tool is intended to assist clinical decision-making. Always verify doses against current local formulary guidelines. It does not replace clinical judgement.
